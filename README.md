# AulaCheck

Sistema de gestión de asistencias y calificaciones para docentes.

## Tecnologías

- **Frontend**: Next.js 15 (App Router)
- **Autenticación**: Firebase Authentication (Google OAuth)
- **Base de Datos**: MongoDB Atlas
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS

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

### Firebase

- Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
- Habilitar Google Authentication
- Descargar Service Account JSON para Firebase Admin SDK

### MongoDB Atlas

- Crear cluster en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Obtener connection string
- Crear base de datos `aulacheck`

## Estructura del Proyecto

```
src/
├── app/                    # App Router pages y layouts
│   ├── api/               # Route Handlers (API endpoints)
│   ├── dashboard/         # Dashboard del docente
│   ├── courses/           # Gestión de cursos
│   └── login/             # Página de login
├── components/            # Componentes React reutilizables
├── lib/                   # Utilidades y configuraciones
│   ├── firebase/          # Firebase client y admin
│   ├── mongodb/           # Cliente MongoDB
│   ├── auth/              # Middleware de autenticación
│   └── calculations/      # Funciones de cálculo
└── types/                 # Tipos TypeScript
```

## Funcionalidades

- ✅ Autenticación con Google
- ✅ Gestión de cursos
- ✅ Gestión de alumnos
- ✅ Registro de asistencia
- ✅ Calificaciones y promedios
- ✅ Exportación a CSV
- ✅ Responsive design

## Licencia

MIT
