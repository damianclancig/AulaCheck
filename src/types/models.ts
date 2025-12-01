import { ObjectId } from 'mongodb';

// User (docente)
export interface User {
  _id: string; // Firebase UID
  email: string;
  name: string;
  photoURL?: string;
  role: 'teacher' | 'admin';
  createdAt: Date;
}

// School (opcional para MVP)
export interface School {
  _id: ObjectId;
  name: string;
  address?: string;
  createdAt: Date;
}

// Course
export interface Course {
  _id: ObjectId;
  name: string;
  ownerId: string; // Firebase UID
  institutionName: string;
  schoolId?: ObjectId; // Deprecated/Future use
  startDate: string; // Formato YYYY-MM-DD
  description?: string;
  joinCode?: string; // Unique 8-character code for self-registration
  allowJoinRequests: boolean; // Whether self-registration is enabled
  createdAt: Date;
  meta: {
    studentCount: number;
    avgAttendance: number; // 0-1
    avgGrade?: number; // 0-10
  };
}

// Student
export interface Student {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string; // número de celular
  externalId?: string; // legajo/DNI
  createdAt: Date;
}

// Enrollment (matrícula: vínculo alumno - curso)
export interface Enrollment {
  _id: ObjectId;
  courseId: ObjectId;
  studentId: ObjectId;
  enrollDate: Date;
  status: 'active' | 'inactive';
}

// Attendance (registro por fecha)
export interface Attendance {
  _id: ObjectId;
  courseId: ObjectId;
  studentId: ObjectId;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late';
  createdAt: Date;
}

// Grade
export interface Grade {
  _id: ObjectId;
  courseId: ObjectId;
  studentId: ObjectId;
  assessment: string; // nombre de la evaluación
  date: string; // Formato YYYY-MM-DD
  score: number;
  weight: number; // peso para promedio ponderado
  createdAt: Date;
}

// Join Request (student self-registration)
export interface JoinRequest {
  _id: ObjectId;
  courseId: ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  externalId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string; // Teacher's Firebase UID
}

// DTOs para API responses
export interface CourseWithMetrics extends Course {
  meta: {
    studentCount: number;
    avgAttendance: number;
    avgGrade?: number;
  };
}

export interface StudentWithMetrics extends Student {
  attendancePercentage?: number;
  gradeAverage?: number;
}

export interface EnrollmentWithStudent extends Enrollment {
  student: Student;
}
