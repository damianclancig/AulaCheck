'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Course } from '@/types/models';
import { CourseCard } from '@/components/courses/CourseCard';
import { CreateCourseModal } from '@/components/courses/CreateCourseModal';
import { Plus, Loader2, BookOpen } from 'lucide-react';
import { auth } from '@/lib/firebase/client';

const fetcher = async (url: string) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('No autenticado');
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) throw new Error('Error al cargar datos');
  return res.json();
};

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: courses, error, isLoading, mutate } = useSWR<Course[]>('/api/courses', fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error al cargar los cursos. Por favor intenta recargar la página.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between items-center mb-8 gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Cursos</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona tus clases y alumnos desde aquí.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nuevo Curso
        </button>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course._id.toString()} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-dashed transition-colors duration-200">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tienes cursos creados</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
            Comienza creando tu primer curso para gestionar asistencias y calificaciones.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
          >
            Crear mi primer curso &rarr;
          </button>
        </div>
      )}

      <CreateCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCourseCreated={() => mutate()}
      />
    </div>
  );
}
