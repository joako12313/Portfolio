(() => {
    const protocolosWeb = new Set(["http:", "https:"]);

    function obtenerUrlWeb(valor) {
        try {
            const url = new URL(valor);
            return protocolosWeb.has(url.protocol) ? url : null;
        } catch {
            return null;
        }
    }

    function obtenerUrlVideoIncrustado(url) {
        if (["www.youtube.com", "youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com", "youtube-nocookie.com"].includes(url.hostname)) {
            const partes = url.pathname.split("/").filter(Boolean);
            const id = url.hostname === "youtu.be"
                ? partes[0]
                : url.searchParams.get("v") || (["embed", "shorts", "live"].includes(partes[0]) ? partes[1] : null);
            return id && /^[\w-]{11}$/.test(id)
                ? `https://www.youtube-nocookie.com/embed/${id}`
                : null;
        }

        if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(url.hostname)) {
            const id = url.pathname.split("/").filter(Boolean).find(parte => /^\d+$/.test(parte));
            return id ? `https://player.vimeo.com/video/${id}` : null;
        }

        return null;
    }

    function crearMedia(ejercicio) {
        const medios = document.createElement("div");
        medios.className = "mediosEjercicio";

        const urlImagen = obtenerUrlWeb(ejercicio.imagen);
        if (urlImagen) {
            const figura = document.createElement("div");
            figura.className = "medioEjercicio";
            const imagen = document.createElement("img");
            imagen.src = urlImagen.href;
            imagen.alt = `Demostración de ${ejercicio.nombre}`;
            imagen.loading = "lazy";
            imagen.decoding = "async";
            imagen.addEventListener("error", () => figura.remove(), { once: true });
            figura.appendChild(imagen);
            medios.appendChild(figura);
        }

        const urlVideo = obtenerUrlWeb(ejercicio.video);
        if (urlVideo) {
            const figura = document.createElement("div");
            figura.className = "medioEjercicio";
            const embedUrl = obtenerUrlVideoIncrustado(urlVideo);
            const esImagenAnimada = /\.(gif|apng)$/i.test(urlVideo.pathname);
            const esArchivoVideo = /\.(mp4|webm|ogg|m4v)$/i.test(urlVideo.pathname);
            if (esImagenAnimada) figura.classList.add("medioEjercicioAnimado");

            if (esImagenAnimada) {
                const imagen = document.createElement("img");
                imagen.src = urlVideo.href;
                imagen.alt = `Demostración de ${ejercicio.nombre}`;
                imagen.loading = "lazy";
                imagen.decoding = "async";
                imagen.addEventListener("error", () => figura.remove(), { once: true });
                figura.appendChild(imagen);
            } else if (embedUrl) {
                const video = document.createElement("iframe");
                video.src = embedUrl;
                video.title = `Video de ${ejercicio.nombre}`;
                video.loading = "lazy";
                video.referrerPolicy = "strict-origin-when-cross-origin";
                video.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                video.allowFullscreen = true;
                figura.appendChild(video);
            } else if (esArchivoVideo) {
                const video = document.createElement("video");
                video.src = urlVideo.href;
                video.controls = true;
                video.preload = "metadata";
                video.setAttribute("aria-label", `Video de ${ejercicio.nombre}`);
                figura.appendChild(video);
            } else {
                const enlace = document.createElement("a");
                enlace.href = urlVideo.href;
                enlace.target = "_blank";
                enlace.rel = "noopener noreferrer";
                enlace.textContent = "Abrir video";
                figura.appendChild(enlace);
            }

            medios.appendChild(figura);
        }

        return medios.childElementCount ? medios : null;
    }

    window.GymlyMediaEjercicio = { crear: crearMedia };
})();
