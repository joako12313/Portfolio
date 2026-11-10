const API_URL = "http://127.0.0.1:8000";

function obtenerSesion() {
	try {
		return {
			token: localStorage.getItem("gymly_token"),
			usuario: JSON.parse(localStorage.getItem("gymly_usuario") || "null")
		};
	} catch {
		return { token: null, usuario: null };
	}
}

function cerrarSesionLocal() {
	localStorage.removeItem("gymly_token");
	localStorage.removeItem("gymly_usuario");
}

function fechaLocalHoy() {
	const ahora = new Date();
	const diferenciaZona = ahora.getTimezoneOffset() * 60000;
	return new Date(ahora.getTime() - diferenciaZona).toISOString().slice(0, 10);
}

function mostrarFecha(valor) {
	if (!valor) return "-";
	const fecha = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
	return Number.isNaN(fecha.getTime())
		? "-"
		: fecha.toLocaleDateString("es-AR");
}

async function solicitarApi(ruta, token, opciones = {}) {
	const headers = { Authorization: `Bearer ${token}`, ...opciones.headers };
	if (opciones.body) headers["Content-Type"] = "application/json";

	const respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
	const datos = await respuesta.json().catch(() => ({}));
	if (respuesta.status === 401) {
		cerrarSesionLocal();
		window.location.href = "../index.html";
		throw new Error("La sesión venció. Inicia sesión nuevamente.");
	}
	if (!respuesta.ok) {
		throw new Error(datos.detail || "No se pudo completar la solicitud.");
	}
	return datos;
}

function iniciarAdmin(sesion) {
	if (!sesion.token || sesion.usuario?.rol !== "administrador") {
		window.location.href = "../index.html";
		return;
	}

	const formulario = document.getElementById("formPago");
	const selectSocio = document.getElementById("idUsuario");
	const tabla = document.getElementById("tablaPagos");
	const mensaje = document.getElementById("mensajePago");
	const busqueda = document.getElementById("buscarPago");
	const botonCerrar = document.getElementById("btnCerrarSesion");
	const nombreAdmin = document.getElementById("nombreAdministrador");
	let socios = [];
	let pagos = [];

	if (nombreAdmin) nombreAdmin.textContent = sesion.usuario.nombre;
	if (botonCerrar) {
		botonCerrar.addEventListener("click", () => {
			cerrarSesionLocal();
			window.location.href = "../index.html";
		});
	}

	document.getElementById("fechaPago").value = fechaLocalHoy();

	function mostrarMensaje(texto, tipo = "") {
		mensaje.textContent = texto;
		mensaje.dataset.tipo = tipo;
	}

	function renderizarPagos() {
		const consulta = busqueda.value.trim().toLocaleLowerCase("es");
		const sociosPorId = new Map(socios.map((socio) => [socio.id_usuario, socio]));
		const filtrados = pagos.filter((pago) => {
			const socio = sociosPorId.get(pago.id_usuario);
			const nombre = socio ? `${socio.nombre} ${socio.apellido} ${socio.email}` : "";
			return nombre.toLocaleLowerCase("es").includes(consulta);
		});

		tabla.replaceChildren();
		if (!filtrados.length) {
			const fila = tabla.insertRow();
			const celda = fila.insertCell();
			celda.colSpan = 6;
			celda.textContent = "No hay pagos para mostrar.";
			return;
		}

		filtrados.sort((a, b) => String(b.fecha_pago).localeCompare(String(a.fecha_pago)));
		filtrados.forEach((pago) => {
			const socio = sociosPorId.get(pago.id_usuario);
			const fila = tabla.insertRow();
			const valores = [
				socio ? `${socio.nombre} ${socio.apellido}` : `Socio #${pago.id_usuario}`,
				new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(pago.monto)),
				mostrarFecha(pago.fecha_pago),
				mostrarFecha(pago.fecha_vencimiento),
				pago.metodo_pago || "-",
				pago.estado === "aprobado" ? "Registrado" : pago.estado
			];
			valores.forEach((valor) => {
				fila.insertCell().textContent = valor;
			});
		});
	}

	async function cargarDatos() {
		try {
			const [listaSocios, listaPagos] = await Promise.all([
				solicitarApi("/usuarios", sesion.token),
				solicitarApi("/pagos", sesion.token)
			]);
			socios = listaSocios.filter((socio) => socio.rol === "usuario");
			pagos = listaPagos;
			selectSocio.replaceChildren(new Option("Selecciona un socio", ""));
			socios.forEach((socio) => {
				selectSocio.add(new Option(
					`${socio.nombre} ${socio.apellido} (#${socio.id_usuario})`,
					socio.id_usuario
				));
			});
			renderizarPagos();
		} catch (error) {
			mostrarMensaje(error.message, "error");
			tabla.replaceChildren();
			const fila = tabla.insertRow();
			const celda = fila.insertCell();
			celda.colSpan = 6;
			celda.textContent = "No se pudieron cargar los pagos.";
		}
	}

	busqueda.addEventListener("input", renderizarPagos);
	formulario.addEventListener("submit", async (evento) => {
		evento.preventDefault();
		mostrarMensaje("");
		const datos = {
			id_usuario: Number(selectSocio.value),
			monto: Number(document.getElementById("monto").value),
			fecha_pago: document.getElementById("fechaPago").value,
			fecha_vencimiento: document.getElementById("fechaVencimiento").value,
			estado: "aprobado",
			metodo_pago: document.getElementById("metodoPago").value
		};

		try {
			await solicitarApi("/pagos", sesion.token, {
				method: "POST",
				body: JSON.stringify(datos)
			});
			formulario.reset();
			document.getElementById("fechaPago").value = fechaLocalHoy();
			mostrarMensaje("Pago registrado y vencimiento actualizado.", "exito");
			await cargarDatos();
		} catch (error) {
			mostrarMensaje(error.message, "error");
		}
	});

	cargarDatos();
}

function iniciarConsultaSocio(sesion) {
	if (!sesion.token || sesion.usuario?.rol !== "usuario") {
		window.location.href = "../index.html";
		return;
	}

	const estado = document.getElementById("estadoCuota");
	const detalle = document.getElementById("detalleCuota");
	const fecha = document.getElementById("fechaCuota");
	const error = document.getElementById("errorCuota");

	solicitarApi(`/pagos/usuario/${sesion.usuario.id_usuario}/estado`, sesion.token)
		.then((datos) => {
			const panel = document.querySelector(".estado-cuota");
			if (!datos.configurado) {
				estado.textContent = "Sin vencimiento registrado";
				detalle.textContent = "Consulta en recepción si ya realizaste tu pago presencial.";
				fecha.textContent = "";
				panel.dataset.estado = "sin-configurar";
				return;
			}

			panel.dataset.estado = datos.al_dia ? "vigente" : "vencido";
			estado.textContent = datos.al_dia ? "Mensualidad vigente" : "Mensualidad vencida";
			detalle.textContent = datos.al_dia
				? datos.dias_restantes === 0
					? "Vence hoy."
					: `Faltan ${datos.dias_restantes} ${datos.dias_restantes === 1 ? "día" : "días"} para el vencimiento.`
				: `Venció hace ${datos.dias_vencido} ${datos.dias_vencido === 1 ? "día" : "días"}.`;
			fecha.textContent = `Fecha de vencimiento: ${mostrarFecha(datos.fecha_vencimiento)}`;
		})
		.catch((requestError) => {
			estado.textContent = "No disponible";
			error.textContent = requestError.message;
		});
}

document.addEventListener("DOMContentLoaded", () => {
	const sesion = obtenerSesion();
	if (document.getElementById("formPago")) {
		iniciarAdmin(sesion);
	} else if (document.getElementById("estadoCuota")) {
		iniciarConsultaSocio(sesion);
	}
});
