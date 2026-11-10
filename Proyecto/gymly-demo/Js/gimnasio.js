const API_URL_GIMNASIO = "http://127.0.0.1:8000";

function sesionGimnasio() {
    try {
        return {
            token: localStorage.getItem("gymly_token"),
            usuario: JSON.parse(localStorage.getItem("gymly_usuario") || "null")
        };
    } catch {
        return { token: null, usuario: null };
    }
}

function salirGimnasio() {
    localStorage.removeItem("gymly_token");
    localStorage.removeItem("gymly_usuario");
    window.location.href = "../index.html";
}

async function apiGimnasio(ruta, token) {
    const respuesta = await fetch(`${API_URL_GIMNASIO}${ruta}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (respuesta.status === 401) {
        salirGimnasio();
        throw new Error("La sesión venció.");
    }
    if (!respuesta.ok) throw new Error(datos.detail || "No se pudo cargar la información del gimnasio.");
    return datos;
}

function mostrar(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor || "Sin información";
}

function formatoHora(valor) {
    if (!valor) return "Sin información";
    return String(valor).slice(0, 5);
}

function mostrarHorariosSemana(horarios) {
    const lista = document.getElementById("horariosGimnasio");
    if (!lista) return;

    const dias = [
        ["lunes", "Lunes"], ["martes", "Martes"], ["miercoles", "Miércoles"],
        ["jueves", "Jueves"], ["viernes", "Viernes"], ["sabado", "Sábado"],
        ["domingo", "Domingo"]
    ];
    lista.replaceChildren();
    const hoy = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"][new Date().getDay()];
    dias.forEach(([clave, nombre]) => {
        const horario = horarios?.[clave];
        const abierto = Boolean(horario?.apertura && horario?.cierre);
        const fila = document.createElement("li");
        if (!abierto) fila.classList.add("cerrado");
        if (clave === hoy) fila.classList.add("hoy");
        const dia = document.createElement("span");
        dia.textContent = nombre;
        const horas = document.createElement("b");
        horas.textContent = abierto
            ? `${formatoHora(horario.apertura)} a ${formatoHora(horario.cierre)}`
            : "Cerrado";
        fila.append(dia, horas);
        lista.appendChild(fila);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const sesion = sesionGimnasio();
    if (!sesion.token || sesion.usuario?.rol !== "usuario") {
        window.location.href = "../index.html";
        return;
    }

    const error = document.getElementById("errorGimnasio");
    try {
        const gimnasio = await apiGimnasio("/gimnasio", sesion.token);

        mostrar("nombreGimnasio", gimnasio.nombre);
        mostrar("direccionGimnasio", gimnasio.direccion);
        mostrar("telefonoGimnasio", gimnasio.telefono);
        mostrarHorariosSemana(gimnasio.horarios);
    } catch (e) {
        if (error) error.textContent = e.message;
    }

    const btnChat = document.getElementById("btnAbrirChatGimnasio");
    if (btnChat) btnChat.addEventListener("click", () => window.location.href = "chat.html");
});
