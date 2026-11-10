const API_URL_CHAT = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("gymly_token");
    const esAdmin = document.body.dataset.rol === "admin" ||
        window.location.pathname.toLowerCase().includes("/admin/mensajes");
    let sesion = null;
    try {
        sesion = JSON.parse(localStorage.getItem("gymly_usuario") || "null");
    } catch {
        sesion = null;
    }
    if (!token || !sesion?.id_usuario || (esAdmin && sesion.rol !== "administrador")) {
        localStorage.removeItem("gymly_token");
        localStorage.removeItem("gymly_usuario");
        window.location.href = "../index.html";
        return;
    }

    const lista = document.getElementById("listaMensajes");
    const form = document.getElementById("formChat");
    const input = document.getElementById("mensaje");
    const estado = document.getElementById("estadoChat");
    let usuarioChat = esAdmin ? null : sesion.id_usuario;
    let conversaciones = [];
    let cargando = false;

    async function api(ruta, opciones = {}) {
        const headers = {
            Authorization: `Bearer ${localStorage.getItem("gymly_token")}`,
            ...(opciones.headers || {})
        };
        if (opciones.body) headers["Content-Type"] = "application/json";
        const respuesta = await fetch(`${API_URL_CHAT}${ruta}`, { ...opciones, headers });
        const texto = await respuesta.text();
        const datos = texto ? JSON.parse(texto) : {};
        if (respuesta.status === 401 || respuesta.status === 403) {
            localStorage.removeItem("gymly_token");
            localStorage.removeItem("gymly_usuario");
            window.location.href = "../index.html";
            throw new Error("Tu sesión no tiene permiso para acceder al chat.");
        }
        if (!respuesta.ok) throw new Error(datos.detail || "No se pudo completar la solicitud.");
        return datos;
    }

    function mostrarEstado(mensaje, tipo = "") {
        if (!estado) return;
        estado.textContent = mensaje;
        estado.dataset.tipo = tipo;
    }

    function render(mensajes) {
        const estabaAlFinal = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 50;
        lista.replaceChildren();
        if (!mensajes.length) {
            const vacio = document.createElement("div");
            vacio.className = "chat-vacio";
            const titulo = document.createElement("strong");
            titulo.textContent = "No hay mensajes todavía";
            const texto = document.createElement("p");
            texto.textContent = "Escribí un mensaje para iniciar la conversación.";
            vacio.append(titulo, texto);
            lista.appendChild(vacio);
            return;
        }

        mensajes.forEach(mensaje => {
            const recibido = esAdmin
                ? mensaje.emisor_rol !== "administrador"
                : mensaje.emisor_rol === "administrador";
            const articulo = document.createElement("article");
            articulo.className = `mensaje ${recibido ? "recibido" : "enviado"}`;
            const contenido = document.createElement("p");
            contenido.textContent = mensaje.contenido;
            const pie = document.createElement("small");
            const fecha = new Date(mensaje.fecha_creacion);
            const hora = Number.isNaN(fecha.getTime())
                ? ""
                : fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
            pie.textContent = `${recibido ? mensaje.emisor_nombre : "Vos"}${hora ? ` · ${hora}` : ""}`;
            articulo.append(contenido, pie);
            lista.appendChild(articulo);
        });
        if (estabaAlFinal) lista.scrollTop = lista.scrollHeight;
    }

    async function cargarConversaciones() {
        conversaciones = await api("/chat/conversaciones");
        const selector = document.getElementById("selectorConversacion");
        const actual = selector.value;
        selector.replaceChildren(new Option("Seleccionar conversación", ""));
        conversaciones.forEach(conversacion => {
            const option = new Option(
                `${conversacion.nombre} ${conversacion.apellido} · ${conversacion.email}`,
                String(conversacion.usuario_id)
            );
            selector.appendChild(option);
        });
        if (conversaciones.some(item => String(item.usuario_id) === actual)) {
            selector.value = actual;
        } else if (conversaciones.length) {
            selector.value = String(conversaciones[0].usuario_id);
            usuarioChat = conversaciones[0].usuario_id;
        } else {
            usuarioChat = null;
        }
        if (selector.value) usuarioChat = Number(selector.value);
        else if (!conversaciones.length) usuarioChat = null;
    }

    async function cargarMensajes() {
        if (cargando) return;
        cargando = true;
        try {
            if (esAdmin) await cargarConversaciones();
            if (!usuarioChat) {
                render([]);
                mostrarEstado("No hay conversaciones todavía.");
                return;
            }
            const mensajes = await api(`/chat/mensajes?usuario_id=${encodeURIComponent(usuarioChat)}`);
            render(mensajes);
            mostrarEstado("");
        } catch (error) {
            mostrarEstado(error.message, "error");
        } finally {
            cargando = false;
        }
    }

    if (esAdmin) {
        const selector = document.createElement("select");
        selector.id = "selectorConversacion";
        selector.setAttribute("aria-label", "Elegir conversación");
        selector.addEventListener("change", () => {
            usuarioChat = selector.value ? Number(selector.value) : null;
            cargarMensajes();
        });
        form.parentElement.insertBefore(selector, form);
    }

    form.addEventListener("submit", async evento => {
        evento.preventDefault();
        const contenido = input.value.trim();
        if (!contenido) return;
        if (esAdmin && !usuarioChat) {
            mostrarEstado("Elegí una conversación antes de responder.", "error");
            return;
        }

        const boton = form.querySelector('button[type="submit"]');
        boton.disabled = true;
        try {
            await api("/chat/mensajes", {
                method: "POST",
                body: JSON.stringify({
                    contenido,
                    ...(esAdmin ? { usuario_id: usuarioChat } : {})
                })
            });
            input.value = "";
            await cargarMensajes();
            input.focus();
        } catch (error) {
            mostrarEstado(error.message, "error");
        } finally {
            boton.disabled = false;
        }
    });

    cargarMensajes();
    const intervalo = window.setInterval(cargarMensajes, 4000);
    window.addEventListener("beforeunload", () => window.clearInterval(intervalo), { once: true });
});
