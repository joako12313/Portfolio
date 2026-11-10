const API_URL_REPORTES = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("gymly_token");
    let sesion = null;
    try {
        sesion = JSON.parse(localStorage.getItem("gymly_usuario") || "null");
    } catch {
        sesion = null;
    }
    if (!token || sesion?.rol !== "administrador") {
        window.location.href = "../index.html";
        return;
    }

    const estado = document.getElementById("estadoReportes");
    const resumen = document.getElementById("resumenReportes");
    const tabla = document.getElementById("tablaUltimosPagos");

    async function api(ruta) {
        const respuesta = await fetch(`${API_URL_REPORTES}${ruta}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("gymly_token")}` }
        });
        const texto = await respuesta.text();
        const datos = texto ? JSON.parse(texto) : {};
        if (respuesta.status === 401 || respuesta.status === 403) {
            localStorage.removeItem("gymly_token");
            localStorage.removeItem("gymly_usuario");
            window.location.href = "../index.html";
            throw new Error("Tu sesión no tiene permisos de administrador.");
        }
        if (!respuesta.ok) throw new Error(datos.detail || "No se pudieron cargar los reportes.");
        return datos;
    }

    function fecha(valor) {
        if (!valor) return "—";
        const fechaPago = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
        return Number.isNaN(fechaPago.getTime()) ? "—" : fechaPago.toLocaleDateString("es-AR");
    }

    function tarjeta(titulo, valor, detalle) {
        const articulo = document.createElement("article");
        articulo.className = "resumen-reporte";
        const heading = document.createElement("h2");
        heading.textContent = titulo;
        const numero = document.createElement("strong");
        numero.textContent = valor;
        const texto = document.createElement("p");
        texto.textContent = detalle;
        articulo.append(heading, numero, texto);
        return articulo;
    }

    async function cargar() {
        estado.textContent = "Cargando reportes...";
        estado.dataset.tipo = "";
        try {
            const [usuarios, pagos, entrenamientos, rutinas] = await Promise.all([
                api("/usuarios"),
                api("/pagos"),
                api("/registro-entrenamiento"),
                api("/rutinas")
            ]);
            const socios = usuarios.filter(usuario => usuario.rol === "usuario");
            const entrenadores = usuarios.filter(usuario => usuario.rol === "entrenador");
            const ahora = new Date();
            const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
            const pagosMes = pagos.filter(pago =>
                pago.estado === "aprobado" && String(pago.fecha_pago || "").startsWith(mesActual)
            );
            const totalMes = pagosMes.reduce((suma, pago) => suma + Number(pago.monto || 0), 0);
            const expirados = new Map();
            pagos.filter(pago => pago.estado === "aprobado").forEach(pago => {
                const actual = expirados.get(pago.id_usuario);
                if (!actual || String(pago.fecha_vencimiento) > String(actual)) {
                    expirados.set(pago.id_usuario, pago.fecha_vencimiento);
                }
            });
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const cuotasVencidas = [...expirados.values()].filter(vencimiento =>
                vencimiento && new Date(`${String(vencimiento).slice(0, 10)}T00:00:00`) < hoy
            ).length;

            resumen.replaceChildren(
                tarjeta("Socios", String(socios.length), "Cuentas con rol de socio"),
                tarjeta("Entrenadores", String(entrenadores.length), "Cuentas con rol de entrenador"),
                tarjeta("Rutinas", String(rutinas.length), "Rutinas asignadas"),
                tarjeta("Entrenamientos", String(entrenamientos.length), "Registros guardados"),
                tarjeta("Pagos este mes", new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS"
                }).format(totalMes), `${pagosMes.length} pagos aprobados registrados`),
                tarjeta("Vencimientos atrasados", String(cuotasVencidas), "Socios con vencimiento aprobado anterior a hoy")
            );

            const nombres = new Map(usuarios.map(usuario => [
                usuario.id_usuario,
                `${usuario.nombre} ${usuario.apellido}`
            ]));
            tabla.replaceChildren();
            [...pagos]
                .sort((a, b) => String(b.fecha_pago || "").localeCompare(String(a.fecha_pago || "")))
                .slice(0, 10)
                .forEach(pago => {
                    const fila = tabla.insertRow();
                    [
                        nombres.get(pago.id_usuario) || `Socio #${pago.id_usuario}`,
                        fecha(pago.fecha_pago),
                        fecha(pago.fecha_vencimiento),
                        new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(pago.monto)),
                        pago.estado === "aprobado" ? "Registrado" : pago.estado
                    ].forEach(valor => {
                        fila.insertCell().textContent = valor;
                    });
                });
            if (!pagos.length) {
                const fila = tabla.insertRow();
                const celda = fila.insertCell();
                celda.colSpan = 5;
                celda.textContent = "Todavía no hay pagos registrados.";
            }
            estado.textContent = "Reportes actualizados.";
        } catch (error) {
            estado.textContent = error.message;
            estado.dataset.tipo = "error";
            resumen.replaceChildren();
            tabla.replaceChildren();
        }
    }

    document.getElementById("btnActualizarReportes").addEventListener("click", cargar);
    cargar();
});
