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