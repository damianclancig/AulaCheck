'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase/client';
import { Student } from '@/types/models';
import { useParams } from 'next/navigation';

interface GradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onGradeSaved: () => void;
}

export function GradeModal({ isOpen, onClose, students, onGradeSaved }: GradeModalProps) {
  const params = useParams();
  const courseId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [score, setScore] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Selecciona un alumno');
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No autenticado');

      const response = await fetch(`/api/courses/${courseId}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
        throw new Error('Error al guardar calificación');
      }

      onGradeSaved();
      // Reset score but keep assessment details for easier entry of next student
      setScore('');
      setSelectedStudentId('');
      alert('Calificación guardada correctamente');
    } catch (error) {
      console.error('Error saving grade:', error);
      alert('Error al guardar la calificación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Nueva Calificación</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="assessment" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Evaluación *
            </label>
            <input
              type="text"
              id="assessment"
              required
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
              placeholder="Ej: Parcial 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                id="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                Peso (1-10) *
              </label>
              <input
                type="number"
                id="weight"
                required
                min="1"
                max="10"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-1">
              Alumno *
            </label>
            <select
              id="student"
              required
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
            >
              <option value="">Seleccionar alumno...</option>
              {students.map((student) => (
                <option key={student._id.toString()} value={student._id.toString()}>
                  {student.lastName}, {student.firstName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-1">
              Nota (0-10) *
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-lg font-medium text-gray-900"
              placeholder="0.00"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar Nota
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
