'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Student } from '@/types/models';
import { PhoneInput } from '@/components/common/PhoneInput';
import { isValidEmail, isValidStoredPhone } from '@/lib/utils/contactUtils';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('students.editModal');
  const tAdd = useTranslations('students.addModal');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  }>({ firstName: null, lastName: null, email: null, phone: null });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    externalId: '',
    requiresAttention: false,
    isRepeating: false,
    notes: '',
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
        requiresAttention: student.requiresAttention || false,
        isRepeating: student.isRepeating || false,
        notes: student.notes || '',
      });
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      const newErrors = {
        firstName: !formData.firstName.trim() ? tAdd('errors.required') : null,
        lastName: !formData.lastName.trim() ? tAdd('errors.required') : null,
        email: formData.email && !isValidEmail(formData.email) ? tAdd('errors.email') : null,
        phone: formData.phone && !isValidStoredPhone(formData.phone) ? tAdd('errors.phone') : null
      };

      if (newErrors.firstName || newErrors.lastName || newErrors.email || newErrors.phone) {
        setFieldErrors(newErrors);
        setLoading(false);
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
        },
        body: JSON.stringify(submissionData),
      });

        if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('error'));
      }

      onStudentUpdated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || tAdd('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors"
      >
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tAdd('firstName')}
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
                    setFieldErrors(prev => ({ ...prev, firstName: tAdd('errors.required') }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-800 ${fieldErrors.firstName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500'
                  }`}
              />
              {fieldErrors.firstName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tAdd('lastName')}
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
                    setFieldErrors(prev => ({ ...prev, lastName: tAdd('errors.required') }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-800 ${fieldErrors.lastName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500'
                  }`}
              />
              {fieldErrors.lastName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="externalId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tAdd('externalId')}
            </label>
            <input
              type="text"
              id="externalId"
              value={formData.externalId}
              onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tAdd('email')}
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
                  setFieldErrors(prev => ({ ...prev, email: tAdd('errors.email') }));
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-800 ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500'
                }`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <PhoneInput
            value={formData.phone}
            onChange={(phone) => {
              setFormData({ ...formData, phone });
              if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: null });
            }}
            error={fieldErrors.phone || undefined}
          />

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tAdd('notes')}
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={tAdd('notesPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-800 resize-none"
            />
          </div>

          <div className="pt-2 flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div>
                <label htmlFor="requiresAttention" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tAdd('requiresAttention')}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tAdd('requiresAttentionDesc')}
                </p>
              </div>
              <button
                type="button"
                id="requiresAttention"
                role="switch"
                aria-checked={formData.requiresAttention}
                onClick={() => setFormData({ ...formData, requiresAttention: !formData.requiresAttention })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  formData.requiresAttention ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span className="sr-only">Requiere atención especial</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.requiresAttention ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div>
                <label htmlFor="isRepeating" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tAdd('isRepeating')}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tAdd('isRepeatingDesc')}
                </p>
              </div>
              <button
                type="button"
                id="isRepeating"
                role="switch"
                aria-checked={formData.isRepeating}
                onClick={() => setFormData({ ...formData, isRepeating: !formData.isRepeating })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  formData.isRepeating ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span className="sr-only">Es recursante</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.isRepeating ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row-reverse gap-3 shrink-0 bg-white dark:bg-gray-900">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('saveChanges')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            {tCommon('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
