'use client';

import { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';

interface PhoneInputProps {
  value: string; // Full phone in storage format: +5491144445555
  onChange: (phone: string) => void; // Returns formatted phone for storage
  error?: string;
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [touched, setTouched] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  // Ajustar estado durante el render si la prop cambia (evita renders en cascada)
  if (value !== prevValue) {
    setPrevValue(value);
    if (value && value.startsWith('+549')) {
      setInputValue(value.substring(4));
    } else if (value) {
      setInputValue(value);
    } else {
      setInputValue('');
      setTouched(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    // Allow digits, spaces, and hyphens
    if (/^[\d\s-]*$/.test(newVal)) {
      setInputValue(newVal);

      // Prepare for storage
      const digits = newVal.replace(/\D/g, '');
      if (digits.length > 0) {
        // Always save with +549 prefix for consistency
        onChange(`+549${digits}`);
      } else {
        onChange('');
      }
    }
  };

  // Basic validation: check total digits (usually 10 for Argentina: 2+8, 3+7, 4+6)
  const digits = inputValue.replace(/\D/g, '');
  const isValid = !touched || digits.length === 0 || (digits.length >= 10);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Teléfono / WhatsApp (Opcional)
      </label>

      <div className="flex gap-2">
        {/* Prefix */}
        <div className="w-24 flex-shrink-0">
          <div className="w-full h-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center select-none">
            🇦🇷 +54 9
          </div>
        </div>

        {/* Number Input */}
        <div className="flex-1 relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="11 1234 5678"
            value={inputValue}
            onChange={handleChange}
            onBlur={() => setTouched(true)}
            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-900 ${!isValid ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              }`}
          />
        </div>
      </div>

      {/* Help Text or Error Message */}
      <div className="mt-1">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : !isValid ? (
          <p className="text-sm text-red-600">
            El número parece incompleto (mínimo 10 dígitos)
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ingresa el código de área y número (sin 0 ni 15)
          </p>
        )}
      </div>
    </div>
  );
}
