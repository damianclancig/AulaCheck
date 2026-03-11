'use client';

import { Course } from '@/types/models';
import { Calendar, Users, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  // Parsear fecha directamente del string YYYY-MM-DD sin conversión UTC
  const formatStartDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const startDate = formatStartDate(course.startDate);

  const attendancePercent = (course.meta.avgAttendance * 100).toFixed(0);

  return (
    <Link href={`/dashboard/courses/${course._id}`} className="block h-full">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 overflow-hidden group h-full flex flex-col">
        {/* Cabecera de la institución separada y centrada */}
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 py-1.5 px-3 border-b border-indigo-100 dark:border-indigo-900/30 text-center">
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-0 opacity-80 leading-tight">
            Institución
          </p>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-tight">
            {course.institutionName}
          </h2>
        </div>

        <div className="p-8 flex-1">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Curso</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight">
                  {course.name}
                </h3>
                {course.shift && (
                  <p className={`text-sm font-bold mt-1.5 ${course.shift === 'Mañana' ? 'text-amber-600 dark:text-amber-400'
                    : course.shift === 'Tarde' ? 'text-orange-600 dark:text-orange-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                    }`}>
                    Turno: {course.shift}
                  </p>
                )}
              </div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-3 py-1 rounded-lg shrink-0 ml-3 border border-indigo-100 dark:border-indigo-800">
              {course.meta.studentCount} Alumnos
            </div>
          </div>

          <p className="text-base text-gray-600 dark:text-gray-400 mb-8 line-clamp-2 leading-relaxed">
            {course.description || 'Sin descripción detallada del curso.'}
          </p>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
              <Calendar className="w-5 h-5 mr-3 text-indigo-500/70" />
              <span>Inicio: <span className="text-gray-900 dark:text-gray-100">{startDate}</span></span>
            </div>

            <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
              <BarChart3 className="w-5 h-5 mr-3 text-indigo-500/70" />
              <span>Asistencia: <span className="text-gray-900 dark:text-gray-100">{attendancePercent}% Promedio</span></span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50/50 dark:bg-gray-800/30 px-8 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center group-hover:bg-indigo-50/80 dark:group-hover:bg-indigo-900/20 transition-all">
          <span className="text-sm font-bold text-indigo-600/80 dark:text-indigo-400/80 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Ver Gestión Completa</span>
          <ArrowRight className="w-5 h-5 text-indigo-400 transform group-hover:translate-x-1.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
