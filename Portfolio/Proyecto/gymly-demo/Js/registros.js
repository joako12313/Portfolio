/* =========================================================
   GYMLY - AYUDANTE DE REGISTROS DE ENTRENAMIENTO
   El guardado de un entrenamiento crea un registro por ejercicio,
   cada uno con su propia fecha (con segundos de diferencia).
   Acá se agrupan en "sesiones": registros de la misma rutina
   guardados con menos de 5 minutos de diferencia.
   ========================================================= */
(function () {
    "use strict";

    const VENTANA_MS = 5 * 60 * 1000;

    function marca(registro) {
        const t = registro.fecha ? new Date(registro.fecha).getTime() : NaN;
        return Number.isNaN(t) ? null : t;
    }

    function volumenRegistro(registro) {
        return (Number(registro.peso) || 0) *
            (Number(registro.repeticiones) || 0) *
            (Number(registro.series) || 0);
    }

    function agrupar(registros) {
        const items = registros.map(registro => ({ registro, t: marca(registro) }));
        const sesiones = [];

        items
            .filter(item => item.t !== null)
            .sort((a, b) => (a.registro.id_rutina - b.registro.id_rutina) || (a.t - b.t))
            .reduce((actual, { registro, t }) => {
                if (!actual || actual.id_rutina !== registro.id_rutina || t - actual.fin > VENTANA_MS) {
                    actual = { id: String(t), id_rutina: registro.id_rutina, inicio: t, fin: t, registros: [] };
                    sesiones.push(actual);
                }
                actual.fin = t;
                actual.registros.push(registro);
                return actual;
            }, null);

        items.filter(item => item.t === null).forEach(({ registro }) => {
            sesiones.push({
                id: `r${registro.id_registro}`,
                id_rutina: registro.id_rutina,
                inicio: null,
                fin: null,
                registros: [registro]
            });
        });

        sesiones.forEach(sesion => {
            sesion.volumen = sesion.registros.reduce((suma, r) => suma + volumenRegistro(r), 0);
        });
        return sesiones.sort((a, b) => (b.inicio || 0) - (a.inicio || 0));
    }

    window.GymlyRegistros = { agrupar, volumenRegistro };
})();
