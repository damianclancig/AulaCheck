'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check, XCircle, Clock } from 'lucide-react';
import { auth } from '@/lib/firebase/client';
import { Student } from '@/types/models';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onAttendanceSaved: () => void;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

export function AttendanceModal({ isOpen, onClose, students, onAttendanceSaved }: AttendanceModalProps) {
  const params = useParams();
  const courseId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});

  // Inicializar todos como presentes por defecto cuando se abre el modal
  useEffect(() => {
    if (isOpen && students.length > 0) {
      const initialMap: Record<string, AttendanceStatus> = {};
      students.forEach(s => {
        initialMap[s._id.toString()] = 'present';
      });
      setAttendanceMap(initialMap);
    }
  }, [isOpen, students]);

  if (!isOpen) return null;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No autenticado');

      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status
      }));

      const response = await fetch(`/api/courses/${courseId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          records
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar asistencia');
      }

      onAttendanceSaved();
      onClose();
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error al guardar la asistencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tomar Asistencia</h2>
            <p className="text-sm text-gray-500 mt-1">
              {students.length} alumnos registrados
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de la clase
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
          />
        </div>

        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {students.map((student) => {
            const status = attendanceMap[student._id.toString()] || 'present';
            
            return (
              <div key={student._id.toString()} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-medium text-sm">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.lastName}, {student.firstName}</p>
                    <p className="text-xs text-gray-500">Legajo: {student.externalId || '-'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(student._id.toString(), 'present')}
                    className={cn(
                      "p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all",
                      status === 'present' 
                        ? "bg-green-100 text-green-700 ring-2 ring-green-500 ring-offset-1" 
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Presente</span>
                  </button>
                  
                  <button
                    onClick={() => handleStatusChange(student._id.toString(), 'late')}
                    className={cn(
                      "p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all",
                      status === 'late' 
                        ? "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500 ring-offset-1" 
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">Tarde</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange(student._id.toString(), 'absent')}
                    className={cn(
                      "p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all",
                      status === 'absent' 
                        ? "bg-red-100 text-red-700 ring-2 ring-red-500 ring-offset-1" 
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    <XCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Ausente</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar Asistencia
          </button>
        </div>
      </div>
    </div>
  );
}
