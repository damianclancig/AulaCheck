'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { Pencil } from 'lucide-react';

interface GradeCellProps {
  id?: string;
  value: number | null;
  isManual?: boolean;
  onChange: (score: number | null) => void;
  onNext?: () => void;
  disabled?: boolean;
}

export const GradeCell = memo(function GradeCell({ 
  id,
  value, 
  isManual = false, 
  onChange, 
  onNext,
  disabled = false 
}: GradeCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value !== null ? String(value) : '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value !== null ? String(value) : '');
  }, [value]);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const commit = () => {
    const raw = inputValue.trim();
    if (raw === '' || raw === '-') {
      onChange(null);
    } else {
      const num = parseFloat(raw.replace(',', '.'));
      if (!isNaN(num) && num >= 1 && num <= 10) {
        onChange(num);
      } else {
        // Valor inválido: restaurar
        setInputValue(value !== null ? String(value) : '');
      }
    }
    setIsEditing(false);
  };

  const handleChange = (val: string) => {
    // Solo permitir números, coma o punto, y el signo menos (solo si está vacío)
    // Validar en tiempo real que no sea > 10
    let clean = val.replace(/[^0-9,.-]/g, '');
    
    // Si es un número, validar que no sea > 10
    const num = parseFloat(clean.replace(',', '.'));
    if (!isNaN(num) && num > 10) {
      return; // No permitir ingresar más de 10
    }

    setInputValue(clean);
  };

  // Color de fondo según nota
  const bgColor =
    value === null
      ? 'bg-gray-50 dark:bg-gray-800/50'
      : value >= 7
      ? 'bg-green-50 dark:bg-green-900/20'
      : value >= 4
      ? 'bg-amber-50 dark:bg-amber-900/20'
      : 'bg-red-50 dark:bg-red-900/20';

  if (isEditing && !disabled) {
    return (
      <input
        id={id}
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit();
            onNext?.();
          }
          if (e.key === 'Escape') {
            setInputValue(value !== null ? String(value) : '');
            setIsEditing(false);
          }
        }}
        className="w-full h-9 px-1 text-center text-sm font-medium border border-indigo-400 rounded outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      />
    );
  }

  return (
    <div
      id={id}
      onClick={() => !disabled && setIsEditing(true)}
      className={`relative flex items-center justify-center h-9 rounded cursor-pointer group transition-colors ${bgColor} ${
        !disabled ? 'hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-600' : 'cursor-default'
      }`}
    >
      {value !== null ? (
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {value % 1 === 0 ? value : value.toFixed(1)}
        </span>
      ) : (
        <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>
      )}
      {isManual && (
        <Pencil className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-indigo-400" />
      )}
    </div>
  );
});
