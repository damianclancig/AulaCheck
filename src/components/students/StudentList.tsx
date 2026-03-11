'use client';

import { Student } from '@/types/models';
import { MoreVertical, Mail, Phone, Trash2, UserCog, Search, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, Check, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ContactPopover } from './ContactPopover';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  studentId: string;
}

interface StudentListProps {
  students: (Student & {
    attendancePercentage?: number;
    gradeAverage?: number | null;
    enrollmentStatus?: 'active' | 'inactive';
  })[];
  onDeleteStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onStudentUpdated?: () => void;
}

type SortField = 'name' | 'attendance' | 'grade';
type SortDirection = 'asc' | 'desc';

import { useTranslations } from 'next-intl';

function ContactTrigger({ student, showText = false }: { student: Student; showText?: boolean }) {
  const t = useTranslations('students.list');
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const hasEmail = !!student.email;
  const hasPhone = !!student.phone;

  if (!hasEmail && !hasPhone) {
    return null;
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${isOpen ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        title={t('contact')}
      >
        <div className="flex items-center">
          {hasEmail && <Mail className={`w-4 h-4 ${hasPhone ? 'mr-1' : ''}`} />}
          {hasPhone && <Phone className="w-4 h-4" />}
        </div>
        {showText && <span className="text-sm font-medium">{t('contact')}</span>}
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

export function StudentList({ students, onDeleteStudent, onEditStudent, onStudentUpdated }: StudentListProps) {
  const t = useTranslations('students.list');
  const tCommon = useTranslations('common');
  
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    studentId: '',
  });

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    const handleScroll = () => setContextMenu(prev => ({ ...prev, visible: false }));
    
    if (contextMenu.visible) {
      document.addEventListener('click', handleClick);
      window.addEventListener('scroll', handleScroll, true); // Use capture phase for scrolling in any scrollable parent
      return () => {
        document.removeEventListener('click', handleClick);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [contextMenu.visible]);

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent, studentId: string) => {
    e.preventDefault();
    e.stopPropagation();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const menuWidth = 200;
    const menuHeight = 120; // 3 items approx
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let x = clientX;
    if (x + menuWidth > windowWidth) {
      x = clientX - menuWidth;
    }

    let y = clientY;
    if (y + menuHeight > windowHeight) {
      y = clientY - menuHeight;
    }

    x = Math.max(10, x);
    y = Math.max(10, y);

    setContextMenu({
      visible: true,
      x,
      y,
      studentId,
    });
  };

  const currentStudentContextMenu = students.find(s => s._id.toString() === contextMenu.studentId);

  const handleToggleFlag = async (flag: 'requiresAttention' | 'isRepeating') => {
    if (!currentStudentContextMenu) return;

    setContextMenu(prev => ({ ...prev, visible: false }));
    
    const newValue = !currentStudentContextMenu[flag];
    
    try {
      const response = await fetch(`/api/students/${currentStudentContextMenu._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [flag]: newValue,
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar el alumno');
      
      if (onStudentUpdated) {
        onStudentUpdated();
      }
      
      router.refresh();
    } catch (error) {
      console.error('Error updating flag:', error);
    }
  };

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
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {t('sort')}
              </button>
              {sortMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSortMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-900 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-20">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        {t('sortBy')}
                      </div>
                      <button
                        onClick={() => {
                          handleSort('name');
                          setSortMenuOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <span>{t('studentAZ')}</span>
                        {sortField === 'name' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                      <button
                        onClick={() => {
                          handleSort('attendance');
                          setSortMenuOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <span>{t('attendance')}</span>
                        {sortField === 'attendance' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                      <button
                        onClick={() => {
                          handleSort('grade');
                          setSortMenuOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <span>{t('average')}</span>
                        {sortField === 'grade' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                      <button
                        onClick={() => {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <span>{t('direction')}</span>
                        {sortDirection === 'asc' ? (
                          <ArrowUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {t('count', { filtered: filteredAndSortedStudents.length, total: students.length })}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && currentStudentContextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-[100] min-w-[220px] transition-colors"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-gray-800 mb-1">
            {t('indicators')}
          </div>
          <button
            onClick={() => handleToggleFlag('requiresAttention')}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-4 h-4 ${currentStudentContextMenu.requiresAttention ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-fuchsia-500'}`} />
              <span className={currentStudentContextMenu.requiresAttention ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}>
                {t('requiresAttention')}
              </span>
            </div>
            {currentStudentContextMenu.requiresAttention && <Check className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />}
          </button>
          
          <button
            onClick={() => handleToggleFlag('isRepeating')}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-3">
              <RefreshCw className={`w-4 h-4 ${currentStudentContextMenu.isRepeating ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-amber-500'}`} />
              <span className={currentStudentContextMenu.isRepeating ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}>
                {t('isRepeating')}
              </span>
            </div>
            {currentStudentContextMenu.isRepeating && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          </button>

          <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
          
          <button
            onClick={() => {
              onEditStudent(currentStudentContextMenu);
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors"
          >
            <UserCog className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">
              {t('actions.edit')}
            </span>
          </button>

          <button
            onClick={() => {
              onDeleteStudent(currentStudentContextMenu);
              setContextMenu({ ...contextMenu, visible: false });
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span className="text-red-600 dark:text-red-400">
              {currentStudentContextMenu.enrollmentStatus === 'inactive' ? t('actions.withdrawalDetails') : t('actions.withdrawal')}
            </span>
          </button>
        </div>
      )}


      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    {t('headers.student')}
                    <SortIcon field="name" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                  <Mail className="w-4 h-4 mx-auto" />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('attendance')}
                >
                  <div className="flex items-center gap-2">
                    {t('headers.attendance')}
                    <SortIcon field="attendance" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('grade')}
                >
                  <div className="flex items-center gap-2">
                    {t('headers.average')}
                    <SortIcon field="grade" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? t('empty.search') : t('empty.noStudents')}
                  </td>
                </tr>
              ) : (
                filteredAndSortedStudents.map((student, index) => {
                  const isInactive = student.enrollmentStatus === 'inactive';
                  const attendanceColor =
                    isInactive ? 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800' :
                      (student.attendancePercentage || 0) >= 0.75 ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' :
                        (student.attendancePercentage || 0) >= 0.60 ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30' :
                          'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30';

                  return (
                    <tr 
                      key={student._id.toString()} 
                      className={cn(
                        "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                        isInactive ? "opacity-60 bg-gray-50/50 dark:bg-gray-900/50" : "cursor-context-menu"
                      )}
                      onContextMenu={(e) => {
                        if (!isInactive) {
                          handleContextMenu(e, student._id.toString());
                        }
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isInactive ? 'bg-gray-100 dark:bg-gray-800' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
                              <span className={`font-medium text-xs ${isInactive ? 'text-gray-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                {student.firstName[0]}{student.lastName[0]}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                <span className={student.requiresAttention ? "bg-fuchsia-200 dark:bg-fuchsia-900/40 text-fuchsia-900 dark:text-fuchsia-100 px-1.5 py-0.5 rounded-sm" : ""}>
                                  {student.lastName}, {student.firstName}
                                </span>
                                <div className="flex items-center gap-1.5 ml-1">
                                  {student.isRepeating && (
                                    <div className="flex items-center justify-center w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50" title={t('isRepeating')}>
                                      <span className="font-black text-sm">R</span>
                                    </div>
                                  )}
                                </div>
                                {isInactive && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                    {t('inactive')}
                                  </span>
                                )}
                              </div>
                              {student.externalId && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {t('externalIdPlaceholder')}: {student.externalId}
                                </div>
                              )}
                            </div>
                          </div>
                          {student.notes && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 italic whitespace-pre-line line-clamp-2 max-w-md" title={student.notes}>
                              {student.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className={`flex justify-center ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}>
                          <ContactTrigger student={student} showText={true} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1 justify-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${attendanceColor}`}>
                            {((student.attendancePercentage || 0) * 100).toFixed(0)}%
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-600">/</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {(100 - ((student.attendancePercentage || 0) * 100)).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {student.gradeAverage !== null && student.gradeAverage !== undefined
                          ? student.gradeAverage.toFixed(2)
                          : '-'}
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
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500 dark:text-gray-400 transition-colors">
            {searchQuery ? t('empty.search') : t('empty.noStudents')}
          </div>
        ) : (
          filteredAndSortedStudents.map((student, index) => {
            const isInactive = student.enrollmentStatus === 'inactive';
            const attendanceColor =
              isInactive ? 'text-gray-400 bg-gray-100' :
                (student.attendancePercentage || 0) >= 0.75 ? 'text-green-600 bg-green-50' :
                  (student.attendancePercentage || 0) >= 0.60 ? 'text-yellow-600 bg-yellow-50' :
                    'text-red-600 bg-red-50';

            return (
              <div 
                key={student._id.toString()} 
                className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 transition-colors select-none ${isInactive ? 'opacity-70 bg-gray-50/50' : ''}`}
                onContextMenu={(e) => {
                  if (!isInactive) {
                    handleContextMenu(e, student._id.toString());
                  }
                }}
                onTouchStart={(e) => {
                  if (isInactive) return;
                  const touch = e.touches[0];
                  // Guardar el timer id en el elemento para poder cancelarlo si se mueve el dedo
                  const timerId = window.setTimeout(() => {
                    handleContextMenu(
                      { preventDefault: () => { }, stopPropagation: () => { }, touches: [{ clientX: touch.clientX, clientY: touch.clientY }] } as any,
                      student._id.toString()
                    );
                  }, 600);
                  
                  e.currentTarget.setAttribute('data-longpress-timer', timerId.toString());
                }}
                onTouchMove={(e) => {
                  const timerId = e.currentTarget.getAttribute('data-longpress-timer');
                  if (timerId) {
                    window.clearTimeout(parseInt(timerId, 10));
                    e.currentTarget.removeAttribute('data-longpress-timer');
                  }
                }}
                onTouchEnd={(e) => {
                  const timerId = e.currentTarget.getAttribute('data-longpress-timer');
                  if (timerId) {
                    window.clearTimeout(parseInt(timerId, 10));
                    e.currentTarget.removeAttribute('data-longpress-timer');
                  }
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isInactive ? 'bg-gray-100' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
                      <span className={`font-medium text-sm ${isInactive ? 'text-gray-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {student.firstName[0]}{student.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className={student.requiresAttention ? "bg-fuchsia-200 dark:bg-fuchsia-900/40 text-fuchsia-900 dark:text-fuchsia-100 px-1.5 py-0.5 rounded-sm" : ""}>
                          {student.lastName}, {student.firstName}
                        </span>
                        <div className="flex items-center gap-1.5 ml-1">
                          {student.isRepeating && (
                            <div className="flex items-center justify-center w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50" title={t('isRepeating')}>
                              <span className="font-black text-sm">R</span>
                            </div>
                          )}
                        </div>
                        {isInactive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {t('inactive')}
                          </span>
                        )}
                      </h3>
                      {student.externalId && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('externalIdPlaceholder')}: {student.externalId}</p>
                      )}
                    </div>
                  </div>
                </div>

                {student.notes && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic whitespace-pre-line line-clamp-3 mb-3">{student.notes}</p>
                )}

                {(student.email || student.phone) ? (
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ContactTrigger student={student} showText={true} />
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('headers.attendance')}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${attendanceColor}`}>
                        {((student.attendancePercentage || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('headers.average')}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
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
