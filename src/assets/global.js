/**
 * Sistema Global - Gerenciamento de dados e funcionalidades compartilhadas
 */

window.Sistema = window.Sistema || {};

/* Armazenamento de dados globais */
window.Sistema.Dados = {
  empresas: [],
};

/* Funções utilitárias do sistema */
window.Sistema.Funcoes = {
  /**
   * Solicita a lista de empresas do backend Python
   */
  solicitarEmpresas() {
    console.log("[Sistema] Solicitando lista de empresas ao Python...");

    if (window.api) {
      window.api.rodarPython({
        modulo: "geral",
        acao: "listar_empresas",
        dados: {},
      });
    } else {
      console.error("Erro: API do Electron não carregada.");
    }
  },

  /**
   * Filtra empresas baseado no texto digitado
   * @param {string} textoDigitado - Texto para filtrar
   * @returns {Array} Lista filtrada de empresas (máximo 10)
   */
  filtrarEmpresas(textoDigitado) {
    if (!window.Sistema.Dados.empresas.length) return [];

    const termo = textoDigitado.toLowerCase();

    return window.Sistema.Dados.empresas
      .filter(
        (emp) =>
          String(emp.cod).toLowerCase().includes(termo) ||
          String(emp.texto_exibicao).toLowerCase().includes(termo)
      )
      .slice(0, 10);
  },

  /**
   * Abre diálogo para seleção de pasta
   * @returns {Promise<string|null>} Caminho da pasta selecionada ou null
   */
  async selecionarPasta() {
    if (!window.api?.selecionarPasta) {
      console.error("API de seleção de pasta não disponível");
      return null;
    }

    return await window.api.selecionarPasta();
  },

  /**
   * Abre diálogo para seleção de arquivo
   * @param {Object} options - Opções para filtros de arquivo
   * @param {Array} options.filters - Filtros de tipo de arquivo (ex: [{name: 'Excel', extensions: ['xlsx']}])
   * @returns {Promise<string|null>} Caminho do arquivo selecionado ou null
   */
  async selecionarArquivo(options = {}) {
    if (!window.api?.selecionarArquivo) {
      console.error("API de seleção de arquivo não disponível");
      return null;
    }

    return await window.api.selecionarArquivo(options);
  },
};

/* Sistema de notificações Toast */
window.Sistema.Toast = {
  container: null,

  /**
   * Inicializa o container de toasts
   */
  init() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      document.body.appendChild(this.container);
    }
  },

  /**
   * Exibe um toast com as opções fornecidas
   * @param {Object} options - Configurações do toast
   * @param {string} options.type - Tipo do toast (success, error, warning, info)
   * @param {string} options.title - Título do toast
   * @param {string} options.message - Mensagem do toast
   * @param {number} options.duration - Duração em ms (0 = permanente, padrão: 4000)
   * @returns {HTMLElement} Elemento do toast criado
   */
  show(options) {
    this.init();

    const toast = document.createElement("div");
    toast.className = `toast ${options.type || "info"}`;

    const icons = {
      success: "check_circle",
      error: "cancel",
      warning: "warning",
      info: "info",
    };

    const icon = icons[options.type] || "info";

    toast.innerHTML = `
      <div class="toast-icon">
        <span class="material-icons-round" style="font-size: 20px;">${icon}</span>
      </div>
      <div class="toast-content">
        ${
          options.title ? `<div class="toast-title">${options.title}</div>` : ""
        }
        ${
          options.message
            ? `<div class="toast-message">${options.message}</div>`
            : ""
        }
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <span class="material-icons-round" style="font-size: 18px;">close</span>
      </button>
    `;

    this.container.appendChild(toast);

    const duration = options.duration !== undefined ? options.duration : 4000;

    if (duration > 0) {
      setTimeout(() => {
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  },

  /**
   * Exibe toast de sucesso
   */
  success(title, message, duration) {
    return this.show({ type: "success", title, message, duration });
  },

  /**
   * Exibe toast de erro
   */
  error(title, message, duration) {
    return this.show({ type: "error", title, message, duration });
  },

  /**
   * Exibe toast de aviso
   */
  warning(title, message, duration) {
    return this.show({ type: "warning", title, message, duration });
  },

  /**
   * Exibe toast de informação
   */
  info(title, message, duration) {
    return this.show({ type: "info", title, message, duration });
  },
};
