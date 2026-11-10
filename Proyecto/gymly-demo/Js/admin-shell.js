/* GYMLY - Barra lateral del panel: datos de la sesión y cierre de sesión */
document.addEventListener("DOMContentLoaded", () => {
    let usuario = null;
    try { usuario = JSON.parse(localStorage.getItem("gymly_usuario") || "null"); } catch {}

    if (usuario) {
        const nombre = `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();
        const iniciales = `${(usuario.nombre || "")[0] || ""}${(usuario.apellido || "")[0] || ""}`.toUpperCase();
        const elNombre = document.getElementById("sideNombre");
        const elAvatar = document.getElementById("sideAvatar");
        if (elNombre && nombre) elNombre.textContent = nombre;
        if (elAvatar) elAvatar.textContent = iniciales || "G";
    }

    const salir = document.getElementById("btnCerrarSesion");
    if (salir) {
        salir.addEventListener("click", () => {
            localStorage.removeItem("gymly_token");
            localStorage.removeItem("gymly_usuario");
            window.location.href = "../index.html";
        });
    }
});
