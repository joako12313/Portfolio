const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", async () => {
    const lista = document.getElementById("listaEjerciciosUsuario");
    const buscador = document.getElementById("buscarEjercicio");
    const sinResultados = document.getElementById("sinEjerciciosUsuario");
    if (!lista || !buscador || !sinResultados) return;

    const token = localStorage.getItem("gymly_token");
    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    let ejercicios;
    try {
        const respuesta = await fetch(`${API_URL}/ejercicios`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const datos = await respuesta.json();
        if (respuesta.status === 401) {
            localStorage.removeItem("gymly_token");
            localStorage.removeItem("gymly_usuario");
            window.location.href = "../index.html";
            return;
        }
        if (!respuesta.ok) throw new Error(datos.detail || "No se pudieron cargar los ejercicios.");
        ejercicios = datos;
    } catch (error) {
        lista.textContent = error.message || "No se pudieron cargar los ejercicios.";
        return;
    }

    function render() {
        const consulta = buscador.value.trim().toLocaleLowerCase();
        const filtrados = ejercicios.filter(ejercicio =>
            `${ejercicio.nombre} ${ejercicio.musculo_principal || ""}`.toLocaleLowerCase().includes(consulta)
        );
        lista.replaceChildren();
        sinResultados.style.display = filtrados.length ? "none" : "block";

        filtrados.forEach(ejercicio => {
            const tarjeta = document.createElement("article");
            tarjeta.className = "ejercicio tarjetaEjercicio";
            const grupo = document.createElement("p");
            grupo.className = "grupoEjercicio";
            grupo.textContent = ejercicio.musculo_principal || "General";
            const nombre = document.createElement("h3");
            nombre.textContent = ejercicio.nombre;
            const descripcion = document.createElement("p");
            descripcion.textContent = ejercicio.descripcion || "Sin descripción.";
            const medios = window.GymlyMediaEjercicio.crear(ejercicio);
            const boton = document.createElement("button");
            boton.className = "btnVerEjercicio";
            boton.type = "button";
            boton.textContent = "Ver ejercicio";
            boton.addEventListener("click", () => {
                const contenido = document.createElement("div");
                const detalleMedios = window.GymlyMediaEjercicio.crear(ejercicio);
                if (detalleMedios) contenido.appendChild(detalleMedios);
                const texto = document.createElement("p");
                texto.textContent = ejercicio.descripcion || "Sin descripción.";
                contenido.appendChild(texto);
                if (ejercicio.series || ejercicio.repeticiones) {
                    const sugerencia = document.createElement("p");
                    sugerencia.style.marginTop = "10px";
                    sugerencia.textContent = `Sugerencia: ${ejercicio.series ?? "—"} series × ${ejercicio.repeticiones ?? "—"} repeticiones`;
                    contenido.appendChild(sugerencia);
                }
                Gymly.hoja(ejercicio.nombre, contenido);
            });
            if (medios) tarjeta.appendChild(medios);
            tarjeta.append(grupo, nombre, descripcion, boton);
            lista.appendChild(tarjeta);
        });
    }

    buscador.addEventListener("input", render);
    render();
});
