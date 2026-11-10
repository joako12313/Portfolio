/* Mostrar / ocultar contraseña: botones .toggle[data-for="idDelInput"] */
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".toggle[data-for]").forEach(boton => {
        const input = document.getElementById(boton.dataset.for);
        if (!input || boton.dataset.bound) return;
        boton.dataset.bound = "1";
        boton.addEventListener("click", () => {
            const mostrar = input.type === "password";
            input.type = mostrar ? "text" : "password";
            boton.setAttribute("aria-pressed", String(mostrar));
            boton.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
        });
    });
});
