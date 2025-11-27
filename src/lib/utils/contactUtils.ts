/**
 * Contact utilities for email and phone validation/formatting
 * Phone format for Argentina: +54 9 [area code] [number]
 * Example: +54 9 11 4444-5555 (stored as +5491144445555)
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Argentine phone number components
 * @param areaCode - Area code without leading 0 (e.g., "11", "351")
 * @param number - Phone number without 15 prefix (e.g., "44445555")
 */
export function isValidArgentinePhone(areaCode: string, number: string): boolean {
  if (!areaCode && !number) return true; // Phone is optional
  if (!areaCode || !number) return false; // Both required if one is provided
  
  // Area code: 2-4 digits
  const areaCodeRegex = /^\d{2,4}$/;
  if (!areaCodeRegex.test(areaCode)) return false;
  
  // Number: 6-8 digits (may include hyphen)
  const cleanNumber = number.replace(/-/g, '');
  const numberRegex = /^\d{6,8}$/;
  return numberRegex.test(cleanNumber);
}

/**
 * Format phone for storage (international format with mobile prefix)
 * Input: areaCode="11", number="4444-5555"
 * Output: "+5491144445555"
 */
export function formatPhoneForStorage(countryCode: string, areaCode: string, number: string): string {
  if (!areaCode || !number) return '';
  
  const cleanNumber = number.replace(/[-\s]/g, '');
  // Argentina mobile numbers include a 9 after country code
  return `${countryCode}9${areaCode}${cleanNumber}`;
}

/**
 * Format phone for display
 * Input: "+5491144445555"
 * Output: "+54 9 11 4444-5555"
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  
  // Remove any existing formatting
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Expected format: +54 9 [area] [number]
  // Example: +5491144445555
  if (cleaned.startsWith('+549')) {
    const withoutPrefix = cleaned.substring(4); // Remove +549
    
    // Determine area code length (2-4 digits)
    // Common: 11 (2 digits), 351 (3 digits), 2966 (4 digits)
    let areaCode = '';
    let number = '';
    
    if (withoutPrefix.startsWith('11')) {
      // Buenos Aires: 2 digit area code
      areaCode = withoutPrefix.substring(0, 2);
      number = withoutPrefix.substring(2);
    } else if (withoutPrefix.length >= 10) {
      // Assume 3 digit area code for longer numbers
      areaCode = withoutPrefix.substring(0, 3);
      number = withoutPrefix.substring(3);
    } else {
      // Fallback: 2 digit area code
      areaCode = withoutPrefix.substring(0, 2);
      number = withoutPrefix.substring(2);
    }
    
    // Format number with hyphen (e.g., 4444-5555)
    const formattedNumber = number.length > 4 
      ? `${number.substring(0, 4)}-${number.substring(4)}`
      : number;
    
    return `+54 9 ${areaCode} ${formattedNumber}`;
  }
  
  return phone; // Return as-is if format not recognized
}

/**
 * Format phone for WhatsApp (no + prefix)
 * Input: "+5491144445555"
 * Output: "5491144445555"
 */
export function formatPhoneWhatsApp(phone: string): string {
  if (!phone) return '';
  return phone.replace(/^\+/, '');
}

/**
 * Parse stored phone into components
 * Input: "+5491144445555"
 * Output: { countryCode: "+54", areaCode: "11", number: "44445555" }
 */
export function parsePhone(phone: string): { countryCode: string; areaCode: string; number: string } {
  if (!phone) {
    return { countryCode: '+54', areaCode: '', number: '' };
  }
  
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+549')) {
    const withoutPrefix = cleaned.substring(4); // Remove +549
    
    let areaCode = '';
    let number = '';
    
    if (withoutPrefix.startsWith('11')) {
      areaCode = withoutPrefix.substring(0, 2);
      number = withoutPrefix.substring(2);
    } else if (withoutPrefix.length >= 10) {
      areaCode = withoutPrefix.substring(0, 3);
      number = withoutPrefix.substring(3);
    } else {
      areaCode = withoutPrefix.substring(0, 2);
      number = withoutPrefix.substring(2);
    }
    
    return { countryCode: '+54', areaCode, number };
  }
  
  return { countryCode: '+54', areaCode: '', number: '' };
}

/**
 * Get common Argentine area codes
 */
export const COMMON_AREA_CODES = [
  { code: '11', name: 'Buenos Aires' },
  { code: '221', name: 'La Plata' },
  { code: '223', name: 'Mar del Plata' },
  { code: '261', name: 'Mendoza' },
  { code: '341', name: 'Rosario' },
  { code: '351', name: 'Córdoba' },
  { code: '381', name: 'Tucumán' },
  { code: '387', name: 'Salta' },
];
