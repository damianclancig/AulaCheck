import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomUUID } from 'crypto'
import { getCoursesCollection, getJoinRequestsCollection } from '@/lib/mongodb/collections'

const JOIN_VISITOR_COOKIE = 'joinVisitorToken'
const JOIN_VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function hashVisitorToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function readOrCreateVisitorToken(request: NextRequest) {
  const cookieToken = request.cookies.get(JOIN_VISITOR_COOKIE)?.value?.trim()

  if (cookieToken) {
    return {
      visitorToken: cookieToken,
      shouldSetCookie: false,
    }
  }

  return {
    visitorToken: randomUUID(),
    shouldSetCookie: true,
  }
}

function applyVisitorCookie(
  response: NextResponse,
  visitorToken: string,
  shouldSetCookie: boolean,
) {
  if (!shouldSetCookie) {
    return response
  }

  response.cookies.set({
    name: JOIN_VISITOR_COOKIE,
    value: visitorToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: JOIN_VISITOR_COOKIE_MAX_AGE,
  })

  return response
}

interface RouteParams {
  params: Promise<{
    code: string
  }>
}

// GET /api/join/[code] - Get course info by join code (public, no auth)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params
    const { visitorToken, shouldSetCookie } = readOrCreateVisitorToken(request)

    const coursesCollection = await getCoursesCollection()
    const course = await coursesCollection.findOne({
      joinCode: code,
      allowJoinRequests: true,
      $or: [{ joinCodeExpiresAt: { $gt: new Date() } }, { joinCodeExpiresAt: { $exists: false } }],
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Código de invitación inválido o expirado' },
        { status: 404 },
      )
    }

    const joinRequestsCollection = await getJoinRequestsCollection()
    const existingRequest = await joinRequestsCollection.findOne({
      courseId: course._id,
      status: 'pending',
      deviceTokenHash: hashVisitorToken(visitorToken),
    })

    // Return only public info
    const response = NextResponse.json({
      courseId: course._id.toString(),
      courseName: course.name,
      institutionName: course.institutionName,
      description: course.description,
      existingRequestPending: Boolean(existingRequest),
    })

    return applyVisitorCookie(response, visitorToken, shouldSetCookie)
  } catch (error) {
    console.error('Error fetching course by join code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/join/[code] - Submit join request (public, no auth)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params
    const { visitorToken, shouldSetCookie } = readOrCreateVisitorToken(request)
    const body = await request.json()
    const { firstName, lastName, email, phone, externalId } = body

    // Validation
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Nombre y apellido son requeridos' }, { status: 400 })
    }

    const coursesCollection = await getCoursesCollection()
    const course = await coursesCollection.findOne({
      joinCode: code,
      allowJoinRequests: true,
      $or: [{ joinCodeExpiresAt: { $gt: new Date() } }, { joinCodeExpiresAt: { $exists: false } }],
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Código de invitación inválido o expirado' },
        { status: 404 },
      )
    }

    const joinRequestsCollection = await getJoinRequestsCollection()
    const deviceTokenHash = hashVisitorToken(visitorToken)

    const existingRequest = await joinRequestsCollection.findOne({
      courseId: course._id,
      status: 'pending',
      deviceTokenHash,
    })

    if (existingRequest) {
      const response = NextResponse.json({
        success: true,
        existing: true,
        message: 'Ya se envió una solicitud desde este dispositivo y sigue pendiente de revisión.',
      })

      return applyVisitorCookie(response, visitorToken, shouldSetCookie)
    }

    const newRequest = {
      courseId: course._id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      externalId: externalId?.trim() || undefined,
      deviceTokenHash,
      submittedFrom: 'same-device' as const,
      status: 'pending' as const,
      createdAt: new Date(),
    }

    try {
      await joinRequestsCollection.insertOne(newRequest as any)
    } catch (error: any) {
      if (error?.code === 11000) {
        const response = NextResponse.json({
          success: true,
          existing: true,
          message:
            'Ya se envió una solicitud desde este dispositivo y sigue pendiente de revisión.',
        })

        return applyVisitorCookie(response, visitorToken, shouldSetCookie)
      }

      throw error
    }

    const response = NextResponse.json({
      success: true,
      existing: false,
      message: 'Solicitud enviada correctamente. El docente la revisará pronto.',
    })

    return applyVisitorCookie(response, visitorToken, shouldSetCookie)
  } catch (error) {
    console.error('Error creating join request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
