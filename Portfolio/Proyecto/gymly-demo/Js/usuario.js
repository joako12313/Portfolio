const GYMLY_API = "http://127.0.0.1:8000";

function obtenerSesion() {
    const token = localStorage.getItem("gymly_token");
    let usuario = null;

    try {
        usuario = JSON.parse(localStorage.getItem("gymly_usuario") || "null");
    } catch {
        usuario = null;
    }

    return { token, usuario };
}

function cerrarSesion() {
    localStorage.removeItem("gymly_token");
    localStorage.removeItem("gymly_usuario");
    window.location.href = "../index.html";
}

/* Aviso breve (usa el componente de la app; si no cargó, cae a alert) */
function avisoGymly(texto, tipo = "info") {
    if (window.Gymly?.toast) window.Gymly.toast(texto, tipo);
    else alert(texto);
}

/* Qué pestaña de la barra inferior corresponde a cada pantalla */
const PESTANA_POR_PAGINA = {
    "inicio.html": "navInicio",
    "historial.html": "navInicio",
    "progreso.html": "navInicio",
    "pagos.html": "navInicio",
    "gimnasio.html": "navInicio",
    "rutinas.html": "navRutinas",
    "entrenamiento.html": "navRutinas",
    "registro.html": "navRutinas",
    "ejercicios.html": "navRutinas",
    "chat.html": "navChat",
    "perfil.html": "navPerfil"
};

function configurarNavBar() {
    const botones = document.querySelectorAll("nav button");
    if (!botones.length) return;

    const iconos = {
        navInicio: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5 9.5V20h14V9.5" />
                <path d="M9 20v-7h6v7" />
            </svg>
        `,
        navRutinas: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 18V9" />
                <path d="M19 18V9" />
                <path d="M8 18V6.5a2.5 2.5 0 0 1 2.5-2.5h3A2.5 2.5 0 0 1 16 6.5V18" />
                <path d="M3 18h18" />
            </svg>
        `,
        navChat: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 18.5V6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v8A2.5 2.5 0 0 1 16.5 17H9l-4 3.5Z" />
                <path d="M8 9h8" />
                <path d="M8 12h6" />
            </svg>
        `,
        navPerfil: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
                <path d="M4 20a8 8 0 0 1 16 0" />
            </svg>
        `
    };

    const paginaActual = location.pathname.split("/").pop() || "inicio.html";
    const pestanaActiva = PESTANA_POR_PAGINA[paginaActual];

    botones.forEach((boton) => {
        const label = boton.dataset.label || boton.textContent.trim();
        boton.dataset.label = label;
        boton.innerHTML = `
            <span class="nav-icon">${iconos[boton.id] || ""}</span>
            <span class="nav-label">${label}</span>
        `;

        const activo = boton.id === pestanaActiva;
        boton.classList.toggle("active", activo);
        if (activo) boton.setAttribute("aria-current", "page");
    });
}

function iniciales(datos) {
    const a = (datos?.nombre || "").trim()[0] || "";
    const b = (datos?.apellido || "").trim()[0] || "";
    return (a + b).toUpperCase() || "G";
}

async function cargarUsuarioActual() {
    const { token, usuario } = obtenerSesion();

    if (!token || !usuario?.id_usuario) {
        cerrarSesion();
        return null;
    }

    try {
        const respuesta = await fetch(`${GYMLY_API}/usuarios/${usuario.id_usuario}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (respuesta.status === 401 || respuesta.status === 403) {
            cerrarSesion();
            return null;
        }

        if (!respuesta.ok) throw new Error("No se pudo cargar el usuario.");

        const datos = await respuesta.json();
        localStorage.setItem("gymly_usuario", JSON.stringify({
            id_usuario: datos.id_usuario,
            nombre: datos.nombre,
            apellido: datos.apellido,
            email: datos.email,
            rol: datos.rol,
            activo: datos.activo,
            motivo_suspension: datos.motivo_suspension
        }));

        document.querySelectorAll("#nombreUsuario").forEach((elemento) => {
            elemento.textContent = datos.nombre;
        });
        document.querySelectorAll("#apellidoUsuario").forEach((elemento) => {
            elemento.textContent = datos.apellido;
        });
        document.querySelectorAll("#emailUsuario").forEach((elemento) => {
            elemento.textContent = datos.email;
        });

        const nombrePerfil = document.querySelector(".profile-name");
        if (nombrePerfil) nombrePerfil.textContent = `${datos.nombre} ${datos.apellido}`;

        const avatar = document.getElementById("avatarUsuario");
        if (avatar) avatar.textContent = iniciales(datos);
        const emailCabecera = document.getElementById("emailCabecera");
        if (emailCabecera) emailCabecera.textContent = datos.email;

        return datos;
    } catch (error) {
        console.error("Error al cargar usuario:", error);
        return usuario;
    }
}

function formatearFechaNotificacion(valor) {
    if (!valor) return "";
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime())
        ? ""
        : fecha.toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });
}

async function pedirNotificaciones() {
    const { token, usuario } = obtenerSesion();
    const respuesta = await fetch(`${GYMLY_API}/notificaciones/usuario/${usuario.id_usuario}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.detail || "No se pudieron cargar las notificaciones.");
    return Array.isArray(datos) ? datos : [];
}

function configurarNotificaciones() {
    const boton = document.getElementById("btnNotificaciones");
    if (!boton) return;

    // Punto amarillo cuando hay notificaciones sin leer
    pedirNotificaciones()
        .then((lista) => {
            if (lista.some((item) => item.leida === false || item.leida === 0)) {
                const punto = document.createElement("span");
                punto.className = "notif-punto";
                boton.appendChild(punto);
            }
        })
        .catch(() => { /* sin punto si no se pudo consultar */ });

    boton.addEventListener("click", async () => {
        try {
            const lista = await pedirNotificaciones();
            const contenido = document.createElement("div");

            if (!lista.length) {
                const vacio = document.createElement("p");
                vacio.textContent = "No tenés nuevas notificaciones.";
                vacio.style.padding = "8px 0 4px";
                contenido.appendChild(vacio);
            } else {
                lista.forEach((item) => {
                    const fila = document.createElement("div");
                    fila.className = `hoja-item${item.leida ? "" : " nueva"}`;
                    const titulo = document.createElement("strong");
                    titulo.textContent = item.titulo || "Notificación";
                    const mensaje = document.createElement("p");
                    mensaje.textContent = item.mensaje || "";
                    const fecha = document.createElement("small");
                    fecha.textContent = formatearFechaNotificacion(item.fecha_creacion);
                    fila.append(titulo, mensaje, fecha);
                    contenido.appendChild(fila);
                });
            }

            window.Gymly?.hoja
                ? window.Gymly.hoja("Notificaciones", contenido)
                : alert(lista.length ? `Tenés ${lista.length} notificación(es).` : "No tenés nuevas notificaciones.");
            boton.querySelector(".notif-punto")?.remove();
        } catch {
            avisoGymly("No se pudieron cargar las notificaciones.", "error");
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const { token, usuario } = obtenerSesion();

    if (!token || !usuario) {
        cerrarSesion();
        return;
    }

    if (usuario.activo === false) {
        avisoGymly("Tu cuenta está suspendida. Contactá al administrador.", "error");
        cerrarSesion();
        return;
    }

    if (usuario.rol === "administrador") {
        window.location.href = "../Admin/dashboard.html";
        return;
    }

    configurarNavBar();

    const usuarioActual = await cargarUsuarioActual() || usuario;
    const rutinaDelDia = document.getElementById("rutinaDelDia");
    if (rutinaDelDia) {
        cargarRutinaDelDia(usuarioActual, token);
    }
    const rutaRutinas = usuarioActual.rol === "entrenador"
        ? "../Entrenador/rutinas.html"
        : "rutinas.html";
    if (usuarioActual.rol === "entrenador") {
        const textoRutinas = document.querySelector("#btnRutinas .fila-texto");
        if (textoRutinas) textoRutinas.textContent = "Gestionar rutinas";
    }

    const rutas = {
        navInicio: "inicio.html",
        navRutinas: rutaRutinas,
        navChat: "chat.html",
        navPerfil: "perfil.html"
    };

    Object.entries(rutas).forEach(([id, ruta]) => {
        const boton = document.getElementById(id);
        if (boton) boton.addEventListener("click", () => window.location.href = ruta);
    });

    const btnVolver = document.getElementById("btnVolver");
    if (btnVolver) {
        btnVolver.addEventListener("click", () => {
            // Si se abrió la pantalla directamente (sin pantalla anterior de la app), vuelve al inicio
            const vinoDeLaApp = document.referrer && new URL(document.referrer).origin === location.origin;
            if (vinoDeLaApp && window.history.length > 1) window.history.back();
            else window.location.href = "inicio.html";
        });
    }

    configurarNotificaciones();

    const enlaces = {
        btnRutinas: rutaRutinas,
        btnHistorial: "historial.html",
        btnProgreso: "progreso.html",
        btnMensualidad: "pagos.html",
        btnGimnasio: "gimnasio.html",
        btnChat: "chat.html",
        btnVerRutina: "entrenamiento.html"
    };

    Object.entries(enlaces).forEach(([id, ruta]) => {
        const boton = document.getElementById(id);
        if (boton) boton.addEventListener("click", () => window.location.href = ruta);
    });

    const botonComenzar = document.getElementById("btnComenzar");
    if (botonComenzar) {
        botonComenzar.addEventListener("click", () => {
            const idRutina = botonComenzar.dataset.rutinaId;
            if (idRutina) {
                window.location.href = `entrenamiento.html?id=${encodeURIComponent(idRutina)}`;
            }
        });
    }

    const formPerfil = document.getElementById("formPerfil");
    if (formPerfil) {
        const sesionActual = obtenerSesion().usuario;
        const nombre = document.getElementById("nombre");
        const apellido = document.getElementById("apellido");
        if (nombre) nombre.value = sesionActual?.nombre || "";
        if (apellido) apellido.value = sesionActual?.apellido || "";

        formPerfil.addEventListener("submit", async (evento) => {
            evento.preventDefault();
            const nombreValor = nombre?.value.trim() || "";
            const apellidoValor = apellido?.value.trim() || "";
            if (!nombreValor || !apellidoValor) {
                avisoGymly("Completá nombre y apellido.", "error");
                return;
            }
            const { token: tokenActual, usuario: usuarioActual } = obtenerSesion();
            const botonGuardar = document.getElementById("btnGuardarPerfil");
            if (botonGuardar) botonGuardar.disabled = true;
            try {
                const respuesta = await fetch(`${GYMLY_API}/usuarios/${usuarioActual.id_usuario}/perfil`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${tokenActual}`
                    },
                    body: JSON.stringify({ nombre: nombreValor, apellido: apellidoValor })
                });
                const datos = await respuesta.json();
                if (!respuesta.ok) throw new Error(datos.detail || "No se pudieron guardar los cambios.");
                localStorage.setItem("gymly_usuario", JSON.stringify({
                    id_usuario: datos.id_usuario,
                    nombre: datos.nombre,
                    apellido: datos.apellido,
                    email: datos.email,
                    rol: datos.rol,
                    activo: datos.activo,
                    motivo_suspension: datos.motivo_suspension
                }));
                await cargarUsuarioActual();
                avisoGymly("Perfil actualizado correctamente.", "exito");
            } catch (error) {
                avisoGymly(error.message || "No se pudieron guardar los cambios.", "error");
            } finally {
                if (botonGuardar) botonGuardar.disabled = false;
            }
        });
    }

    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    if (btnCerrarSesion) btnCerrarSesion.addEventListener("click", cerrarSesion);
});

async function cargarRutinaDelDia(usuario, token) {
    const nombreRutina = document.getElementById("nombreRutina");
    const cantidadEjercicios = document.getElementById("cantidadEjercicios");
    const estado = document.getElementById("estadoRutinaHoy");
    const boton = document.getElementById("btnComenzar");
    if (!nombreRutina || !cantidadEjercicios || !estado || !boton) return;

    const dias = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    const diaHoy = dias[new Date().getDay()];
    const nombreDia = {
        miercoles: "miércoles",
        sabado: "sábado",
    }[diaHoy] || diaHoy;
    boton.disabled = true;

    try {
        const respuesta = await fetch(
            `${GYMLY_API}/usuarios/${usuario.id_usuario}/rutinas-completas`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const rutinas = await respuesta.json();
        if (respuesta.status === 401 || respuesta.status === 403) {
            cerrarSesion();
            return;
        }
        if (!respuesta.ok) {
            throw new Error(rutinas.detail || "No se pudo cargar la rutina de hoy.");
        }

        const rutina = rutinas.find(item =>
            Number(item.activa) === 1 && item.dia_semana === diaHoy
        );
        if (!rutina) {
            nombreRutina.textContent = "Día de descanso";
            cantidadEjercicios.textContent = "0";
            estado.textContent = "No tenés una rutina asignada para hoy. Revisá “Mis rutinas”.";
            boton.textContent = "Día de descanso";
            return;
        }

        nombreRutina.textContent = rutina.nombre;
        cantidadEjercicios.textContent = String(rutina.ejercicios.length);
        estado.textContent = `Plan asignado para ${nombreDia}.`;
        boton.dataset.rutinaId = String(rutina.id_rutina);
        boton.textContent = "Comenzar entrenamiento";
        boton.disabled = false;
    } catch (error) {
        nombreRutina.textContent = "No se pudo cargar la rutina";
        cantidadEjercicios.textContent = "—";
        estado.textContent = error.message;
        boton.textContent = "No disponible";
    }
}
