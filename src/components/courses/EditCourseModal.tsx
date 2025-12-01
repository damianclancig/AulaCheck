import { useState } from 'react';
import { X } from 'lucide-react';
import { auth } from '@/lib/firebase/client';
import { Course } from '@/types/models';
import { CourseForm, CourseFormData } from './CourseForm';

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onCourseUpdated: () => void;
}

export function EditCourseModal({ isOpen, onClose, course, onCourseUpdated }: EditCourseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Función para convertir fecha a formato local YYYY-MM-DD
  const formatDateForInput = (dateString: string) => {
    // Si ya está en formato YYYY-MM-DD, usarlo directamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Si es otro formato, parsearlo y convertir a fecha local
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const initialData: CourseFormData = {
    institutionName: course.institutionName || '',
    name: course.name,
    description: course.description || '',
    startDate: formatDateForInput(course.startDate),
  };

  const handleSubmit = async (data: CourseFormData) => {
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No autenticado');

      const response = await fetch(`/api/courses/${course._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el curso');
      }

      onCourseUpdated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Editar Curso</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <CourseForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel="Guardar Cambios"
          loading={loading}
        />
      </div>
    </div>
  );
}
