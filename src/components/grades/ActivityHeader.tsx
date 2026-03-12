'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { GradeSheetActivity } from '@/types/models';

interface ActivityHeaderProps {
  activity: GradeSheetActivity;
  onRename: (activityId: string, newName: string) => void;
  onRemove: (activityId: string) => void;
}

export function ActivityHeader({ activity, onRename, onRemove }: ActivityHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(activity.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== activity.name) {
      onRename(activity.id, trimmed);
    } else {
      setValue(activity.name);
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setValue(activity.name);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-[80px]">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          className="w-full text-xs px-1 py-0.5 border border-indigo-400 rounded outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          maxLength={40}
        />
        <button onClick={commit} className="text-green-500 hover:text-green-700 flex-shrink-0" title="Confirmar">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={cancel} className="text-red-400 hover:text-red-600 flex-shrink-0" title="Cancelar">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 group min-w-[80px]">
      <span
        className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate cursor-pointer"
        onDoubleClick={() => setIsEditing(true)}
        title={`${activity.name} (doble clic para editar)`}
      >
        {activity.name}
      </span>
      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 flex-shrink-0">
        <button
          onClick={() => setIsEditing(true)}
          className="text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400"
          title="Renombrar"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={() => onRemove(activity.id)}
          className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
          title="Eliminar actividad"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
