'use client';

import { useState, useRef, useEffect } from 'react';
import { Mail, Phone, Copy, Check, ExternalLink, MessageCircle } from 'lucide-react';
import { formatPhoneDisplay, formatPhoneWhatsApp } from '@/lib/utils/contactUtils';

interface ContactPopoverProps {
  email?: string;
  phone?: string;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function ContactPopover({ 
  email, 
  phone, 
  studentName, 
  isOpen, 
  onClose,
  triggerRef 
}: ContactPopoverProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  // Calculate position
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      // Dimensiones estimadas del popover
      const popoverHeight = 250; // Altura aproximada del popover
      const popoverWidth = 280;
      
      // Calcular posición horizontal (centrado si es posible)
      let left = rect.left + scrollX - 100; // Center roughly
      if (left < 10) left = 10;
      
      // Check right edge
      if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - 10;
      }

      // Calcular posición vertical (arriba o abajo según espacio disponible)
      let top = rect.bottom + scrollY + 8; // Por defecto, abajo del botón
      
      // Verificar si se sale por el borde inferior
      if (rect.bottom + popoverHeight > window.innerHeight) {
        // Si se sale por abajo, mostrar arriba del botón
        top = rect.top + scrollY - popoverHeight - 8;
      }

      setPosition({
        top: top,
        left: left,
      });
    }
  }, [isOpen, triggerRef]);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const formattedPhone = phone ? formatPhoneDisplay(phone) : '';
  const whatsappPhone = phone ? formatPhoneWhatsApp(phone) : '';

  return (
    <div 
      ref={popoverRef}
      className="absolute z-50 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200 transition-colors"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
          Contacto de {studentName}
        </h3>

        {email ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Mail className="w-4 h-4 text-indigo-500" />
              Email
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg flex items-center justify-between group">
              <span className="text-sm text-gray-600 dark:text-gray-300 truncate mr-2 select-all">
                {email}
              </span>
              <button
                onClick={() => handleCopy(email, 'email')}
                className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1 rounded-md hover:bg-white dark:hover:bg-gray-700 shadow-sm"
                title="Copiar email"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <a
              href={`mailto:${email}`}
              className="block w-full text-center py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            >
              Enviar Correo
            </a>
          </div>
        ) : null}

        {phone ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Phone className="w-4 h-4 text-green-500" />
              Teléfono / WhatsApp
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg flex items-center justify-between group">
              <span className="text-sm text-gray-600 dark:text-gray-300 truncate mr-2 select-all">
                {formattedPhone}
              </span>
              <button
                onClick={() => handleCopy(formattedPhone, 'phone')}
                className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1 rounded-md hover:bg-white dark:hover:bg-gray-700 shadow-sm"
                title="Copiar teléfono"
              >
                {copiedPhone ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <a
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Enviar WhatsApp
            </a>
          </div>
        ) : null}

        {!email && !phone && (
          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            No hay datos de contacto registrados.
          </div>
        )}
      </div>
    </div>
  );
}
