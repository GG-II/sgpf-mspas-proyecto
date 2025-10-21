// ===== SISTEMA DE REPORTES V2.0 - ORQUESTADOR MODULAR =====
window.Reportes = window.Reportes || {
  // ===== ESTADO GLOBAL =====
  state: {
    anioActual: new Date().getFullYear(),
    tabActual: 'general',
    modulosCargados: {},
    datosCache: {}
  },

  // ===== INICIALIZAR SISTEMA =====
  async init() {
    console.log('📊 Inicializando Sistema de Reportes V2.0');

    try {
      const user = SGPF.getCurrentUser();

      if (!user) {
        console.error('❌ Usuario no autenticado');
        SGPF.showToast('Debes iniciar sesión', 'error');
        return;
      }

      console.log('✅ Usuario autenticado:', user.nombre);

      // Cargar años disponibles
      await this.cargarAniosDisponibles();

      // Configurar selector de año
      this.configurarSelectorAnio();

      // Configurar navegación por tabs
      this.configurarTabs();

      // Cargar pestaña inicial
      await this.cambiarTab('general');

      console.log('✅ Sistema de reportes inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando reportes:', error);
      this.mostrarError('Error al inicializar el sistema de reportes');
    }
  },

  // ===== CARGAR AÑOS DISPONIBLES =====
  async cargarAniosDisponibles() {
    try {
      const response = await SGPF.apiCall('/planificacion/anios', 'GET');

      if (response.success && response.data) {
        const anios = response.data;
        const selector = document.getElementById('reporte-anio-global');

        if (selector) {
          selector.innerHTML = anios
            .map(
              (anio) =>
                `<option value="${anio}" ${anio === this.state.anioActual ? 'selected' : ''}>${anio}</option>`
            )
            .join('');

          // Si no hay años, agregar el actual
          if (anios.length === 0) {
            selector.innerHTML = `<option value="${this.state.anioActual}" selected>${this.state.anioActual}</option>`;
          }
        }

        console.log('✅ Años cargados:', anios);
      }
    } catch (error) {
      console.error('❌ Error cargando años:', error);
      // Fallback: usar año actual
      const selector = document.getElementById('reporte-anio-global');
      if (selector) {
        selector.innerHTML = `<option value="${this.state.anioActual}" selected>${this.state.anioActual}</option>`;
      }
    }
  },

  // ===== CONFIGURAR SELECTOR DE AÑO =====
  configurarSelectorAnio() {
    const selector = document.getElementById('reporte-anio-global');

    if (selector) {
      selector.addEventListener('change', async (e) => {
        const nuevoAnio = parseInt(e.target.value);
        
        if (nuevoAnio !== this.state.anioActual) {
          this.state.anioActual = nuevoAnio;
          console.log('📅 Año cambiado a:', this.state.anioActual);

          // Limpiar caché
          this.state.datosCache = {};

          // Recargar contenido de la pestaña actual
          await this.cambiarTab(this.state.tabActual);
        }
      });
    }
  },

  // ===== CONFIGURAR NAVEGACIÓN POR TABS =====
  configurarTabs() {
    const tabs = document.querySelectorAll('.tab-reporte');

    tabs.forEach((tab) => {
      tab.addEventListener('click', async () => {
        const tabName = tab.dataset.tab;
        await this.cambiarTab(tabName);
      });
    });

    console.log('✅ Tabs configurados:', tabs.length);
  },

  // ===== CAMBIAR DE PESTAÑA =====
  async cambiarTab(tabName) {
    console.log('🔄 Cambiando a pestaña:', tabName);

    this.state.tabActual = tabName;

    // Actualizar estilos de tabs
    this.actualizarEstilosTabs(tabName);

    // Limpiar estados previos
    this.ocultarError();
    this.limpiarContenido();

    // Mostrar loading
    this.mostrarLoading(true);

    try {
      // Cargar módulo específico
      await this.cargarModulo(tabName);
    } catch (error) {
      console.error(`❌ Error en pestaña ${tabName}:`, error);
      this.mostrarError(`Error al cargar el reporte: ${error.message}`);
    } finally {
      this.mostrarLoading(false);
    }
  },

  // ===== ACTUALIZAR ESTILOS DE TABS =====
  actualizarEstilosTabs(tabActivo) {
    document.querySelectorAll('.tab-reporte').forEach((tab) => {
      const isActive = tab.dataset.tab === tabActivo;

      if (isActive) {
        tab.classList.add('text-purple-600', 'border-purple-600');
        tab.classList.remove('text-gray-500', 'border-transparent');
      } else {
        tab.classList.remove('text-purple-600', 'border-purple-600');
        tab.classList.add('text-gray-500', 'border-transparent');
      }
    });
  },

  // ===== CARGAR MÓDULO ESPECÍFICO =====
  async cargarModulo(moduloNombre) {
    try {
      // Verificar si el script ya está cargado
      if (!this.state.modulosCargados[moduloNombre]) {
        console.log(`📦 Cargando script: js/reportes/${moduloNombre}.js`);
        await this.cargarScript(`js/reportes/${moduloNombre}.js`);
        this.state.modulosCargados[moduloNombre] = true;
      }

      // Obtener el módulo
      const nombreModulo = `Reporte${this.capitalize(moduloNombre)}`;
      const modulo = window[nombreModulo];

      if (!modulo) {
        throw new Error(`Módulo ${nombreModulo} no encontrado en window`);
      }

      if (typeof modulo.init !== 'function') {
        throw new Error(`Módulo ${nombreModulo} no tiene método init()`);
      }

      // Inicializar módulo con el año actual
      console.log(`🚀 Inicializando módulo: ${nombreModulo}`);
      await modulo.init(this.state.anioActual);

      console.log(`✅ Módulo ${nombreModulo} cargado exitosamente`);
    } catch (error) {
      console.error(`❌ Error cargando módulo ${moduloNombre}:`, error);
      throw error;
    }
  },

  // ===== CARGAR SCRIPT DINÁMICAMENTE =====
  cargarScript(src) {
    return new Promise((resolve, reject) => {
      // Verificar si ya existe
      const scriptExistente = document.querySelector(`script[src="${src}"]`);
      if (scriptExistente) {
        console.log(`✅ Script ya cargado: ${src}`);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.type = 'text/javascript';

      script.onload = () => {
        console.log(`✅ Script cargado: ${src}`);
        resolve();
      };

      script.onerror = () => {
        const error = new Error(`Error al cargar script: ${src}`);
        console.error('❌', error);
        reject(error);
      };

      document.head.appendChild(script);
    });
  },

  // ===== UTILIDADES DE UI =====
  mostrarLoading(mostrar) {
    const loading = document.getElementById('reporte-loading');
    if (loading) {
      loading.classList.toggle('hidden', !mostrar);
    }
  },

  mostrarError(mensaje) {
    const errorDiv = document.getElementById('reporte-error');
    const errorMensaje = document.getElementById('reporte-error-mensaje');

    if (errorDiv && errorMensaje) {
      errorMensaje.textContent = mensaje;
      errorDiv.classList.remove('hidden');
    }

    // También limpiar el contenido
    this.limpiarContenido();
  },

  ocultarError() {
    const errorDiv = document.getElementById('reporte-error');
    if (errorDiv) {
      errorDiv.classList.add('hidden');
    }
  },

  limpiarContenido() {
    const content = document.getElementById('reporte-content');
    if (content) {
      content.innerHTML = '';
    }
  },

  // ===== FUNCIONES COMUNES DE EXPORTACIÓN =====
  async exportarExcel(datos, nombreArchivo, nombreHoja = 'Reporte') {
    try {
      if (!Array.isArray(datos) || datos.length === 0) {
        SGPF.showToast('No hay datos para exportar', 'warning');
        return;
      }

      // Verificar que SheetJS esté disponible
      if (typeof XLSX === 'undefined') {
        throw new Error('Librería XLSX no está cargada');
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(datos);

      // Aplicar estilos básicos (ancho de columnas)
      const cols = Object.keys(datos[0]).map(() => ({ wch: 15 }));
      ws['!cols'] = cols;

      XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

      const filename = `${nombreArchivo}_${this.state.anioActual}.xlsx`;
      XLSX.writeFile(wb, filename);

      SGPF.showToast('✅ Excel exportado exitosamente', 'success');
      console.log('✅ Excel exportado:', filename);
    } catch (error) {
      console.error('❌ Error exportando Excel:', error);
      SGPF.showToast('Error al exportar Excel', 'error');
    }
  },

  async exportarPDF(elementoId, nombreArchivo, orientacion = 'landscape') {
    try {
      // Verificar que html2pdf esté disponible
      if (typeof html2pdf === 'undefined') {
        throw new Error('Librería html2pdf no está cargada');
      }

      const elemento = document.getElementById(elementoId);

      if (!elemento) {
        throw new Error(`Elemento ${elementoId} no encontrado`);
      }

      const opt = {
        margin: 10,
        filename: `${nombreArchivo}_${this.state.anioActual}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          logging: false,
          useCORS: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: orientacion 
        }
      };

      await html2pdf().set(opt).from(elemento).save();

      SGPF.showToast('✅ PDF exportado exitosamente', 'success');
      console.log('✅ PDF exportado:', opt.filename);
    } catch (error) {
      console.error('❌ Error exportando PDF:', error);
      SGPF.showToast('Error al exportar PDF', 'error');
    }
  },

  async exportarPNG(canvasId, nombreArchivo) {
    try {
      const canvas = document.getElementById(canvasId);

      if (!canvas) {
        throw new Error(`Canvas ${canvasId} no encontrado`);
      }

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${nombreArchivo}_${this.state.anioActual}.png`;
      link.href = url;
      link.click();

      SGPF.showToast('✅ Imagen exportada exitosamente', 'success');
      console.log('✅ PNG exportado:', link.download);
    } catch (error) {
      console.error('❌ Error exportando PNG:', error);
      SGPF.showToast('Error al exportar imagen', 'error');
    }
  },

  // ===== FUNCIONES AUXILIARES =====
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  formatearNumero(numero) {
    return new Intl.NumberFormat('es-GT').format(numero);
  },

  formatearPorcentaje(valor) {
    return `${Math.round(valor * 100) / 100}%`;
  },

  obtenerColorPorcentaje(porcentaje) {
    if (porcentaje >= 90) {
      return {
        text: 'text-green-600',
        bg: 'bg-green-100',
        border: 'border-green-300',
        bar: 'bg-green-600'
      };
    } else if (porcentaje >= 70) {
      return {
        text: 'text-yellow-600',
        bg: 'bg-yellow-100',
        border: 'border-yellow-300',
        bar: 'bg-yellow-600'
      };
    } else {
      return {
        text: 'text-red-600',
        bg: 'bg-red-100',
        border: 'border-red-300',
        bar: 'bg-red-600'
      };
    }
  },

  // ===== CACHÉ DE DATOS =====
  guardarEnCache(clave, datos) {
    this.state.datosCache[clave] = {
      datos: datos,
      timestamp: Date.now()
    };
    console.log(`💾 Datos guardados en caché: ${clave}`);
  },

  obtenerDeCache(clave, maxEdad = 300000) { // 5 minutos por defecto
    const cache = this.state.datosCache[clave];

    if (!cache) {
      return null;
    }

    const edad = Date.now() - cache.timestamp;

    if (edad > maxEdad) {
      console.log(`⏰ Caché expirado: ${clave}`);
      delete this.state.datosCache[clave];
      return null;
    }

    console.log(`✅ Datos obtenidos de caché: ${clave}`);
    return cache.datos;
  },

  limpiarCache() {
    this.state.datosCache = {};
    console.log('🗑️ Caché limpiado');
  }
};