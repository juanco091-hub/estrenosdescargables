let CONFIG_VARS = {};

let BD_PELICULAS = [];
let datosFiltrados = [];

let modoVistaActual = "modo1"; // "modo1" = Vista Normal | "modo2" = Vista Compacta
let paginaActual = 1;

const contenedorPrincipal = document.getElementById("contenedor-principal");
const contenedorPaginacion = document.getElementById("contenedor-paginacion");
const searchBarContainer = document.getElementById("search-bar-container");
const inputBuscar = document.getElementById("input-buscar");
const btnLimpiarBusqueda = document.getElementById("btn-limpiar-busqueda");
const btnToggleSearch = document.getElementById("btn-toggle-search");
const mainTitle = document.getElementById("main-title");

const btnModo1 = document.getElementById("btn-modo-1");
const btnModo2 = document.getElementById("btn-modo-2");

const modalDetalles = document.getElementById("modal-detalles");
const modalDetallesContenido = document.getElementById("modal-detalles-contenido");
const btnCerrarModalDetalles = document.getElementById("btn-cerrar-modal-detalles");

// ==========================================
// 1. CONFIGURACIÓN Y TEMATIZACIÓN DINÁMICA
// ==========================================
function aplicarConfiguracion() {
    if (typeof CONFIG_OPCIONES !== "undefined") {
        CONFIG_VARS = CONFIG_OPCIONES;
    }

    const root = document.documentElement;
    const setVar = (cssVar, configKey, defecto) => {
        const val = CONFIG_VARS[configKey] || defecto;
        root.style.setProperty(cssVar, val);
        return val;
    };

    setVar("--config-fondo-body", "COLOR_FONDO_BODY", "#020617");
    setVar("--config-fondo-hf", "COLOR_FONDO_HEADER_FOOTER", "#0f172a");
    setVar("--config-fondo-tarjeta", "COLOR_FONDO_TARJETA", "#0f172a");
    setVar("--config-borde-tarjeta", "COLOR_BORDE_TARJETA", "#1e293b");

    const colorPrimario = setVar("--config-primario", "COLOR_PRIMARIO", "#10b981");
    root.style.setProperty("--config-primario-alpha", hexToRgba(colorPrimario, 0.35));
    setVar("--config-texto-sobre-primario", "COLOR_TEXTO_SOBRE_PRIMARIO", "#022c22");
    setVar("--config-texto-acento", "COLOR_TEXTO_ACENTO", "#34d399");

    const colorBordeBuscador = setVar("--config-borde-buscador", "COLOR_BORDE_BUSCADOR", "#10b981");
    root.style.setProperty("--config-borde-buscador-alpha", hexToRgba(colorBordeBuscador, 0.5));

    setVar("--config-spinner", "COLOR_SPINNER_CARGA", "#10b981");
    setVar("--config-error", "COLOR_TEXTO_ERROR", "#ef4444");

    // Textos configurables
    const elTitulo1 = document.getElementById("titulo-parte-1");
    const elTitulo2 = document.getElementById("titulo-parte-2");
    if (elTitulo1 && CONFIG_VARS.TITULO_PRINCIPAL_1) elTitulo1.textContent = CONFIG_VARS.TITULO_PRINCIPAL_1;
    if (elTitulo2 && CONFIG_VARS.TITULO_PRINCIPAL_2) elTitulo2.textContent = CONFIG_VARS.TITULO_PRINCIPAL_2;

    const elTxtModo1 = document.getElementById("texto-btn-modo-1");
    const elTxtModo2 = document.getElementById("texto-btn-modo-2");
    if (elTxtModo1 && CONFIG_VARS.TEXTO_BOTON_MODO_1) elTxtModo1.textContent = CONFIG_VARS.TEXTO_BOTON_MODO_1;
    if (elTxtModo2 && CONFIG_VARS.TEXTO_BOTON_MODO_2) elTxtModo2.textContent = CONFIG_VARS.TEXTO_BOTON_MODO_2;

    if (inputBuscar && CONFIG_VARS.PLACEHOLDER_BUSCADOR) {
        inputBuscar.placeholder = CONFIG_VARS.PLACEHOLDER_BUSCADOR;
    }

    // WhatsApp dinámico
    const numeroWa = CONFIG_VARS.NUMERO_WHATSAPP || "51983104072";
    const urlWa = `https://wa.me/${numeroWa}`;
    const btnHeaderWa = document.getElementById("btn-header-whatsapp");
    const btnFooterWa = document.getElementById("btn-footer-whatsapp");
    const txtFooterWa = document.getElementById("texto-footer-whatsapp");
    if (btnHeaderWa) btnHeaderWa.href = urlWa;
    if (btnFooterWa) btnFooterWa.href = urlWa;
    if (txtFooterWa && CONFIG_VARS.TEXTO_WHATSAPP_FOOTER) {
        txtFooterWa.textContent = CONFIG_VARS.TEXTO_WHATSAPP_FOOTER;
    }
}

function hexToRgba(hex, alpha) {
    if (!hex || !hex.startsWith("#")) return hex;
    let c = hex.substring(1);
    if (c.length === 3) c = c.split("").map(x => x + x).join("");
    if (c.length !== 6) return hex;
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

// ==========================================
// 2. PARSER CSV Y NORMALIZACIÓN DE COLUMNAS
// ==========================================
function normalizarClave(texto) {
    if (!texto) return "";
    return texto
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ñ/g, "n")
        .replace(/\s+/g, "");
}

function quitarAcentos(texto) {
    if (!texto) return "";
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function parsearCSV(textoCsv) {
    const lineas = textoCsv.split(/\r?\n/);
    if (lineas.length < 3) return [];

    // Fila 1 (índice 0): Encabezados
    const encabezados = dividirLineaCSV(lineas[0]).map(h => normalizarClave(h));
    const resultado = [];

    // Fila 2 (índice 1) se omite (buscador interno de Google Sheets).
    // Los datos reales empiezan en la Fila 3 (índice 2).
    for (let i = 2; i < lineas.length; i++) {
        if (!lineas[i].trim()) continue;

        const valores = dividirLineaCSV(lineas[i]);
        const filaObjeto = {};

        encabezados.forEach((encabezado, indice) => {
            const val = valores[indice] !== undefined ? valores[indice].trim() : "";
            filaObjeto[encabezado] = val.replace(/^"|"$/g, "");
        });

        resultado.push(filaObjeto);
    }
    return resultado;
}

function dividirLineaCSV(linea) {
    const valores = [];
    let dentroDeComillas = false;
    let valorActual = "";

    for (let j = 0; j < linea.length; j++) {
        const caracter = linea[j];
        if (caracter === '"') {
            if (dentroDeComillas && linea[j + 1] === '"') {
                valorActual += '"';
                j++;
            } else {
                dentroDeComillas = !dentroDeComillas;
            }
        } else if (caracter === "," && !dentroDeComillas) {
            valores.push(valorActual);
            valorActual = "";
        } else {
            valorActual += caracter;
        }
    }
    valores.push(valorActual);
    return valores;
}

function obtenerValorColumna(fila, claveConfig) {
    const nombreEncabezado = CONFIG_VARS.COLUMNAS?.[claveConfig] || claveConfig;
    const claveNormalizada = normalizarClave(nombreEncabezado);
    const valor = fila[claveNormalizada] || "";
    return valor.trim() === "---" ? "" : valor.trim();
}

function formatearDuracion(duracionRaw) {
    if (!duracionRaw) return "";
    // Si viene como "01:49:00" desde Google Sheets, lo convierte a "1:49"
    const matchHms = duracionRaw.match(/^0?(\d+):(\d{2}):\d{2}$/);
    if (matchHms) {
        return `${matchHms[1]}:${matchHms[2]}`;
    }
    return duracionRaw;
}

function formatearAno(anoRaw) {
    if (!anoRaw) return "";
    // Evita decimales si viene como "2026.0"
    return anoRaw.replace(/\.0+$/, "");
}

// ==========================================
// 3. ALGORITMO CIRCULAR POR COLUMNA "CONDICIÓN"
// ==========================================
function construirCatalogoCircular(filasCrudas) {
    const maxCatalogo = Number(CONFIG_VARS.LIMITE_MAXIMO_CATALOGO) || 560;
    const txtUmbral = normalizarClave(CONFIG_VARS.CONDICION_UMBRAL || "UMBRAL");
    const txtHabilitado = normalizarClave(CONFIG_VARS.CONDICION_HABILITADO || "HABILITADO");

    const mapaPorNumero = new Map();
    let numeroUmbral = null;
    let mayorNumeroHabilitado = null;

    filasCrudas.forEach((fila) => {
        const codigoStr = obtenerValorColumna(fila, "CODIGO");
        const numCodigo = parseInt(codigoStr, 10);

        if (!isNaN(numCodigo) && numCodigo >= 1 && numCodigo <= maxCatalogo) {
            const condicionRaw = obtenerValorColumna(fila, "CONDICION");
            const condicionNorm = normalizarClave(condicionRaw);

            const esUmbral = condicionNorm === txtUmbral && txtUmbral !== "";
            const esHabilitado = esUmbral || (condicionNorm === txtHabilitado && txtHabilitado !== "");

            // Recopilar pistas de audio (AUDIO 1, AUDIO 2, AUDIO 3)
            const audios = [
                obtenerValorColumna(fila, "AUDIO_1"),
                obtenerValorColumna(fila, "AUDIO_2"),
                obtenerValorColumna(fila, "AUDIO_3")
            ].filter(Boolean);

            // Recopilar subtítulos (SUB 1 a SUB 5)
            const subtitulos = [
                obtenerValorColumna(fila, "SUB_1"),
                obtenerValorColumna(fila, "SUB_2"),
                obtenerValorColumna(fila, "SUB_3"),
                obtenerValorColumna(fila, "SUB_4"),
                obtenerValorColumna(fila, "SUB_5")
            ].filter(Boolean);

            const item = {
                numero: numCodigo,
                codigoFormateado: String(numCodigo).padStart(3, "0"),
                titulo: obtenerValorColumna(fila, "TITULO"),
                ano: formatearAno(obtenerValorColumna(fila, "ANO")),
                pais: obtenerValorColumna(fila, "PAIS"),
                duracion: formatearDuracion(obtenerValorColumna(fila, "DURACION")),
                audios: audios,
                formato: obtenerValorColumna(fila, "FORMATO"),
                resolucion: obtenerValorColumna(fila, "RESOLUCION"),
                fuente: obtenerValorColumna(fila, "FUENTE"),
                tamano: obtenerValorColumna(fila, "TAMANO"),
                tamanoConv: obtenerValorColumna(fila, "TAMANO_CONV"),
                subtitulos: subtitulos,
                esHabilitado: esHabilitado,
                esUmbral: esUmbral
            };

            mapaPorNumero.set(numCodigo, item);

            if (esUmbral) {
                numeroUmbral = numCodigo;
            }
            if (esHabilitado) {
                if (mayorNumeroHabilitado === null || numCodigo > mayorNumeroHabilitado) {
                    mayorNumeroHabilitado = numCodigo;
                }
            }
        }
    });

    // Punto de inicio: la fila con "UMBRAL" (o en su defecto el mayor habilitado si aún no marcaron umbral)
    const pivoteInicio = numeroUmbral !== null ? numeroUmbral : mayorNumeroHabilitado;
    if (pivoteInicio === null) return [];

    // Recorrido circular completo hacia atrás desde pivoteInicio (ej. 194 -> 193 -> ... -> 26 -> 560 -> 559...)
    // Solo incluye los ítems cuya CONDICIÓN sea "HABILITADO" o "UMBRAL".
    const listaOrdenada = [];
    for (let step = 0; step < maxCatalogo; step++) {
        const numActual = ((pivoteInicio - 1 - step) % maxCatalogo + maxCatalogo) % maxCatalogo + 1;
        const registro = mapaPorNumero.get(numActual);

        if (registro && registro.esHabilitado) {
            listaOrdenada.push(registro);
        }
    }

    return listaOrdenada;
}

// ==========================================
// 4. HISTORIAL SPA Y GESTIÓN DE ESTADO
// ==========================================
function obtenerLimitePorPagina() {
    return modoVistaActual === "modo2"
        ? (Number(CONFIG_VARS.ITEMS_POR_PAGINA_MODO_2) || 40)
        : (Number(CONFIG_VARS.ITEMS_POR_PAGINA_MODO_1) || 20);
}

function obtenerEstadoActual() {
    return {
        modo: modoVistaActual,
        pagina: paginaActual,
        textoBusqueda: inputBuscar ? inputBuscar.value : "",
        scrollY: window.scrollY
    };
}

function actualizarEstadoActualSinNavegar() {
    history.replaceState(obtenerEstadoActual(), "", window.location.href);
}

function restaurarEstado(state) {
    if (!state) return;

    modoVistaActual = state.modo || "modo1";
    paginaActual = state.pagina || 1;

    if (inputBuscar) {
        inputBuscar.value = state.textoBusqueda || "";
        if (inputBuscar.value.trim() !== "") {
            searchBarContainer.classList.remove("hidden");
            btnLimpiarBusqueda.classList.remove("hidden");
        } else {
            searchBarContainer.classList.add("hidden");
            btnLimpiarBusqueda.classList.add("hidden");
        }
    }

    actualizarUIBotonesModo();
    aplicarFiltrosYRenderizar();

    const scrollDestino = state.scrollY || 0;
    requestAnimationFrame(() => {
        window.scrollTo(0, scrollDestino);
    });
}

window.addEventListener("popstate", (evento) => {
    document.body.classList.remove("modal-abierto");
    if (modalDetalles) modalDetalles.classList.add("hidden");

    if (evento && evento.state) {
        restaurarEstado(evento.state);
    } else {
        resetearAInicio();
    }
});

// ==========================================
// 5. INICIALIZACIÓN Y EVENTOS
// ==========================================
async function inicializarApp() {
    aplicarConfiguracion();

    contenedorPrincipal.innerHTML = `
        <div class="flex flex-col items-center justify-center py-24 text-center gap-3">
            <div class="w-9 h-9 border-4 rounded-full animate-spin dinamico-spinner"></div>
            <p class="text-xs font-bold text-slate-400 tracking-wide">Cargando catálogo...</p>
        </div>
    `;

    try {
        const urlCsv = CONFIG_VARS.URL_CSV_PELICULAS;
        if (!urlCsv || urlCsv.includes("PEGA_AQUI")) {
            throw new Error("Falta configurar la URL del CSV en config.js");
        }

        const respuesta = await fetch(urlCsv);
        if (!respuesta.ok) throw new Error("No se pudo descargar el CSV");

        const textoCsv = await respuesta.text();
        const filasCrudas = parsearCSV(textoCsv);
        BD_PELICULAS = construirCatalogoCircular(filasCrudas);

        configurarEventos();
        actualizarUIBotonesModo();
        history.replaceState(obtenerEstadoActual(), "", window.location.href);
        aplicarFiltrosYRenderizar();

    } catch (error) {
        console.error("Error al inicializar:", error);
        contenedorPrincipal.innerHTML = `
            <div class="text-center py-20 px-4">
                <p class="font-black text-xs uppercase tracking-wider dinamico-error">❌ Error al cargar el catálogo</p>
                <p class="text-[11px] text-slate-400 mt-1">${error.message}</p>
            </div>
        `;
    }
}

function configurarEventos() {
    // Cambiar a Modo 1 (Vista Normal)
    btnModo1.addEventListener("click", () => {
        if (modoVistaActual === "modo1") return;
        actualizarEstadoActualSinNavegar();
        modoVistaActual = "modo1";
        paginaActual = 1;
        actualizarUIBotonesModo();
        history.pushState(obtenerEstadoActual(), "", `?vista=normal`);
        aplicarFiltrosYRenderizar();
        window.scrollTo(0, 0);
    });

    // Cambiar a Modo 2 (Vista Compacta)
    btnModo2.addEventListener("click", () => {
        if (modoVistaActual === "modo2") return;
        actualizarEstadoActualSinNavegar();
        modoVistaActual = "modo2";
        paginaActual = 1;
        actualizarUIBotonesModo();
        history.pushState(obtenerEstadoActual(), "", `?vista=compacta`);
        aplicarFiltrosYRenderizar();
        window.scrollTo(0, 0);
    });

    // Clic en el título principal -> volver al inicio limpio
    mainTitle.addEventListener("click", () => {
        resetearAInicio();
    });

    // Mostrar/ocultar buscador
    btnToggleSearch.addEventListener("click", () => {
        searchBarContainer.classList.toggle("hidden");
        if (!searchBarContainer.classList.contains("hidden")) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            inputBuscar.focus({ preventScroll: true });
        }
        actualizarEstadoActualSinNavegar();
    });

    // Búsqueda en tiempo real por nombre de película
    inputBuscar.addEventListener("input", () => {
        paginaActual = 1;
        if (inputBuscar.value.trim() !== "") {
            btnLimpiarBusqueda.classList.remove("hidden");
        } else {
            btnLimpiarBusqueda.classList.add("hidden");
        }
        aplicarFiltrosYRenderizar();
        actualizarEstadoActualSinNavegar();
    });

    btnLimpiarBusqueda.addEventListener("click", () => {
        inputBuscar.value = "";
        btnLimpiarBusqueda.classList.add("hidden");
        paginaActual = 1;
        aplicarFiltrosYRenderizar();
        inputBuscar.focus();
        actualizarEstadoActualSinNavegar();
    });

    // Cerrar modal de detalles
    btnCerrarModalDetalles.addEventListener("click", cerrarModalDetalles);
    modalDetalles.addEventListener("click", (e) => {
        if (e.target === modalDetalles) cerrarModalDetalles();
    });

    // Navegación táctil (Swipe horizontal para cambiar de página en móvil)
    let touchStartX = 0;
    let touchStartY = 0;

    contenedorPrincipal.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    contenedorPrincipal.addEventListener("touchend", (e) => {
        const diffX = e.changedTouches[0].screenX - touchStartX;
        const diffY = e.changedTouches[0].screenY - touchStartY;
        const UMBRAL_SWIPE = 60;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > UMBRAL_SWIPE) {
            const limite = obtenerLimitePorPagina();
            const totalPaginas = Math.ceil(datosFiltrados.length / limite);
            if (totalPaginas <= 1) return;

            if (diffX < 0 && paginaActual < totalPaginas) {
                cambiarPagina(paginaActual + 1);
            } else if (diffX > 0 && paginaActual > 1) {
                cambiarPagina(paginaActual - 1);
            }
        }
    }, { passive: true });
}

function resetearAInicio() {
    modoVistaActual = "modo1";
    paginaActual = 1;
    inputBuscar.value = "";
    btnLimpiarBusqueda.classList.add("hidden");
    searchBarContainer.classList.add("hidden");

    document.body.classList.remove("modal-abierto");
    modalDetalles.classList.add("hidden");

    actualizarUIBotonesModo();
    history.pushState(obtenerEstadoActual(), "", window.location.pathname);
    aplicarFiltrosYRenderizar();
    window.scrollTo(0, 0);
}

function actualizarUIBotonesModo() {
    if (modoVistaActual === "modo1") {
        btnModo1.className = "px-4 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 dinamico-modo-activo flex items-center justify-center gap-1.5";
        btnModo2.className = "px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-1.5";
    } else {
        btnModo2.className = "px-4 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 dinamico-modo-activo flex items-center justify-center gap-1.5";
        btnModo1.className = "px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-1.5";
    }
}

// ==========================================
// 6. GENERACIÓN DE PORTADA Y BLOQUE DE FICHA TÉCNICA
// ==========================================
function generarHtmlImagenPortada(peli, clasesExtra = "w-full h-full object-cover transition-transform duration-300") {
    // Si tiene portada en carpeta portadas/ (.jpg, .webp, .png, .jpeg), no muestra el código.
    // Solo si no existe ninguna imagen, muestra la portada genérica con el código del ítem.
    return `
        <img src="portadas/${peli.codigoFormateado}.jpg" 
             alt="${peli.titulo.replace(/"/g, "&quot;")}"
             loading="lazy"
             onerror="this.onerror=()=>{ this.onerror=()=>{ this.onerror=()=>{ this.src='https://placehold.co/400x600/0f172a/34d399?text=${peli.codigoFormateado}'; }; this.src='portadas/${peli.codigoFormateado}.jpeg'; }; this.src='portadas/${peli.codigoFormateado}.png'; }; this.src='portadas/${peli.codigoFormateado}.webp';"
             class="${clasesExtra}">
    `;
}

function construirContenidoVersion(peli, tipoVersion) {
    const etq = CONFIG_VARS.ETIQUETAS || {};
    const cfgLigera = CONFIG_VARS.VERSION_LIGERA || {};

    const esLigera = tipoVersion === "ligera";

    // Audios según versión
    const listaAudios = esLigera
        ? [cfgLigera.AUDIO || "Español Latino AAC 2.0"]
        : (peli.audios.length > 0 ? peli.audios : ["No especificado"]);

    // Video: Formato + Resolución + Fuente
    const formatoBase = esLigera
        ? (cfgLigera.FORMATO_VIDEO || "MP4")
        : peli.formato;

    const resolucionBase = (esLigera && cfgLigera.RESOLUCION_VIDEO && cfgLigera.RESOLUCION_VIDEO.trim() !== "")
        ? cfgLigera.RESOLUCION_VIDEO.trim()
        : peli.resolucion;

    const textoFormatoCompleto = [formatoBase, resolucionBase, peli.fuente].filter(Boolean).join(" ");

    // Tamaño según versión
    const textoTamano = esLigera
        ? (peli.tamanoConv || "No especificado")
        : (peli.tamano || "No especificado");

    // Subtítulos (solo en Versión Pesada)
    const tieneSubtitulos = !esLigera && peli.subtitulos.length > 0;
    const textoSubtitulos = peli.subtitulos.join(", ");

    return `
        <!-- DATOS GENERALES -->
        <div class="flex flex-col gap-1 text-xs">
            ${peli.ano ? `
            <div class="flex items-baseline gap-1.5">
                <span class="font-bold dinamico-texto-acento">${etq.ANO_ESTRENO || "Año de Estreno:"}</span>
                <span class="text-slate-100 font-semibold">${peli.ano}</span>
            </div>` : ""}
            
            ${peli.pais ? `
            <div class="flex items-baseline gap-1.5">
                <span class="font-bold dinamico-texto-acento">${etq.PAIS || "País:"}</span>
                <span class="text-slate-100 font-semibold">${peli.pais}</span>
            </div>` : ""}
            
            ${peli.duracion ? `
            <div class="flex items-baseline gap-1.5">
                <span class="font-bold dinamico-texto-acento">${etq.DURACION || "Duración:"}</span>
                <span class="text-slate-100 font-semibold">${peli.duracion}</span>
            </div>` : ""}
        </div>

        <div class="h-px bg-slate-800/80"></div>

        <!-- SECCIÓN AUDIO -->
        <div class="flex flex-col gap-1.5 text-xs">
            <span class="font-black dinamico-texto-acento uppercase text-[11px] tracking-wider">${etq.SECCION_AUDIO || "AUDIO"}</span>
            <div class="flex flex-col gap-1">
                ${listaAudios.map(audioItem => `
                    <div class="bg-slate-900/90 border border-slate-800 text-slate-200 px-2.5 py-1 rounded-lg font-medium text-[11px]">
                        ${audioItem}
                    </div>
                `).join("")}
            </div>
        </div>

        <div class="h-px bg-slate-800/80"></div>

        <!-- SECCIÓN VIDEO -->
        <div class="flex flex-col gap-1 text-xs">
            <span class="font-black dinamico-texto-acento uppercase text-[11px] tracking-wider">${etq.SECCION_VIDEO || "VIDEO"}</span>
            <div class="flex flex-col gap-1 text-[11px] mt-0.5">
                ${textoFormatoCompleto ? `
                <div class="flex items-baseline gap-1.5">
                    <span class="font-bold text-slate-400">${etq.FORMATO || "Formato:"}</span>
                    <span class="text-slate-100 font-semibold">${textoFormatoCompleto}</span>
                </div>` : ""}
                <div class="flex items-baseline gap-1.5">
                    <span class="font-bold text-slate-400">${etq.TAMANO || "Tamaño:"}</span>
                    <span class="text-slate-100 font-semibold">${textoTamano}</span>
                </div>
            </div>
        </div>

        <!-- SECCIÓN SUBTÍTULOS (SOLO EN VERSIÓN PESADA) -->
        ${tieneSubtitulos ? `
        <div class="h-px bg-slate-800/80"></div>
        <div class="flex flex-col gap-1 text-xs">
            <span class="font-black dinamico-texto-acento uppercase text-[11px] tracking-wider">${etq.SECCION_SUBTITULOS || "SUBTÍTULOS"}</span>
            <p class="text-slate-300 font-medium text-[11px] leading-relaxed">${textoSubtitulos}</p>
        </div>
        ` : ""}
    `;
}

function crearBloqueFichaInteractiva(peli) {
    const txtBtnPesada = CONFIG_VARS.TEXTO_BTN_VERSION_1 || "Versión Pesada";
    const txtBtnLigera = CONFIG_VARS.TEXTO_BTN_VERSION_2 || "Versión Ligera";

    const contenedorFicha = document.createElement("div");
    contenedorFicha.className = "bg-slate-950/85 rounded-xl p-3 border border-slate-800/80 flex flex-col gap-3";

    contenedorFicha.innerHTML = `
        <!-- PAR DE BOTONES: VERSIÓN PESADA (IZQUIERDA) / VERSIÓN LIGERA (DERECHA) -->
        <div class="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button type="button" data-version="pesada" class="btn-version py-1.5 px-2 rounded-lg text-[11px] font-black transition-all active:scale-95 dinamico-modo-activo text-center">
                ${txtBtnPesada}
            </button>
            <button type="button" data-version="ligera" class="btn-version py-1.5 px-2 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white transition-all active:scale-95 text-center">
                ${txtBtnLigera}
            </button>
        </div>

        <!-- CONTENIDO DINÁMICO DE DATOS (SE ADAPTA VERTICALMENTE) -->
        <div class="contenedor-datos-version flex flex-col gap-2.5">
            ${construirContenidoVersion(peli, "pesada")}
        </div>
    `;

    const botonesVersion = contenedorFicha.querySelectorAll(".btn-version");
    const contenedorDatos = contenedorFicha.querySelector(".contenedor-datos-version");

    botonesVersion.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const versionElegida = btn.getAttribute("data-version");

            botonesVersion.forEach(b => {
                if (b.getAttribute("data-version") === versionElegida) {
                    b.className = "btn-version py-1.5 px-2 rounded-lg text-[11px] font-black transition-all active:scale-95 dinamico-modo-activo text-center";
                } else {
                    b.className = "btn-version py-1.5 px-2 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white transition-all active:scale-95 text-center";
                }
            });

            contenedorDatos.innerHTML = construirContenidoVersion(peli, versionElegida);
        });
    });

    return contenedorFicha;
}

// ==========================================
// 7. RENDERIZADO DE VISTAS (MODO 1 Y MODO 2)
// ==========================================
function aplicarFiltrosYRenderizar() {
    const textoBusqueda = quitarAcentos(inputBuscar.value.toLowerCase().trim());

    if (textoBusqueda === "") {
        datosFiltrados = [...BD_PELICULAS];
    } else {
        datosFiltrados = BD_PELICULAS.filter(peli => {
            const tituloLimpio = quitarAcentos(peli.titulo.toLowerCase());
            return tituloLimpio.includes(textoBusqueda);
        });
    }

    if (modoVistaActual === "modo2") {
        renderizarVistaCompacta();
    } else {
        renderizarVistaNormal();
    }

    renderizarPaginacion(datosFiltrados.length);
}

// MODO 1: VISTA NORMAL (20 ítems por página, sin datos arriba de la portada, ficha adaptable abajo)
function renderizarVistaNormal() {
    contenedorPrincipal.innerHTML = "";

    if (datosFiltrados.length === 0) {
        contenedorPrincipal.innerHTML = `
            <div class="text-center text-slate-500 py-20 text-xs font-bold tracking-wide">
                No se encontraron películas con ese nombre.
            </div>
        `;
        return;
    }

    const limite = obtenerLimitePorPagina();
    const inicio = (paginaActual - 1) * limite;
    const itemsPagina = datosFiltrados.slice(inicio, inicio + limite);

    // items-start permite que cada tarjeta ajuste su altura vertical según la cantidad de audios y subtítulos
    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start";

    itemsPagina.forEach(peli => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "dinamico-tarjeta border rounded-2xl overflow-hidden shadow-xl p-3 flex flex-col gap-3";

        // Portada arriba sin ningún texto ni código superpuesto
        const bloquePortada = document.createElement("div");
        bloquePortada.className = "poster-card relative rounded-xl overflow-hidden bg-slate-950 aspect-[2/3] border border-slate-800 shadow-md";
        bloquePortada.innerHTML = generarHtmlImagenPortada(peli);

        // Ficha técnica debajo de la portada
        const bloqueFicha = crearBloqueFichaInteractiva(peli);

        tarjeta.appendChild(bloquePortada);
        tarjeta.appendChild(bloqueFicha);
        grid.appendChild(tarjeta);
    });

    contenedorPrincipal.appendChild(grid);
}

// MODO 2: VISTA COMPACTA (40 ítems por página en cuadrícula 4x10)
function renderizarVistaCompacta() {
    contenedorPrincipal.innerHTML = "";

    if (datosFiltrados.length === 0) {
        contenedorPrincipal.innerHTML = `
            <div class="text-center text-slate-500 py-20 text-xs font-bold tracking-wide">
                No se encontraron películas con ese nombre.
            </div>
        `;
        return;
    }

    const limite = obtenerLimitePorPagina();
    const inicio = (paginaActual - 1) * limite;
    const itemsPagina = datosFiltrados.slice(inicio, inicio + limite);

    const textoBtn = CONFIG_VARS.TEXTO_BTN_DETALLES_COMPACTO || "Mostrar detalles";

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-4 gap-2 sm:gap-3.5 items-start";

    itemsPagina.forEach(peli => {
        const item = document.createElement("div");
        item.className = "dinamico-tarjeta border rounded-xl p-1 sm:p-2 flex flex-col gap-1.5 shadow-md cursor-pointer group active:scale-95 transition-transform";

        item.innerHTML = `
            <div class="relative rounded-lg overflow-hidden bg-slate-950 aspect-[2/3] border border-slate-800/80">
                ${generarHtmlImagenPortada(peli, "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300")}
            </div>
            <button type="button" class="w-full py-1.5 px-1 rounded-lg bg-slate-800 group-hover:bg-slate-700 text-slate-200 font-bold text-[9px] sm:text-xs leading-tight text-center border border-slate-700/70 transition-colors">
                ${textoBtn}
            </button>
        `;

        item.addEventListener("click", () => {
            abrirModalDetalles(peli);
        });

        grid.appendChild(item);
    });

    contenedorPrincipal.appendChild(grid);
}

// ==========================================
// 8. MODAL DETALLADO (PARA VISTA COMPACTA)
// ==========================================
function abrirModalDetalles(peli) {
    modalDetallesContenido.innerHTML = "";

    // Columna izquierda: Portada en grande
    const colPortada = document.createElement("div");
    colPortada.className = "w-full md:w-5/12 shrink-0";
    colPortada.innerHTML = `
        <div class="rounded-xl overflow-hidden bg-slate-950 aspect-[2/3] border border-slate-800 shadow-lg max-w-[260px] md:max-w-none mx-auto">
            ${generarHtmlImagenPortada(peli, "w-full h-full object-cover")}
        </div>
    `;

    // Columna derecha: Ficha técnica interactiva (Versión Pesada / Versión Ligera)
    const colDatos = document.createElement("div");
    colDatos.className = "w-full md:w-7/12 flex flex-col pt-1 md:pt-7";
    colDatos.appendChild(crearBloqueFichaInteractiva(peli));

    modalDetallesContenido.appendChild(colPortada);
    modalDetallesContenido.appendChild(colDatos);

    actualizarEstadoActualSinNavegar();
    document.body.classList.add("modal-abierto");
    modalDetalles.classList.remove("hidden");
    history.pushState(Object.assign(obtenerEstadoActual(), { modalAbierto: "detalles" }), "");
}

function cerrarModalDetalles() {
    if (history.state && history.state.modalAbierto === "detalles") {
        history.back();
    } else {
        document.body.classList.remove("modal-abierto");
        modalDetalles.classList.add("hidden");
    }
}

// ==========================================
// 9. PAGINACIÓN
// ==========================================
function cambiarPagina(nuevaPagina) {
    actualizarEstadoActualSinNavegar();
    paginaActual = nuevaPagina;

    const vistaParam = modoVistaActual === "modo2" ? "compacta" : "normal";
    history.pushState(obtenerEstadoActual(), "", `?vista=${vistaParam}&p=${paginaActual}`);

    aplicarFiltrosYRenderizar();
    window.scrollTo(0, 0);
}

function renderizarPaginacion(totalElementos) {
    contenedorPaginacion.innerHTML = "";
    const limite = obtenerLimitePorPagina();
    const totalPaginas = Math.ceil(totalElementos / limite);

    if (totalPaginas <= 1) return;

    for (let i = 1; i <= totalPaginas; i++) {
        const boton = document.createElement("button");
        boton.textContent = i;
        boton.className = `w-8 h-8 rounded-lg text-xs font-black transition-all active:scale-90 ${
            paginaActual === i
                ? "dinamico-modo-activo scale-105"
                : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
        }`;

        boton.addEventListener("click", () => {
            if (paginaActual !== i) cambiarPagina(i);
        });

        contenedorPaginacion.appendChild(boton);
    }
}

window.addEventListener("DOMContentLoaded", inicializarApp);
