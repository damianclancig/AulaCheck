# AulaCheck

Sistema de gestión de asistencias y calificaciones para docentes.

## Tecnologías

- **Framework**: Next.js 15 (App Router)
- **Autenticación**: NextAuth.js (Google OAuth)
- **Base de Datos**: MongoDB Atlas (Mongoose)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 4

## Configuración

1. Clonar el repositorio
2. Copiar `.env.example` a `.env.local` y completar con tus credenciales:
   ```bash
   cp .env.example .env.local
   ```
3. Instalar dependencias:
   ```bash
   npm install
   ```
4. Ejecutar en desarrollo:
   ```bash
   npm run dev
   ```

## Variables de Entorno

Ver `.env.example` para la lista completa de variables requeridas.

### Google Cloud Console

- Crear un proyecto en [Google Cloud Console](https://console.cloud.google.com/)
- Configurar la "OAuth consent screen" (Pantalla de consentimiento)
- Crear "OAuth 2.0 Client IDs" de tipo Web Application
- Agregar `http://localhost:3000/api/auth/callback/google` a los Authorized redirect URIs

### MongoDB Atlas

- Crear cluster en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Obtener connection string y configurar `MONGODB_URI`
- Definir el nombre de la base de datos en `MONGODB_DB_NAME` (ej: `aulacheck`)

## Estructura del Proyecto

```
src/
├── app/                    # App Router pages y layouts
│   ├── api/               # Route Handlers (API endpoints)
│   ├── dashboard/         # Dashboard del docente
│   └── login/             # Página de login
├── components/            # Componentes React reutilizables
├── lib/                   # Utilidades y configuraciones
│   ├── auth.ts            # Configuración de NextAuth
│   ├── mongodb.ts         # Conexión a MongoDB (Mongoose)
│   ├── auth/              # Lógica de propiedad (ownership)
│   └── calculations/      # Funciones de cálculo
├── models/                # Modelos de Mongoose (User, etc.)
└── types/                 # Tipos TypeScript
```

## Funcionalidades

- ✅ Autenticación con Google (NextAuth)
- ✅ Gestión de cursos
- ✅ Gestión de alumnos
- ✅ Registro de asistencia
- ✅ Calificaciones y promedios
- ✅ Exportación a CSV
- ✅ Responsive design (Mobile First)
- ✅ Dual Theme (Light/Dark Mode)

## Licencia

MIT
