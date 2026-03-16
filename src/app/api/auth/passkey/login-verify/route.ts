import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import connectToDatabase from '@/lib/mongodb';
import Authenticator from '@/models/Authenticator';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { getWebAuthnConfig } from '@/lib/webauthn-config';

export async function POST(req: Request) {
    try {
        const { rpID, origin } = getWebAuthnConfig(req);
        const body = await req.json();
        const cookieStore = await cookies();
        const expectedChallenge = cookieStore.get('authenticationChallenge')?.value;

        if (!expectedChallenge) {
            return NextResponse.json({ error: 'Challenge no encontrado o expirado' }, { status: 400 });
        }

        await connectToDatabase();

        // Buscar el autenticador por credentialID
        const credentialIDBuffer = Buffer.from(body.id, 'base64url');
        const authenticator = await Authenticator.findOne({ credentialID: credentialIDBuffer });

        if (!authenticator) {
            console.error('Login Error: Autenticador no encontrado en DB para ID', body.id);
            return NextResponse.json({ error: 'Autenticador no encontrado' }, { status: 404 });
        }

        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            requireUserVerification: false,
            credential: {
                id: authenticator.credentialID,
                publicKey: authenticator.credentialPublicKey,
                counter: authenticator.counter,
                transports: authenticator.transports as any,
            },
        });

        if (verification.verified) {
            const { authenticationInfo } = verification;
            const { newCounter } = authenticationInfo;

            // Actualizar el contador en la DB
            authenticator.counter = newCounter;
            authenticator.lastUsedAt = new Date();
            await authenticator.save();

            // Buscar el usuario vinculado
            const user = await User.findById(authenticator.userId);

            if (!user) {
                console.error('Login Error: Usuario no encontrado para ID', authenticator.userId);
                return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
            }

            cookieStore.delete('authenticationChallenge');

            return NextResponse.json({ 
                verified: true, 
                userId: user._id,
                email: user.email 
            });
        } else {
            console.warn('Login Verification Failed. Details:', JSON.stringify(verification, null, 2));
            return NextResponse.json({ error: 'Fallo en la verificación de la firma' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Error al verificar login:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
