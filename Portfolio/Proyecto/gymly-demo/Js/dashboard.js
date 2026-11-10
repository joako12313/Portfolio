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

    document.getElementById("btnCerrarSesion").addEventListener("click", () => {
        localStorage.removeItem("gymly_token");
        localStorage.removeItem("gymly_usuario");
        window.location.href = "../index.html";
    });
});
