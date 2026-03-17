import { ObjectId } from 'mongodb'

// User (docente)
export interface User {
  _id: string // Firebase UID
  email: string
  name: string
  photoURL?: string
  role: 'teacher' | 'admin'
  createdAt: Date
}

// School (opcional para MVP)
export interface School {
  _id: ObjectId
  name: string
  address?: string
  createdAt: Date
}

// Course
export interface Course {
  _id: ObjectId
  name: string
  ownerId: string // Firebase UID
  institutionName: string
  schoolId?: ObjectId // Deprecated/Future use
  startDate: string // Formato YYYY-MM-DD
  annualClassCount?: number // Cantidad total de clases durante el año
  shift?: 'Mañana' | 'Tarde' | 'Noche' // Turno del curso
  description?: string
  joinCode?: string // Unique 8-character code for self-registration
  joinCodeExpiresAt?: Date // Fecha límite de validez del código
  allowJoinRequests: boolean // Whether self-registration is enabled
  createdAt: Date
  meta: {
    studentCount: number
    avgAttendance: number // 0-1
    avgGrade?: number // 0-10
  }
}

// Student
export interface Student {
  _id: ObjectId
  firstName: string
  lastName: string
  email?: string
  phone?: string // número de celular
  externalId?: string // legajo/DNI
  requiresAttention?: boolean // ¿Requiere atención especial / se porta mal?
  isRepeating?: boolean // ¿Es recursante?
  notes?: string // Observaciones o notas
  createdAt: Date
}

// Enrollment (matrícula: vínculo alumno - curso)
export interface Enrollment {
  _id: ObjectId
  courseId: ObjectId
  studentId: ObjectId
  enrollDate: Date
  status: 'active' | 'inactive'
  withdrawalReason?: 'course_change' | 'school_change' | 'other'
  withdrawalDate?: Date
  withdrawalNote?: string
}

// Attendance (registro por fecha)
export interface Attendance {
  _id: ObjectId
  courseId: ObjectId
  studentId?: ObjectId // Opcional: no presente en registros de suspensión sin alumnos
  date: string // YYYY-MM-DD
  status?: 'present' | 'absent' | 'late' // Opcional: no presente en registros de suspensión sin alumnos
  suspensionReason?: 'none' | 'class_suspension' | 'teacher_leave' | 'other' // Motivo de suspensión
  suspensionNote?: string // Nota personalizada cuando suspensionReason es 'other'
  createdAt: Date
}

// Grade
export interface Grade {
  _id: ObjectId
  courseId: ObjectId
  studentId: ObjectId
  assessment: string // nombre de la evaluación
  date: string // Formato YYYY-MM-DD
  score: number
  weight: number // peso para promedio ponderado
  // Campos del módulo de calificaciones dinámicas (opcionales para retrocompatibilidad)
  period?: 1 | 2 // Cuatrimestre al que pertenece
  year?: number // Año lectivo
  activityId?: string // ID de la actividad/columna en la planilla
  isManual?: boolean // Indica si fue modificada manualmente por el docente
  createdAt: Date
}

// GradeActivity - describe una actividad/columna de la planilla de un cuatrimestre
export interface GradeActivity {
  id: string // UUID local de la actividad
  name: string // Nombre editable (ej: "TP1", "Parcial 1")
  order: number // Orden de columna
}

// GradeSheetMeta - metadata del cierre anual y overrides por alumno
export interface GradeSheetMeta {
  _id: ObjectId
  courseId: ObjectId
  studentId: ObjectId
  year: number
  // Overrides por cuatrimestre (informe manual)
  semester1Override?: string | null // 'TEA' | 'TEP' | 'TED' | null
  semester2Override?: string | null
  // Cierre anual
  annualCalculatedCondition?: string // 'APPROVED' | 'DECEMBER' | 'FEBRUARY'
  annualForcedCondition?: string | null // Override manual
  isManual: boolean // True si algún campo fue forzado manualmente
  updatedAt: Date
}

// BehavioralPoints - puntos por comportamiento (+/- 5) para un cuatrimestre
export interface BehavioralPoints {
  _id?: ObjectId
  courseId: ObjectId
  studentId: ObjectId
  period: 1 | 2
  year: number
  points: number // [-5, 5]
  updatedAt: Date
}

// Tipos para la respuesta de la API de planilla de calificaciones
export interface GradeSheetActivity {
  id: string
  name: string
  order: number
}

export interface GradeSheetStudentRow {
  studentId: string
  firstName: string
  lastName: string
  scores: Record<string, number | null> // activityId -> score (null si vacío)
  average: number | null
  attendancePresent: number
  attendanceAbsent: number
  attendancePercent: number // % de presencia
  absencePercent: number // % de inasistencia
  status: 'TEA' | 'TEP' | 'TED' // calculado automáticamente
  statusOverride: string | null // override manual
  isManual: boolean
  behavioralPoints: number // default 0
}

export interface GradeSheetData {
  period: 1 | 2
  year: number
  activities: GradeSheetActivity[]
  rows: GradeSheetStudentRow[]
}

// Tipos para la vista de cierre anual
export interface AnnualConditionRow {
  studentId: string
  firstName: string
  lastName: string
  semester1Average: number | null
  semester2Average: number | null
  finalAverage: number | null
  semester1Status: string
  semester2Status: string
  annualAttendancePercent: number
  calculatedCondition: 'APPROVED' | 'DECEMBER' | 'FEBRUARY'
  forcedCondition: string | null
  isManual: boolean
}

// Join Request (student self-registration)
export interface JoinRequest {
  _id: ObjectId
  courseId: ObjectId
  firstName: string
  lastName: string
  email?: string
  phone?: string
  externalId?: string
  requiresAttention?: boolean
  isRepeating?: boolean
  notes?: string
  deviceTokenHash?: string
  submittedFrom?: 'same-device'
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  processedAt?: Date
  processedBy?: string // Teacher's Firebase UID
}

export interface JoinRequestPossibleDuplicate {
  type: 'enrolledStudent' | 'pendingRequest'
  id: string
  firstName: string
  lastName: string
  similarityScore: number
  email?: string
  phone?: string
  externalId?: string
  enrollmentStatus?: 'active' | 'inactive'
  createdAt?: Date
}

export interface PendingJoinRequestWithMatches extends JoinRequest {
  hasPossibleDuplicates: boolean
  possibleDuplicates: JoinRequestPossibleDuplicate[]
}

// DTOs para API responses
export interface CourseWithMetrics extends Course {
  meta: {
    studentCount: number
    avgAttendance: number
    avgGrade?: number
  }
}

export interface StudentWithMetrics extends Student {
  attendancePercentage?: number
  gradeAverage?: number | null
  enrollmentStatus?: 'active' | 'inactive'
}

export interface EnrollmentWithStudent extends Enrollment {
  student: Student
}
