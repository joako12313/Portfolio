const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("gymly_token");
    let usuario = null;
    try {
        usuario = JSON.parse(localStorage.getItem("gymly_usuario") || "null");
    } catch {
        usuario = null;
    }
    if (!token || usuario?.rol !== "administrador") {
        window.location.href = "../index.html";
        return;
    }

    const lista = document.getElementById("listaEjerciciosAdmin");
    const buscador = document.getElementById("buscarEjercicioAdmin");
    const sinResultados = document.getElementById("sinEjerciciosAdmin");
    const estado = document.getElementById("estadoEjerciciosAdmin");
    const modal = document.getElementById("modalEjercicioAdmin");
    const formulario = document.getElementById("formEjercicioAdmin");
    const botonGuardar = document.getElementById("btnGuardarEjercicioAdmin");
    let ejercicios = [];
    let ejercicioEditando = null;

    function escapar(texto) {
        return String(texto ?? "").replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[caracter]);
    }

    function urlsMultimediaValidas() {
        return ["imagenEjercicioAdmin", "videoEjercicioAdmin"].every(id => {
            const valor = document.getElementById(id).value.trim();
            if (!valor) return true;
            try {
                return ["http:", "https:"].includes(new URL(valor).protocol);
            } catch {
                return false;
            }
        });
    }

    async function api(ruta, opciones = {}) {
        const headers = {
            Authorization: `Bearer ${localStorage.getItem("gymly_token")}`,
            ...(opciones.headers || {})
        };
        if (opciones.body) headers["Content-Type"] = "application/json";
        const respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
        const texto = await respuesta.text();
        const datos = texto ? JSON.parse(texto) : {};

        if (respuesta.status === 401 || respuesta.status === 403) {
            localStorage.removeItem("gymly_token");
            localStorage.removeItem("gymly_usuario");
            window.location.href = "../index.html";
            throw new Error(respuesta.status === 401 ? "La sesión venció." : "Se requiere una cuenta de administrador.");
        }
        if (!respuesta.ok) throw new Error(datos.detail || "No se pudo completar la solicitud.");
        return datos;
    }

    function render() {
        const busqueda = buscador.value.trim().toLocaleLowerCase();
        const filtrados = ejercicios.filter(ejercicio =>
            `${ejercicio.nombre} ${ejercicio.musculo_principal || ""}`.toLocaleLowerCase().includes(busqueda)
        );
        lista.innerHTML = "";
        sinResultados.hidden = filtrados.length > 0;

        filtrados.forEach(ejercicio => {
            const tarjeta = document.createElement("article");
            tarjeta.className = "ejercicio tarjetaEjercicio";
            tarjeta.innerHTML = `
                <div class="contenidoEjercicio">
                    <p class="grupoEjercicio">${escapar(ejercicio.musculo_principal || "General")}</p>
                    <h2>${escapar(ejercicio.nombre)}</h2>
                    <p>${escapar(ejercicio.descripcion || "Sin descripción.")}</p>
                    <p>Sugerencia: ${ejercicio.series ?? "—"} series × ${escapar(ejercicio.repeticiones ?? "—")} repeticiones</p>
                    <div class="acciones-ejercicio">
                        <button class="btn-editar-ejercicio" type="button">Editar</button>
                        <button class="btn-eliminar-ejercicio" type="button">Eliminar</button>
                    </div>
                </div>`;
            const medios = window.GymlyMediaEjercicio.crear(ejercicio);
            if (medios) {
                tarjeta.classList.add("conMedia");
                tarjeta.appendChild(medios);
            } else {
                const aviso = document.createElement("div");
                aviso.className = "mediaEjercicioVacio";
                aviso.textContent = "Editá este ejercicio para agregar una URL de imagen o video.";
                tarjeta.appendChild(aviso);
            }
            tarjeta.querySelector(".btn-editar-ejercicio").addEventListener("click", () => abrirEdicion(ejercicio));
            tarjeta.querySelector(".btn-eliminar-ejercicio").addEventListener("click", () => eliminar(ejercicio));
            lista.appendChild(tarjeta);
        });
    }

    async function cargar() {
        estado.textContent = "Cargando ejercicios...";
        estado.dataset.tipo = "";
        try {
            ejercicios = await api("/ejercicios");
            render();
            estado.textContent = `${ejercicios.length} ejercicios`;
        } catch (error) {
            estado.textContent = error.message;
            estado.dataset.tipo = "error";
        }
    }

    function limpiarFormulario() {
        formulario.reset();
        ejercicioEditando = null;
        document.getElementById("tituloModalEjercicio").textContent = "Nuevo ejercicio";
        document.getElementById("errorFormularioEjercicio").textContent = "";
    }

    function abrirEdicion(ejercicio) {
        ejercicioEditando = ejercicio;
        document.getElementById("tituloModalEjercicio").textContent = "Editar ejercicio";
        document.getElementById("nombreEjercicioAdmin").value = ejercicio.nombre;
        document.getElementById("musculoEjercicioAdmin").value = ejercicio.musculo_principal || "";
        document.getElementById("descripcionEjercicioAdmin").value = ejercicio.descripcion || "";
        document.getElementById("seriesEjercicioAdmin").value = ejercicio.series ?? "";
        document.getElementById("repeticionesEjercicioAdmin").value = ejercicio.repeticiones ?? "";
        document.getElementById("imagenEjercicioAdmin").value = ejercicio.imagen || "";
        document.getElementById("videoEjercicioAdmin").value = ejercicio.video || "";
        document.getElementById("errorFormularioEjercicio").textContent = "";
        modal.style.display = "flex";
    }

    async function eliminar(ejercicio) {
        if (!await Gymly.confirmar(`¿Eliminar "${ejercicio.nombre}"? No se puede eliminar si pertenece a una rutina o tiene registros.`, { titulo: "Eliminar ejercicio", aceptar: "Eliminar", peligro: true })) return;
        try {
            await api(`/ejercicios/${ejercicio.id_ejercicio}`, { method: "DELETE" });
            estado.textContent = "Ejercicio eliminado.";
            estado.dataset.tipo = "exito";
            await cargar();
        } catch (error) {
            estado.textContent = error.message;
            estado.dataset.tipo = "error";
        }
    }

    document.getElementById("btnNuevoEjercicio").addEventListener("click", () => {
        limpiarFormulario();
        modal.style.display = "flex";
    });
    document.getElementById("btnCancelarEjercicioAdmin").addEventListener("click", () => {
        modal.style.display = "none";
        limpiarFormulario();
    });
    buscador.addEventListener("input", render);
    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();
        const nombre = document.getElementById("nombreEjercicioAdmin").value.trim();
        const seriesTexto = document.getElementById("seriesEjercicioAdmin").value;
        const repeticionesTexto = document.getElementById("repeticionesEjercicioAdmin").value.trim();
        const datos = {
            nombre,
            descripcion: document.getElementById("descripcionEjercicioAdmin").value.trim() || null,
            musculo_principal: document.getElementById("musculoEjercicioAdmin").value.trim() || null,
            series: seriesTexto ? Number(seriesTexto) : null,
            repeticiones: repeticionesTexto || null,
            imagen: document.getElementById("imagenEjercicioAdmin").value.trim() || null,
            video: document.getElementById("videoEjercicioAdmin").value.trim() || null
        };
        if (!nombre || (datos.series !== null && (!Number.isInteger(datos.series) || datos.series < 1)) ||
            repeticionesTexto.length > 20) {
            document.getElementById("errorFormularioEjercicio").textContent = "Ingresá un nombre y una cantidad de series válida. La sugerencia de repeticiones admite hasta 20 caracteres.";
            return;
        }
        if (!urlsMultimediaValidas()) {
            document.getElementById("errorFormularioEjercicio").textContent = "Las URL de imagen y video deben comenzar con http:// o https://.";
            return;
        }

        botonGuardar.disabled = true;
        document.getElementById("errorFormularioEjercicio").textContent = "";
        try {
            if (ejercicioEditando) {
                await api(`/ejercicios/${ejercicioEditando.id_ejercicio}`, {
                    method: "PUT",
                    body: JSON.stringify(datos)
                });
            } else {
                await api("/ejercicios", { method: "POST", body: JSON.stringify(datos) });
            }
            modal.style.display = "none";
            limpiarFormulario();
            await cargar();
        } catch (error) {
            document.getElementById("errorFormularioEjercicio").textContent = error.message;
        } finally {
            botonGuardar.disabled = false;
        }
    });

    cargar();
});
