# AulaCheck

Gestión inteligente de asistencias y calificaciones para docentes. 

AulaCheck es una plataforma web moderna, rápida y "Mobile-First" diseñada para simplificar la vida de los educadores. Permite llevar un control exhaustivo de alumnos, registrar asistencias en segundos (incluso mediante códigos QR) y calcular promedios de calificaciones de forma totalmente automática.

## Características Principales

* **Control de Asistencia Rápido**: Toma asistencia en modo tradicional o permite que los alumnos escaneen un código QR en el aula para registrarse automáticamente.
* **Seguridad Biométrica (Passkeys)**: Los docentes pueden acceder al sistema de forma instantánea y segura usando FaceID o huella dactilar, sin depender exclusivamente de correos electrónicos.
* **Promedios Automáticos**: Sistema avanzado de evaluación con peso (ponderación) de notas para calcular promedios y definir condiciones finales (TEA, TEP, TED, etc.).
* **Gestión de Alumnos**: Fichas completas de alumnos, notas de seguimiento, estado de recursantes y gestión de solicitudes de admisión.
* **Soporte Multi-idioma (i18n)**: Aplicación completa traducida al Español (es), Inglés (en) y Portugués (pt).
* **Diseño Dual Theme**: Interfaz moderna adaptable a Modo Claro y Modo Oscuro para reducir la fatiga visual.
* **Reportes y Exportación**: Generación y exportación de planillas de asistencia y calificaciones a formato CSV en un clic.

## Stack Tecnológico

Este proyecto utiliza tecnologías web modernas y escalables:

* **Framework Base**: Next.js (App Router) y React 19.
* **Estilos y UI**: Tailwind CSS v4, interfaces fluidas e iconos de Lucide-React.
* **Base de Datos**: MongoDB (mediante Mongoose).
* **Autenticación**: NextAuth para el flujo clásico y `@simplewebauthn` para Passkeys (Biometría).
* **Internacionalización**: `next-intl` para el manejo de idiomas y metadatos dinámicos.

## Arquitectura y Estándares de Clean Code

El desarrollo de AulaCheck sigue reglas estrictas de mantenimiento y escalabilidad:
- **SOLID & DRY (Don't Repeat Yourself)**: La lógica se maneja a través de Custom Hooks y Servicios especializados, limitando la responsabilidad de los componentes a la mera presentación.
- **Mobile-First UI**: Las interfaces se piensan en porcentajes y sistemas de grid flexibles (`flex-col` a `md:flex-row`) para garantizar la total usabilidad en móviles antes de escalar a monitores.
- **i18n Enforced**: Cero textos incrustados ("hardcoded"). Todos los textos de pantalla residen en los archivos de configuración JSON.

## Licencia

Este proyecto está bajo la licencia **ISC**. Es una licencia de software libre permisiva, funcionalmente equivalente a la licencia BSD de dos cláusulas y a la licencia MIT, pero con un lenguaje que elimina el texto que se considera innecesario raíz de cambios en la ley de derechos de autor. Permite copiar, modificar y distribuir el código libremente.

---
*Desarrollado para optimizar el tiempo de quienes educan.*
