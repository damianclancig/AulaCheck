'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Student } from '@/types/models';
import { useParams } from 'next/navigation';
import { useModal } from '@/hooks/useModal';
import { useTranslations } from 'next-intl';

interface GradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onGradeSaved: () => void;
}

export function GradeModal({ isOpen, onClose, students, onGradeSaved }: GradeModalProps) {
  const params = useParams();
  const courseId = params.id as string;

  // Función para obtener fecha local en formato YYYY-MM-DD sin conversión UTC
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [weight, setWeight] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [score, setScore] = useState<string>('');
  const { showAlert } = useModal();
  const t = useTranslations('grades.modal');
  const tCommon = useTranslations('common');


  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      await showAlert({
        title: tCommon('attention'),
        description: t('alerts.selectStudent'),
        variant: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          assessment,
          date,
          score: parseFloat(score),
          weight: Number(weight),
        }),
      });

      if (!response.ok) {
        throw new Error(t('alerts.error'));
      }

      onGradeSaved();
      // Reset score but keep assessment details for easier entry of next student
      setScore('');
      setSelectedStudentId('');
      await showAlert({
        title: tCommon('success'),
        description: t('alerts.success'),
        variant: 'info'
      });
    } catch (error) {
      console.error('Error saving grade:', error);
      await showAlert({
        title: tCommon('error'),
        description: t('alerts.error'),
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="assessment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('assessmentLabel')}
            </label>
            <input
              type="text"
              id="assessment"
              required
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-800"
              placeholder={t('assessmentPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('dateLabel')}
              </label>
              <input
                type="date"
                id="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('weightLabel')}
              </label>
              <input
                type="number"
                id="weight"
                required
                min="1"
                max="10"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div>
            <label htmlFor="student" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('studentLabel')}
            </label>
            <select
              id="student"
              required
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            >
              <option value="">{t('studentPlaceholder')}</option>
              {students.map((student) => (
                <option key={student._id.toString()} value={student._id.toString()}>
                  {student.lastName}, {student.firstName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="score" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('scoreLabel')}
            </label>
            <input
              type="number"
              id="score"
              required
              min="0"
              max="10"
              step="0.01"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-lg font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800"
              placeholder="0.00"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              {tCommon('close')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('saveButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
