/* =========================================================
   GYMLY - MODO DEMO (portfolio)
   Simula la API FastAPI con datos ficticios guardados en
   localStorage. Intercepta fetch() hacia http://127.0.0.1:8000
   para que el frontend original funcione sin backend ni BD.
   ========================================================= */
(function () {
    "use strict";
    const API = "http://127.0.0.1:8000", KEY = "gymly_demo_db_v1", PASS = "demo1234";
    const dia = n => { const t = new Date(); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
    const ahora = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 19);

    function seed() {
        const U = (id, nombre, apellido, email, rol, extra = {}) => ({
            id_usuario: id, nombre, apellido, email, rol, contrasena: PASS, dni: `30.000.${String(id).padStart(3, "0")}`,
            telefono: `+54 11 5555-01${String(id).padStart(2, "0")}`, fecha_nacimiento: "1995-04-12",
            dias_asistencia: 3, activo: true, motivo_suspension: null, ...extra });
        const usuarios = [
            U(1, "Carla", "Admin", "admin@gymly.demo", "administrador", { dias_asistencia: null }),
            U(2, "Martín", "Entrenador", "entrenador@gymly.demo", "entrenador", { dias_asistencia: null }),
            U(3, "Lucía", "Socia", "socio@gymly.demo", "usuario", { dias_asistencia: 4 }),
            U(4, "Joaquín", "Pérez", "joaquin@gymly.demo", "usuario"),
            U(5, "Sofía", "Gómez", "sofia@gymly.demo", "usuario", { dias_asistencia: 5 }),
            U(6, "Tomás", "Rivas", "tomas@gymly.demo", "usuario", { dias_asistencia: 2, activo: false, motivo_suspension: "Cuota vencida" }),
            U(7, "Valentina", "Díaz", "valentina@gymly.demo", "usuario")
        ];
        const E = (id, nombre, musculo_principal, series, repeticiones, descripcion) =>
            ({ id_ejercicio: id, nombre, descripcion, musculo_principal, series, repeticiones, imagen: null, video: null });
        const ejercicios = [
            E(1, "Sentadilla con barra", "Piernas", 4, "8-10", "Barra apoyada en trapecios, descenso controlado hasta paralelo."),
            E(2, "Press de banca", "Pecho", 4, "8-10", "Agarre medio, escápulas retraídas y pies firmes."),
            E(3, "Peso muerto", "Espalda baja", 3, "6-8", "Espalda neutra, la barra sube pegada al cuerpo."),
            E(4, "Dominadas", "Espalda", 4, "6-10", "Agarre prono, pecho hacia la barra."),
            E(5, "Press militar", "Hombros", 3, "8-12", "De pie, core activo, sin arquear la espalda."),
            E(6, "Remo con barra", "Espalda", 4, "10-12", "Torso inclinado a 45°, codos pegados."),
            E(7, "Hip thrust", "Glúteos", 4, "10-12", "Pausa de un segundo arriba."),
            E(8, "Curl de bíceps", "Bíceps", 3, "10-12", "Sin balanceo, control en la bajada."),
            E(9, "Fondos en paralelas", "Tríceps", 3, "8-12", "Torso levemente inclinado hacia adelante."),
            E(10, "Plancha", "Core", 3, "45 s", "Cuerpo alineado, glúteos y abdomen activos.")
        ];
        const R = (id, id_usuario, nombre, objetivo, dia_semana) => ({ id_rutina: id, id_usuario, id_entrenador: 2, nombre, objetivo,
            descripcion: "Rutina de demostración.", fecha_creacion: dia(-40), activa: 1, dia_semana });
        const rutinas = [
            R(1, 3, "Pecho y tríceps", "Hipertrofia", "lunes"), R(2, 3, "Piernas y glúteos", "Fuerza", "miercoles"),
            R(3, 3, "Espalda y bíceps", "Hipertrofia", "viernes"), R(4, 4, "Full body", "Acondicionamiento", "martes"),
            R(5, 5, "Tren inferior", "Fuerza", "jueves")
        ];
        const RE = (r, e, orden, series, repeticiones, peso) => ({ id_rutina: r, id_ejercicio: e, orden, series, repeticiones, peso });
        const rutina_ejercicios = [
            RE(1, 2, 1, 4, 10, 50), RE(1, 5, 2, 3, 10, 30), RE(1, 9, 3, 3, 12, 0),
            RE(2, 1, 1, 4, 8, 70), RE(2, 7, 2, 4, 12, 60), RE(2, 10, 3, 3, 45, 0),
            RE(3, 4, 1, 4, 8, 0), RE(3, 6, 2, 4, 10, 45), RE(3, 8, 3, 3, 12, 15),
            RE(4, 1, 1, 3, 10, 40), RE(4, 2, 2, 3, 10, 35), RE(4, 6, 3, 3, 10, 30), RE(5, 1, 1, 4, 8, 55), RE(5, 3, 2, 3, 6, 80)
        ];
        const registros = []; let rid = 1;
        rutinas.filter(r => r.id_usuario === 3).forEach((r, i) => {
            for (let w = 0; w < 6; w++) rutina_ejercicios.filter(x => x.id_rutina === r.id_rutina).forEach(x => registros.push({
                id_registro: rid++, id_usuario: 3, id_rutina: r.id_rutina, id_ejercicio: x.id_ejercicio, fecha: ahora(-(40 - w * 6 - i * 2)),
                peso: x.peso ? x.peso + w * 2.5 : 0, repeticiones: x.repeticiones, series: x.series, observaciones: w === 5 ? "Buena sesión" : null }));
        });
        const P = (id, u, monto, pago, venc, metodo = "Efectivo") => ({ id_pago: id, id_usuario: u, monto, fecha_pago: pago, fecha_vencimiento: venc, estado: "aprobado", metodo_pago: metodo });
        const pagos = [P(1, 3, 25000, dia(-20), dia(10)), P(2, 3, 25000, dia(-50), dia(-20)), P(3, 4, 25000, dia(-5), dia(25), "Transferencia"),
            P(4, 5, 25000, dia(-12), dia(18)), P(5, 6, 25000, dia(-60), dia(-30)), P(6, 7, 25000, dia(-2), dia(28), "Tarjeta")];
        const h = (a, c) => ({ apertura: a, cierre: c });
        const gym = { id_gimnasio: 1, nombre: "Gymly Fitness Club", direccion: "Av. Demo 1234, Buenos Aires", telefono: "+54 11 5555-0100",
            horario_apertura: "07:00:00", horario_cierre: "22:00:00",
            horarios: { lunes: h("07:00:00", "22:00:00"), martes: h("07:00:00", "22:00:00"), miercoles: h("07:00:00", "22:00:00"),
                jueves: h("07:00:00", "22:00:00"), viernes: h("07:00:00", "21:00:00"), sabado: h("09:00:00", "14:00:00"), domingo: null } };
        const M = (id, emisor, texto, n) => { const e = usuarios.find(x => x.id_usuario === emisor);
            return { id_mensaje: id, usuario_id: 3, emisor_id: emisor, emisor_nombre: `${e.nombre} ${e.apellido}`, emisor_rol: e.rol, contenido: texto, fecha_creacion: ahora(n) }; };
        const mensajes = [M(1, 3, "Hola! ¿Puedo cambiar mi rutina del viernes?", -2), M(2, 1, "¡Hola Lucía! Claro, hablalo con Martín y la ajustamos.", -1.9)];
        const notificaciones = [{ id_notificacion: 1, id_usuario: 3, titulo: "Cuota próxima a vencer", mensaje: "Tu cuota vence en 10 días.", tipo: "pago", fecha_creacion: ahora(-1), leida: false }];
        return { usuarios, ejercicios, rutinas, rutina_ejercicios, registros, pagos, gym, mensajes, notificaciones, seq: 100 };
    }

    let db; try { db = JSON.parse(localStorage.getItem(KEY)); } catch (_) { db = null; }
    if (!db) db = seed();
    const save = () => localStorage.setItem(KEY, JSON.stringify(db));
    const nid = () => ++db.seq;
    const err = (s, d) => { throw { s, d }; };
    const pub = u => { const { contrasena, ...r } = u; return r; };
    const por = (arr, k, id) => arr.find(x => x[k] === +id) || err(404, "No encontrado");
    const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

    const rutas = [
        ["GET", /^\/$/, () => ({ mensaje: "Gymly API (modo demo)" })],
        ["GET", /^\/health$/, () => ({ status: "ok", modo: "demo" })],
        ["POST", /^\/login$/, c => {
            const u = db.usuarios.find(x => x.email === (c.b.email || "").trim().toLowerCase().replace(/\s/g, "") || x.email === c.b.email);
            if (!u || u.contrasena !== c.b.contrasena) err(401, "Email o contraseña incorrectos");
            if (!u.activo) err(403, "Tu cuenta está suspendida. Contactá al administrador.");
            return { mensaje: "Inicio de sesión correcto", access_token: `demo-${u.id_usuario}`, token_type: "bearer", ...pub(u) };
        }],
        ["POST", /^\/password\/forgot$/, () => ({ mensaje: "Modo demo: no se envían correos reales." })],
        ["POST", /^\/password\/reset$/, () => ({ mensaje: "Contraseña actualizada (modo demo)." })],

        ["GET", /^\/usuarios$/, () => db.usuarios.map(pub)],
        ["GET", /^\/entrenador\/usuarios$/, () => db.usuarios.filter(u => u.rol === "usuario").map(pub)],
        ["POST", /^\/usuarios$/, c => {
            if (db.usuarios.some(u => u.email === c.b.email)) err(400, "El email ya está registrado");
            const u = { id_usuario: nid(), activo: true, motivo_suspension: null, rol: "usuario", ...c.b };
            db.usuarios.push(u); return pub(u);
        }],
        ["GET", /^\/usuarios\/(\d+)\/rutinas-completas$/, c => db.rutinas.filter(r => r.id_usuario === +c.m[1]).map(r => ({
            ...r, ejercicios: db.rutina_ejercicios.filter(x => x.id_rutina === r.id_rutina).sort((a, b) => a.orden - b.orden).map(x => {
                const e = por(db.ejercicios, "id_ejercicio", x.id_ejercicio);
                return { id_ejercicio: e.id_ejercicio, nombre: e.nombre, descripcion: e.descripcion, musculo_principal: e.musculo_principal, series: x.series, repeticiones: x.repeticiones, peso: x.peso };
            }) }))],
        ["GET", /^\/usuarios\/(\d+)\/rutinas$/, c => db.rutinas.filter(r => r.id_usuario === +c.m[1])],
        ["PUT", /^\/usuarios\/(\d+)\/perfil$/, c => { const u = por(db.usuarios, "id_usuario", c.m[1]); u.nombre = c.b.nombre; u.apellido = c.b.apellido; return pub(u); }],
        ["PATCH", /^\/usuarios\/(\d+)\/estado$/, c => { const u = por(db.usuarios, "id_usuario", c.m[1]);
            u.activo = c.b.activo; u.motivo_suspension = c.b.activo ? null : (c.b.motivo_suspension || null); return pub(u); }],
        ["GET", /^\/usuarios\/(\d+)$/, c => pub(por(db.usuarios, "id_usuario", c.m[1]))],
        ["PUT", /^\/usuarios\/(\d+)$/, c => { const u = por(db.usuarios, "id_usuario", c.m[1]);
            if (db.usuarios.some(x => x.email === c.b.email && x !== u)) err(400, "El email ya está registrado");
            Object.assign(u, c.b); return pub(u); }],
        ["DELETE", /^\/usuarios\/(\d+)$/, c => { const id = +c.m[1]; por(db.usuarios, "id_usuario", id);
            if (id === c.u.id_usuario) err(400, "No podés eliminar tu propia cuenta");
            const rs = db.rutinas.filter(r => r.id_usuario === id).map(r => r.id_rutina);
            db.usuarios = db.usuarios.filter(u => u.id_usuario !== id); db.rutinas = db.rutinas.filter(r => r.id_usuario !== id);
            db.rutina_ejercicios = db.rutina_ejercicios.filter(x => !rs.includes(x.id_rutina));
            db.registros = db.registros.filter(x => x.id_usuario !== id); db.pagos = db.pagos.filter(p => p.id_usuario !== id);
            db.mensajes = db.mensajes.filter(m => m.usuario_id !== id); return { mensaje: "Usuario eliminado" }; }],

        ["GET", /^\/rutinas$/, c => c.u.rol === "administrador" ? db.rutinas : c.u.rol === "entrenador" ? db.rutinas.filter(r => r.id_entrenador === c.u.id_usuario) : db.rutinas.filter(r => r.id_usuario === c.u.id_usuario)],
        ["POST", /^\/rutinas$/, c => {
            const dsem = c.b.dia_semana ? c.b.dia_semana.trim().toLowerCase() : null;
            if (dsem && !DIAS.includes(dsem)) err(422, "El día de la semana no es válido.");
            if (dsem && db.rutinas.some(r => r.id_usuario === c.b.id_usuario && r.dia_semana === dsem && r.activa)) err(400, "El socio ya tiene una rutina activa para ese día.");
            const r = { activa: 1, ...c.b, dia_semana: dsem, id_rutina: nid(), id_entrenador: c.b.id_entrenador ?? (c.u.rol === "entrenador" ? c.u.id_usuario : null), fecha_creacion: dia(0) };
            db.rutinas.push(r); return r; }],
        ["GET", /^\/rutinas\/(\d+)\/detalle$/, c => db.rutina_ejercicios.filter(x => x.id_rutina === +c.m[1]).sort((a, b) => a.orden - b.orden).map(x => {
            const e = por(db.ejercicios, "id_ejercicio", x.id_ejercicio);
            return { id_ejercicio: e.id_ejercicio, nombre: e.nombre, descripcion: e.descripcion, musculo_principal: e.musculo_principal, imagen: e.imagen, video: e.video, series: x.series, repeticiones: x.repeticiones, peso: x.peso }; })],
        ["GET", /^\/rutinas\/(\d+)\/ejercicios$/, c => db.rutina_ejercicios.filter(x => x.id_rutina === +c.m[1])],
        ["GET", /^\/rutinas\/(\d+)$/, c => por(db.rutinas, "id_rutina", c.m[1])],
        ["PUT", /^\/rutinas\/(\d+)$/, c => Object.assign(por(db.rutinas, "id_rutina", c.m[1]), c.b)],
        ["DELETE", /^\/rutinas\/(\d+)$/, c => { por(db.rutinas, "id_rutina", c.m[1]); db.rutinas = db.rutinas.filter(r => r.id_rutina !== +c.m[1]);
            db.rutina_ejercicios = db.rutina_ejercicios.filter(x => x.id_rutina !== +c.m[1]); return { mensaje: "Rutina eliminada" }; }],

        ["GET", /^\/ejercicios$/, () => db.ejercicios],
        ["POST", /^\/ejercicios$/, c => { const e = { imagen: null, video: null, ...c.b, id_ejercicio: nid() }; db.ejercicios.push(e); return e; }],
        ["PUT", /^\/ejercicios\/(\d+)$/, c => Object.assign(por(db.ejercicios, "id_ejercicio", c.m[1]), c.b)],
        ["DELETE", /^\/ejercicios\/(\d+)$/, c => { const id = +c.m[1]; por(db.ejercicios, "id_ejercicio", id);
            if (db.rutina_ejercicios.some(x => x.id_ejercicio === id) || db.registros.some(x => x.id_ejercicio === id)) err(400, "No se puede eliminar un ejercicio incluido en rutinas o con historial.");
            db.ejercicios = db.ejercicios.filter(e => e.id_ejercicio !== id); return { mensaje: "Ejercicio eliminado" }; }],
        ["GET", /^\/rutina-ejercicios$/, () => db.rutina_ejercicios],
        ["POST", /^\/rutina-ejercicios$/, c => { let x = db.rutina_ejercicios.find(y => y.id_rutina === c.b.id_rutina && y.id_ejercicio === c.b.id_ejercicio);
            if (x) return Object.assign(x, c.b);
            x = { orden: db.rutina_ejercicios.filter(y => y.id_rutina === c.b.id_rutina).length + 1, ...c.b }; db.rutina_ejercicios.push(x); return x; }],
        ["DELETE", /^\/rutina-ejercicios\/(\d+)\/(\d+)$/, c => { db.rutina_ejercicios = db.rutina_ejercicios.filter(x => !(x.id_rutina === +c.m[1] && x.id_ejercicio === +c.m[2])); return { mensaje: "Ejercicio quitado de la rutina" }; }],

        ["GET", /^\/registro-entrenamiento$/, c => c.u.rol === "administrador" ? db.registros : db.registros.filter(r => r.id_usuario === c.u.id_usuario)],
        ["GET", /^\/registro-entrenamiento\/usuario\/(\d+)$/, c => db.registros.filter(r => r.id_usuario === +c.m[1])],
        ["GET", /^\/registro-entrenamiento\/rutina\/(\d+)$/, c => db.registros.filter(r => r.id_rutina === +c.m[1])],
        ["GET", /^\/registro-entrenamiento\/ejercicio\/(\d+)\/evolucion$/, c => db.registros.filter(r => r.id_ejercicio === +c.m[1] && (c.u.rol === "administrador" || r.id_usuario === c.u.id_usuario))
            .sort((a, b) => a.fecha.localeCompare(b.fecha)).map(({ fecha, peso, repeticiones, series }) => ({ fecha, peso, repeticiones, series }))],
        ["GET", /^\/registro-entrenamiento\/ejercicio\/(\d+)$/, c => db.registros.filter(r => r.id_ejercicio === +c.m[1] && (c.u.rol === "administrador" || r.id_usuario === c.u.id_usuario))],
        ["POST", /^\/registro-entrenamiento$/, c => { const r = { observaciones: null, ...c.b, id_registro: nid(), fecha: ahora(0) }; db.registros.push(r); return r; }],
        ["PUT", /^\/registro-entrenamiento\/(\d+)$/, c => Object.assign(por(db.registros, "id_registro", c.m[1]), c.b)],
        ["DELETE", /^\/registro-entrenamiento\/(\d+)$/, c => { db.registros = db.registros.filter(r => r.id_registro !== +c.m[1]); return { mensaje: "Registro eliminado" }; }],

        ["GET", /^\/gimnasio$/, () => db.gym],
        ["POST", /^\/gimnasio$/, c => Object.assign(db.gym, c.b)],
        ["PUT", /^\/gimnasio$/, c => { const { horarios, ...resto } = c.b; Object.assign(db.gym, resto); if (horarios) Object.assign(db.gym.horarios, horarios); return db.gym; }],

        ["GET", /^\/pagos$/, () => db.pagos],
        ["POST", /^\/pagos$/, c => { const p = { fecha_pago: dia(0), estado: "aprobado", metodo_pago: null, ...c.b, id_pago: nid() }; db.pagos.push(p); return p; }],
        ["GET", /^\/pagos\/usuario\/(\d+)\/estado$/, c => {
            const v = db.pagos.filter(p => p.id_usuario === +c.m[1] && p.estado === "aprobado").map(p => p.fecha_vencimiento).sort().pop();
            if (!v) return { configurado: false, al_dia: false, detalle: "No hay fecha de vencimiento registrada", fecha_vencimiento: null, dias_restantes: null, dias_vencido: null };
            const n = Math.round((new Date(v) - new Date(dia(0))) / 864e5);
            return { configurado: true, al_dia: n >= 0, fecha_vencimiento: v, dias_restantes: Math.max(n, 0), dias_vencido: Math.max(-n, 0), estado: n >= 0 ? "vigente" : "vencido" }; }],
        ["GET", /^\/pagos\/usuario\/(\d+)$/, c => db.pagos.filter(p => p.id_usuario === +c.m[1])],
        ["PUT", /^\/pagos\/(\d+)$/, c => Object.assign(por(db.pagos, "id_pago", c.m[1]), c.b)],
        ["DELETE", /^\/pagos\/(\d+)$/, c => { db.pagos = db.pagos.filter(p => p.id_pago !== +c.m[1]); return { mensaje: "Pago eliminado" }; }],

        ["POST", /^\/notificaciones$/, c => { const n = { tipo: "general", ...c.b, id_notificacion: nid(), fecha_creacion: ahora(0), leida: false }; db.notificaciones.push(n); return n; }],
        ["GET", /^\/notificaciones\/usuario\/(\d+)$/, c => db.notificaciones.filter(n => n.id_usuario === +c.m[1]).reverse()],
        ["PUT", /^\/notificaciones\/(\d+)\/leida$/, c => Object.assign(por(db.notificaciones, "id_notificacion", c.m[1]), { leida: true })],
        ["DELETE", /^\/notificaciones\/(\d+)$/, c => { db.notificaciones = db.notificaciones.filter(n => n.id_notificacion !== +c.m[1]); return { mensaje: "Notificación eliminada" }; }],

        ["GET", /^\/chat\/conversaciones$/, () => {
            const ult = {}; db.mensajes.forEach(m => { if (!ult[m.usuario_id] || m.fecha_creacion > ult[m.usuario_id]) ult[m.usuario_id] = m.fecha_creacion; });
            return Object.keys(ult).map(id => { const u = por(db.usuarios, "id_usuario", id);
                return { usuario_id: u.id_usuario, nombre: u.nombre, apellido: u.apellido, email: u.email, ultimo_mensaje: ult[id] }; })
                .sort((a, b) => b.ultimo_mensaje.localeCompare(a.ultimo_mensaje)); }],
        ["GET", /^\/chat\/mensajes$/, c => { const id = c.u.rol === "administrador" ? +c.q.get("usuario_id") : c.u.id_usuario;
            if (!id) err(400, "Seleccioná una conversación");
            return db.mensajes.filter(m => m.usuario_id === id).sort((a, b) => a.fecha_creacion.localeCompare(b.fecha_creacion)); }],
        ["POST", /^\/chat\/mensajes$/, c => {
            const contenido = (c.b.contenido || "").trim(); if (!contenido) err(422, "El mensaje no puede estar vacío");
            const m = { id_mensaje: nid(), usuario_id: c.u.rol === "administrador" ? c.b.usuario_id : c.u.id_usuario, emisor_id: c.u.id_usuario,
                emisor_nombre: `${c.u.nombre} ${c.u.apellido}`, emisor_rol: c.u.rol, contenido, fecha_creacion: ahora(0) };
            db.mensajes.push(m); return m; }]
    ];

    function atender(url, op) {
        const u = new URL(url), metodo = (op.method || "GET").toUpperCase();
        let b = {}; try { b = op.body ? JSON.parse(op.body) : {}; } catch (_) {}
        const auth = (new Headers(op.headers || {}).get("Authorization") || "").replace("Bearer ", "");
        const publico = u.pathname === "/login" || u.pathname.startsWith("/password") || u.pathname === "/health";
        const yo = db.usuarios.find(x => `demo-${x.id_usuario}` === auth);
        if (!yo && !publico) err(401, "Sesión inválida. Volvé a iniciar sesión.");
        for (const [m, re, fn] of rutas) {
            const hit = m === metodo && re.exec(u.pathname);
            if (hit) { const r = fn({ m: hit, b, q: u.searchParams, u: yo }); save(); return r; }
        }
        return err(404, "Endpoint no disponible en el modo demo");
    }

    const fetchReal = window.fetch.bind(window);
    window.fetch = function (input, op = {}) {
        const url = typeof input === "string" ? input : input.url;
        if (!url.startsWith(API)) return fetchReal(input, op);
        let status = 200, data;
        try { data = atender(url, op); } catch (e) { status = e.s || 500; data = { detail: e.d || "Error en modo demo" }; if (!e.s) console.error(e); }
        return new Promise(res => setTimeout(() => res(new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })), 120));
    };

    /* Insignia "Demo" + accesos rápidos en el login */
    document.addEventListener("DOMContentLoaded", () => {
        const css = document.createElement("style");
        css.textContent = ".gd-badge{position:fixed;left:8px;bottom:8px;z-index:99999;font:600 11px system-ui,sans-serif;background:#F2B400;color:#111;padding:5px 9px;border-radius:999px;display:flex;gap:8px;align-items:center;box-shadow:0 2px 8px #0005}.gd-badge button{all:unset;cursor:pointer;text-decoration:underline}" +
            ".gd-box{margin-top:18px;padding:12px;border:1px dashed #F2B400;border-radius:12px;font:13px system-ui,sans-serif;color:#ddd;text-align:center}.gd-box b{color:#F2B400}.gd-box div{display:flex;gap:6px;margin-top:8px;justify-content:center;flex-wrap:wrap}.gd-box button{cursor:pointer;border:0;border-radius:8px;padding:7px 10px;background:#F2B400;color:#111;font-weight:600}";
        document.head.appendChild(css);
        const badge = document.createElement("div"); badge.className = "gd-badge";
        badge.innerHTML = "DEMO · datos ficticios <button type='button'>Restablecer</button>";
        badge.querySelector("button").onclick = () => { ["gymly_token", "gymly_usuario", KEY].forEach(k => localStorage.removeItem(k)); location.href = location.pathname.replace(/(Admin|Usuario|Entrenador)\/[^/]*$/, "") + "index.html"; };
        document.body.appendChild(badge);

        const form = document.getElementById("loginForm"); if (!form) return;
        const box = document.createElement("div"); box.className = "gd-box";
        box.innerHTML = `<b>Modo demo</b> — elegí un rol para entrar (clave: ${PASS})<div></div>`;
        [["Administrador", "admin@gymly.demo"], ["Entrenador", "entrenador@gymly.demo"], ["Socio", "socio@gymly.demo"]].forEach(([n, mail]) => {
            const b = document.createElement("button"); b.type = "button"; b.textContent = n;
            b.onclick = () => { document.getElementById("email").value = mail; document.getElementById("password").value = PASS; form.requestSubmit(); };
            box.querySelector("div").appendChild(b);
        });
        form.after(box);
    });
})();
