'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase/client';
import { Student } from '@/types/models';
import { PhoneInput } from '@/components/common/PhoneInput';
import { isValidEmail } from '@/lib/utils/contactUtils';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onStudentUpdated: () => void;
}

// Helper function to convert text to Title Case
const toTitleCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function EditStudentModal({ isOpen, onClose, student, onStudentUpdated }: EditStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  }>({ firstName: null, lastName: null, email: null });
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    externalId: '',
  });

  // Pre-fill form when student changes
  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || '',
        phone: student.phone || '',
        externalId: student.externalId || '',
      });
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No autenticado');

      // Validate required fields
      const newErrors = {
        firstName: !formData.firstName.trim() ? 'Este campo es obligatorio' : null,
        lastName: !formData.lastName.trim() ? 'Este campo es obligatorio' : null,
        email: formData.email && !isValidEmail(formData.email) ? 'El formato del email no es válido' : null
      };

      if (newErrors.firstName || newErrors.lastName || newErrors.email) {
        setFieldErrors(newErrors);
        return;
      }

      // Transform names to Title Case
      const submissionData = {
        ...formData,
        firstName: toTitleCase(formData.firstName.trim()),
        lastName: toTitleCase(formData.lastName.trim()),
      };

      const response = await fetch(`/api/students/${student._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar alumno');
      }

      onStudentUpdated();
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Editar Alumno</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value });
                  if (fieldErrors.firstName) setFieldErrors({ ...fieldErrors, firstName: null });
                }}
                onBlur={() => {
                  if (!formData.firstName.trim()) {
                    setFieldErrors(prev => ({ ...prev, firstName: 'Este campo es obligatorio' }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 ${
                  fieldErrors.firstName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                }`}
              />
              {fieldErrors.firstName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => {
                  setFormData({ ...formData, lastName: e.target.value });
                  if (fieldErrors.lastName) setFieldErrors({ ...fieldErrors, lastName: null });
                }}
                onBlur={() => {
                  if (!formData.lastName.trim()) {
                    setFieldErrors(prev => ({ ...prev, lastName: 'Este campo es obligatorio' }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 ${
                  fieldErrors.lastName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                }`}
              />
              {fieldErrors.lastName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="externalId" className="block text-sm font-medium text-gray-700 mb-1">
              Legajo / ID (Opcional)
            </label>
            <input
              type="text"
              id="externalId"
              value={formData.externalId}
              onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (Opcional)
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
              }}
              onBlur={() => {
                if (formData.email && !isValidEmail(formData.email)) {
                  setFieldErrors(prev => ({ ...prev, email: 'El formato del email no es válido' }));
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 ${
                fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <PhoneInput
            value={formData.phone}
            onChange={(phone) => setFormData({ ...formData, phone })}
          />

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
