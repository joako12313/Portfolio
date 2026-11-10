const API_URL_GIMNASIO_ADMIN = "http://127.0.0.1:8000";
const DIAS_SEMANA_GIMNASIO = [
    "lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"
];

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

    const formulario = document.getElementById("formGimnasio");
    const estado = document.getElementById("estadoGimnasioAdmin");
    const botonGuardar = document.getElementById("btnGuardarGimnasio");
    let gimnasioConfigurado = false;

    async function api(ruta, opciones = {}) {
        const headers = {
            Authorization: `Bearer ${localStorage.getItem("gymly_token")}`,
            ...(opciones.headers || {})
        };
        if (opciones.body) headers["Content-Type"] = "application/json";
        const respuesta = await fetch(`${API_URL_GIMNASIO_ADMIN}${ruta}`, { ...opciones, headers });
        const texto = await respuesta.text();
        const datos = texto ? JSON.parse(texto) : {};
        if (respuesta.status === 401 || respuesta.status === 403) {
            localStorage.removeItem("gymly_token");
            localStorage.removeItem("gymly_usuario");
            window.location.href = "../index.html";
            throw new Error("Tu sesión no tiene permisos de administrador.");
        }
        if (!respuesta.ok) throw new Error(datos.detail || "No se pudo completar la solicitud.");
        return datos;
    }

    function valor(id) {
        return document.getElementById(id).value.trim();
    }

    function actualizarEstadoDia(dia) {
        const cerrado = document.getElementById(`horario-${dia}-cerrado`).checked;
        ["apertura", "cierre"].forEach(tipo => {
            const campo = document.getElementById(`horario-${dia}-${tipo}`);
            campo.disabled = cerrado;
            if (cerrado) campo.value = "";
        });
    }

    function cargarFormulario(gimnasio) {
        document.getElementById("nombreGimnasioAdmin").value = gimnasio.nombre || "";
        document.getElementById("direccionGimnasioAdmin").value = gimnasio.direccion || "";
        document.getElementById("telefonoGimnasioAdmin").value = gimnasio.telefono || "";
        DIAS_SEMANA_GIMNASIO.forEach(dia => {
            const horario = gimnasio.horarios?.[dia];
            const cerrado = document.getElementById(`horario-${dia}-cerrado`);
            cerrado.checked = !horario?.apertura || !horario?.cierre;
            document.getElementById(`horario-${dia}-apertura`).value =
                (horario?.apertura || "").slice(0, 5);
            document.getElementById(`horario-${dia}-cierre`).value =
                (horario?.cierre || "").slice(0, 5);
            actualizarEstadoDia(dia);
        });
    }

    DIAS_SEMANA_GIMNASIO.forEach(dia => {
        document.getElementById(`horario-${dia}-cerrado`)
            .addEventListener("change", () => actualizarEstadoDia(dia));
    });

    async function cargar() {
        estado.textContent = "Cargando configuración...";
        try {
            const gimnasio = await api("/gimnasio");
            gimnasioConfigurado = true;
            cargarFormulario(gimnasio);
            estado.textContent = "Configuración cargada.";
        } catch (error) {
            if (error.message.includes("todavia no fue configurado")) {
                gimnasioConfigurado = false;
                formulario.reset();
                estado.textContent = "Todavía no hay un gimnasio configurado. Completá los datos para crearlo.";
                return;
            }
            estado.textContent = error.message;
            estado.dataset.tipo = "error";
        }
    }

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();
        const horarios = {};
        let errorHorario = "";
        DIAS_SEMANA_GIMNASIO.forEach(dia => {
            const apertura = valor(`horario-${dia}-apertura`);
            const cierre = valor(`horario-${dia}-cierre`);
            const cerrado = document.getElementById(`horario-${dia}-cerrado`).checked;
            if (cerrado) {
                horarios[dia] = null;
                return;
            }
            if (!apertura || !cierre) {
                errorHorario = `Completá apertura y cierre de ${dia}, o marcá «Cerrado».`;
            } else if (cierre <= apertura) {
                errorHorario = `El cierre de ${dia} debe ser posterior a la apertura.`;
            }
            horarios[dia] = { apertura, cierre };
        });
        const datos = {
            nombre: valor("nombreGimnasioAdmin"),
            direccion: valor("direccionGimnasioAdmin") || null,
            telefono: valor("telefonoGimnasioAdmin") || null,
            horarios
        };
        if (errorHorario) {
            estado.textContent = errorHorario;
            estado.dataset.tipo = "error";
            return;
        }
        if (!datos.nombre) {
            estado.textContent = "Ingresá el nombre del gimnasio.";
            estado.dataset.tipo = "error";
            return;
        }
        botonGuardar.disabled = true;
        estado.textContent = "Guardando...";
        estado.dataset.tipo = "";
        try {
            const gimnasio = await api("/gimnasio", {
                method: gimnasioConfigurado ? "PUT" : "POST",
                body: JSON.stringify(datos)
            });
            gimnasioConfigurado = true;
            cargarFormulario(gimnasio);
            estado.textContent = "Configuración guardada correctamente.";
            estado.dataset.tipo = "exito";
        } catch (error) {
            estado.textContent = error.message;
            estado.dataset.tipo = "error";
        } finally {
            botonGuardar.disabled = false;
        }
    });

    DIAS_SEMANA_GIMNASIO.forEach(dia => actualizarEstadoDia(dia));
    cargar();
});
