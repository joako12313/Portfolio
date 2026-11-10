document.addEventListener("DOMContentLoaded", () => {
	const form = document.getElementById("loginForm");
	const error = document.getElementById("loginError");
	if (!form) return;

	// Mostrar / ocultar contraseña
	const passwordInput = document.getElementById("password");
	const toggleButton = document.getElementById("togglePassword");
	if (passwordInput && toggleButton && !toggleButton.dataset.bound) {
		toggleButton.dataset.bound = "1";
		toggleButton.addEventListener("click", () => {
			const show = passwordInput.type === "password";
			passwordInput.type = show ? "text" : "password";
			toggleButton.setAttribute("aria-pressed", String(show));
			toggleButton.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
		});
	}

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		error.hidden = true;

		const submitButton = form.querySelector("button[type='submit']");
		submitButton.disabled = true;

		try {
			const response = await fetch("http://127.0.0.1:8000/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: document.getElementById("email").value.trim(),
					contrasena: document.getElementById("password").value
				})
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.detail || "No se pudo iniciar sesión.");

			localStorage.setItem("gymly_token", data.access_token);
			localStorage.setItem("gymly_usuario", JSON.stringify({
				id_usuario: data.id_usuario,
				nombre: data.nombre,
				apellido: data.apellido,
				email: data.email,
				rol: data.rol,
				activo: data.activo,
				motivo_suspension: data.motivo_suspension
			}));

			window.location.href = data.rol === "administrador"
				? "Admin/dashboard.html"
				: "Usuario/inicio.html";
		} catch (requestError) {
			error.textContent = requestError.message || "No se pudo conectar con Gymly API.";
			error.hidden = false;
		} finally {
			submitButton.disabled = false;
		}
	});

});
