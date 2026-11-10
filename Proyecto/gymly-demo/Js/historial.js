const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("gymly_token");
    let sesion = null;
    try { sesion = JSON.parse(localStorage.getItem("gymly_usuario") || "null"); } catch {}
    if (!token || !sesion?.id_usuario) { window.location.href = "../index.html"; return; }

    const cont = document.getElementById("historialEntrenamientos");
    const vacio = document.getElementById("sinHistorial");

    async function api(ruta) {
        const respuesta = await fetch(`${API_URL}${ruta}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await respuesta.json().catch(() => ({}));
        if (respuesta.status === 401) {
            localStorage.removeItem("gymly_token");
            localStorage.removeItem("gymly_usuario");
            window.location.href = "../index.html";
            throw new Error("La sesión venció.");
        }
        if (!respuesta.ok) throw new Error(data.detail || "No se pudo cargar el historial.");
        return data;
    }

    const escapar = t => String(t ?? "").replace(/[&<>"']/g,c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
    const fecha = ms => ms ? new Date(ms).toLocaleString("es-AR", {dateStyle:"medium", timeStyle:"short"}) : "Fecha no disponible";

    try {
        const [registros, rutinas] = await Promise.all([
            api(`/registro-entrenamiento/usuario/${sesion.id_usuario}`),
            api(`/usuarios/${sesion.id_usuario}/rutinas-completas`).catch(() => [])
        ]);
        const nombres = new Map(rutinas.map(r => [r.id_rutina, r.nombre]));
        const sesiones = window.GymlyRegistros.agrupar(registros);

        vacio.style.display = sesiones.length ? "none" : "block";
        cont.innerHTML = "";

        sesiones.forEach(item => {
            const nombre = nombres.get(item.id_rutina) || `Rutina #${item.id_rutina}`;
            const card = document.createElement("article");
            card.className = "registro";
            card.innerHTML = `<div><h3>${escapar(nombre)}</h3><p>${fecha(item.inicio)}</p><p>${item.registros.length} ejercicio${item.registros.length === 1 ? "" : "s"} registrado${item.registros.length === 1 ? "" : "s"}</p></div><button class="btnVerRegistro" type="button">Ver registro</button>`;
            // Lleva a la pantalla con el registro de esa rutina
            card.querySelector(".btnVerRegistro").addEventListener("click", () => {
                window.location.href = `registro.html?rutina=${item.id_rutina}&sesion=${encodeURIComponent(item.id)}`;
            });
            cont.appendChild(card);
        });
    } catch (error) {
        vacio.style.display = "none";
        cont.innerHTML = `<p class="mensaje-error">${escapar(error.message)}</p>`;
    }
});
