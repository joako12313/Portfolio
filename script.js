const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const animations = new WeakMap();
const themeToggle = document.querySelector(".theme-toggle");
const themeIcon = themeToggle.querySelector(".theme-icon");
const themeLabel = themeToggle.querySelector(".theme-label");

function setTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", `Cambiar a tema ${isDark ? "claro" : "oscuro"}`);
    themeIcon.textContent = isDark ? "☀" : "☾";
    themeLabel.textContent = isDark ? "Tema claro" : "Tema oscuro";
    localStorage.setItem("portfolio-theme", theme);
}

const savedTheme = localStorage.getItem("portfolio-theme");
setTheme(savedTheme === "dark" ? "dark" : "light");

themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
});

function animateHover(element, properties) {
    if (reduceMotion) {
        Object.assign(element.style, properties);
        return;
    }

    const currentStyles = getComputedStyle(element);
    const start = {};
    for (const [property, value] of Object.entries(properties)) {
        start[property] = currentStyles[property];
    }

    animations.get(element)?.cancel();
    const animation = element.animate([start, properties], {
        duration: 220,
        easing: "ease-out",
        fill: "forwards"
    });
    animations.set(element, animation);
}

document.querySelectorAll(".card").forEach((card) => {
    const button = card.querySelector(".btn");

    card.addEventListener("pointerenter", () => {
        const styles = getComputedStyle(document.documentElement);
        animateHover(card, {
            transform: "translateY(-4px)",
            borderColor: styles.getPropertyValue("--card-border-hover").trim()
        });
    });

    card.addEventListener("pointerleave", () => {
        const styles = getComputedStyle(document.documentElement);
        animateHover(card, {
            transform: "translateY(0)",
            borderColor: styles.getPropertyValue("--card-border").trim()
        });
    });

    button.addEventListener("pointerenter", () => {
        const color = getComputedStyle(document.documentElement)
            .getPropertyValue("--button-hover-bg").trim();
        animateHover(button, { backgroundColor: color });
    });

    button.addEventListener("pointerleave", () => {
        const color = getComputedStyle(document.documentElement)
            .getPropertyValue("--button-bg").trim();
        animateHover(button, { backgroundColor: color });
    });
});
