import { NextAuthOptions, DefaultSession, DefaultUser } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import connectToDatabase from './mongodb';
import User, { UserRole } from '@/models/User';

/**
 * Extensión de la interfaz de Sesión y Usuario de NextAuth
 * para aceptar TypeScript
 */
declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id: string;
            role: UserRole;
        } & DefaultSession['user'];
    }
    interface User extends DefaultUser {
        role: UserRole;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: UserRole;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_ID!,
            clientSecret: process.env.GOOGLE_SECRET!,
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        // Se ejecuta cada vez que el usuario se loguea (incluyendo primer registro)
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google') {
                try {
                    await connectToDatabase();
                    const existingUser = await User.findOne({ email: user.email });

                    if (!existingUser) {
                        // Primer login del usuario, lo creamos en MongoDB
                        const newUser = new User({
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            role: UserRole.PENDING, // Asignamos rol PENDING por defecto
                        });
                        await newUser.save();
                    }
                    return true; // Permitir SignIn
                } catch (error) {
                    console.error("Error en callback signIn:", error);
                    return false; // Denegar SignIn si hay error
                }
            }
            return true;
        },

        // Generación y lectura del token JWT (se inyecta id y role extraídos desde DB)
        async jwt({ token, user, trigger, session }) {
            if (user) {
                // En el primer Login, 'user' existe
                // Extraemos rol e id directo de MongoDB la primera vez para asegurar coherencia
                await connectToDatabase();
                const dbUser = await User.findOne({ email: user.email });
                if (dbUser) {
                    token.id = dbUser._id.toString();
                    token.role = dbUser.role;
                }
            }

            // Permitir actualización manual de sesión (ej: si le cambian el rol por BD)
            if (trigger === "update" && session?.role) {
                token.role = session.role;
            }

            return token;
        },

        // Generación del objeto de sesión accesible desde el Frontend
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as UserRole;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login', // Redirige al componenente de login custom
    },
};
