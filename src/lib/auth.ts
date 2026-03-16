import { NextAuthOptions, DefaultSession, DefaultUser } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import connectToDatabase from './mongodb'
import User, { UserRole } from '@/models/User'

/**
 * Extensión de la interfaz de Sesión y Usuario de NextAuth
 * para aceptar TypeScript
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: UserRole
    } & DefaultSession['user']
  }
  interface User extends DefaultUser {
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    {
      id: 'credentials',
      type: 'credentials',
      name: 'Passkey',
      credentials: {
        email: { label: 'Email', type: 'text' },
      },
      async authorize(credentials: Record<string, any> | undefined) {
        if (!credentials?.email) return null;
        
        try {
          await connectToDatabase();
          const user = await User.findOne({ email: credentials.email });

          if (!user) return null;

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error('Error en authorize:', error);
          return null;
        }
      },
    } as any, // Cast temporal para evitar conflictos de tipos complejos con NextAuth
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    // Se ejecuta cada vez que el usuario se loguea (incluyendo primer registro)
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          await connectToDatabase()
          const existingUser = await User.findOne({ email: user.email })

          if (!existingUser) {
            // Primer login del usuario, lo creamos en MongoDB
            const newUser = new User({
              name: user.name,
              email: user.email,
              image: user.image,
              role: UserRole.PENDING, // Asignamos rol PENDING por defecto
            })
            await newUser.save()
          }
          return true // Permitir SignIn
        } catch (error) {
          // En entornos corporativos puede fallar TLS/DB de forma transitoria.
          // No bloqueamos OAuth; el usuario quedará con rol PENDING por defecto.
          console.error('Error en callback signIn (se permite ingreso con fallback):', error)
          return true
        }
      }
      return true
    },

    // Generación y lectura del token JWT (se inyecta id y role extraídos desde DB)
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // En el primer Login, 'user' existe
        // Extraemos rol e id directo de MongoDB la primera vez para asegurar coherencia
        try {
          await connectToDatabase()
          const dbUser = await User.findOne({ email: user.email })
          if (dbUser) {
            token.id = dbUser._id.toString()
            token.role = dbUser.role
          }
        } catch (error) {
          console.error('Error en callback jwt (fallback a token/sub):', error)
        }
      }

      // Permitir actualización manual de sesión (ej: si le cambian el rol por BD)
      if (trigger === 'update' && session?.role) {
        token.role = session.role
      }

      // Fallbacks para no romper sesión cuando DB no está disponible.
      if (!token.id) {
        token.id = token.sub ?? ''
      }
      if (!token.role) {
        token.role = UserRole.PENDING
      }

      return token
    },

    // Generación del objeto de sesión accesible desde el Frontend
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
  pages: {
    signIn: '/login', // Redirige al componenente de login custom
  },
}
