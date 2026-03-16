import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Authenticator from '@/models/Authenticator';
import User from '@/models/User';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        await connectToDatabase();
        const authenticators = await Authenticator.find({ userId: session.user.id })
            .select('credentialID createdAt lastUsedAt')
            .lean();

        // No enviamos keys públicas ni Buffers complejos al cliente, solo IDs y metadatos básicos
        const formatted = authenticators.map((auth: any) => ({
            id: auth._id,
            createdAt: auth.createdAt,
            lastUsedAt: auth.lastUsedAt,
            deviceType: auth.credentialDeviceType,
        }));

        return NextResponse.json(formatted);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id } = await req.json();
        if (!id) {
            return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
        }

        await connectToDatabase();
        
        // Verificar propiedad
        const auth = await Authenticator.findOne({ _id: id, userId: session.user.id });
        if (!auth) {
            return NextResponse.json({ error: 'Autenticador no encontrado' }, { status: 404 });
        }

        await Authenticator.deleteOne({ _id: id });
        
        // Remover de la lista del usuario
        await User.findByIdAndUpdate(session.user.id, {
            $pull: { authenticators: id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
