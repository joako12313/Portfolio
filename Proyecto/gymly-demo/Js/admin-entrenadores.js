const API_URL_ENTRENADORES = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("gymly_token");
    let sesion = null;
    try {
        sesion = JSON.parse(localStorage.getItem("gymly_usuario") || "null");
    } catch {
        sesion = null;
    }
    if (!token || sesion?.rol !== "administrador") {
        window.location.href = "../index.html";
        return;
    }

    const tabla = document.getElementById("tablaEntrenadores");
    const busqueda = document.getElementById("buscarEntrenador");
    const estado = document.getElementById("estadoEntrenadores");
    let entrenadores = [];

    function render() {
        const consulta = busqueda.value.trim().toLocaleLowerCase("es");
        const visibles = entrenadores.filter(entrenador =>
            `${entrenador.nombre} ${entrenador.apellido} ${entrenador.email}`
                .toLocaleLowerCase("es").includes(consulta)
        );
        tabla.replaceChildren();
        if (!visibles.length) {
            const fila = tabla.insertRow();
            const celda = fila.insertCell();
            celda.colSpan = 3;
            celda.textContent = "No hay entrenadores que coincidan.";
            return;
        }
        visibles.forEach(entrenador => {
            const fila = tabla.insertRow();
            fila.insertCell().textContent = `${entrenador.nombre} ${entrenador.apellido}`;
            fila.insertCell().textContent = entrenador.email;
            fila.insertCell().textContent = entrenador.telefono || "—";
        });
    }

    try {
        const respuesta = await fetch(`${API_URL_ENTRENADORES}/usuarios`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const datos = await respuesta.json();
        if (respuesta.status === 401 || respuesta.status === 403) {
            localStorage.removeItem("gymly_token");
            localStorage.removeItem("gymly_usuario");
            window.location.href = "../index.html";
            return;
        }
        if (!respuesta.ok) throw new Error(datos.detail || "No se pudieron cargar los entrenadores.");
        entrenadores = datos.filter(usuario => usuario.rol === "entrenador");
        estado.textContent = `${entrenadores.length} entrenador${entrenadores.length === 1 ? "" : "es"}.`;
        render();
    } catch (error) {
        estado.textContent = error.message || "No se pudieron cargar los entrenadores.";
        estado.dataset.tipo = "error";
    }
    busqueda.addEventListener("input", render);
});
