const CONFIG_OPCIONES = {
    // ==========================================
    // 1. FUENTE DE DATOS (GOOGLE SHEETS CSV)
    // ==========================================
    URL_CSV_PELICULAS: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRu9RP5qIWHyJ_wWh_kF9XrbO5-MTP48fxCDEy41WsrIJIadejXV8nRXp7MEOwAy1sM8KflVnQwiX1j/pub?gid=0&single=true&output=csv",

    // ==========================================
    // 2. CONFIGURACIÓN DEL CATÁLOGO CIRCULAR Y CONDICIÓN
    // ==========================================
    ITEMS_POR_PAGINA_MODO_1: 20,        // Vista Normal: 20 ítems por página
    ITEMS_POR_PAGINA_MODO_2: 40,        // Vista Compacta: 40 ítems por página (4 columnas x 10 filas)

    // Valores de la columna CONDICIÓN (puedes cambiarlos aquí si los renombras en Sheets)
    CONDICION_UMBRAL: "UMBRAL",         // Habilitado + marca el último archivo trabajado (inicio del ciclo)
    CONDICION_HABILITADO: "HABILITADO", // Se muestra en el catálogo
    CONDICION_DESHABILITADO: "DESHABILITADO", // No se muestra (igual que celdas en blanco)

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
    // 4. CONFIGURACIÓN DE VERSIONES (PESADA Y LIGERA)
    // ==========================================
    TEXTO_BTN_VERSION_1: "Versión Pesada",
    TEXTO_BTN_VERSION_2: "Versión Ligera",

    VERSION_LIGERA: {
        AUDIO: "Español Latino AAC 2.0", // Audio único por defecto para Versión Ligera
        FORMATO_VIDEO: "MP4",            // Reemplaza el formato de la versión pesada
        RESOLUCION_VIDEO: ""             // Déjalo vacío "" para repetir la resolución de la versión pesada, o escribe ej. "1080p" / "720p" para forzarla
    },

    // ==========================================
    // 5. ETIQUETAS DE LAS MINICATEGORÍAS DE LA FICHA
    // ==========================================
    ETIQUETAS: {
        ANO_ESTRENO: "Año de Estreno:",
        PAIS: "País:",
        DURACION: "Duración:",
        SECCION_AUDIO: "AUDIO",
        SECCION_VIDEO: "VIDEO",
        FORMATO: "Formato:",
        TAMANO: "Tamaño:",
        SECCION_SUBTITULOS: "SUBTÍTULOS"
    },

    // ==========================================
    // 6. MAPEO DE ENCABEZADOS DE GOOGLE SHEETS
    // (Si cambias el nombre de una columna en Sheets, actualízalo aquí)
    // ==========================================
    COLUMNAS: {
        CODIGO: "CÓDIGO",
        TITULO: "TÍTULO",
        ANO: "AÑO DE ESTRENO",
        PAIS: "PAÍS",
        DURACION: "DURACIÓN",
        AUDIO_1: "AUDIO 1",
        AUDIO_2: "AUDIO 2",
        AUDIO_3: "AUDIO 3",
        FORMATO: "FORMATO",
        RESOLUCION: "RESOLUCIÓN",
        FUENTE: "FUENTE",
        TAMANO: "TAMAÑO",
        TAMANO_CONV: "TAMAÑO CONV",
        SUB_1: "SUB 1",
        SUB_2: "SUB 2",
        SUB_3: "SUB 3",
        SUB_4: "SUB 4",
        SUB_5: "SUB 5",
        CONDICION: "CONDICIÓN"
    },

    // ==========================================
    // 7. PALETA DE COLORES (TEMA OSCURO ESMERALDA)
    // ==========================================
    COLOR_FONDO_BODY: "#111827",
    COLOR_FONDO_HEADER_FOOTER: "#1b2533",
    COLOR_FONDO_TARJETA: "#202b39",
    COLOR_BORDE_TARJETA: "#354253",

    COLOR_PRIMARIO: "#b89b68",               // Botones activos, insignias, acentos
    COLOR_TEXTO_SOBRE_PRIMARIO: "#17202b",   // Texto oscuro sobre botón primario
    COLOR_TEXTO_ACENTO: "#d7bd8c",           // Títulos de minicategorías (AUDIO, VIDEO, SUBTÍTULOS) y etiquetas
    COLOR_BORDE_BUSCADOR: "#b89b68",

    COLOR_SPINNER_CARGA: "#b89b68",
    COLOR_TEXTO_ERROR: "#ef4444"
};
