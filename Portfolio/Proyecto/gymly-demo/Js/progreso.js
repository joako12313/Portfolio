const API_URL_PROGRESO = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("gymly_token");
    let usuario = null;
    try {
        usuario = JSON.parse(localStorage.getItem("gymly_usuario") || "null");
    } catch {
        usuario = null;
    }
    const contenedor = document.getElementById("contenidoProgreso");
    if (!contenedor) return;
    if (!token || !usuario?.id_usuario || usuario.rol !== "usuario") {
        localStorage.removeItem("gymly_token");
        localStorage.removeItem("gymly_usuario");
        window.location.href = "../index.html";
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL_PROGRESO}/registro-entrenamiento/usuario/${usuario.id_usuario}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const datos = await respuesta.json();
        if (respuesta.status === 401 || respuesta.status === 403) {
            localStorage.removeItem("gymly_token");
            localStorage.removeItem("gymly_usuario");
            window.location.href = "../index.html";
            return;
        }
        if (!respuesta.ok) throw new Error(datos.detail || "No se pudo cargar tu progreso.");

        const registros = datos;
        const fechaUltima = registros
            .map(registro => registro.fecha)
            .filter(Boolean)
            .sort()
            .at(-1);
        const ultimoTexto = fechaUltima
            ? new Date(fechaUltima).toLocaleDateString("es-AR")
            : "Sin registros";
        const grupos = { size: window.GymlyRegistros.agrupar(registros).length };
        const totalVolumen = registros.reduce((total, registro) =>
            total + (Number(registro.peso) || 0) *
                (Number(registro.repeticiones) || 0) *
                (Number(registro.series) || 0), 0
        );
        const tarjetas = [
            ["Ejercicios registrados", String(registros.length)],
            ["Sesiones completadas", String(grupos.size)],
            ["Último entrenamiento", ultimoTexto],
            ["Volumen registrado", `${new Intl.NumberFormat("es-AR").format(totalVolumen)} kg`]
        ];
        contenedor.replaceChildren();
        tarjetas.forEach(([titulo, valor]) => {
            const tarjeta = document.createElement("article");
            tarjeta.className = "card-progreso";
            const etiqueta = document.createElement("strong");
            etiqueta.textContent = titulo;
            const resultado = document.createElement("span");
            resultado.textContent = valor;
            tarjeta.append(etiqueta, resultado);
            contenedor.appendChild(tarjeta);
        });
        if (!registros.length) {
            const ayuda = document.createElement("p");
            ayuda.textContent = "Cuando guardes un entrenamiento, vas a ver acá tu progreso.";
            contenedor.appendChild(ayuda);
        }
    } catch (error) {
        contenedor.textContent = error.message || "No se pudo cargar tu progreso.";
    }
});
