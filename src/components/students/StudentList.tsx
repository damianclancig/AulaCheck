'use client';

import { Student } from '@/types/models';
import { MoreVertical, Mail, Phone, Trash2, UserCog, Search, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, Check, X } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import { ContactPopover } from './ContactPopover';

interface StudentListProps {
  students: (Student & { attendancePercentage?: number; gradeAverage?: number | null })[];
  onDeleteStudent: (studentId: string) => void;
  onEditStudent: (student: Student) => void;
}

type SortField = 'name' | 'attendance' | 'grade';
type SortDirection = 'asc' | 'desc';

function ContactTrigger({ student }: { student: Student }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const hasEmail = !!student.email;
  const hasPhone = !!student.phone;

  if (!hasEmail && !hasPhone) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-300">
        <Mail className="w-4 h-4" />
      </div>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${
          isOpen ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'
        }`}
        title="Ver contacto"
      >
        {hasEmail && <Mail className={`w-4 h-4 ${hasPhone ? 'mr-0.5' : ''}`} />}
        {hasPhone && <Phone className="w-4 h-4" />}
      </button>

      <ContactPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        email={student.email}
        phone={student.phone}
        studentName={`${student.firstName} ${student.lastName}`}
      />
    </>
  );
}

export function StudentList({ students, onDeleteStudent, onEditStudent }: StudentListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    // Filter by search query
    let filtered = students.filter(student => {
      const query = searchQuery.toLowerCase();
      return (
        student.firstName.toLowerCase().includes(query) ||
        student.lastName.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.externalId?.toLowerCase().includes(query)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'name') {
        // Sort by lastName, then firstName
        const lastNameCompare = a.lastName.localeCompare(b.lastName);
        comparison = lastNameCompare !== 0 ? lastNameCompare : a.firstName.localeCompare(b.firstName);
      } else if (sortField === 'attendance') {
        comparison = (a.attendancePercentage || 0) - (b.attendancePercentage || 0);
      } else if (sortField === 'grade') {
        const aGrade = a.gradeAverage ?? -1;
        const bGrade = b.gradeAverage ?? -1;
        comparison = aGrade - bGrade;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [students, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to asc
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-indigo-600" /> : 
      <ArrowDown className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 w-full max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido, email o legajo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Mobile Sort Button */}
            <div className="relative md:hidden flex-1">
              <button
                onClick={() => setSortMenuOpen(!sortMenuOpen)}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Ordenar
              </button>
              {sortMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSortMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                        Ordenar por
                      </div>
                      <button
                        onClick={() => {
                          handleSort('name');
                          setSortMenuOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span>Alumno (A-Z)</span>
                        {sortField === 'name' && <Check className="w-4 h-4 text-indigo-600" />}
                      </button>
                      <button
                        onClick={() => {
                          handleSort('attendance');
                          setSortMenuOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span>Asistencia</span>
                        {sortField === 'attendance' && <Check className="w-4 h-4 text-indigo-600" />}
                      </button>
                      <button
                        onClick={() => {
                          handleSort('grade');
                          setSortMenuOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span>Promedio</span>
                        {sortField === 'grade' && <Check className="w-4 h-4 text-indigo-600" />}
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span>Dirección</span>
                        {sortDirection === 'asc' ? (
                          <ArrowUp className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-indigo-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="text-sm text-gray-500 whitespace-nowrap">
              {filteredAndSortedStudents.length} de {students.length} alumnos
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Alumno
                    <SortIcon field="name" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  <Mail className="w-4 h-4 mx-auto" />
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('attendance')}
                >
                  <div className="flex items-center gap-2">
                    Asistencia
                    <SortIcon field="attendance" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('grade')}
                >
                  <div className="flex items-center gap-2">
                    Promedio
                    <SortIcon field="grade" />
                  </div>
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchQuery ? 'No se encontraron alumnos con ese criterio' : 'No hay alumnos inscritos'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedStudents.map((student, index) => {
                  const attendanceColor = 
                    (student.attendancePercentage || 0) >= 0.75 ? 'text-green-600 bg-green-50' :
                    (student.attendancePercentage || 0) >= 0.60 ? 'text-yellow-600 bg-yellow-50' :
                    'text-red-600 bg-red-50';

                  return (
                    <tr key={student._id.toString()} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                              {student.firstName[0]}{student.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.lastName}, {student.firstName}
                            </div>
                            {student.externalId && (
                              <div className="text-sm text-gray-500">
                                Legajo: {student.externalId}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <ContactTrigger student={student} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${attendanceColor}`}>
                          {((student.attendancePercentage || 0) * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.gradeAverage !== null && student.gradeAverage !== undefined
                          ? student.gradeAverage.toFixed(2)
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === student._id.toString() ? null : student._id.toString())}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openMenuId === student._id.toString() && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div 
                                className={`absolute right-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 ${
                                  index >= filteredAndSortedStudents.length - 2 ? 'bottom-full mb-2' : 'mt-2'
                                }`}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      onEditStudent(student);
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <UserCog className="w-4 h-4 mr-3" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => {
                                      onDeleteStudent(student._id.toString());
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 mr-3" />
                                    Dar de baja
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredAndSortedStudents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            {searchQuery ? 'No se encontraron alumnos con ese criterio' : 'No hay alumnos inscritos'}
          </div>
        ) : (
          filteredAndSortedStudents.map((student, index) => {
            const attendanceColor = 
              (student.attendancePercentage || 0) >= 0.75 ? 'text-green-600 bg-green-50' :
              (student.attendancePercentage || 0) >= 0.60 ? 'text-yellow-600 bg-yellow-50' :
              'text-red-600 bg-red-50';

            return (
              <div key={student._id.toString()} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-medium">
                        {student.firstName[0]}{student.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {student.lastName}, {student.firstName}
                      </h3>
                      {student.externalId && (
                        <p className="text-sm text-gray-500">Legajo: {student.externalId}</p>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === student._id.toString() ? null : student._id.toString())}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openMenuId === student._id.toString() && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div 
                          className={`absolute right-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 ${
                            index >= filteredAndSortedStudents.length - 2 ? 'bottom-full mb-2' : 'mt-2'
                          }`}
                        >
                          <div className="py-1">
                            <button
                              onClick={() => {
                                onEditStudent(student);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <UserCog className="w-4 h-4 mr-3" />
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                onDeleteStudent(student._id.toString());
                                setOpenMenuId(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-3" />
                              Dar de baja
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ContactTrigger student={student} />
                    <span className="text-sm text-gray-500">
                      {student.email || student.phone ? 'Ver contacto' : 'Sin contacto'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Asistencia</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${attendanceColor}`}>
                        {((student.attendancePercentage || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Promedio</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {student.gradeAverage !== null && student.gradeAverage !== undefined
                          ? student.gradeAverage.toFixed(2)
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
