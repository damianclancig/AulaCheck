import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useStudentActions(onStudentUpdated?: () => void) {
  const router = useRouter();
  const [loadingFlags, setLoadingFlags] = useState<Record<string, Record<string, boolean>>>({});
  const [optimisticFlags, setOptimisticFlags] = useState<Record<string, Record<string, boolean>>>({});

  const handleToggleFlag = async (studentId: string, flag: 'requiresAttention' | 'isRepeating', currentValue: boolean) => {
    const newValue = !currentValue;

    // Set optimistic update
    setOptimisticFlags((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [flag]: newValue,
      },
    }));

    // Set loading state
    setLoadingFlags((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [flag]: true,
      },
    }));

    try {
      const response = await fetch(`/api/students/${studentId}`, {
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
      // Revert optimistic change on error
      setOptimisticFlags((prev) => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          [flag]: currentValue,
        },
      }));
    } finally {
      // Clear loading state
      setLoadingFlags((prev) => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          [flag]: false,
        },
      }));
    }
  };

  const handleAddComment = async (studentId: string, currentNotes: string, comment: string) => {
    const newNotes = currentNotes ? `${currentNotes}\n\n${comment}` : comment;

    setLoadingFlags((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        comment: true,
      },
    }));

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: newNotes,
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar el alumno');

      if (onStudentUpdated) {
        onStudentUpdated();
      }

      router.refresh();
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    } finally {
      setLoadingFlags((prev) => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          comment: false,
        },
      }));
    }
  };

  return {
    handleToggleFlag,
    handleAddComment,
    loadingFlags,
    optimisticFlags,
  };
}
