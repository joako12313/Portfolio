document.addEventListener("DOMContentLoaded", () => {
	const form = document.getElementById("recoveryForm");
	const message = document.getElementById("recoveryMessage");

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		message.hidden = true;
		const submitButton = form.querySelector("button[type='submit']");
		submitButton.disabled = true;

		try {
			const response = await fetch("http://127.0.0.1:8000/password/forgot", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: document.getElementById("recoveryEmail").value.trim()
				})
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.detail || "No se pudo enviar la solicitud.");
			message.textContent = data.mensaje;
			message.className = "success-message";
		} catch (requestError) {
			message.textContent = requestError.message || "No se pudo conectar con Gymly API.";
			message.className = "error-message";
		} finally {
			message.hidden = false;
			submitButton.disabled = false;
		}
	});
});
