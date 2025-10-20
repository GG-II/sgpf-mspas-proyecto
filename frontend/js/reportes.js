// ===== js/reportes.js - SISTEMA DE REPORTES =====
window.ReportesSystem = window.ReportesSystem || {
  // Estado del sistema
  tipoReporteActual: "mensual",
  datosReporte: null,
  filtrosActuales: {
    año: 2025,
    mes: 9,
  },

  // ===== INICIALIZACIÓN =====
  async init() {
    console.log("🚀 Inicializando Sistema de Reportes");

    // CRÍTICO: Delay para renderizado DOM
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const user = SGPF.getCurrentUser();
      const rolNormalizado = SGPF.getNormalizedRole();

      console.log("📊 Usuario:", user.nombres, user.apellidos);
      console.log("🎭 Rol normalizado:", rolNormalizado);

      // Configurar filtros por defecto
      this.configurarFiltrosDefault();

      // Configurar event listeners
      this.configurarEventListeners();

      // Cargar datos iniciales si es necesario
      await this.actualizarResumen();

      console.log("✅ Sistema de Reportes inicializado");
    } catch (error) {
      console.error("❌ Error inicializando reportes:", error);
      SGPF.showToast("Error inicializando sistema de reportes", "error");
    }
  },

  // ===== CONFIGURAR FILTROS DEFAULT =====
  configurarFiltrosDefault() {
    const fechaActual = new Date();
    const añoActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1;

    // Establecer valores por defecto
    const selectAño = document.getElementById("filtro-año");
    const selectMes = document.getElementById("filtro-mes");

    if (selectAño) {
      selectAño.value = añoActual.toString();
      this.filtrosActuales.año = añoActual;
    }

    if (selectMes) {
      selectMes.value = mesActual.toString();
      this.filtrosActuales.mes = mesActual;
    }

    console.log("📅 Filtros configurados:", this.filtrosActuales);
  },

  // ===== CONFIGURAR EVENT LISTENERS =====
  configurarEventListeners() {
    // Tabs de reportes
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        this.cambiarTipoReporte(e.target.dataset.tab);
      });
    });

    // Botón generar reporte
    const btnGenerar = document.getElementById("btn-generar-reporte");
    if (btnGenerar) {
      btnGenerar.addEventListener("click", () => {
        this.generarReporte();
      });
    }

    // Filtros
    const selectAño = document.getElementById("filtro-año");
    const selectMes = document.getElementById("filtro-mes");

    if (selectAño) {
      selectAño.addEventListener("change", (e) => {
        this.filtrosActuales.año = parseInt(e.target.value);
      });
    }

    if (selectMes) {
      selectMes.addEventListener("change", (e) => {
        this.filtrosActuales.mes = parseInt(e.target.value);
      });
    }

    // Botones de exportación
    const btnExportarCSV = document.getElementById("btn-exportar-csv");
    const btnExportarExcel = document.getElementById("btn-exportar-excel");
    const btnImprimir = document.getElementById("btn-imprimir");

    if (btnExportarCSV) {
      btnExportarCSV.addEventListener("click", () => {
        this.exportarCSV();
      });
    }

    if (btnExportarExcel) {
      btnExportarExcel.addEventListener("click", () => {
        this.exportarExcel();
      });
    }

    if (btnImprimir) {
      btnImprimir.addEventListener("click", () => {
        this.imprimir();
      });
    }

    console.log("🎯 Event listeners configurados");
  },

  // ===== CAMBIAR TIPO DE REPORTE =====
  cambiarTipoReporte(tipo) {
    console.log("🔄 Cambiando tipo de reporte a:", tipo);

    // Actualizar estado
    this.tipoReporteActual = tipo;

    // Actualizar tabs activos
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === tipo);
    });

    // Mostrar/ocultar filtro de mes
    const filtroMesGrupo = document.getElementById("filtro-mes-grupo");
    if (filtroMesGrupo) {
      filtroMesGrupo.style.display = tipo === "mensual" ? "flex" : "none";
    }

    // Limpiar contenido anterior
    this.limpiarContenidoReporte();
  },

  // ===== GENERAR REPORTE =====
  async generarReporte() {
    console.log(
      "📊 Generando reporte:",
      this.tipoReporteActual,
      this.filtrosActuales
    );

    try {
      // Mostrar loading
      this.mostrarLoading();

      let endpoint, titulo;

      if (this.tipoReporteActual === "mensual") {
        endpoint = `/reportes/mensual/${this.filtrosActuales.año}/${this.filtrosActuales.mes}`;
        titulo = `Reporte Mensual - ${this.obtenerNombreMes(
          this.filtrosActuales.mes
        )} ${this.filtrosActuales.año}`;
      } else {
        endpoint = `/reportes/anual/${this.filtrosActuales.año}`;
        titulo = `Reporte Anual - ${this.filtrosActuales.año}`;
      }

      console.log("🌐 Llamando endpoint:", endpoint);

      const response = await SGPF.apiCall(endpoint);

      if (response.success) {
        this.datosReporte = response.data;
        this.actualizarTituloReporte(titulo);

        if (this.tipoReporteActual === "mensual") {
          this.renderizarReporteMensual(response.data);
        } else {
          this.renderizarReporteAnual(response.data);
        }

        this.actualizarResumenConDatos(response.data);
        SGPF.showToast("Reporte generado exitosamente", "success");
      } else {
        throw new Error(response.message || "Error generando reporte");
      }
    } catch (error) {
      console.error("❌ Error generando reporte:", error);
      this.mostrarError(
        "Error generando el reporte. Verifique los filtros e intente nuevamente."
      );
      SGPF.showToast("Error generando reporte", "error");
    }
  },

  // ===== RENDERIZAR REPORTE MENSUAL =====
  renderizarReporteMensual(data) {
    console.log("📅 Renderizando reporte mensual:", data);

    const contenedor = document.getElementById("contenido-reporte");
    const template = document.getElementById("template-tabla-mensual");

    if (!contenedor || !template) {
      console.error("❌ Elementos no encontrados para renderizar");
      return;
    }

    // Clonar template
    const tabla = template.content.cloneNode(true);
    const tbody = tabla.querySelector("#tbody-mensual");

    // Llenar datos
    if (data.registros && data.registros.length > 0) {
      data.registros.forEach((registro) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
                    <td>${registro.territorio || "N/A"}</td>
                    <td>${registro.comunidad || "N/A"}</td>
                    <td>${registro.metodo || "N/A"}</td>
                    <td>${registro.cantidad_administrada || 0}</td>
                    <td>${registro.porcentaje_poblacion || 0}%</td>
                    <td>${registro.registrado_por || "N/A"}</td>
                    <td>${this.formatearFecha(registro.fecha_registro)}</td>
                `;
        tbody.appendChild(fila);
      });
    } else {
      const fila = document.createElement("tr");
      fila.innerHTML = `
                <td colspan="7" class="sin-datos">
                    No hay datos disponibles para el período seleccionado
                </td>
            `;
      tbody.appendChild(fila);
    }

    // Insertar en contenedor
    contenedor.innerHTML = "";
    contenedor.appendChild(tabla);
  },

  // ===== RENDERIZAR REPORTE ANUAL =====
  renderizarReporteAnual(data) {
    console.log("📆 Renderizando reporte anual:", data);

    const contenedor = document.getElementById("contenido-reporte");
    const template = document.getElementById("template-tabla-anual");

    if (!contenedor || !template) {
      console.error("❌ Elementos no encontrados para renderizar");
      return;
    }

    // Clonar template
    const tabla = template.content.cloneNode(true);
    const tbody = tabla.querySelector("#tbody-anual");

    // Llenar datos
    if (data.detalle_completo && data.detalle_completo.length > 0) {
      data.detalle_completo.forEach((registro) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
                    <td>${registro.territorio || "N/A"}</td>
                    <td>${registro.comunidad || "N/A"}</td>
                    <td>${registro.metodo || "N/A"}</td>
                    <td>${registro.total_anual || 0}</td>
                    <td>${registro.meses_con_registros || 0}</td>
                    <td>${registro.poblacion_mef || 0}</td>
                `;
        tbody.appendChild(fila);
      });
    } else {
      const fila = document.createElement("tr");
      fila.innerHTML = `
                <td colspan="6" class="sin-datos">
                    No hay datos disponibles para el año seleccionado
                </td>
            `;
      tbody.appendChild(fila);
    }

    // Insertar en contenedor
    contenedor.innerHTML = "";
    contenedor.appendChild(tabla);
  },

  // ===== ACTUALIZAR RESUMEN =====
  async actualizarResumen() {
    try {
      // Obtener datos básicos para el resumen
      const response = await SGPF.apiCall("/dashboard/ejecutivo");

      if (response.success && response.data) {
        const data = response.data;

        // Actualizar tarjetas de resumen
        this.actualizarElemento("total-reportes", data.total_registros || 0);
        this.actualizarElemento(
          "total-comunidades-reportes",
          data.comunidades_activas || 0
        );
        this.actualizarElemento(
          "total-usuarias-reportes",
          data.total_usuarias || 0
        );
        this.actualizarElemento("total-metodos-reportes", "11"); // Métodos disponibles
      }
    } catch (error) {
      console.error("⚠️ Error actualizando resumen:", error);
      // No mostrar error al usuario, es información complementaria
    }
  },

  // ===== ACTUALIZAR RESUMEN CON DATOS DEL REPORTE =====
  actualizarResumenConDatos(data) {
    if (this.tipoReporteActual === "mensual" && data.resumen) {
      this.actualizarElemento("total-reportes", data.registros?.length || 0);
      this.actualizarElemento(
        "total-comunidades-reportes",
        data.resumen.total_comunidades || 0
      );
      this.actualizarElemento(
        "total-usuarias-reportes",
        data.resumen.total_usuarias || 0
      );
      this.actualizarElemento(
        "total-metodos-reportes",
        data.resumen.metodos_utilizados || 0
      );
    } else if (this.tipoReporteActual === "anual" && data.resumen) {
      this.actualizarElemento(
        "total-reportes",
        data.detalle_completo?.length || 0
      );
      this.actualizarElemento(
        "total-comunidades-reportes",
        data.resumen.comunidades_participantes || 0
      );
      this.actualizarElemento(
        "total-usuarias-reportes",
        data.resumen.total_usuarias_atendidas || 0
      );
      this.actualizarElemento(
        "total-metodos-reportes",
        data.resumen.metodos_utilizados || 0
      );
    }
  },

  // ===== EXPORTAR CSV =====
  exportarCSV() {
    if (!this.datosReporte) {
      SGPF.showToast(
        "No hay datos para exportar. Genere un reporte primero.",
        "warning"
      );
      return;
    }

    try {
      let csv = "";
      let filename = "";

      if (this.tipoReporteActual === "mensual") {
        csv = this.generarCSVMensual(this.datosReporte);
        filename = `reporte_mensual_${this.filtrosActuales.mes}_${this.filtrosActuales.año}.csv`;
      } else {
        csv = this.generarCSVAnual(this.datosReporte);
        filename = `reporte_anual_${this.filtrosActuales.año}.csv`;
      }

      this.descargarArchivo(csv, filename, "text/csv");
      SGPF.showToast("CSV exportado exitosamente", "success");
    } catch (error) {
      console.error("❌ Error exportando CSV:", error);
      SGPF.showToast("Error exportando CSV", "error");
    }
  },

  // ===== GENERAR CSV MENSUAL =====
  generarCSVMensual(data) {
    const encabezados = [
      "Territorio",
      "Comunidad",
      "Método",
      "Cantidad",
      "Porcentaje Población",
      "Registrado Por",
      "Fecha",
    ];

    let csv = encabezados.join(",") + "\n";

    if (data.registros && data.registros.length > 0) {
      data.registros.forEach((registro) => {
        const fila = [
          `"${registro.territorio || ""}"`,
          `"${registro.comunidad || ""}"`,
          `"${registro.metodo || ""}"`,
          registro.cantidad_administrada || 0,
          registro.porcentaje_poblacion || 0,
          `"${registro.registrado_por || ""}"`,
          `"${this.formatearFecha(registro.fecha_registro)}"`,
        ];
        csv += fila.join(",") + "\n";
      });
    }

    return csv;
  },

  // ===== GENERAR CSV ANUAL =====
  generarCSVAnual(data) {
    const encabezados = [
      "Territorio",
      "Comunidad",
      "Método",
      "Total Anual",
      "Meses Activos",
      "Población MEF",
    ];

    let csv = encabezados.join(",") + "\n";

    if (data.detalle_completo && data.detalle_completo.length > 0) {
      data.detalle_completo.forEach((registro) => {
        const fila = [
          `"${registro.territorio || ""}"`,
          `"${registro.comunidad || ""}"`,
          `"${registro.metodo || ""}"`,
          registro.total_anual || 0,
          registro.meses_con_registros || 0,
          registro.poblacion_mef || 0,
        ];
        csv += fila.join(",") + "\n";
      });
    }

    return csv;
  },

  // ===== EXPORTAR EXCEL =====
  exportarExcel() {
    if (!this.datosReporte) {
      SGPF.showToast(
        "No hay datos para exportar. Genere un reporte primero.",
        "warning"
      );
      return;
    }

    if (typeof XLSX === "undefined") {
      SGPF.showToast(
        "Librería Excel no disponible. Usando CSV como alternativa.",
        "warning"
      );
      this.exportarCSV();
      return;
    }

    try {
      let filename = "";
      let worksheetData = [];

      if (this.tipoReporteActual === "mensual") {
        worksheetData = this.prepararDatosExcelMensual(this.datosReporte);
        filename = `reporte_mensual_${this.filtrosActuales.mes}_${this.filtrosActuales.año}.xlsx`;
      } else {
        worksheetData = this.prepararDatosExcelAnual(this.datosReporte);
        filename = `reporte_anual_${this.filtrosActuales.año}.xlsx`;
      }

      // Crear workbook y worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Configurar anchos de columnas
      const columnWidths = worksheetData[0].map(() => ({ width: 15 }));
      worksheet["!cols"] = columnWidths;

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

      // Descargar archivo
      XLSX.writeFile(workbook, filename);
      SGPF.showToast("Excel exportado exitosamente", "success");
    } catch (error) {
      console.error("❌ Error exportando Excel:", error);
      SGPF.showToast(
        "Error exportando Excel. Usando CSV como alternativa.",
        "warning"
      );
      this.exportarCSV();
    }
  },

  // ===== PREPARAR DATOS EXCEL MENSUAL =====
  prepararDatosExcelMensual(data) {
    const encabezados = [
      "Territorio",
      "Comunidad",
      "Código Comunidad",
      "Método",
      "Categoría",
      "Cantidad",
      "Población MEF",
      "% Población",
      "Registrado Por",
      "Fecha Registro",
      "Estado",
    ];

    const filas = [encabezados];

    if (data.registros && data.registros.length > 0) {
      data.registros.forEach((registro) => {
        filas.push([
          registro.territorio || "",
          registro.comunidad || "",
          registro.codigo_comunidad || "",
          registro.metodo || "",
          registro.categoria || "",
          registro.cantidad_administrada || 0,
          registro.poblacion_mef || 0,
          registro.porcentaje_poblacion || 0,
          registro.registrado_por || "",
          this.formatearFecha(registro.fecha_registro),
          registro.estado || "",
        ]);
      });
    }

    // Agregar fila de resumen
    if (data.resumen) {
      filas.push([]);
      filas.push(["RESUMEN"]);
      filas.push(["Total Usuarias:", data.resumen.total_usuarias || 0]);
      filas.push(["Comunidades:", data.resumen.total_comunidades || 0]);
      filas.push(["Territorios:", data.resumen.total_territorios || 0]);
      filas.push(["Métodos Utilizados:", data.resumen.metodos_utilizados || 0]);
    }

    return filas;
  },

  // ===== PREPARAR DATOS EXCEL ANUAL =====
  prepararDatosExcelAnual(data) {
    const encabezados = [
      "Territorio",
      "Comunidad",
      "Método",
      "Categoría",
      "Total Anual",
      "Meses Activos",
      "Población MEF",
      "Promedio Mensual",
    ];

    const filas = [encabezados];

    if (data.detalle_completo && data.detalle_completo.length > 0) {
      data.detalle_completo.forEach((registro) => {
        const promedioMensual =
          registro.meses_con_registros > 0
            ? Math.round(registro.total_anual / registro.meses_con_registros)
            : 0;

        filas.push([
          registro.territorio || "",
          registro.comunidad || "",
          registro.metodo || "",
          registro.categoria || "",
          registro.total_anual || 0,
          registro.meses_con_registros || 0,
          registro.poblacion_mef || 0,
          promedioMensual,
        ]);
      });
    }

    // Agregar fila de resumen
    if (data.resumen) {
      filas.push([]);
      filas.push(["RESUMEN ANUAL"]);
      filas.push(["Año:", data.resumen.año || this.filtrosActuales.año]);
      filas.push([
        "Total Usuarias Atendidas:",
        data.resumen.total_usuarias_atendidas || 0,
      ]);
      filas.push([
        "Comunidades Participantes:",
        data.resumen.comunidades_participantes || 0,
      ]);
      filas.push([
        "Territorios Activos:",
        data.resumen.territorios_activos || 0,
      ]);
      filas.push(["Métodos Utilizados:", data.resumen.metodos_utilizados || 0]);
    }

    return filas;
  },

  // ===== IMPRIMIR =====
  imprimir() {
    const contenido = document.getElementById("contenido-reporte");
    const titulo =
      document.getElementById("titulo-reporte")?.textContent || "Reporte";

    if (!contenido || !contenido.querySelector("table")) {
      SGPF.showToast(
        "No hay datos para imprimir. Genere un reporte primero.",
        "warning"
      );
      return;
    }

    const ventanaImpresion = window.open("", "_blank");

    ventanaImpresion.document.write(`
            <html>
            <head>
                <title>${titulo}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    h1 { color: #333; }
                </style>
            </head>
            <body>
                <h1>${titulo}</h1>
                ${contenido.innerHTML}
            </body>
            </html>
        `);

    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    ventanaImpresion.print();
    ventanaImpresion.close();
  },

  // ===== UTILIDADES =====
  actualizarTituloReporte(titulo) {
    const elemento = document.getElementById("titulo-reporte");
    if (elemento) {
      elemento.textContent = titulo;
    }
  },

  actualizarElemento(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = valor;
    }
  },

  obtenerNombreMes(mes) {
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return meses[mes - 1] || "Mes desconocido";
  },

  formatearFecha(fecha) {
    if (!fecha) return "N/A";

    const date = new Date(fecha);
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("es-GT");
  },

  mostrarLoading() {
    const contenedor = document.getElementById("contenido-reporte");
    if (contenedor) {
      contenedor.innerHTML = `
                <div class="loading-reportes">
                    <div>Generando reporte...</div>
                </div>
            `;
    }
  },

  mostrarError(mensaje) {
    const contenedor = document.getElementById("contenido-reporte");
    if (contenedor) {
      contenedor.innerHTML = `
                <div class="sin-datos">
                    <div>❌ ${mensaje}</div>
                </div>
            `;
    }
  },

  limpiarContenidoReporte() {
    const contenedor = document.getElementById("contenido-reporte");
    if (contenedor) {
      contenedor.innerHTML = `
                <div class="sin-datos">
                    <div>Configurar filtros y hacer clic en "Generar Reporte"</div>
                    <p>Seleccione el tipo de reporte, año y mes para comenzar</p>
                </div>
            `;
    }
  },

  descargarArchivo(contenido, nombreArchivo, tipoMime) {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
