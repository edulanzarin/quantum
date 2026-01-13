// ============================================
// config_planos.js - Versão refatorada com utilitários
// ============================================

const elementos = {
    planosTbody: document.getElementById('planos-tbody'),
    inputBusca: document.getElementById('input-busca'),
    btnNovoPlano: document.getElementById('btn-novo-plano')
};

let planos = [
    { cod: "1", nome: "Padrão" },
    { cod: "2", nome: "Simplificado" },
    { cod: "3", nome: "Detalhado" },
    { cod: "4", nome: "Resumido" },
    { cod: "5", nome: "Personalizado A" }
];

// ============================================
// INICIALIZAÇÃO
// ============================================

function inicializar() {
    carregarPlanos();
    configurarEventos();
}

// ============================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================

function configurarEventos() {
    elementos.btnNovoPlano.addEventListener('click', () => {
        window.Sistema.Navegacao.irPara('../add_planos/add_planos.html');
    });

    elementos.inputBusca.addEventListener('input', () => {
        const filtrados = window.Sistema.Tabela.filtrar(
            planos,
            elementos.inputBusca.value,
            ['cod', 'nome']
        );
        renderizarPlanos(filtrados);
    });
}

// ============================================
// CARREGAMENTO DE DADOS
// ============================================

function carregarPlanos() {
    console.log('Carregando planos...');

    // TODO: Buscar planos do backend
    // window.Sistema.Funcoes.listarPlanos();

    renderizarPlanos(planos);
}

// ============================================
// RENDERIZAÇÃO
// ============================================

function renderizarPlanos(planosParaExibir) {
    if (planosParaExibir.length === 0) {
        window.Sistema.Tabela.renderizarVazio(
            elementos.planosTbody,
            3,
            'Nenhum plano encontrado',
            'Crie seu primeiro plano de conferência'
        );
        return;
    }

    elementos.planosTbody.innerHTML = planosParaExibir.map(plano => `
        <tr>
            <td><span class="plano-codigo">${plano.cod}</span></td>
            <td>${plano.nome}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon edit" onclick="editarPlano('${plano.cod}')" title="Editar">
                        <span class="material-icons-round">edit</span>
                    </button>
                    <button class="btn-icon delete" onclick="excluirPlano('${plano.cod}')" title="Excluir">
                        <span class="material-icons-round">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================
// OPERAÇÕES DE PLANO
// ============================================

function editarPlano(planoId) {
    console.log('Editando plano:', planoId);
    window.Sistema.Navegacao.irPara(`../add_planos/add_planos.html?id=${planoId}`);
}

function excluirPlano(planoId) {
    const plano = planos.find(p => p.cod === planoId);

    if (!plano) return;

    window.Sistema.Confirmacao.excluir(plano.nome, () => {
        console.log('Excluindo plano:', planoId);

        // TODO: Enviar requisição para backend
        // window.Sistema.Funcoes.excluirPlano(planoId);

        planos = planos.filter(p => p.cod !== planoId);
        renderizarPlanos(planos);

        window.Sistema.Toast.success('Plano excluído', `O plano "${plano.nome}" foi excluído com sucesso.`);
    });
}

// Torna funções acessíveis globalmente
window.editarPlano = editarPlano;
window.excluirPlano = excluirPlano;

// ============================================
// INICIAR
// ============================================

inicializar();