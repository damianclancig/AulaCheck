import useSWR from 'swr';
import { Course } from '@/types/models';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al cargar instituciones');
  return res.json();
};

export function useInstitutions() {
  const { data: courses, error, isLoading } = useSWR<Course[]>('/api/courses', fetcher);

  const institutions = Array.from(
    new Set((courses || []).map((course) => course.institutionName).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  return {
    institutions,
    isLoading,
    error,
  };
}
