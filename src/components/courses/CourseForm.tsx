import { useState, useEffect } from 'react';
import { Loader2, Sun, CloudSun, Moon } from 'lucide-react';
import { useInstitutions } from '@/hooks/useInstitutions';

export interface CourseFormData {
  institutionName: string;
  name: string;
  description: string;
  startDate: string;
  annualClassCount?: number;
  shift?: 'Mañana' | 'Tarde' | 'Noche' | '';
}

interface CourseFormProps {
  initialData?: CourseFormData;
  onSubmit: (data: CourseFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
}

export function CourseForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
  loading = false
}: CourseFormProps) {
  // Función para obtener fecha local en formato YYYY-MM-DD sin conversión UTC
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<CourseFormData>(initialData || {
    institutionName: '',
    name: '',
    description: '',
    startDate: getLocalDateString(),
    annualClassCount: undefined,
    shift: '',
  });

  const [prevInitialData, setPrevInitialData] = useState(initialData);

  // Ajustar estado si initialData cambia externamente
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    if (initialData) {
      setFormData(initialData);
    }
  }

  const { institutions } = useInstitutions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Institución *
        </label>
        <input
          type="text"
          id="institutionName"
          list="institutions-list"
          required
          value={formData.institutionName}
          onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Ej: Universidad Nacional"
        />
        <datalist id="institutions-list">
          {institutions.map((inst, index) => (
            <option key={`inst-${index}`} value={inst} />
          ))}
        </datalist>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nombre del Curso *
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Ej: Matemáticas 1A"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Turno (Opcional)
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'Mañana', icon: Sun, label: 'Mañana', color: 'amber' },
            { id: 'Tarde', icon: CloudSun, label: 'Tarde', color: 'orange' },
            { id: 'Noche', icon: Moon, label: 'Noche', color: 'indigo' },
          ].map((shift) => (
            <button
              key={shift.id}
              type="button"
              onClick={() => setFormData({ ...formData, shift: formData.shift === shift.id ? '' : shift.id as any })}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1 ${formData.shift === shift.id
                  ? shift.color === 'amber' ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/20 dark:border-amber-500 dark:text-amber-400'
                    : shift.color === 'orange' ? 'bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-900/20 dark:border-orange-500 dark:text-orange-400'
                      : 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-500 dark:text-indigo-400'
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-200 dark:hover:border-gray-600'
                }`}
            >
              <shift.icon className={`w-6 h-6 ${formData.shift === shift.id ? '' : 'opacity-50'}`} />
              <span className="text-xs font-medium">{shift.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Fecha de Inicio *
        </label>
        <input
          type="date"
          id="startDate"
          required
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-800"
        />
      </div>

      <div>
        <label htmlFor="annualClassCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Cantidad de Clases Anual (Opcional)
        </label>
        <input
          type="number"
          id="annualClassCount"
          min="1"
          value={formData.annualClassCount || ''}
          onChange={(e) => setFormData({ ...formData, annualClassCount: e.target.value ? parseInt(e.target.value) : undefined })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Ej: 120"
        />
      </div>



      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripción (Opcional)
        </label>
        <textarea
          id="description"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Breve descripción del curso..."
        />
      </div>

      <div className="pt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
