const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("gymly_token");
    let sesion;

    try {
        sesion = JSON.parse(localStorage.getItem("gymly_usuario") || "null");
    } catch {
        sesion = null;
    }

    if (!token || sesion?.rol !== "administrador") {
        window.location.href = "../index.html";
        return;
    }

    const modal = document.getElementById("modalUsuario");
    const formulario = document.getElementById("formUsuario");
    const tabla = document.getElementById("tablaUsuarios");
    const busqueda = document.getElementById("buscarUsuario");
    const mensaje = document.getElementById("mensajeUsuarios");
    const campoContrasena = document.getElementById("contrasena");
    const grupoContrasena = campoContrasena.closest(".campo");
    const campoDiasAsistencia = document.getElementById("diasAsistencia");
    const grupoDiasAsistencia = document.getElementById("campoDiasAsistencia");
    const campoRol = document.getElementById("rol");
    const campoEstadoUsuario = document.getElementById("estadoUsuario");
    const grupoEstadoUsuario = document.getElementById("campoEstadoUsuario");
    const tituloModal = document.querySelector(".modal-contenido h2");
    const botonGuardar = document.querySelector(".btn-guardar");

    let usuarios = [];
    let usuarioEditando = null;

    async function solicitar(ruta, opciones = {}) {
        const headers = {
            Authorization: `Bearer ${token}`,
            ...opciones.headers
        };

        if (opciones.body) {
            headers["Content-Type"] = "application/json";
        }

        const respuesta = await fetch(`${API_URL}${ruta}`, {
            ...opciones,
            cache: "no-store",
            headers
        });

        const datos = await respuesta.json().catch(() => ({}));

        if (respuesta.status === 401) {
            localStorage.removeItem("gymly_token");
            localStorage.removeItem("gymly_usuario");
            window.location.href = "../index.html";
            throw new Error("La sesión venció.");
        }

        if (!respuesta.ok) {
            throw new Error(datos.detail || "No se pudo completar la solicitud.");
        }

        return datos;
    }

    function mostrarMensaje(texto = "", tipo = "") {
        mensaje.textContent = texto;
        mensaje.dataset.tipo = tipo;
    }

    function crearBoton(texto, clase, accion, id) {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = clase;
        boton.textContent = texto;
        boton.dataset.accion = accion;
        boton.dataset.id = id;
        return boton;
    }

    function mostrarUsuarios(lista = usuarios) {
        tabla.replaceChildren();

        if (!lista.length) {
            const fila = tabla.insertRow();
            const celda = fila.insertCell();
            celda.colSpan = 10;
            celda.textContent = "No hay usuarios para mostrar.";
            return;
        }

        lista.forEach((usuario) => {
            const fila = tabla.insertRow();

            fila.insertCell().textContent = usuario.id_usuario;
            fila.insertCell().textContent = usuario.nombre;
            fila.insertCell().textContent = usuario.apellido;
            fila.insertCell().textContent = usuario.dni || "-";
            fila.insertCell().textContent = usuario.email;
            fila.insertCell().textContent = usuario.telefono || "-";
            fila.insertCell().textContent = usuario.rol === "usuario"
                ? (usuario.dias_asistencia ?? "Sin definir")
                : "-";

            const celdaEstado = fila.insertCell();
            const estado = document.createElement("span");
            estado.className = `rol ${usuario.activo === false ? "suspendido" : "activo"}`;
            estado.textContent = usuario.activo === false ? "Suspendido" : "Activo";
            celdaEstado.appendChild(estado);

            const celdaRol = fila.insertCell();
            const rol = document.createElement("span");
            rol.className = `rol ${usuario.rol}`;
            rol.textContent = usuario.rol;
            celdaRol.appendChild(rol);

            const acciones = fila.insertCell();
            const accionesWrapper = document.createElement("div");
            accionesWrapper.className = "acciones-usuario";
            const botonEliminar = usuario.rol === "administrador"
                ? null
                : crearBoton("Eliminar", "btn-eliminar", "eliminar", usuario.id_usuario);
            accionesWrapper.append(
                crearBoton("Editar", "btn-editar", "editar", usuario.id_usuario),
                ...(botonEliminar ? [botonEliminar] : [])
            );
            acciones.appendChild(accionesWrapper);
        });
    }

    async function cargarUsuarios() {
        mostrarMensaje("Cargando usuarios...");

        try {
            usuarios = await solicitar("/usuarios");
            aplicarBusqueda();
            mostrarMensaje(`${usuarios.length} usuario${usuarios.length === 1 ? "" : "s"} registrado${usuarios.length === 1 ? "" : "s"}.`, "exito");
        } catch (error) {
            mostrarMensaje(error.message, "error");
        }
    }

    function abrirFormulario(usuario = null) {
        usuarioEditando = usuario?.id_usuario ?? null;
        formulario.reset();

        tituloModal.textContent = usuario ? "Editar usuario" : "Nuevo usuario";
        botonGuardar.textContent = usuario ? "Guardar cambios" : "Crear usuario";
        grupoContrasena.hidden = Boolean(usuario);
        campoContrasena.required = !usuario;
        grupoEstadoUsuario.hidden = !usuario || usuario.rol === "administrador";

        if (usuario) {
            document.getElementById("nombre").value = usuario.nombre || "";
            document.getElementById("apellido").value = usuario.apellido || "";
            document.getElementById("dni").value = usuario.dni || "";
            document.getElementById("email").value = usuario.email || "";
            document.getElementById("fechaNacimiento").value = usuario.fecha_nacimiento || "";
            document.getElementById("telefono").value = usuario.telefono || "";
            campoDiasAsistencia.value = usuario.dias_asistencia ?? "";
            document.getElementById("rol").value = usuario.rol || "usuario";
            campoEstadoUsuario.value = usuario.activo === false ? "false" : "true";
        }

        document.getElementById("dni").required = !usuario;
        actualizarCampoDiasAsistencia();
        modal.classList.add("activo");
        document.getElementById("nombre").focus();
    }

    function actualizarCampoDiasAsistencia() {
        const esSocio = campoRol.value === "usuario";
        grupoDiasAsistencia.hidden = !esSocio;
        campoDiasAsistencia.required = esSocio;
    }

    function cerrarFormulario() {
        modal.classList.remove("activo");
        usuarioEditando = null;
        formulario.reset();
        grupoContrasena.hidden = false;
        campoContrasena.required = true;
    }

    function aplicarBusqueda() {
        const consulta = busqueda.value.trim().toLocaleLowerCase("es");

        const filtrados = usuarios.filter((usuario) => {
            const texto = `${usuario.nombre} ${usuario.apellido} ${usuario.dni || ""} ${usuario.email}`.toLocaleLowerCase("es");
            return texto.includes(consulta);
        });

        mostrarUsuarios(filtrados);
    }

    document.getElementById("btnAgregar").addEventListener("click", () => abrirFormulario());
    document.getElementById("cerrarModal").addEventListener("click", cerrarFormulario);

    modal.addEventListener("click", (evento) => {
        if (evento.target === modal) {
            cerrarFormulario();
        }
    });

    document.getElementById("btnCerrarSesion").addEventListener("click", () => {
        localStorage.removeItem("gymly_token");
        localStorage.removeItem("gymly_usuario");
        window.location.href = "../index.html";
    });

    tabla.addEventListener("click", async (evento) => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;

        const usuario = usuarios.find((item) => item.id_usuario === Number(boton.dataset.id));
        if (!usuario) return;

        if (boton.dataset.accion === "editar") {
            abrirFormulario(usuario);
            return;
        }

        if (usuario.rol === "administrador") {
            mostrarMensaje("Las cuentas de administrador no pueden eliminarse.", "error");
            return;
        }

        if (usuario.id_usuario === sesion.id_usuario) {
            mostrarMensaje("No podés eliminar tu propio usuario administrador.", "error");
            return;
        }

        if (!await Gymly.confirmar(`¿Querés eliminar a ${usuario.nombre} ${usuario.apellido}?`, { titulo: "Eliminar usuario", aceptar: "Eliminar", peligro: true })) return;

        try {
            await solicitar(`/usuarios/${usuario.id_usuario}`, { method: "DELETE" });
            await cargarUsuarios();
            mostrarMensaje("Usuario eliminado correctamente.", "exito");
        } catch (error) {
            mostrarMensaje(error.message, "error");
        }
    });

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const datos = {
            nombre: document.getElementById("nombre").value.trim(),
            apellido: document.getElementById("apellido").value.trim(),
            dni: document.getElementById("dni").value.trim() || null,
            email: document.getElementById("email").value.trim(),
            fecha_nacimiento: document.getElementById("fechaNacimiento").value || null,
            telefono: document.getElementById("telefono").value.trim() || null,
            dias_asistencia: campoRol.value === "usuario"
                ? Number(campoDiasAsistencia.value)
                : null,
            rol: document.getElementById("rol").value
        };

        const usuarioActualizado = usuarioEditando === null
            ? null
            : usuarios.find((usuario) => usuario.id_usuario === usuarioEditando);
        if (usuarioActualizado && usuarioActualizado.rol !== "administrador") {
            datos.activo = campoEstadoUsuario.value === "true";
            datos.motivo_suspension = datos.activo
                ? null
                : usuarioActualizado.motivo_suspension || "Suspendido por el administrador";
        }

        if (!datos.nombre || !datos.apellido || !datos.email || (usuarioEditando === null && !datos.dni)) {
            mostrarMensaje("Completá los campos obligatorios.", "error");
            return;
        }

        if (usuarioActualizado?.activo !== false && datos.activo === false) {
            const confirmar = await Gymly.confirmar(
                `¿Querés suspender a ${usuarioActualizado.nombre} ${usuarioActualizado.apellido}?`,
                { titulo: "Suspender usuario", aceptar: "Suspender", peligro: true }
            );
            if (!confirmar) return;
        }

        if (usuarioEditando === null) {
            if (!campoContrasena.value) {
                mostrarMensaje("La contraseña es obligatoria para crear un usuario.", "error");
                return;
            }
            datos.contrasena = campoContrasena.value;
        }

        botonGuardar.disabled = true;
        botonGuardar.textContent = "Guardando...";
        const estabaCreando = usuarioEditando === null;

        try {
            const ruta = estabaCreando ? "/usuarios" : `/usuarios/${usuarioEditando}`;
            const metodo = estabaCreando ? "POST" : "PUT";

            const usuarioGuardado = await solicitar(ruta, {
                method: metodo,
                body: JSON.stringify(datos)
            });

            if (!estabaCreando) {
                usuarios = usuarios.map((usuario) =>
                    usuario.id_usuario === usuarioGuardado.id_usuario
                        ? usuarioGuardado
                        : usuario
                );
                aplicarBusqueda();
            }

            cerrarFormulario();
            await cargarUsuarios();
            const mensajeGuardado = estabaCreando
                ? "Usuario creado correctamente."
                : datos.activo === false
                    ? "Cambios guardados. El usuario quedó suspendido."
                    : datos.activo === true
                        ? "Cambios guardados. El usuario quedó activo."
                        : "Cambios guardados correctamente.";
            mostrarMensaje(mensajeGuardado, "exito");
        } catch (error) {
            mostrarMensaje(error.message, "error");
        } finally {
            botonGuardar.disabled = false;
            botonGuardar.textContent = estabaCreando ? "Crear usuario" : "Guardar cambios";
        }
    });

    busqueda.addEventListener("input", aplicarBusqueda);
    campoRol.addEventListener("change", actualizarCampoDiasAsistencia);

    cargarUsuarios();
});
