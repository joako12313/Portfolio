document.addEventListener("DOMContentLoaded", () => {
	const form = document.getElementById("resetForm");
	const message = document.getElementById("resetMessage");
	const token = new URLSearchParams(window.location.search).get("token");

	if (!token) {
		message.textContent = "El enlace no es válido. Solicita uno nuevo desde el inicio de sesión.";
		message.className = "error-message";
		message.hidden = false;
		return;
	}
	form.hidden = false;

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		message.hidden = true;
		const password = document.getElementById("newPassword").value;
		const confirmPassword = document.getElementById("confirmPassword").value;
		if (password !== confirmPassword) {
			message.textContent = "Las contraseñas no coinciden.";
			message.className = "error-message";
			message.hidden = false;
			return;
		}

		const submitButton = form.querySelector("button[type='submit']");
		submitButton.disabled = true;
		try {
			const response = await fetch("http://127.0.0.1:8000/password/reset", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, contrasena: password })
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.detail || "No se pudo cambiar la contraseña.");
			message.textContent = data.mensaje;
			message.className = "success-message";
			form.hidden = true;
		} catch (requestError) {
			message.textContent = requestError.message || "No se pudo conectar con Gymly API.";
			message.className = "error-message";
		} finally {
			message.hidden = false;
			submitButton.disabled = false;
		}
	});
});
