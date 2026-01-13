// ============================================
// add_planos.js - Versão refatorada com utilitários
// ============================================

const elementos = {
    inputCodigo: document.getElementById('input-codigo'),
    inputNome: document.getElementById('input-nome'),
    btnCancelar: document.getElementById('btn-cancelar'),
    btnSalvar: document.getElementById('btn-salvar'),
    btnAdicionarMapeamento: document.getElementById('btn-adicionar-mapeamento'),
    mapeamentosTbody: document.getElementById('mapeamentos-tbody'),
    inputBuscaMap: document.getElementById('input-busca-map'),
    pageTitle: document.getElementById('page-title'),
    modalCfop: document.getElementById('modal-cfop'),
    modalConta: document.getElementById('modal-conta'),
    modalTitle: document.getElementById('modal-title'),
    btnConfirmarMap: document.getElementById('btn-confirmar-map')
};

let planoAtual = {
    id: null,
    nome: '',
    mapeamentos: []
};

let estado = {
    modoEdicao: false,
    indexEditando: -1
};

// ============================================
// INICIALIZAÇÃO
// ============================================

function inicializar() {
    const urlParams = new URLSearchParams(window.location.search);
    const planoId = urlParams.get('id');

    if (planoId) {
        elementos.pageTitle.textContent = 'EDITAR PLANO';
        carregarPlano(planoId);
    } else {
        elementos.pageTitle.textContent = 'NOVO PLANO';
        elementos.inputCodigo.value = '(Gerado automaticamente)';
        renderizarMapeamentos();
    }

    configurarEventos();
}

// ============================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================

function configurarEventos() {
    elementos.btnAdicionarMapeamento.addEventListener('click', abrirModal);
    elementos.btnConfirmarMap.addEventListener('click', confirmarMapeamento);
    elementos.btnSalvar.addEventListener('click', salvarPlano);
    elementos.btnCancelar.addEventListener('click', () => {
        window.Sistema.Navegacao.irPara('../config_planos/config_planos.html');
    });
    elementos.inputBuscaMap.addEventListener('input', () => {
        const filtrados = window.Sistema.Tabela.filtrar(
            planoAtual.mapeamentos,
            elementos.inputBuscaMap.value,
            ['cfop', 'contas']
        );
        renderizarMapeamentos(filtrados);
    });

    // Fecha modal ao clicar fora
    window.Sistema.Modal.configurarFechamentoExterno('modal-mapeamento');
}

// ============================================
// CARREGAMENTO DE DADOS
// ============================================

function carregarPlano(id) {
    // TODO: Buscar do backend
    planoAtual = {
        id: id,
        nome: 'Padrão',
        mapeamentos: [
            { cfop: '5102', contas: ['3.1.01.001', '3.1.01.002'] },
            { cfop: '5405', contas: ['3.1.02.001'] },
            { cfop: '6102', contas: ['3.1.01.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001'] },
            { cfop: '6102', contas: ['3.1.01.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001'] },
            { cfop: '6102', contas: ['3.1.01.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001'] },
            { cfop: '6102', contas: ['3.1.01.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001'] },
            { cfop: '6102', contas: ['3.1.01.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001'] },
            { cfop: '6102', contas: ['3.1.01.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001'] },
            { cfop: '6102', contas: ['3.1.01.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001'] },
            { cfop: '6102', contas: ['3.1.01.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001'] },
            { cfop: '6102', contas: ['3.1.01.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001'] },
            { cfop: '6102', contas: ['3.1.01.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001'] },
            { cfop: '6102', contas: ['3.1.01.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001', '3.1.03.001'] }
        ]
    };

    elementos.inputCodigo.value = id;
    elementos.inputNome.value = planoAtual.nome;
    renderizarMapeamentos();
}

// ============================================
// RENDERIZAÇÃO
// ============================================

function renderizarMapeamentos(mapeamentos = planoAtual.mapeamentos) {
    if (mapeamentos.length === 0) {
        window.Sistema.Tabela.renderizarVazio(
            elementos.mapeamentosTbody,
            3,
            'Nenhum mapeamento cadastrado',
            'Adicione o primeiro mapeamento CFOP → Conta Contábil'
        );
        return;
    }

    elementos.mapeamentosTbody.innerHTML = mapeamentos.map((map, index) => `
        <tr>
            <td><span class="cfop-badge">${map.cfop}</span></td>
            <td>
                ${map.contas.map(c => `<span class="conta-badge">${c}</span>`).join('')}
            </td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon edit" onclick="editarMapeamento(${index})" title="Editar">
                        <span class="material-icons-round">edit</span>
                    </button>
                    <button class="btn-icon delete" onclick="excluirMapeamento(${index})" title="Excluir">
                        <span class="material-icons-round">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================
// MODAL
// ============================================

function abrirModal() {
    elementos.modalTitle.textContent = 'Adicionar Mapeamento';
    window.Sistema.Modal.limparCampos('modal-mapeamento');
    estado.modoEdicao = false;
    window.Sistema.Modal.abrir('modal-mapeamento');
}

function fecharModal() {
    window.Sistema.Modal.fechar('modal-mapeamento');
    window.Sistema.Modal.limparCampos('modal-mapeamento');
    estado.modoEdicao = false;
    estado.indexEditando = -1;
}

// Torna funções acessíveis globalmente para os botões inline
window.fecharModal = fecharModal;

// ============================================
// OPERAÇÕES DE MAPEAMENTO
// ============================================

function confirmarMapeamento() {
    const cfop = elementos.modalCfop.value.trim();
    const contasTexto = elementos.modalConta.value.trim();

    // Validação - apenas verifica se está preenchido
    if (!window.Sistema.Validacao.camposObrigatorios([elementos.modalCfop, elementos.modalConta])) {
        return;
    }

    const contas = contasTexto.split(/[,\s]+/).filter(c => c);

    if (estado.modoEdicao) {
        planoAtual.mapeamentos[estado.indexEditando] = { cfop, contas };
        window.Sistema.Toast.success('Mapeamento atualizado', `CFOP ${cfop} foi atualizado.`);
    } else {
        planoAtual.mapeamentos.push({ cfop, contas });
        window.Sistema.Toast.success('Mapeamento adicionado', `CFOP ${cfop} foi adicionado.`);
    }

    renderizarMapeamentos();
    fecharModal();
}

function editarMapeamento(index) {
    const map = planoAtual.mapeamentos[index];
    elementos.modalTitle.textContent = 'Editar Mapeamento';
    elementos.modalCfop.value = map.cfop;
    elementos.modalConta.value = map.contas.join(', ');
    estado.modoEdicao = true;
    estado.indexEditando = index;
    window.Sistema.Modal.abrir('modal-mapeamento');
}

function excluirMapeamento(index) {
    const map = planoAtual.mapeamentos[index];

    window.Sistema.Confirmacao.excluir(`CFOP ${map.cfop}`, () => {
        planoAtual.mapeamentos.splice(index, 1);
        renderizarMapeamentos();
        window.Sistema.Toast.success('Mapeamento excluído', `CFOP ${map.cfop} foi removido.`);
    });
}

// Torna funções acessíveis globalmente
window.editarMapeamento = editarMapeamento;
window.excluirMapeamento = excluirMapeamento;

// ============================================
// SALVAR PLANO
// ============================================

function salvarPlano() {
    const nome = elementos.inputNome.value.trim();

    if (!window.Sistema.Validacao.camposObrigatorios([elementos.inputNome])) {
        return;
    }

    if (planoAtual.mapeamentos.length === 0) {
        window.Sistema.Toast.warning('Sem mapeamentos', 'Adicione pelo menos um mapeamento.');
        return;
    }

    planoAtual.nome = nome;

    // TODO: Enviar para backend
    console.log('Salvando plano:', planoAtual);

    window.Sistema.Toast.success('Plano salvo', `O plano "${nome}" foi salvo com sucesso.`);

    setTimeout(() => {
        window.Sistema.Navegacao.irPara('../config_planos/config_planos.html', true);
    }, 1500);
}

// ============================================
// INICIAR
// ============================================

inicializar();