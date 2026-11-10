const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("gymly_token");
    let sesion = null;
    try { sesion = JSON.parse(localStorage.getItem("gymly_usuario") || "null"); } catch {}
    if (!token || !sesion?.id_usuario) { window.location.href = "../index.html"; return; }

    const params = new URLSearchParams(window.location.search);
    const idRutina = Number(params.get("id"));
    const contenedor = document.getElementById("ejerciciosEntrenamiento");
    const vacio = document.getElementById("sinEjerciciosEntrenamiento");
    const estado = document.getElementById("estadoEntrenamiento");
    const registrosSesion = new Map();
    const barra = document.getElementById("barraEntrenamiento");

    async function api(ruta, opciones = {}) {
        const headers = { Authorization: `Bearer ${token}`, ...(opciones.headers || {}) };
        if (opciones.body) headers["Content-Type"] = "application/json";
        const respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
        const data = await respuesta.json().catch(() => ({}));
        if (respuesta.status === 401) {
            localStorage.removeItem("gymly_token");
            localStorage.removeItem("gymly_usuario");
            window.location.href = "../index.html";
            throw new Error("La sesión venció.");
        }
        if (!respuesta.ok) throw new Error(data.detail || "No se pudo completar la solicitud.");
        return data;
    }

    const escapar = t => String(t ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

    if (!idRutina) {
        mostrarError("No se seleccionó ninguna rutina.");
        return;
    }

    try {
        const [rutina, ejercicios] = await Promise.all([
            api(`/rutinas/${idRutina}`),
            api(`/rutinas/${idRutina}/detalle`)
        ]);

        document.getElementById("nombreRutina").textContent = rutina.nombre;
        document.getElementById("cantidadEjercicios").textContent = ejercicios.length;
        vacio.style.display = ejercicios.length ? "none" : "block";

        ejercicios.forEach((ejercicio, indice) => {
            const card = document.createElement("article");
            card.className = "ejercicio ejercicioEntrenamiento";
            card.innerHTML = `
                <div class="ejercicioInfo">
                    <span class="numeroEjercicio">${indice + 1}</span>
                    <div><h3>${escapar(ejercicio.nombre)}</h3><p>${ejercicio.series ?? "-"} series × ${ejercicio.repeticiones ?? "-"} repeticiones${ejercicio.peso != null ? ` · Referencia: ${ejercicio.peso} kg` : ""}</p></div>
                </div>
                <div class="registroEjercicio">
                    <div><label>Peso realizado<input class="pesoRealizado" type="number" min="0" step="0.5" placeholder="kg"></label></div>
                    <div><label>Repeticiones<input class="repsRealizadas" type="number" min="0" placeholder="reps"></label></div>
                </div>
                <button class="btnGuardarEjercicio" type="button">Guardar ejercicio</button>
                <p class="estadoRegistro">Sin registrar</p>`;

            const medios = window.GymlyMediaEjercicio.crear(ejercicio);
            if (medios) card.prepend(medios);

            const peso = card.querySelector(".pesoRealizado");
            const reps = card.querySelector(".repsRealizadas");
            const btn = card.querySelector(".btnGuardarEjercicio");
            const estadoRegistro = card.querySelector(".estadoRegistro");

            btn.addEventListener("click", () => {
                if (peso.value === "" || reps.value === "") { Gymly.toast("Completá peso y repeticiones.", "error"); return; }
                registrosSesion.set(ejercicio.id_ejercicio, {
                    id_ejercicio: ejercicio.id_ejercicio,
                    ejercicio: ejercicio.nombre,
                    peso: Number(peso.value),
                    repeticiones: Number(reps.value),
                    series: Number(ejercicio.series) || 1
                });
                estadoRegistro.textContent = "Registrado ✓";
                estadoRegistro.classList.add("registroCompleto");
                btn.textContent = "Registro actualizado";
                estado.textContent = `${registrosSesion.size} de ${ejercicios.length} ejercicios registrados`;
                barra.style.width = `${(registrosSesion.size / ejercicios.length) * 100}%`;
                Gymly.toast(`${ejercicio.nombre} registrado`, "exito", 1800);
            });
            contenedor.appendChild(card);
        });

        document.getElementById("btnFinalizar").addEventListener("click", async () => {
            if (!registrosSesion.size) { Gymly.toast("Registrá al menos un ejercicio antes de finalizar.", "error"); return; }
            const boton = document.getElementById("btnFinalizar");
            boton.disabled = true;
            try {
                for (const registro of registrosSesion.values()) {
                    await api("/registro-entrenamiento", {
                        method: "POST",
                        body: JSON.stringify({
                            id_usuario: sesion.id_usuario,
                            id_rutina: idRutina,
                            id_ejercicio: registro.id_ejercicio,
                            peso: registro.peso,
                            repeticiones: registro.repeticiones,
                            series: registro.series,
                            observaciones: null
                        })
                    });
                }
                Gymly.flash("Entrenamiento guardado correctamente.", "exito");
                window.location.href = "historial.html";
            } catch (error) {
                Gymly.toast(error.message, "error");
                boton.disabled = false;
            }
        });
    } catch (error) {
        mostrarError(error.message);
    }

    function mostrarError(mensaje) {
        document.getElementById("nombreRutina").textContent = "No se pudo cargar la rutina";
        document.getElementById("cantidadEjercicios").textContent = "0";
        estado.textContent = mensaje;
        vacio.style.display = "block";
    }
});
