import { Collection } from 'mongodb';
import { getDatabase } from './client';
import type {
  User,
  School,
  Course,
  Student,
  Enrollment,
  Attendance,
  Grade,
  JoinRequest,
} from '@/types/models';

// Helper functions para acceder a colecciones tipadas
export async function getUsersCollection(): Promise<Collection<User>> {
  const db = await getDatabase();
  return db.collection<User>('users');
}

export async function getSchoolsCollection(): Promise<Collection<School>> {
  const db = await getDatabase();
  return db.collection<School>('schools');
}

export async function getCoursesCollection(): Promise<Collection<Course>> {
  const db = await getDatabase();
  return db.collection<Course>('courses');
}

export async function getStudentsCollection(): Promise<Collection<Student>> {
  const db = await getDatabase();
  return db.collection<Student>('students');
}

export async function getEnrollmentsCollection(): Promise<Collection<Enrollment>> {
  const db = await getDatabase();
  return db.collection<Enrollment>('enrollments');
}

export async function getAttendanceCollection(): Promise<Collection<Attendance>> {
  const db = await getDatabase();
  return db.collection<Attendance>('attendance');
}

export async function getGradesCollection(): Promise<Collection<Grade>> {
  const db = await getDatabase();
  return db.collection<Grade>('grades');
}

export async function getJoinRequestsCollection(): Promise<Collection<JoinRequest>> {
  const db = await getDatabase();
  return db.collection<JoinRequest>('joinRequests');
}
