import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import connectToDatabase from '@/lib/mongodb';
import Authenticator from '@/models/Authenticator';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { getWebAuthnConfig } from '@/lib/webauthn-config';

export async function POST(req: Request) {
    try {
        const { rpID, origin } = getWebAuthnConfig(req);
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const cookieStore = await cookies();
        const expectedChallenge = cookieStore.get('registrationChallenge')?.value;

        if (!expectedChallenge) {
            return NextResponse.json({ error: 'Challenge no encontrado o expirado' }, { status: 400 });
        }

        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            requireUserVerification: false,
        });

        if (verification.verified && verification.registrationInfo) {
            const { registrationInfo } = verification;
            
            const credentialID = registrationInfo.credential.id;
            const credentialPublicKey = registrationInfo.credential.publicKey;
            const counter = registrationInfo.credential.counter;
            const credentialDeviceType = registrationInfo.credentialDeviceType;
            const credentialBackedUp = registrationInfo.credentialBackedUp;

            if (!credentialID || !credentialPublicKey) {
                return NextResponse.json({ error: 'Datos de credencial incompletos' }, { status: 400 });
            }

            await connectToDatabase();

            const newAuthenticator = new Authenticator({
                userId: session.user.id,
                credentialID: Buffer.from(credentialID, 'base64url'),
                credentialPublicKey: Buffer.from(credentialPublicKey),
                counter,
                credentialDeviceType,
                credentialBackedUp,
                transports: registrationInfo.credential.transports || [],
            });

            const savedAuthenticator = await newAuthenticator.save();

            // Vincular el autenticador al usuario
            await User.findByIdAndUpdate(session.user.id, {
                $push: { authenticators: savedAuthenticator._id }
            });

            // Limpiar la cookie del challenge
            cookieStore.delete('registrationChallenge');

            return NextResponse.json({ verified: true });
        } else {
            return NextResponse.json({ error: 'Fallo en la verificación del registro' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Error fatal en registro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
