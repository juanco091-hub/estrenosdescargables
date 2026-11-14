let CONFIG_VARS = {};

let BD_PELICULAS = [];
let datosFiltrados = [];
let modoVistaActual = "modo1";
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

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

function aplicarConfiguracion() {
    if (typeof CONFIG_OPCIONES !== "undefined") CONFIG_VARS = CONFIG_OPCIONES;

    const root = document.documentElement;
    const setVar = (cssVar, configKey, defecto) => {
        const valor = CONFIG_VARS[configKey] ?? defecto;
        root.style.setProperty(cssVar, valor);
        return valor;
    };

    setVar("--config-fondo-body", "COLOR_FONDO_BODY", "#111827");
    setVar("--config-fondo-hf", "COLOR_FONDO_HEADER_FOOTER", "#1b2533");
    setVar("--config-fondo-tarjeta", "COLOR_FONDO_TARJETA", "#202b39");
    setVar("--config-borde-tarjeta", "COLOR_BORDE_TARJETA", "#354253");

    const colorPrimario = setVar("--config-primario", "COLOR_PRIMARIO", "#b89b68");
    root.style.setProperty("--config-primario-alpha", hexToRgba(colorPrimario, 0.24));
    setVar("--config-texto-sobre-primario", "COLOR_TEXTO_SOBRE_PRIMARIO", "#17202b");
    setVar("--config-texto-acento", "COLOR_TEXTO_ACENTO", "#d7bd8c");

    const colorBordeBuscador = setVar("--config-borde-buscador", "COLOR_BORDE_BUSCADOR", "#b89b68");
    root.style.setProperty("--config-borde-buscador-alpha", hexToRgba(colorBordeBuscador, 0.48));
    setVar("--config-spinner", "COLOR_SPINNER_CARGA", "#b89b68");
    setVar("--config-error", "COLOR_TEXTO_ERROR", "#f87171");

    const elTitulo1 = document.getElementById("titulo-parte-1");
    const elTitulo2 = document.getElementById("titulo-parte-2");
    const elTxtModo1 = document.getElementById("texto-btn-modo-1");
    const elTxtModo2 = document.getElementById("texto-btn-modo-2");
    const txtFooterWa = document.getElementById("texto-footer-whatsapp");

    if (elTitulo1 && CONFIG_VARS.TITULO_PRINCIPAL_1) elTitulo1.textContent = CONFIG_VARS.TITULO_PRINCIPAL_1;
    if (elTitulo2 && CONFIG_VARS.TITULO_PRINCIPAL_2) elTitulo2.textContent = CONFIG_VARS.TITULO_PRINCIPAL_2;
    if (elTxtModo1 && CONFIG_VARS.TEXTO_BOTON_MODO_1) elTxtModo1.textContent = CONFIG_VARS.TEXTO_BOTON_MODO_1;
    if (elTxtModo2 && CONFIG_VARS.TEXTO_BOTON_MODO_2) elTxtModo2.textContent = CONFIG_VARS.TEXTO_BOTON_MODO_2;
    if (inputBuscar && CONFIG_VARS.PLACEHOLDER_BUSCADOR) inputBuscar.placeholder = CONFIG_VARS.PLACEHOLDER_BUSCADOR;
    if (txtFooterWa && CONFIG_VARS.TEXTO_WHATSAPP_FOOTER) txtFooterWa.textContent = CONFIG_VARS.TEXTO_WHATSAPP_FOOTER;

    const numeroWa = CONFIG_VARS.NUMERO_WHATSAPP || "51983104072";
    const urlWa = `https://wa.me/${encodeURIComponent(numeroWa)}`;
    const btnHeaderWa = document.getElementById("btn-header-whatsapp");
    const btnFooterWa = document.getElementById("btn-footer-whatsapp");
    if (btnHeaderWa) btnHeaderWa.href = urlWa;
    if (btnFooterWa) btnFooterWa.href = urlWa;
}

function hexToRgba(hex, alpha) {
    if (!hex || !hex.startsWith("#")) return hex;
    let color = hex.substring(1);
    if (color.length === 3) color = color.split("").map(letra => letra + letra).join("");
    if (color.length !== 6) return hex;
    const numero = parseInt(color, 16);
    return `rgba(${(numero >> 16) & 255}, ${(numero >> 8) & 255}, ${numero & 255}, ${alpha})`;
}

function normalizarClave(texto) {
    if (!texto) return "";
    return texto.trim().toLowerCase().normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ñ/g, "n")
        .replace(/[^a-z0-9]/g, "");
}

function quitarAcentos(texto) {
    if (!texto) return "";
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function parsearCSV(textoCsv) {
    const contenido = textoCsv.trim();
    if (contenido.startsWith("<!DOCTYPE") || contenido.startsWith("<html")) {
        throw new Error("El enlace devolvió HTML en lugar de CSV. Verifica que termine en output=csv.");
    }

    const lineas = textoCsv.split(/\r?\n/);
    if (lineas.length < 3) return [];

    const encabezados = dividirLineaCSV(lineas[0]).map(encabezado => normalizarClave(encabezado));
    const resultado = [];

    for (let indice = 2; indice < lineas.length; indice++) {
        if (!lineas[indice].trim()) continue;
        const valores = dividirLineaCSV(lineas[indice]);
        const filaObjeto = {};
        encabezados.forEach((encabezado, posicion) => {
            if (!encabezado) return;
            const valor = valores[posicion] !== undefined ? valores[posicion].trim() : "";
            filaObjeto[encabezado] = valor.replace(/^"|"$/g, "");
        });
        resultado.push(filaObjeto);
    }
    return resultado;
}

function dividirLineaCSV(linea) {
    const valores = [];
    let dentroDeComillas = false;
    let valorActual = "";

    for (let indice = 0; indice < linea.length; indice++) {
        const caracter = linea[indice];
        if (caracter === '"') {
            if (dentroDeComillas && linea[indice + 1] === '"') {
                valorActual += '"';
                indice++;
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
    const encabezado = CONFIG_VARS.COLUMNAS?.[claveConfig] || claveConfig;
    const clave = normalizarClave(encabezado);
    const valor = fila[clave] || "";
    return valor.trim() === "---" ? "" : valor.trim();
}

function formatearDuracion(duracionRaw) {
    if (!duracionRaw) return "";
    const coincidencia = duracionRaw.match(/^0?(\d+):(\d{2}):\d{2}$/);
    return coincidencia ? `${coincidencia[1]}:${coincidencia[2]}` : duracionRaw;
}

function formatearAno(anoRaw) {
    return anoRaw ? anoRaw.replace(/\.0+$/, "") : "";
}

function construirCatalogoCircular(filasCrudas) {
    const txtUmbral = normalizarClave(CONFIG_VARS.CONDICION_UMBRAL || "UMBRAL");
    const txtHabilitado = normalizarClave(CONFIG_VARS.CONDICION_HABILITADO || "HABILITADO");
    const mapaPorNumero = new Map();

    filasCrudas.forEach((fila, indiceFila) => {
        const codigoStr = obtenerValorColumna(fila, "CODIGO");
        if (!/^\d+$/.test(codigoStr)) return;
        const numero = Number(codigoStr);
        if (!Number.isSafeInteger(numero) || numero < 1) return;

        const condicion = normalizarClave(obtenerValorColumna(fila, "CONDICION"));
        const esUmbral = condicion === txtUmbral && Boolean(txtUmbral);
        const esHabilitado = esUmbral || (condicion === txtHabilitado && Boolean(txtHabilitado));
        const audios = ["AUDIO_1", "AUDIO_2", "AUDIO_3"].map(clave => obtenerValorColumna(fila, clave)).filter(Boolean);
        const subtitulos = ["SUB_1", "SUB_2", "SUB_3", "SUB_4", "SUB_5"].map(clave => obtenerValorColumna(fila, clave)).filter(Boolean);

        mapaPorNumero.set(numero, {
            numero,
            codigoFormateado: String(numero).padStart(3, "0"),
            titulo: obtenerValorColumna(fila, "TITULO"),
            ano: formatearAno(obtenerValorColumna(fila, "ANO")),
            pais: obtenerValorColumna(fila, "PAIS"),
            duracion: formatearDuracion(obtenerValorColumna(fila, "DURACION")),
            audios,
            formato: obtenerValorColumna(fila, "FORMATO"),
            resolucion: obtenerValorColumna(fila, "RESOLUCION"),
            fuente: obtenerValorColumna(fila, "FUENTE"),
            tamano: obtenerValorColumna(fila, "TAMANO"),
            tamanoConv: obtenerValorColumna(fila, "TAMANO_CONV"),
            subtitulos,
            esHabilitado,
            esUmbral,
            indiceFila
        });
    });

    const registros = [...mapaPorNumero.values()];
    const habilitados = registros.filter(registro => registro.esHabilitado);
    if (!habilitados.length) return [];

    const umbrales = habilitados.filter(registro => registro.esUmbral);
    const pivote = umbrales.length
        ? umbrales.reduce((ultimo, actual) => actual.indiceFila > ultimo.indiceFila ? actual : ultimo).numero
        : Math.max(...habilitados.map(registro => registro.numero));

    const ordenados = habilitados.sort((a, b) => b.numero - a.numero);
    const indicePivote = ordenados.findIndex(registro => registro.numero === pivote);
    const inicio = indicePivote >= 0 ? indicePivote : 0;
    return ordenados.slice(inicio).concat(ordenados.slice(0, inicio)).map(({ indiceFila, ...registro }) => registro);
}

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
        busquedaVisible: searchBarContainer ? !searchBarContainer.classList.contains("hidden") : false,
        scrollY: window.scrollY
    };
}

function actualizarEstadoActualSinNavegar() {
    const estado = Object.assign({}, history.state || {}, obtenerEstadoActual());
    history.replaceState(estado, "", window.location.href);
}

function ocultarModalDetalles() {
    document.body.classList.remove("modal-abierto");
    if (modalDetalles) modalDetalles.classList.add("hidden");
}

function restaurarEstado(estado) {
    if (!estado) return;

    modoVistaActual = estado.modo === "modo2" ? "modo2" : "modo1";
    paginaActual = Math.max(1, Number(estado.pagina) || 1);

    if (inputBuscar) inputBuscar.value = estado.textoBusqueda || "";
    if (searchBarContainer) searchBarContainer.classList.toggle("hidden", !estado.busquedaVisible && !estado.textoBusqueda);
    if (btnLimpiarBusqueda) btnLimpiarBusqueda.classList.toggle("hidden", !inputBuscar.value.trim());

    actualizarUIBotonesModo();
    aplicarFiltrosYRenderizar();

    if (estado.modalAbierto === "detalles") {
        const pelicula = BD_PELICULAS.find(item => item.numero === Number(estado.codigoModal));
        if (pelicula) mostrarModalDetalles(pelicula);
        else ocultarModalDetalles();
    } else {
        ocultarModalDetalles();
    }

    requestAnimationFrame(() => window.scrollTo(0, Number(estado.scrollY) || 0));
}

window.addEventListener("popstate", evento => {
    if (evento.state) {
        restaurarEstado(evento.state);
    } else {
        ocultarModalDetalles();
        restaurarEstado({ modo: "modo1", pagina: 1, textoBusqueda: "", busquedaVisible: false, scrollY: 0 });
    }
});

function cargarEstadoDesdeUrl() {
    const parametros = new URLSearchParams(window.location.search);
    modoVistaActual = parametros.get("vista") === "compacta" ? "modo2" : "modo1";
    paginaActual = Math.max(1, Number(parametros.get("p")) || 1);
}

async function inicializarApp() {
    aplicarConfiguracion();
    cargarEstadoDesdeUrl();

    contenedorPrincipal.innerHTML = `
        <div class="estado-carga">
            <div class="w-9 h-9 border-4 rounded-full animate-spin dinamico-spinner"></div>
            <p>Cargando catálogo...</p>
        </div>`;

    try {
        const urlCsv = CONFIG_VARS.URL_CSV_PELICULAS;
        if (!urlCsv || urlCsv.includes("PEGA_AQUI")) throw new Error("Falta configurar la URL del CSV en config.js");

        const respuesta = await fetch(urlCsv);
        if (!respuesta.ok) throw new Error("No se pudo descargar el CSV");
        const textoCsv = await respuesta.text();
        BD_PELICULAS = construirCatalogoCircular(parsearCSV(textoCsv));

        configurarEventos();
        actualizarUIBotonesModo();
        aplicarFiltrosYRenderizar();
        const totalPaginas = Math.max(1, Math.ceil(datosFiltrados.length / obtenerLimitePorPagina()));
        paginaActual = Math.min(paginaActual, totalPaginas);
        aplicarFiltrosYRenderizar();
        history.replaceState(obtenerEstadoActual(), "", window.location.href);
    } catch (error) {
        console.error("Error al inicializar:", error);
        contenedorPrincipal.innerHTML = `
            <div class="estado-error">
                <p class="font-bold dinamico-error">No se pudo cargar el catálogo</p>
                <p>${escaparHTML(error.message)}</p>
            </div>`;
    }
}

function configurarEventos() {
    btnModo1.addEventListener("click", () => cambiarModoVista("modo1"));
    btnModo2.addEventListener("click", () => cambiarModoVista("modo2"));

    mainTitle.addEventListener("click", resetearAInicio);

    btnToggleSearch.addEventListener("click", () => {
        searchBarContainer.classList.toggle("hidden");
        if (!searchBarContainer.classList.contains("hidden")) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            inputBuscar.focus({ preventScroll: true });
        }
        actualizarEstadoActualSinNavegar();
    });

    inputBuscar.addEventListener("input", () => {
        paginaActual = 1;
        btnLimpiarBusqueda.classList.toggle("hidden", !inputBuscar.value.trim());
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

    btnCerrarModalDetalles.addEventListener("click", cerrarModalDetalles);
    modalDetalles.addEventListener("click", evento => {
        if (evento.target === modalDetalles) cerrarModalDetalles();
    });

    let inicioX = 0;
    let inicioY = 0;
    contenedorPrincipal.addEventListener("touchstart", evento => {
        inicioX = evento.changedTouches[0].screenX;
        inicioY = evento.changedTouches[0].screenY;
    }, { passive: true });

    contenedorPrincipal.addEventListener("touchend", evento => {
        const diferenciaX = evento.changedTouches[0].screenX - inicioX;
        const diferenciaY = evento.changedTouches[0].screenY - inicioY;
        if (Math.abs(diferenciaX) <= Math.abs(diferenciaY) || Math.abs(diferenciaX) <= 60) return;

        const totalPaginas = Math.ceil(datosFiltrados.length / obtenerLimitePorPagina());
        if (totalPaginas <= 1) return;
        if (diferenciaX < 0 && paginaActual < totalPaginas) cambiarPagina(paginaActual + 1);
        if (diferenciaX > 0 && paginaActual > 1) cambiarPagina(paginaActual - 1);
    }, { passive: true });
}

function cambiarModoVista(modo) {
    if (modoVistaActual === modo) return;
    actualizarEstadoActualSinNavegar();
    modoVistaActual = modo;
    paginaActual = 1;
    actualizarUIBotonesModo();
    const vista = modo === "modo2" ? "compacta" : "normal";
    history.pushState(obtenerEstadoActual(), "", `?vista=${vista}`);
    aplicarFiltrosYRenderizar();
    window.scrollTo(0, 0);
}

function resetearAInicio() {
    const estabaEnModal = history.state?.modalAbierto === "detalles";
    modoVistaActual = "modo1";
    paginaActual = 1;
    inputBuscar.value = "";
    btnLimpiarBusqueda.classList.add("hidden");
    searchBarContainer.classList.add("hidden");
    ocultarModalDetalles();
    actualizarUIBotonesModo();
    if (estabaEnModal) history.replaceState(obtenerEstadoActual(), "", window.location.pathname);
    else history.pushState(obtenerEstadoActual(), "", window.location.pathname);
    aplicarFiltrosYRenderizar();
    window.scrollTo(0, 0);
}

function actualizarUIBotonesModo() {
    const clasesBase = "px-4 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-[.98] flex items-center justify-center gap-2";
    btnModo1.className = `${clasesBase} ${modoVistaActual === "modo1" ? "dinamico-modo-activo" : "modo-inactivo"}`;
    btnModo2.className = `${clasesBase} ${modoVistaActual === "modo2" ? "dinamico-modo-activo" : "modo-inactivo"}`;
}

function generarHtmlImagenPortada(pelicula, clasesExtra = "w-full h-full object-cover transition-transform duration-300") {
    const codigo = escaparHTML(pelicula.codigoFormateado);
    const titulo = escaparHTML(pelicula.titulo);
    return `<img src="portadas/${codigo}.jpg" alt="${titulo}" loading="lazy"
        onerror="if(this.dataset.fallback==='0'){this.dataset.fallback='1';this.src='portadas/${codigo}.jpeg'}else if(this.dataset.fallback==='1'){this.dataset.fallback='2';this.src='portadas/${codigo}.png'}else if(this.dataset.fallback==='2'){this.dataset.fallback='3';this.src='portadas/${codigo}.webp'}else{this.onerror=null;this.src='https://placehold.co/400x600/202b39/d7bd8c?text=${codigo}'}"
        data-fallback="0" class="${clasesExtra}">`;
}

function construirContenidoVersion(peli, tipoVersion) {
    const etiquetas = CONFIG_VARS.ETIQUETAS || {};
    const cfgLigera = CONFIG_VARS.VERSION_LIGERA || {};
    const esLigera = tipoVersion === "ligera";
    const listaAudios = esLigera
        ? [cfgLigera.AUDIO || "Español Latino AAC 2.0"]
        : (peli.audios.length ? peli.audios : ["No especificado"]);
    const formatoBase = esLigera ? (cfgLigera.FORMATO_VIDEO || "MP4") : peli.formato;
    const resolucionBase = esLigera && cfgLigera.RESOLUCION_VIDEO?.trim()
        ? cfgLigera.RESOLUCION_VIDEO.trim()
        : peli.resolucion;
    const textoFormatoCompleto = [formatoBase, resolucionBase, peli.fuente].filter(Boolean).join(" ");
    const textoTamano = esLigera ? (peli.tamanoConv || "No especificado") : (peli.tamano || "No especificado");
    const tieneSubtitulos = !esLigera && peli.subtitulos.length > 0;

    return `
        <div class="datos-generales">
            ${peli.ano ? `<div><span>${escaparHTML(etiquetas.ANO_ESTRENO || "Año de Estreno:")}</span><strong>${escaparHTML(peli.ano)}</strong></div>` : ""}
            ${peli.pais ? `<div><span>${escaparHTML(etiquetas.PAIS || "País:")}</span><strong>${escaparHTML(peli.pais)}</strong></div>` : ""}
            ${peli.duracion ? `<div><span>${escaparHTML(etiquetas.DURACION || "Duración:")}</span><strong>${escaparHTML(peli.duracion)}</strong></div>` : ""}
        </div>
        <div class="separador-ficha"></div>
        <section class="seccion-ficha">
            <h3>${escaparHTML(etiquetas.SECCION_AUDIO || "AUDIO")}</h3>
            <div class="lista-etiquetas">${listaAudios.map(audio => `<span>${escaparHTML(audio)}</span>`).join("")}</div>
        </section>
        <div class="separador-ficha"></div>
        <section class="seccion-ficha">
            <h3>${escaparHTML(etiquetas.SECCION_VIDEO || "VIDEO")}</h3>
            ${textoFormatoCompleto ? `<div><span>${escaparHTML(etiquetas.FORMATO || "Formato:")}</span><strong>${escaparHTML(textoFormatoCompleto)}</strong></div>` : ""}
            <div><span>${escaparHTML(etiquetas.TAMANO || "Tamaño:")}</span><strong>${escaparHTML(textoTamano)}</strong></div>
        </section>
        ${tieneSubtitulos ? `<div class="separador-ficha"></div><section class="seccion-ficha"><h3>${escaparHTML(etiquetas.SECCION_SUBTITULOS || "SUBTÍTULOS")}</h3><p>${peli.subtitulos.map(escaparHTML).join(", ")}</p></section>` : ""}
    `;
}

function crearBloqueFichaInteractiva(peli) {
    const textoPesada = escaparHTML(CONFIG_VARS.TEXTO_BTN_VERSION_1 || "Versión Pesada");
    const textoLigera = escaparHTML(CONFIG_VARS.TEXTO_BTN_VERSION_2 || "Versión Ligera");
    const ficha = document.createElement("div");
    ficha.className = "bloque-ficha";
    ficha.innerHTML = `
        <div class="selector-version">
            <button type="button" data-version="pesada" class="btn-version activo">${textoPesada}</button>
            <button type="button" data-version="ligera" class="btn-version">${textoLigera}</button>
        </div>
        <div class="contenedor-datos-version">${construirContenidoVersion(peli, "pesada")}</div>`;

    const botones = ficha.querySelectorAll(".btn-version");
    const datos = ficha.querySelector(".contenedor-datos-version");
    botones.forEach(boton => boton.addEventListener("click", evento => {
        evento.stopPropagation();
        const version = boton.dataset.version;
        botones.forEach(item => item.classList.toggle("activo", item.dataset.version === version));
        datos.innerHTML = construirContenidoVersion(peli, version);
    }));
    return ficha;
}

function aplicarFiltrosYRenderizar() {
    const busqueda = quitarAcentos(inputBuscar.value.toLowerCase().trim());
    datosFiltrados = busqueda
        ? BD_PELICULAS.filter(pelicula => quitarAcentos(pelicula.titulo.toLowerCase()).includes(busqueda))
        : [...BD_PELICULAS];

    const totalPaginas = Math.max(1, Math.ceil(datosFiltrados.length / obtenerLimitePorPagina()));
    paginaActual = Math.min(Math.max(1, paginaActual), totalPaginas);
    if (modoVistaActual === "modo2") renderizarVistaCompacta();
    else renderizarVistaNormal();
    renderizarPaginacion(datosFiltrados.length);
}

function obtenerElementosPagina() {
    const limite = obtenerLimitePorPagina();
    const inicio = (paginaActual - 1) * limite;
    return datosFiltrados.slice(inicio, inicio + limite);
}

function mostrarMensajeSinResultados() {
    contenedorPrincipal.innerHTML = `<div class="sin-resultados">No se encontraron películas con ese nombre.</div>`;
}

function renderizarVistaNormal() {
    contenedorPrincipal.innerHTML = "";
    if (!datosFiltrados.length) return mostrarMensajeSinResultados();

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start";
    obtenerElementosPagina().forEach(pelicula => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "dinamico-tarjeta tarjeta-catalogo border rounded-2xl overflow-hidden p-3 flex flex-col gap-3";
        const portada = document.createElement("div");
        portada.className = "poster-card relative rounded-xl overflow-hidden aspect-[2/3]";
        portada.innerHTML = generarHtmlImagenPortada(pelicula);
        tarjeta.append(portada, crearBloqueFichaInteractiva(pelicula));
        grid.appendChild(tarjeta);
    });
    contenedorPrincipal.appendChild(grid);
}

function renderizarVistaCompacta() {
    contenedorPrincipal.innerHTML = "";
    if (!datosFiltrados.length) return mostrarMensajeSinResultados();

    const textoBoton = escaparHTML(CONFIG_VARS.TEXTO_BTN_DETALLES_COMPACTO || "Mostrar detalles");
    const grid = document.createElement("div");
    grid.className = "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 items-start";
    obtenerElementosPagina().forEach(pelicula => {
        const item = document.createElement("article");
        item.className = "dinamico-tarjeta item-compacto border rounded-xl p-1.5 sm:p-2 flex flex-col gap-2 cursor-pointer transition-transform";
        item.innerHTML = `
            <div class="relative rounded-lg overflow-hidden aspect-[2/3]">${generarHtmlImagenPortada(pelicula, "w-full h-full object-cover")}</div>
            <button type="button" class="boton-detalles">${textoBoton}</button>`;
        item.addEventListener("click", () => abrirModalDetalles(pelicula));
        grid.appendChild(item);
    });
    contenedorPrincipal.appendChild(grid);
}

function abrirModalDetalles(pelicula) {
    actualizarEstadoActualSinNavegar();
    modalDetallesContenido.innerHTML = "";
    const columnaPortada = document.createElement("div");
    columnaPortada.className = "w-full md:w-5/12 shrink-0";
    columnaPortada.innerHTML = `<div class="portada-modal">${generarHtmlImagenPortada(pelicula, "w-full h-full object-cover")}</div>`;

    const columnaDatos = document.createElement("div");
    columnaDatos.className = "w-full md:w-7/12 flex flex-col pt-1 md:pt-5";
    columnaDatos.appendChild(crearBloqueFichaInteractiva(pelicula));
    modalDetallesContenido.append(columnaPortada, columnaDatos);
    document.body.classList.add("modal-abierto");
    modalDetalles.classList.remove("hidden");

    history.pushState(
        Object.assign(obtenerEstadoActual(), { modalAbierto: "detalles", codigoModal: pelicula.numero }),
        "",
        window.location.href
    );
}

function mostrarModalDetalles(pelicula) {
    modalDetallesContenido.innerHTML = "";
    const columnaPortada = document.createElement("div");
    columnaPortada.className = "w-full md:w-5/12 shrink-0";
    columnaPortada.innerHTML = `<div class="portada-modal">${generarHtmlImagenPortada(pelicula, "w-full h-full object-cover")}</div>`;
    const columnaDatos = document.createElement("div");
    columnaDatos.className = "w-full md:w-7/12 flex flex-col pt-1 md:pt-5";
    columnaDatos.appendChild(crearBloqueFichaInteractiva(pelicula));
    modalDetallesContenido.append(columnaPortada, columnaDatos);
    document.body.classList.add("modal-abierto");
    modalDetalles.classList.remove("hidden");
}

function cerrarModalDetalles() {
    if (history.state?.modalAbierto === "detalles") {
        history.back();
    } else {
        ocultarModalDetalles();
    }
}

function cambiarPagina(nuevaPagina) {
    actualizarEstadoActualSinNavegar();
    paginaActual = nuevaPagina;
    const vista = modoVistaActual === "modo2" ? "compacta" : "normal";
    history.pushState(obtenerEstadoActual(), "", `?vista=${vista}&p=${paginaActual}`);
    aplicarFiltrosYRenderizar();
    window.scrollTo(0, 0);
}

function renderizarPaginacion(totalElementos) {
    contenedorPaginacion.innerHTML = "";
    const totalPaginas = Math.ceil(totalElementos / obtenerLimitePorPagina());
    if (totalPaginas <= 1) return;

    const agregarBoton = (texto, pagina, deshabilitado = false, actual = false, etiqueta = "") => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = texto;
        boton.setAttribute("aria-label", etiqueta || `Ir a página ${pagina}`);
        boton.disabled = deshabilitado;
        boton.className = `boton-paginacion ${actual ? "activo" : ""}`;
        boton.addEventListener("click", () => {
            if (!deshabilitado && pagina !== paginaActual) cambiarPagina(pagina);
        });
        contenedorPaginacion.appendChild(boton);
    };

    agregarBoton("‹", Math.max(1, paginaActual - 1), paginaActual === 1, false, "Página anterior");
    const paginasVisibles = new Set([1, totalPaginas, paginaActual - 1, paginaActual, paginaActual + 1]);
    const paginas = [...paginasVisibles].filter(numero => numero >= 1 && numero <= totalPaginas).sort((a, b) => a - b);
    let anterior = 0;
    paginas.forEach(numero => {
        if (anterior && numero - anterior > 1) {
            const puntos = document.createElement("span");
            puntos.className = "paginacion-puntos";
            puntos.textContent = "…";
            contenedorPaginacion.appendChild(puntos);
        }
        agregarBoton(String(numero), numero, false, paginaActual === numero);
        anterior = numero;
    });
    agregarBoton("›", Math.min(totalPaginas, paginaActual + 1), paginaActual === totalPaginas, false, "Página siguiente");
}

window.addEventListener("DOMContentLoaded", inicializarApp);
