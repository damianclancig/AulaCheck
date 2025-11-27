'use client';

import { Course } from '@/types/models';
import { Calendar, Users, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const startDate = new Date(course.startDate).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const attendancePercent = (course.meta.avgAttendance * 100).toFixed(0);

  return (
    <Link href={`/dashboard/courses/${course._id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden group">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {course.institutionName}
              </p>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {course.name}
              </h3>
            </div>
            <div className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ml-2">
              {course.meta.studentCount} alumnos
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-6 line-clamp-2 h-10">
            {course.description || 'Sin descripción'}
          </p>

          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <span>Inicio: {startDate}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <BarChart3 className="w-4 h-4 mr-2 text-gray-400" />
              <span>Asistencia prom: <span className="font-medium text-gray-900">{attendancePercent}%</span></span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center group-hover:bg-indigo-50/50 transition-colors">
          <span className="text-xs font-medium text-gray-500 group-hover:text-indigo-600">Ver detalles</span>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}
