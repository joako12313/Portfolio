const API_URL_REGISTRO = "http://127.0.0.1:8000";

/* Registro de una rutina: sesiones guardadas con peso, repeticiones y series */
document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("gymly_token");
    let sesion = null;
    try { sesion = JSON.parse(localStorage.getItem("gymly_usuario") || "null"); } catch {}
    if (!token || !sesion?.id_usuario) { window.location.href = "../index.html"; return; }

    const params = new URLSearchParams(window.location.search);
    const idRutina = Number(params.get("rutina"));
    const sesionObjetivo = params.get("sesion");

    const titulo = document.getElementById("nombreRutinaRegistro");
    const descripcion = document.getElementById("descripcionRegistro");
    const resumen = document.getElementById("resumenRegistro");
    const lista = document.getElementById("listaSesiones");
    const vacio = document.getElementById("sinRegistros");

    const escapar = t => String(t ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
    const numero = n => new Intl.NumberFormat("es-AR").format(n);
    const dia = ms => ms ? new Date(ms).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }) : "Fecha no disponible";
    const hora = ms => ms ? new Date(ms).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "";

    async function api(ruta) {
        const respuesta = await fetch(`${API_URL_REGISTRO}${ruta}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await respuesta.json().catch(() => ({}));
        if (respuesta.status === 401) {
            localStorage.removeItem("gymly_token");
            localStorage.removeItem("gymly_usuario");
            window.location.href = "../index.html";
            throw new Error("La sesión venció.");
        }
        if (!respuesta.ok) throw new Error(data.detail || "No se pudo cargar el registro.");
        return data;
    }

    function mostrarError(mensaje) {
        titulo.textContent = "No se pudo cargar el registro";
        descripcion.textContent = "";
        lista.innerHTML = `<p class="mensaje-error">${escapar(mensaje)}</p>`;
    }

    if (!idRutina) { mostrarError("No se seleccionó ninguna rutina."); return; }

    try {
        const [rutinas, registros] = await Promise.all([
            api(`/usuarios/${sesion.id_usuario}/rutinas-completas`),
            api(`/registro-entrenamiento/usuario/${sesion.id_usuario}`)
        ]);

        const rutina = rutinas.find(item => item.id_rutina === idRutina);
        const delaRutina = registros.filter(item => item.id_rutina === idRutina);
        if (!rutina && !delaRutina.length) { mostrarError("No encontramos esa rutina."); return; }

        titulo.textContent = rutina?.nombre || `Rutina #${idRutina}`;
        descripcion.textContent = rutina?.objetivo || "Sesiones guardadas de esta rutina.";
        const nombres = new Map((rutina?.ejercicios || []).map(e => [e.id_ejercicio, e.nombre]));

        document.getElementById("btnIrEntrenar").addEventListener("click", () => {
            window.location.href = `entrenamiento.html?id=${idRutina}`;
        });

        const sesiones = window.GymlyRegistros.agrupar(delaRutina);
        if (!sesiones.length) {
            vacio.style.display = "block";
            return;
        }

        resumen.hidden = false;
        document.getElementById("totalSesiones").textContent = String(sesiones.length);
        document.getElementById("ultimaSesion").textContent = sesiones[0].inicio
            ? new Date(sesiones[0].inicio).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
            : "—";
        document.getElementById("volumenTotal").textContent =
            `${numero(sesiones.reduce((suma, s) => suma + s.volumen, 0))} kg`;

        lista.innerHTML = "";
        let elementoObjetivo = null;
        sesiones.forEach((item, indice) => {
            const esObjetivo = sesionObjetivo ? item.id === sesionObjetivo : indice === 0;
            const detalle = document.createElement("details");
            detalle.className = `sesion${sesionObjetivo && esObjetivo ? " destacada" : ""}`;
            detalle.open = esObjetivo;
            detalle.style.animationDelay = `${Math.min(indice, 5) * 0.06}s`;
            const cantidad = item.registros.length;
            detalle.innerHTML = `
                <summary>
                    <div>
                        <h3>${escapar(dia(item.inicio))}</h3>
                        <p>${[hora(item.inicio), `${cantidad} ejercicio${cantidad === 1 ? "" : "s"}`, `${numero(item.volumen)} kg`].filter(Boolean).join(" · ")}</p>
                    </div>
                    <span class="fila-flecha"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></span>
                </summary>
                <div class="sesion-cuerpo">
                    ${item.registros.map(r => `
                        <article class="detalleEjercicio">
                            <strong>${escapar(nombres.get(r.id_ejercicio) || `Ejercicio #${r.id_ejercicio}`)}</strong>
                            <div class="datos-ejercicio">
                                <div><span>Peso</span><b>${r.peso ?? "-"} kg</b></div>
                                <div><span>Reps</span><b>${r.repeticiones ?? "-"}</b></div>
                                <div><span>Series</span><b>${r.series ?? "-"}</b></div>
                            </div>
                        </article>`).join("")}
                </div>`;
            lista.appendChild(detalle);
            if (sesionObjetivo && esObjetivo) elementoObjetivo = detalle;
        });

        if (elementoObjetivo && sesiones[0].id !== sesionObjetivo) {
            window.setTimeout(() => elementoObjetivo.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
        }
    } catch (error) {
        mostrarError(error.message);
    }
});
