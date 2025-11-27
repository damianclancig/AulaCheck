'use client';

import { Student } from '@/types/models';
import { MoreVertical, Mail, Phone, Trash2, UserCog } from 'lucide-react';
import { useState } from 'react';

interface StudentListProps {
  students: (Student & { attendancePercentage?: number; gradeAverage?: number | null })[];
  onDeleteStudent: (studentId: string) => void;
  onEditStudent: (student: Student) => void;
}

export function StudentList({ students, onDeleteStudent, onEditStudent }: StudentListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alumno
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asistencia
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Promedio
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => {
              const attendanceColor = 
                (student.attendancePercentage || 0) >= 0.75 ? 'text-green-600 bg-green-50' :
                (student.attendancePercentage || 0) >= 0.60 ? 'text-yellow-600 bg-yellow-50' :
                'text-red-600 bg-red-50';

              return (
                <tr key={student._id.toString()} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.lastName}, {student.firstName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Legajo: {student.externalId || '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {student.email || '-'}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {student.phone || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${attendanceColor}`}>
                      {((student.attendancePercentage || 0) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.gradeAverage !== null && student.gradeAverage !== undefined
                      ? student.gradeAverage.toFixed(2)
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === student._id.toString() ? null : student._id.toString())}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {openMenuId === student._id.toString() && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1" role="menu">
                            <button
                              onClick={() => {
                                onEditStudent(student);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <UserCog className="w-4 h-4" /> Editar
                            </button>
                            <button
                              onClick={() => {
                                onDeleteStudent(student._id.toString());
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Dar de baja
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {students.map((student) => {
          const attendanceColor = 
            (student.attendancePercentage || 0) >= 0.75 ? 'text-green-600 bg-green-50' :
            (student.attendancePercentage || 0) >= 0.60 ? 'text-yellow-600 bg-yellow-50' :
            'text-red-600 bg-red-50';

          return (
            <div key={student._id.toString()} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium flex-shrink-0">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {student.lastName}, {student.firstName}
                    </div>
                    <div className="text-xs text-gray-500">
                      Legajo: {student.externalId || '-'}
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === student._id.toString() ? null : student._id.toString())}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {openMenuId === student._id.toString() && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1" role="menu">
                        <button
                          onClick={() => {
                            onEditStudent(student);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <UserCog className="w-4 h-4" /> Editar
                        </button>
                        <button
                          onClick={() => {
                            onDeleteStudent(student._id.toString());
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Dar de baja
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{student.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{student.phone || '-'}</span>
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-gray-500">Asistencia:</span>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${attendanceColor}`}>
                      {((student.attendancePercentage || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-gray-500">Promedio:</span>
                    <span className="font-medium text-gray-900">
                      {student.gradeAverage !== null && student.gradeAverage !== undefined
                        ? student.gradeAverage.toFixed(2)
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {students.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay alumnos inscritos en este curso.
        </div>
      )}
    </div>
  );
}
