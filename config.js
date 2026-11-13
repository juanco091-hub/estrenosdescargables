const CONFIG_OPCIONES = {
    // ==========================================
    // 1. FUENTE DE DATOS (GOOGLE SHEETS CSV)
    // ==========================================
    URL_CSV_PELICULAS: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRu9RP5qIWHyJ_wWh_kF9XrbO5-MTP48fxCDEy41WsrIJIadejXV8nRXp7MEOwAy1sM8KflVnQwiX1j/pub?gid=0&single=true&output=csv",

    // ==========================================
    // 2. CONFIGURACIÓN DEL CATÁLOGO CIRCULAR
    // ==========================================
    LIMITE_MAXIMO_CATALOGO: 560,   // Capacidad total de filas en tu base (001 a 560)
    CANTIDAD_ITEMS_ACTIVOS: 100,   // Cantidad de ítems hacia atrás a mostrar (cámbialo a 560 cuando lo llenes)
    ITEMS_POR_PAGINA_MODO_1: 20,   // Vista Normal: 20 ítems por página
    ITEMS_POR_PAGINA_MODO_2: 40,   // Vista Compacta: 40 ítems por página (4 columnas x 10 filas)

    // ==========================================
    // 3. TEXTOS DE INTERFAZ Y BOTONES GENÉRICOS
    // ==========================================
    TITULO_PRINCIPAL_1: "ESTRENOS",
    TITULO_PRINCIPAL_2: "DESCARGABLES",
    TEXTO_BOTON_MODO_1: "Vista Normal",
    TEXTO_BOTON_MODO_2: "Vista Compacta",
    TEXTO_BTN_DETALLES_COMPACTO: "Mostrar detalles",
    PLACEHOLDER_BUSCADOR: "Buscar película por nombre...",
    NUMERO_WHATSAPP: "51983104072",
    TEXTO_WHATSAPP_FOOTER: "WhatsApp Soporte",

    // ==========================================
    // 4. MAPEO DE ENCABEZADOS DE GOOGLE SHEETS
    // (Si cambias el nombre de una columna en Sheets, actualízalo aquí)
    // ==========================================
    COLUMNAS: {
        CODIGO: "CÓDIGO",
        TITULO: "TÍTULO",
        ANO: "AÑO",
        PAIS: "PAÍS",
        DURACION: "DURACIÓN",
        PESO: "PESO",
        AUDIO: "AUDIO",
        FORMATO: "FORMATO",
        SUBTITULOS: "SUBTÍTULOS",
        FECHA_ACTUALIZACION: "ULTIMA ACTUALIZACIÓN" // Columna que detecta cuál fue el último ingreso
    },

    // ==========================================
    // 5. PALETA DE COLORES (TEMA OSCURO ESMERALDA)
    // ==========================================
    COLOR_FONDO_BODY: "#020617",
    COLOR_FONDO_HEADER_FOOTER: "#0f172a",
    COLOR_FONDO_TARJETA: "#0f172a",
    COLOR_BORDE_TARJETA: "#1e293b",

    COLOR_PRIMARIO: "#10b981",               // Botones activos, insignias, acentos
    COLOR_TEXTO_SOBRE_PRIMARIO: "#022c22",   // Texto oscuro sobre botón primario
    COLOR_TEXTO_ACENTO: "#34d399",           // Textos destacados (Año, etiquetas técnicas)
    COLOR_BORDE_BUSCADOR: "#10b981",

    COLOR_SPINNER_CARGA: "#10b981",
    COLOR_TEXTO_ERROR: "#ef4444"
};