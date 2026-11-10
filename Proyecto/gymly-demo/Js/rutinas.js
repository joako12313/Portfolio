const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("gymly_token");
    let sesion = null;
    try {
        sesion = JSON.parse(localStorage.getItem("gymly_usuario") || "null");
    } catch {
        sesion = null;
    }

    if (!token || !sesion?.id_usuario) {
        window.location.href = "../index.html";
        return;
    }

    const adminList = document.getElementById("listaRutinasAdmin");
    const userList = document.getElementById("listaRutinasUsuario");
    const esEntrenador = sesion.rol === "entrenador";
    if (adminList && sesion.rol !== "administrador" && !esEntrenador) {
        window.location.href = "../Usuario/inicio.html";
        return;
    }
    if (adminList) iniciarAdmin();
    if (userList) iniciarUsuario();

    async function api(ruta, opciones = {}) {
        const headers = {
            Authorization: `Bearer ${localStorage.getItem("gymly_token")}`,
            ...(opciones.headers || {})
        };
        if (opciones.body) headers["Content-Type"] = "application/json";

        const respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
        const texto = await respuesta.text();
        const datos = texto ? JSON.parse(texto) : {};
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

    const esc = texto => String(texto ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caracter]);

    async function iniciarAdmin() {
        const buscar = document.getElementById("buscarRutina");
        const modal = document.getElementById("modalRutina");
        const modalEjercicios = document.getElementById("modalEjercicios");
        const selectorUsuario = document.getElementById("rutinaUsuario");
        const selectorEntrenador = document.getElementById("rutinaEntrenador");
        const selectorEjercicio = document.getElementById("selectEjercicio");
        const btnGuardar = document.getElementById("btnGuardarRutina");
        let rutinas = [];
        let usuarios = [];
        let ejercicios = [];
        let rutinaSeleccionada = null;
        let rutinaEditando = null;

        if (esEntrenador) {
            document.querySelector(".admin-info span").textContent = "Entrenador";
            document.querySelector(".titulo-seccion h1").textContent = "Rutinas para usuarios";
            document.querySelector(".titulo-seccion p").textContent =
                "Creá y asigná planes de entrenamiento a los usuarios del gimnasio.";
            document.getElementById("btnNuevaRutina").textContent = "+ Asignar rutina";
        }

        async function cargar() {
            try {
                [rutinas, usuarios, ejercicios] = await Promise.all([
                    api("/rutinas"),
                    api(esEntrenador ? "/entrenador/usuarios" : "/usuarios"),
                    api("/ejercicios")
                ]);
                selectorUsuario.innerHTML = '<option value="">Seleccionar usuario</option>' +
                    usuarios
                        .filter(usuario => esEntrenador
                            ? usuario.rol === "usuario"
                            : usuario.rol !== "administrador")
                        .map(usuario => `<option value="${usuario.id_usuario}">${esc(usuario.nombre)} ${esc(usuario.apellido)} · ${esc(usuario.email)}</option>`)
                        .join("");
                if (selectorEntrenador) {
                    selectorEntrenador.innerHTML = '<option value="">Sin asignar</option>' +
                        usuarios
                            .filter(usuario => usuario.rol === "entrenador")
                            .map(usuario => `<option value="${usuario.id_usuario}">${esc(usuario.nombre)} ${esc(usuario.apellido)}</option>`)
                            .join("");
                }
                selectorEjercicio.innerHTML = '<option value="">Seleccionar ejercicio</option>' +
                    ejercicios.map(ejercicio =>
                        `<option value="${ejercicio.id_ejercicio}">${esc(ejercicio.nombre)}</option>`
                    ).join("");
                render();
            } catch (error) {
                adminList.innerHTML = `<p>${esc(error.message)}</p>`;
            }
        }

        function render() {
            const busqueda = buscar.value.trim().toLowerCase();
            const filtradas = rutinas.filter(rutina => {
                const usuario = usuarios.find(item => item.id_usuario === rutina.id_usuario);
                return `${rutina.nombre} ${rutina.objetivo || ""} ${usuario ? `${usuario.nombre} ${usuario.apellido}` : ""}`
                    .toLowerCase().includes(busqueda);
            });

            adminList.innerHTML = "";
            document.getElementById("sinRutinasAdmin").style.display = filtradas.length ? "none" : "block";
            filtradas.forEach(rutina => {
                const usuario = usuarios.find(item => item.id_usuario === rutina.id_usuario);
                const entrenador = usuarios.find(item => item.id_usuario === rutina.id_entrenador);
                const puedeGestionar = !esEntrenador || rutina.id_entrenador === sesion.id_usuario;
                const tarjeta = document.createElement("article");
                tarjeta.className = "rutina";
                tarjeta.innerHTML = `
                    <h3>${esc(rutina.nombre)}</h3>
                    <p><b>Usuario:</b> ${esc(usuario ? `${usuario.nombre} ${usuario.apellido}` : "Usuario no encontrado")}</p>
                    ${esEntrenador ? "" : `<p><b>Entrenador:</b> ${esc(entrenador ? `${entrenador.nombre} ${entrenador.apellido}` : "Sin asignar")}</p>`}
                    <p><b>Objetivo:</b> ${esc(rutina.objetivo || "Sin objetivo")}</p>
                    <p><b>Día:</b> ${esc(formatearDia(rutina.dia_semana))}</p>
                    <p>${esc(rutina.descripcion || "Sin descripción")}</p>
                    <p><b>Estado:</b> <span class="estado-pildora${Number(rutina.activa) === 1 ? "" : " inactiva"}">${Number(rutina.activa) === 1 ? "Activa" : "Inactiva"}</span></p>
                    <div class="rutina-botones">
                        ${puedeGestionar ? '<button class="btnEditar" type="button">Editar</button>' : ""}
                        <button class="btnEjercicios" type="button">${puedeGestionar ? "Administrar ejercicios" : "Ver ejercicios"}</button>
                        ${puedeGestionar ? '<button class="btnEliminar" type="button">Eliminar</button>' : ""}
                    </div>`;

                tarjeta.querySelector(".btnEditar")?.addEventListener("click", () => abrirEdicion(rutina));
                tarjeta.querySelector(".btnEjercicios").addEventListener("click", () => abrirEjercicios(rutina));
                tarjeta.querySelector(".btnEliminar")?.addEventListener("click", async () => {
                    if (!await Gymly.confirmar(`¿Eliminar la rutina "${rutina.nombre}"?`, { titulo: "Eliminar rutina", aceptar: "Eliminar", peligro: true })) return;
                    try {
                        await api(`/rutinas/${rutina.id_rutina}`, { method: "DELETE" });
                        await cargar();
                    } catch (error) {
                        Gymly.toast(error.message, "error");
                    }
                });
                adminList.appendChild(tarjeta);
            });
        }

        function limpiarFormulario() {
            rutinaEditando = null;
            document.getElementById("tituloModalRutina").textContent = "Nueva rutina";
            selectorUsuario.value = "";
            if (selectorEntrenador) selectorEntrenador.value = "";
            document.getElementById("rutinaNombre").value = "";
            document.getElementById("rutinaObjetivo").value = "";
            document.getElementById("rutinaDescripcion").value = "";
            document.getElementById("rutinaDiaSemana").value = "";
            document.getElementById("rutinaActiva").value = "1";
        }

        function formatearDia(dia) {
            if (!dia) return "Sin asignar";
            return dia.charAt(0).toUpperCase() + dia.slice(1);
        }

        function abrirEdicion(rutina) {
            rutinaEditando = rutina;
            document.getElementById("tituloModalRutina").textContent = "Editar rutina";
            selectorUsuario.value = String(rutina.id_usuario);
            if (selectorEntrenador) {
                selectorEntrenador.value = rutina.id_entrenador ? String(rutina.id_entrenador) : "";
            }
            document.getElementById("rutinaNombre").value = rutina.nombre;
            document.getElementById("rutinaObjetivo").value = rutina.objetivo || "";
            document.getElementById("rutinaDescripcion").value = rutina.descripcion || "";
            document.getElementById("rutinaDiaSemana").value = rutina.dia_semana || "";
            document.getElementById("rutinaActiva").value = String(rutina.activa ?? 1);
            modal.style.display = "flex";
        }

        async function abrirEjercicios(rutina) {
            rutinaSeleccionada = rutina;
            document.getElementById("tituloEjerciciosRutina").textContent = rutina.nombre;
            document.getElementById("agregarEjercicioForm").style.display =
                !esEntrenador || rutina.id_entrenador === sesion.id_usuario ? "" : "none";
            modalEjercicios.style.display = "flex";
            await cargarDetalle();
        }

        async function cargarDetalle() {
            const lista = document.getElementById("listaEjerciciosRutina");
            lista.innerHTML = "<p>Cargando ejercicios...</p>";
            try {
                const detalle = await api(`/rutinas/${rutinaSeleccionada.id_rutina}/detalle`);
                lista.innerHTML = detalle.length ? "" : "<p>No hay ejercicios en esta rutina.</p>";
                detalle.forEach(ejercicio => {
                    const fila = document.createElement("div");
                    fila.className = "detalleEjercicio";
                    fila.innerHTML = `
                        <strong>${esc(ejercicio.nombre)}</strong>
                        <p>${ejercicio.series ?? "-"} series × ${ejercicio.repeticiones ?? "-"} repeticiones${ejercicio.peso != null ? ` · ${esc(ejercicio.peso)} kg` : ""}</p>
                        ${!esEntrenador || rutinaSeleccionada.id_entrenador === sesion.id_usuario ? '<button type="button" class="btnQuitarEjercicio">Quitar</button>' : ""}`;
                    const medios = window.GymlyMediaEjercicio.crear(ejercicio);
                    if (medios) fila.prepend(medios);
                    fila.querySelector(".btnQuitarEjercicio")?.addEventListener("click", async () => {
                        if (!await Gymly.confirmar(`¿Quitar "${ejercicio.nombre}" de esta rutina?`, { titulo: "Quitar ejercicio", aceptar: "Quitar", peligro: true })) return;
                        try {
                            await api(`/rutina-ejercicios/${rutinaSeleccionada.id_rutina}/${ejercicio.id_ejercicio}`, {
                                method: "DELETE"
                            });
                            await cargarDetalle();
                        } catch (error) {
                            Gymly.toast(error.message, "error");
                        }
                    });
                    lista.appendChild(fila);
                });
            } catch (error) {
                lista.innerHTML = `<p>${esc(error.message)}</p>`;
            }
        }

        document.getElementById("btnNuevaRutina").addEventListener("click", () => {
            limpiarFormulario();
            modal.style.display = "flex";
        });
        document.getElementById("btnCancelarRutina").addEventListener("click", () => {
            modal.style.display = "none";
            limpiarFormulario();
        });
        btnGuardar.addEventListener("click", async () => {
            const usuarioId = Number(selectorUsuario.value);
            const nombre = document.getElementById("rutinaNombre").value.trim();
            if (!usuarioId || !nombre) {
                Gymly.toast("Seleccioná un usuario y escribí el nombre de la rutina.", "error");
                return;
            }

            const datos = {
                id_usuario: usuarioId,
                id_entrenador: esEntrenador
                    ? sesion.id_usuario
                    : (selectorEntrenador.value ? Number(selectorEntrenador.value) : null),
                nombre,
                objetivo: document.getElementById("rutinaObjetivo").value.trim() || null,
                descripcion: document.getElementById("rutinaDescripcion").value.trim() || null,
                dia_semana: document.getElementById("rutinaDiaSemana").value || null,
                activa: Number(document.getElementById("rutinaActiva").value)
            };
            btnGuardar.disabled = true;
            try {
                if (rutinaEditando) {
                    await api(`/rutinas/${rutinaEditando.id_rutina}`, {
                        method: "PUT",
                        body: JSON.stringify(datos)
                    });
                } else {
                    await api("/rutinas", { method: "POST", body: JSON.stringify(datos) });
                }
                modal.style.display = "none";
                limpiarFormulario();
                await cargar();
            } catch (error) {
                Gymly.toast(error.message, "error");
            } finally {
                btnGuardar.disabled = false;
            }
        });
        document.getElementById("btnAgregarEjercicio").addEventListener("click", async () => {
            if (!rutinaSeleccionada) return;
            const idEjercicio = Number(selectorEjercicio.value);
            const series = Number(document.getElementById("ejercicioSeries").value);
            const repeticiones = Number(document.getElementById("ejercicioReps").value);
            const peso = Number(document.getElementById("ejercicioPeso").value);
            if (!idEjercicio || !Number.isInteger(series) || series < 1 ||
                !Number.isInteger(repeticiones) || repeticiones < 1 ||
                !Number.isFinite(peso) || peso < 0) {
                Gymly.toast("Elegí un ejercicio e ingresá series, repeticiones y peso válidos.", "error");
                return;
            }
            try {
                await api("/rutina-ejercicios", {
                    method: "POST",
                    body: JSON.stringify({
                        id_rutina: rutinaSeleccionada.id_rutina,
                        id_ejercicio: idEjercicio,
                        orden: null,
                        series,
                        repeticiones,
                        peso
                    })
                });
                await cargarDetalle();
            } catch (error) {
                Gymly.toast(error.message, "error");
            }
        });
        document.getElementById("btnCerrarEjercicios").addEventListener("click", () => {
            modalEjercicios.style.display = "none";
            rutinaSeleccionada = null;
        });
        buscar.addEventListener("input", render);
        await cargar();
    }

    async function iniciarUsuario() {
        try {
            const rutinas = await api(`/usuarios/${sesion.id_usuario}/rutinas-completas`);
            userList.innerHTML = "";
            document.getElementById("sinRutinas").style.display = rutinas.length ? "none" : "block";
            const hoy = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"][new Date().getDay()];
            rutinas.forEach(rutina => {
                const esHoy = rutina.dia_semana === hoy && Number(rutina.activa) === 1;
                const tarjeta = document.createElement("article");
                tarjeta.className = "rutina";
                tarjeta.innerHTML = `
                    <div class="rutina-cabecera">
                        <h3>${esc(rutina.nombre)}</h3>
                        ${rutina.dia_semana ? `<span class="etiqueta${esHoy ? " hoy" : ""}">${esHoy ? "Hoy" : esc(formatearDia(rutina.dia_semana))}</span>` : ""}
                    </div>
                    <p class="objetivo">${esc(rutina.objetivo || "Entrenamiento")}</p>
                    <p>${esc(rutina.descripcion || "Sin descripción.")}</p>
                    <div class="rutina-meta">
                        <span>${rutina.ejercicios.length} ejercicio${rutina.ejercicios.length === 1 ? "" : "s"}</span>
                        <span>Día: ${esc(formatearDia(rutina.dia_semana))}</span>
                    </div>
                    <div class="rutina-acciones">
                        <button class="btnVerRutina" type="button">Ver rutina</button>
                        <button class="btnVerRegistro btn-secundario" type="button">Ver registro</button>
                    </div>`;
                tarjeta.querySelector(".btnVerRutina").addEventListener("click", () => {
                    window.location.href = `entrenamiento.html?id=${rutina.id_rutina}`;
                });
                // Lleva al registro de esta rutina
                tarjeta.querySelector(".btnVerRegistro").addEventListener("click", () => {
                    window.location.href = `registro.html?rutina=${rutina.id_rutina}`;
                });
                userList.appendChild(tarjeta);
            });
        } catch (error) {
            userList.innerHTML = `<p class="mensaje-error">${esc(error.message)}</p>`;
        }
    }

    function formatearDia(dia) {
        if (!dia) return "Sin asignar";
        return dia.charAt(0).toUpperCase() + dia.slice(1);
    }
});
