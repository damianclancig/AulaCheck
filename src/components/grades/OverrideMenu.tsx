'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { StatusBadge, type BadgeType } from './StatusBadge';

type OverrideTarget = 'semester1' | 'semester2' | 'annual';

interface OverrideOption {
  value: string;
  label: string;
  type: BadgeType;
}

interface OverrideMenuProps {
  target: OverrideTarget;
  currentStatus: string;
  isManual: boolean;
  onSelect: (value: string | null) => void;
}

export function OverrideMenu({ target, currentStatus, isManual, onSelect }: OverrideMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('grades.sheet');

  const semesterOptions: OverrideOption[] = [
    { value: 'TEA', label: 'TEA', type: 'TEA' },
    { value: 'TEP', label: 'TEP', type: 'TEP' },
    { value: 'TED', label: 'TED', type: 'TED' },
  ];

  const annualOptions: OverrideOption[] = [
    { value: 'APPROVED', label: t('status.approved'), type: 'APPROVED' },
    { value: 'DECEMBER', label: t('status.december'), type: 'DECEMBER' },
    { value: 'FEBRUARY', label: t('status.february'), type: 'FEBRUARY' },
  ];

  const options = target === 'annual' ? annualOptions : semesterOptions;

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const [menuPosition, setMenuPosition] = useState<'left' | 'right'>('left');

  useEffect(() => {
    if (open && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      // Si el espacio a la derecha es menor que el ancho estimado del menú (150px), mostrar a la izquierda
      if (rect.left + 150 > windowWidth) {
        setMenuPosition('right');
      } else {
        setMenuPosition('left');
      }
    }
  }, [open]);

  const handleSelect = (value: string) => {
    onSelect(value === currentStatus && isManual ? null : value);
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="focus:outline-none"
        title={t('overrideTitle')}
      >
        <StatusBadge status={currentStatus as BadgeType} isManual={isManual} />
      </button>

      {open && (
        <div className={`absolute z-50 mt-1 min-w-[140px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100 ${
          menuPosition === 'right' ? 'right-0' : 'left-0'
        }`}>
          <p className="px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium border-b border-gray-100 dark:border-gray-800">
            {t('forceCondition')}
          </p>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                currentStatus === opt.value ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
              }`}
            >
              <StatusBadge status={opt.type} size="sm" />
              {currentStatus === opt.value && isManual && (
                <span className="text-xs text-gray-400">(actual)</span>
              )}
            </button>
          ))}
          {isManual && (
            <button
              onClick={() => { onSelect(null); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-800"
            >
              ↩ {t('resetToAutomatic')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
