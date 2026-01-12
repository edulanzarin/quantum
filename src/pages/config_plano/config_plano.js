// Captura o ID do plano da URL
const urlParams = new URLSearchParams(window.location.search);
const planoId = urlParams.get('id');

// Elementos da página
const spanCodigo = document.getElementById('plano-codigo');
const spanNome = document.getElementById('plano-nome');
const inputNomePlano = document.getElementById('input-nome-plano');
const inputDescricao = document.getElementById('input-descricao');
const btnVoltar = document.getElementById('btn-voltar');
const btnCancelar = document.getElementById('btn-cancelar');
const btnSalvar = document.getElementById('btn-salvar');

// Verifica se existe ID na URL
if (!planoId) {
    alert('ID do plano não informado!');
    window.location.href = '../conf_fiscal/conf_fiscal.html';
}

// Carrega os dados do plano
function carregarDadosPlano() {
    console.log(`Carregando dados do plano ID: ${planoId}`);

    // TODO: Fazer requisição ao backend para buscar dados do plano
    // window.Sistema.Funcoes.buscarPlano(planoId);

    // DADOS DE TESTE - Remover quando conectar com o banco
    const planosTemporarios = {
        '1': { cod: '1', nome: 'Padrão', descricao: 'Plano de conferência padrão' },
        '2': { cod: '2', nome: 'Simplificado', descricao: 'Plano simplificado' },
        '3': { cod: '3', nome: 'Detalhado', descricao: 'Plano com análise detalhada' },
        '4': { cod: '4', nome: 'Resumido', descricao: 'Plano resumido' },
        '5': { cod: '5', nome: 'Personalizado A', descricao: 'Plano personalizado tipo A' }
    };

    const plano = planosTemporarios[planoId];

    if (plano) {
        preencherFormulario(plano);
    } else {
        alert('Plano não encontrado!');
        window.location.href = '../conf_fiscal/conf_fiscal.html';
    }
}

// Preenche o formulário com os dados do plano
function preencherFormulario(plano) {
    spanCodigo.textContent = plano.cod;
    spanNome.textContent = plano.nome;
    inputNomePlano.value = plano.nome;
    inputDescricao.value = plano.descricao || '';
}

// Botão voltar
btnVoltar.addEventListener('click', () => {
    window.location.href = '../conf_fiscal/conf_fiscal.html';
});

// Botão cancelar
btnCancelar.addEventListener('click', () => {
    if (confirm('Deseja realmente cancelar as alterações?')) {
        window.location.href = '../conf_fiscal/conf_fiscal.html';
    }
});

// Botão salvar
btnSalvar.addEventListener('click', () => {
    const dadosAtualizados = {
        id: planoId,
        nome: inputNomePlano.value.trim(),
        descricao: inputDescricao.value.trim()
    };

    if (!dadosAtualizados.nome) {
        alert('O nome do plano é obrigatório!');
        return;
    }

    console.log('Salvando dados:', dadosAtualizados);

    // TODO: Enviar dados para o backend
    // window.Sistema.Funcoes.atualizarPlano(dadosAtualizados);

    alert('Alterações salvas com sucesso!');
    window.location.href = '../conf_fiscal/conf_fiscal.html';
});

// Carrega os dados ao iniciar
carregarDadosPlano();