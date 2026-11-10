# Gymly · Demo

Aplicación web para la gestión de un gimnasio con tres roles: **administrador**, **entrenador** y **socio**.
Esta es una **versión de demostración para portfolio**: corre 100 % en el navegador, sin backend ni base de datos.
Todos los datos son ficticios y se guardan en `localStorage`.

## Probar la demo

Abrí `index.html` (o la URL publicada) y elegí un rol con los botones de acceso rápido
(o ingresá manualmente — clave de todas las cuentas: `demo1234`):

| Rol | Email |
| --- | --- |
| Administrador | `admin@gymly.demo` |
| Entrenador | `entrenador@gymly.demo` |
| Socio | `socio@gymly.demo` |

El botón **Restablecer** (abajo a la izquierda) vuelve los datos al estado inicial.

## Qué incluye

- Panel de administración: usuarios, entrenadores, rutinas, ejercicios, pagos, reportes y horarios del gimnasio.
- App del socio: rutinas por día, registro de entrenamientos, historial, progreso, pagos y chat con administración.
- Recuperación de contraseña, suspensión de cuentas y permisos por rol.

## Cómo funciona esta versión

`Js/demo-api.js` intercepta las llamadas `fetch` que el frontend original hacía a la API FastAPI
(`http://127.0.0.1:8000`) y las responde con datos de ejemplo. El resto del código del frontend es el original.

Proyecto completo: **Frontend** HTML/CSS/JS vanilla · **Backend** FastAPI + SQLAlchemy + MySQL/MariaDB · JWT · pruebas con pytest.

## Publicarla

Es un sitio estático: subí esta carpeta a GitHub Pages, Netlify o Vercel (el `index.html` está en la raíz).
Para probarla local: `python -m http.server 5500` y abrir `http://localhost:5500`.
