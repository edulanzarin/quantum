window.Sistema = window.Sistema || {};

window.Sistema.Dados = {
    empresas: []
};

window.Sistema.Funcoes = {
    solicitarEmpresas: function () {
        console.log("[Sistema] Solicitando lista de empresas ao Python...");
        if (window.api) {
            window.api.rodarPython({
                modulo: 'geral',
                acao: 'listar_empresas',
                dados: {}
            });
        } else {
            console.error("Erro: API do Electron não carregada.");
        }
    },

    filtrarEmpresas: function (textoDigitado) {
        if (!window.Sistema.Dados.empresas.length) return [];

        textoDigitado = textoDigitado.toLowerCase();

        return window.Sistema.Dados.empresas.filter(emp =>
            String(emp.cod).toLowerCase().includes(textoDigitado) ||
            String(emp.texto_exibicao).toLowerCase().includes(textoDigitado)
        ).slice(0, 10);
    }
};

/* ============================================
   SISTEMA DE NOTIFICAÇÕES TOAST
   ============================================ */

window.Sistema.Toast = {
    container: null,

    // Inicializa o container de toasts (chamado automaticamente)
    init: function () {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    // Cria um toast genérico
    show: function (options) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast ${options.type || 'info'}`;

        // Ícones para cada tipo
        const icons = {
            success: 'check_circle',
            error: 'cancel',
            warning: 'warning',
            info: 'info'
        };

        const icon = icons[options.type] || 'info';

        toast.innerHTML = `
            <div class="toast-icon">
                <span class="material-icons-round" style="font-size: 20px;">${icon}</span>
            </div>
            <div class="toast-content">
                ${options.title ? `<div class="toast-title">${options.title}</div>` : ''}
                ${options.message ? `<div class="toast-message">${options.message}</div>` : ''}
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <span class="material-icons-round" style="font-size: 18px;">close</span>
            </button>
        `;

        this.container.appendChild(toast);

        // Remove automaticamente após o tempo especificado (padrão: 4 segundos)
        const duration = options.duration !== undefined ? options.duration : 4000;

        if (duration > 0) {
            setTimeout(() => {
                toast.classList.add('removing');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    },

    // Atalhos para tipos específicos
    success: function (title, message, duration) {
        return this.show({
            type: 'success',
            title: title,
            message: message,
            duration: duration
        });
    },

    error: function (title, message, duration) {
        return this.show({
            type: 'error',
            title: title,
            message: message,
            duration: duration
        });
    },

    warning: function (title, message, duration) {
        return this.show({
            type: 'warning',
            title: title,
            message: message,
            duration: duration
        });
    },

    info: function (title, message, duration) {
        return this.show({
            type: 'info',
            title: title,
            message: message,
            duration: duration
        });
    }
};

/* ============================================
   ADICIONAR AO FINAL DO global.js EXISTENTE
   ============================================ */

/* ============================================
   UTILITÁRIOS DE MODAL
   ============================================ */

window.Sistema.Modal = {
    // Abre um modal
    abrir: function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
        }
    },

    // Fecha um modal
    fechar: function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    },

    // Limpa campos de um modal
    limparCampos: function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const inputs = modal.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        }
    },

    // Configura fechamento ao clicar fora
    configurarFechamentoExterno: function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.fechar(modalId);
                }
            });
        }
    }
};

/* ============================================
   UTILITÁRIOS DE TABELA
   ============================================ */

window.Sistema.Tabela = {
    // Renderiza estado vazio
    renderizarVazio: function (tbody, colspan, titulo, mensagem) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}">
                    <div class="empty-state">
                        <span class="material-icons-round">folder_open</span>
                        <h3>${titulo}</h3>
                        <p>${mensagem}</p>
                    </div>
                </td>
            </tr>
        `;
    },

    // Filtra dados baseado em múltiplos campos
    filtrar: function (dados, termo, campos) {
        if (!termo) return dados;

        termo = termo.toLowerCase().trim();

        return dados.filter(item => {
            return campos.some(campo => {
                const valor = item[campo];
                if (Array.isArray(valor)) {
                    return valor.some(v => String(v).toLowerCase().includes(termo));
                }
                return String(valor).toLowerCase().includes(termo);
            });
        });
    }
};

/* ============================================
   UTILITÁRIOS DE VALIDAÇÃO
   ============================================ */

window.Sistema.Validacao = {
    // Valida se campos estão preenchidos
    camposObrigatorios: function (campos) {
        const camposVazios = [];

        campos.forEach(campo => {
            const valor = campo.value.trim();
            if (!valor) {
                camposVazios.push(campo.placeholder || campo.name || 'Campo');
            }
        });

        if (camposVazios.length > 0) {
            window.Sistema.Toast.warning(
                'Campos obrigatórios',
                `Preencha: ${camposVazios.join(', ')}`
            );
            return false;
        }

        return true;
    }
};

/* ============================================
   UTILITÁRIOS DE NAVEGAÇÃO
   ============================================ */

window.Sistema.Navegacao = {
    // Redireciona com confirmação se houver mudanças
    irPara: function (url, forcar = false) {
        if (forcar) {
            window.location.href = url;
            return;
        }

        // Pode adicionar lógica de verificação de mudanças aqui
        window.location.href = url;
    },

    // Volta para página anterior
    voltar: function () {
        window.history.back();
    },

    // Recarrega página
    recarregar: function () {
        window.location.reload();
    }
};

/* ============================================
   UTILITÁRIOS DE CONFIRMAÇÃO
   ============================================ */

window.Sistema.Confirmacao = {
    // Confirma exclusão
    excluir: function (itemNome, callback) {
        if (confirm(`Deseja realmente excluir "${itemNome}"?`)) {
            callback();
        }
    },

    // Confirma ação genérica
    acao: function (mensagem, callback) {
        if (confirm(mensagem)) {
            callback();
        }
    }
};

/* ============================================
   UTILITÁRIOS DE FORMATAÇÃO
   ============================================ */

window.Sistema.Formato = {
    // Formata número com separadores
    numero: function (valor, decimais = 2) {
        return Number(valor).toLocaleString('pt-BR', {
            minimumFractionDigits: decimais,
            maximumFractionDigits: decimais
        });
    },

    // Formata moeda
    moeda: function (valor) {
        return Number(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    },

    // Formata data
    data: function (valor) {
        if (!valor) return '';
        const data = new Date(valor);
        return data.toLocaleDateString('pt-BR');
    }
};