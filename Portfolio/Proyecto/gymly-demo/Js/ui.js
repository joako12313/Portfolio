/* =========================================================
   GYMLY - AVISOS, CONFIRMACIONES Y HOJAS
   Reemplaza alert() y confirm() por componentes con el mismo
   diseño de la app. Dentro del teléfono se muestran dentro de
   la pantalla del teléfono.

   Gymly.toast(texto, tipo)        -> aviso breve (info | exito | error)
   Gymly.confirmar(texto, opciones)-> Promise<boolean>
   Gymly.hoja(titulo, nodo)        -> panel inferior (solo app del socio)
   Gymly.flash(texto, tipo)        -> aviso que se muestra en la próxima página
   ========================================================= */
(function () {
    "use strict";

    const CLAVE_FLASH = "gymly_flash";

    function anfitrion() {
        let host = document.querySelector(".gy-host");
        if (host) return host;
        host = document.createElement("div");
        host.className = "gy-host";
        const toasts = document.createElement("div");
        toasts.className = "gy-toasts";
        toasts.setAttribute("role", "status");
        toasts.setAttribute("aria-live", "polite");
        host.appendChild(toasts);
        (document.querySelector(".phone") || document.body).appendChild(host);
        return host;
    }

    function toast(texto, tipo = "info", duracion = 3400) {
        const host = anfitrion();
        const contenedor = host.querySelector(".gy-toasts");
        const aviso = document.createElement("div");
        aviso.className = "gy-toast";
        aviso.dataset.tipo = tipo;
        aviso.textContent = texto;
        contenedor.appendChild(aviso);

        const quitar = () => {
            aviso.classList.add("saliendo");
            window.setTimeout(() => aviso.remove(), 260);
        };
        const temporizador = window.setTimeout(quitar, duracion);
        aviso.addEventListener("click", () => {
            window.clearTimeout(temporizador);
            quitar();
        });
        return aviso;
    }

    function crearOverlay(clase = "") {
        const overlay = document.createElement("div");
        overlay.className = `gy-overlay ${clase}`.trim();
        anfitrion().appendChild(overlay);
        return overlay;
    }

    function confirmar(texto, opciones = {}) {
        const {
            titulo = "Confirmar",
            aceptar = "Aceptar",
            cancelar = "Cancelar",
            peligro = false,
            soloAviso = false
        } = opciones;

        return new Promise(resolver => {
            const overlay = crearOverlay();
            const dialogo = document.createElement("div");
            dialogo.className = "gy-dialogo";
            dialogo.setAttribute("role", "alertdialog");
            dialogo.setAttribute("aria-modal", "true");

            const h = document.createElement("h3");
            h.textContent = titulo;
            const p = document.createElement("p");
            p.textContent = texto;
            const acciones = document.createElement("div");
            acciones.className = "gy-acciones";

            const botonOk = document.createElement("button");
            botonOk.type = "button";
            botonOk.className = `gy-aceptar${peligro ? " peligro" : ""}`;
            botonOk.textContent = aceptar;

            if (!soloAviso) {
                const botonCancelar = document.createElement("button");
                botonCancelar.type = "button";
                botonCancelar.textContent = cancelar;
                botonCancelar.addEventListener("click", () => cerrar(false));
                acciones.appendChild(botonCancelar);
            }
            acciones.appendChild(botonOk);
            dialogo.append(h, p, acciones);
            overlay.appendChild(dialogo);

            function alTeclado(evento) {
                if (evento.key === "Escape") cerrar(false);
            }
            function cerrar(valor) {
                document.removeEventListener("keydown", alTeclado);
                overlay.remove();
                resolver(valor);
            }

            botonOk.addEventListener("click", () => cerrar(true));
            overlay.addEventListener("click", evento => {
                if (evento.target === overlay) cerrar(false);
            });
            document.addEventListener("keydown", alTeclado);
            botonOk.focus();
        });
    }

    function avisar(titulo, texto) {
        return confirmar(texto, { titulo, aceptar: "Entendido", soloAviso: true });
    }

    function hoja(titulo, contenido) {
        const overlay = crearOverlay("hoja");
        const panel = document.createElement("div");
        panel.className = "gy-hoja";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");

        const h = document.createElement("h3");
        h.textContent = titulo;
        const cuerpo = document.createElement("div");
        cuerpo.className = "gy-hoja-cuerpo";
        if (contenido) cuerpo.appendChild(contenido);
        panel.append(h, cuerpo);
        overlay.appendChild(panel);

        function alTeclado(evento) {
            if (evento.key === "Escape") cerrar();
        }
        function cerrar() {
            document.removeEventListener("keydown", alTeclado);
            overlay.remove();
        }
        overlay.addEventListener("click", evento => {
            if (evento.target === overlay) cerrar();
        });
        document.addEventListener("keydown", alTeclado);
        return { cerrar };
    }

    function flash(texto, tipo = "exito") {
        try {
            sessionStorage.setItem(CLAVE_FLASH, JSON.stringify({ texto, tipo }));
        } catch { /* sin almacenamiento: se omite */ }
    }

    document.addEventListener("DOMContentLoaded", () => {
        try {
            const guardado = sessionStorage.getItem(CLAVE_FLASH);
            if (!guardado) return;
            sessionStorage.removeItem(CLAVE_FLASH);
            const { texto, tipo } = JSON.parse(guardado);
            if (texto) toast(texto, tipo);
        } catch { /* ignorar */ }
    });

    window.Gymly = Object.assign(window.Gymly || {}, { toast, confirmar, avisar, hoja, flash });
})();
