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

    // Fila 2 (índice 1) se omite porque es el buscador interno de Google Sheets.
    // Los datos comienzan en la Fila 3 (índice 2).
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
    return fila[claveNormalizada] || "";
}

// ==========================================
// 3. ALGORITMO DE ORDENAMIENTO CIRCULAR (1 A 560)
// ==========================================
function parsearFechaTimestamp(strFecha) {
    if (!strFecha || strFecha.trim() === "" || strFecha.trim() === "---") return 0;
    const limpia = strFecha.trim();

    // Soporta DD/MM/YYYY o DD/MM/YYYY HH:mm:ss
    const matchLatam = limpia.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (matchLatam) {
        const [, dia, mes, anio, hora = 0, min = 0, seg = 0] = matchLatam;
        const ts = new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hora), Number(min), Number(seg)).getTime();
        return isNaN(ts) ? 0 : ts;
    }

    // Soporta YYYY/MM/DD o YYYY-MM-DD
    const matchIso = limpia.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (matchIso) {
        const [, anio, mes, dia, hora = 0, min = 0, seg = 0] = matchIso;
        const ts = new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hora), Number(min), Number(seg)).getTime();
        return isNaN(ts) ? 0 : ts;
    }

    const fallback = Date.parse(limpia);
    return isNaN(fallback) ? 0 : fallback;
}

function construirCatalogoCircular(filasCrudas) {
    const maxCatalogo = Number(CONFIG_VARS.LIMITE_MAXIMO_CATALOGO) || 560;
    const cantidadTrabajar = Math.min(Number(CONFIG_VARS.CANTIDAD_ITEMS_ACTIVOS) || 100, maxCatalogo);

    // Indexar filas por número entero de código (1..560)
    const mapaPorNumero = new Map();
    let ultimoNumeroActualizado = null;
    let maxTimestamp = -1;

    filasCrudas.forEach((fila, idx) => {
        const codigoStr = obtenerValorColumna(fila, "CODIGO");
        const titulo = obtenerValorColumna(fila, "TITULO");
        const numCodigo = parseInt(codigoStr, 10);

        if (!isNaN(numCodigo) && numCodigo >= 1 && numCodigo <= maxCatalogo) {
            const item = {
                numero: numCodigo,
                codigoFormateado: codigoStr.padStart(3, "0"),
                titulo: titulo,
                ano: obtenerValorColumna(fila, "ANO"),
                pais: obtenerValorColumna(fila, "PAIS"),
                duracion: obtenerValorColumna(fila, "DURACION"),
                peso: obtenerValorColumna(fila, "PESO"),
                audio: obtenerValorColumna(fila, "AUDIO"),
                formato: obtenerValorColumna(fila, "FORMATO"),
                subtitulos: obtenerValorColumna(fila, "SUBTITULOS"),
                fechaActualizacion: obtenerValorColumna(fila, "FECHA_ACTUALIZACION"),
                esValido: titulo.trim() !== "" && titulo.trim() !== "---"
            };

            mapaPorNumero.set(numCodigo, item);

            if (item.esValido) {
                const ts = parsearFechaTimestamp(item.fechaActualizacion);
                // Si hay fechas válidas, gana la más reciente; si empatan o no hay fechas, gana el código mayor en el ciclo
                if (ts > maxTimestamp) {
                    maxTimestamp = ts;
                    ultimoNumeroActualizado = numCodigo;
                } else if (maxTimestamp === 0 && (ultimoNumeroActualizado === null || numCodigo > ultimoNumeroActualizado)) {
                    ultimoNumeroActualizado = numCodigo;
                }
            }
        }
    });

    if (ultimoNumeroActualizado === null) return [];

    // Recorrido circular hacia atrás desde ultimoNumeroActualizado por cantidadTrabajar posiciones
    const listaOrdenada = [];
    for (let step = 0; step < cantidadTrabajar; step++) {
        // Fórmula circular 1-indexed: retrocede step pasos envolviendo de 1 hacia maxCatalogo
        const numActual = ((ultimoNumeroActualizado - 1 - step) % maxCatalogo + maxCatalogo) % maxCatalogo + 1;
        const registro = mapaPorNumero.get(numActual);

        // Solo agregamos si la fila tiene película cargada (ignoramos las vacías, ej. 1 al 80)
        if (registro && registro.esValido) {
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
// 6. FILTRADO Y RENDERIZADO DE VISTAS
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

function generarHtmlImagenPortada(codigoFormateado, tituloAlt, clasesExtra = "w-full h-full object-cover transition-transform duration-300") {
    return `
        <img src="portadas/${codigoFormateado}.jpg" 
             alt="${tituloAlt.replace(/"/g, "&quot;")}"
             loading="lazy"
             onerror="this.onerror=()=>{ this.onerror=()=>{ this.onerror=()=>{ this.src='https://placehold.co/400x600/0f172a/34d399?text=%23${codigoFormateado}'; }; this.src='portadas/${codigoFormateado}.jpeg'; }; this.src='portadas/${codigoFormateado}.png'; }; this.src='portadas/${codigoFormateado}.webp';"
             class="${clasesExtra}">
    `;
}

function generarHtmlPildorasAudio(audioTexto) {
    if (!audioTexto || audioTexto.trim() === "" || audioTexto.trim() === "---") {
        return `<span class="text-slate-400 font-medium">No especificado</span>`;
    }
    // Separa por coma o salto de línea para crear insignias limpias
    const pistas = audioTexto.split(/,|\n|\//).map(p => p.trim()).filter(Boolean);
    return pistas.map(pista => `
        <span class="bg-slate-900 border border-slate-700/70 text-slate-200 px-2 py-0.5 rounded font-medium">${pista}</span>
    `).join("");
}

// MODO 1: VISTA NORMAL (20 ítems por página, portada + ficha técnica abajo)
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

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

    itemsPagina.forEach(peli => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "dinamico-tarjeta border rounded-2xl overflow-hidden shadow-xl p-3 flex flex-col gap-3";

        const metaSuperior = [peli.duracion, peli.peso].filter(x => x && x !== "---").join(" • ");

        tarjeta.innerHTML = `
            <!-- CABECERA DE TARJETA -->
            <div class="flex justify-between items-center px-1">
                <span class="text-[10px] font-black uppercase dinamico-texto-acento tracking-wider bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md">#${peli.codigoFormateado}</span>
                <span class="text-slate-400 font-bold text-[11px] tracking-tight">${metaSuperior}</span>
            </div>

            <!-- PORTADA SOLO INFORMATIVA -->
            <div class="poster-card relative rounded-xl overflow-hidden bg-slate-950 aspect-[2/3] border border-slate-800 shadow-md">
                ${generarHtmlImagenPortada(peli.codigoFormateado, peli.titulo)}
            </div>

            <!-- FICHA TÉCNICA DETALLADA -->
            <div class="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 flex flex-col gap-2 flex-grow">
                <div>
                    <h2 class="text-sm font-black uppercase tracking-wide text-white leading-snug">${peli.titulo}</h2>
                    <div class="flex items-center flex-wrap gap-2 text-[11px] text-slate-400 font-semibold mt-0.5">
                        ${peli.ano ? `<span class="dinamico-texto-acento">Año: ${peli.ano}</span>` : ""}
                        ${peli.ano && peli.pais ? `<span>•</span>` : ""}
                        ${peli.pais ? `<span>País: ${peli.pais}</span>` : ""}
                    </div>
                </div>

                <div class="h-px bg-slate-800/80 my-0.5"></div>

                <!-- AUDIO -->
                <div class="flex flex-col gap-1 text-[11px]">
                    <span class="font-bold dinamico-texto-acento uppercase text-[10px] tracking-wider">Audio:</span>
                    <div class="flex flex-wrap gap-1">
                        ${generarHtmlPildorasAudio(peli.audio)}
                    </div>
                </div>

                <!-- VIDEO / FORMATO -->
                ${peli.formato ? `
                <div class="flex flex-col gap-1 text-[11px]">
                    <span class="font-bold dinamico-texto-acento uppercase text-[10px] tracking-wider">Video:</span>
                    <div>
                        <span class="bg-slate-900 border border-slate-700/70 text-slate-200 px-2 py-0.5 rounded font-medium">${peli.formato}</span>
                    </div>
                </div>
                ` : ""}

                <!-- SUBTÍTULOS -->
                ${peli.subtitulos ? `
                <div class="flex flex-col gap-1 text-[11px]">
                    <span class="font-bold dinamico-texto-acento uppercase text-[10px] tracking-wider">Subtítulos:</span>
                    <span class="text-slate-300 font-medium">${peli.subtitulos}</span>
                </div>
                ` : ""}
            </div>
        `;

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

    // Cuadrícula de 4 columnas en móvil y 4 columnas en escritorio (4 x 10 = 40 ítems)
    const grid = document.createElement("div");
    grid.className = "grid grid-cols-4 gap-2 sm:gap-3.5";

    itemsPagina.forEach(peli => {
        const item = document.createElement("div");
        item.className = "dinamico-tarjeta border rounded-xl p-1 sm:p-2 flex flex-col gap-1.5 shadow-md cursor-pointer group active:scale-95 transition-transform";

        item.innerHTML = `
            <div class="relative rounded-lg overflow-hidden bg-slate-950 aspect-[2/3] border border-slate-800/80">
                ${generarHtmlImagenPortada(peli.codigoFormateado, peli.titulo, "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300")}
                <span class="absolute top-1 left-1 text-[8px] sm:text-[10px] font-black dinamico-texto-acento bg-slate-950/85 px-1.5 py-0.5 rounded border border-slate-800">
                    #${peli.codigoFormateado}
                </span>
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
// 7. MODAL DETALLADO (PARA VISTA COMPACTA)
// ==========================================
function abrirModalDetalles(peli) {
    const metaSuperior = [peli.duracion, peli.peso].filter(x => x && x !== "---").join(" • ");

    modalDetallesContenido.innerHTML = `
        <!-- COLUMNA IZQUIERDA: PORTADA EN GRANDE -->
        <div class="w-full md:w-5/12 shrink-0">
            <div class="rounded-xl overflow-hidden bg-slate-950 aspect-[2/3] border border-slate-800 shadow-lg max-w-[260px] md:max-w-none mx-auto">
                ${generarHtmlImagenPortada(peli.codigoFormateado, peli.titulo, "w-full h-full object-cover")}
            </div>
        </div>

        <!-- COLUMNA DERECHA: FICHA TÉCNICA COMPLETA -->
        <div class="w-full md:w-7/12 flex flex-col justify-between gap-3">
            <div class="flex flex-col gap-2.5">
                <div class="flex items-center gap-2 pr-8">
                    <span class="text-[10px] font-black uppercase dinamico-texto-acento tracking-wider bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md">#${peli.codigoFormateado}</span>
                    ${metaSuperior ? `<span class="text-slate-400 font-bold text-xs">${metaSuperior}</span>` : ""}
                </div>

                <div>
                    <h2 class="text-base sm:text-lg font-black uppercase tracking-wide text-white leading-snug">${peli.titulo}</h2>
                    <div class="flex items-center flex-wrap gap-2 text-xs text-slate-400 font-semibold mt-1">
                        ${peli.ano ? `<span class="dinamico-texto-acento">Año: ${peli.ano}</span>` : ""}
                        ${peli.ano && peli.pais ? `<span>•</span>` : ""}
                        ${peli.pais ? `<span>País: ${peli.pais}</span>` : ""}
                    </div>
                </div>

                <div class="h-px bg-slate-800 my-0.5"></div>

                <div class="flex flex-col gap-1 text-xs">
                    <span class="font-bold dinamico-texto-acento uppercase text-[10px] tracking-wider">Audio:</span>
                    <div class="flex flex-wrap gap-1.5">
                        ${generarHtmlPildorasAudio(peli.audio)}
                    </div>
                </div>

                ${peli.formato ? `
                <div class="flex flex-col gap-1 text-xs">
                    <span class="font-bold dinamico-texto-acento uppercase text-[10px] tracking-wider">Video:</span>
                    <div>
                        <span class="bg-slate-900 border border-slate-700/70 text-slate-200 px-2.5 py-1 rounded font-medium inline-block">${peli.formato}</span>
                    </div>
                </div>
                ` : ""}

                ${peli.subtitulos ? `
                <div class="flex flex-col gap-1 text-xs">
                    <span class="font-bold dinamico-texto-acento uppercase text-[10px] tracking-wider">Subtítulos:</span>
                    <span class="text-slate-300 font-medium leading-relaxed">${peli.subtitulos}</span>
                </div>
                ` : ""}
            </div>
        </div>
    `;

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
// 8. PAGINACIÓN
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