const inputEmpresa = document.getElementById('input-codigoEmpresa');
const inputNome = document.getElementById('input-nomeEmpresa');
const inputDataIni = document.getElementById('data-ini');
const inputDataFim = document.getElementById('data-fim');
const inputCodPlano = document.getElementById('input-codigoPlano');
const selectNomePlano = document.getElementById('select-nomePlano');

const logArea = document.getElementById('log-area');

// Solicita empresas ao iniciar
window.Sistema.Funcoes.solicitarEmpresas();

window.api.aoReceberResposta((respostaTexto) => {
    try {
        const json = JSON.parse(respostaTexto);

        if (json.sucesso) {
            if (json.dados && Array.isArray(json.dados)) {
                window.Sistema.Dados.empresas = json.dados;
                console.log(`Empresas carregadas: ${json.dados.length}`);
            }
        } else {
            window.Sistema.Toast.error("Erro no Sistema", json.erro || "Erro ao carregar empresas.");
        }
    } catch (e) {
        window.Sistema.Toast.error("Erro de Processamento", "Não foi possível ler a resposta do servidor.");
        console.error("Erro JSON:", e);
    }
});

function configurarAutocomplete(inputPrincipal, listaElemento, tipo) {
    inputPrincipal.addEventListener('input', () => {
        const texto = inputPrincipal.value.trim().toLowerCase();
        listaElemento.innerHTML = '';

        if (!texto) {
            listaElemento.style.display = 'none';
            return;
        }

        const todasEmpresas = window.Sistema.Dados.empresas || [];
        let sugestoes = [];

        if (tipo === 'cod') {
            sugestoes = todasEmpresas.filter(emp =>
                emp.cod.toString().startsWith(texto)
            );
        } else {
            sugestoes = todasEmpresas.filter(emp =>
                emp.nome.toLowerCase().includes(texto)
            );
        }

        if (sugestoes.length > 0) {
            listaElemento.style.display = 'block';

            sugestoes.slice(0, 15).forEach(emp => {
                const li = document.createElement('li');

                if (tipo === 'cod') {
                    li.innerHTML = `
                        <span style="display: flex; justify-content: center; align-items: center;">
                            <span class="badge-cod" style="font-weight: bold; font-size: 1.1em;">${emp.cod}</span>
                        </span>`;
                } else {
                    li.innerHTML = `<span>${emp.nome}</span>`;
                }

                li.addEventListener('click', () => {
                    preencherCampos(emp);
                    esconderListas();
                });

                listaElemento.appendChild(li);
            });
        } else {
            listaElemento.style.display = 'none';
        }
    });
}

function preencherCampos(empresa) {
    inputEmpresa.value = empresa.cod;
    inputNome.value = empresa.nome;
}

function autoPreencherEmpresa(campo) {
    const todasEmpresas = window.Sistema.Dados.empresas || [];
    const valor = campo.value.trim();

    if (!valor) return;

    let empresaEncontrada = null;

    if (campo === inputEmpresa) {
        // Busca exata pelo código
        empresaEncontrada = todasEmpresas.find(emp => emp.cod.toString() === valor);
    } else if (campo === inputNome) {
        // Busca exata ou parcial pelo nome
        empresaEncontrada = todasEmpresas.find(emp => emp.nome.toLowerCase() === valor.toLowerCase());

        if (!empresaEncontrada) {
            empresaEncontrada = todasEmpresas.find(emp => emp.nome.toLowerCase().includes(valor.toLowerCase()));
        }
    }

    if (empresaEncontrada) {
        preencherCampos(empresaEncontrada);
    }
}

// Eventos Empresa
inputEmpresa.addEventListener('blur', () => setTimeout(() => autoPreencherEmpresa(inputEmpresa), 100));
inputEmpresa.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        autoPreencherEmpresa(inputEmpresa);
        inputNome.focus();
    }
});

inputNome.addEventListener('blur', () => setTimeout(() => autoPreencherEmpresa(inputNome), 100));
inputNome.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        autoPreencherEmpresa(inputNome);
    }
});

// === PLANO DE CONFERÊNCIA ===

function preencherSelectPlanos(planos) {
    selectNomePlano.innerHTML = '<option value="" disabled selected></option>';

    planos.forEach(plano => {
        const option = document.createElement('option');
        option.value = plano.cod;
        option.textContent = plano.nome;
        option.dataset.codigo = plano.cod;
        selectNomePlano.appendChild(option);
    });
}

// Simulação de carregamento de planos
setTimeout(() => {
    const planosTemporarios = [
        { cod: "1", nome: "Padrão" },
        { cod: "2", nome: "Simplificado" },
        { cod: "3", nome: "Detalhado" },
        { cod: "4", nome: "Resumido" },
        { cod: "5", nome: "Personalizado A" }
    ];
    preencherSelectPlanos(planosTemporarios);
}, 100);

function sincronizarPlanoPorCodigo() {
    const codigoDigitado = inputCodPlano.value.trim();
    if (!codigoDigitado) return;

    const options = selectNomePlano.querySelectorAll('option');
    let encontrou = false;

    for (let option of options) {
        if (option.value === codigoDigitado || option.dataset.codigo === codigoDigitado) {
            selectNomePlano.value = option.value;
            encontrou = true;
            break;
        }
    }

    if (!encontrou) {
        // ADICIONADO: Toast de aviso quando o código do plano não existe
        window.Sistema.Toast.warning("Plano não encontrado", `O código de plano ${codigoDigitado} não existe.`);
    }
}

selectNomePlano.addEventListener('change', () => {
    const optionSelecionada = selectNomePlano.options[selectNomePlano.selectedIndex];
    inputCodPlano.value = optionSelecionada.dataset.codigo || selectNomePlano.value;
});

inputCodPlano.addEventListener('blur', () => sincronizarPlanoPorCodigo());
inputCodPlano.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sincronizarPlanoPorCodigo();
    }
});

// Botão de procurar pasta
const btnProcurar = document.getElementById('btn-procurar');
const inputCaminho = document.getElementById('input-caminho');

btnProcurar.addEventListener('click', async () => {
    const caminho = await window.Sistema.Funcoes.selecionarPasta();
    if (caminho) {
        inputCaminho.value = caminho;
        inputCaminho.dispatchEvent(new Event('input'));
    }
});

function mostrarCarregamento() {
    logArea.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Gerando relatório...</p>
            <small style="color: #6c757d;">Isso pode levar alguns minutos</small>
        </div>
    `;
}

const btnExecutar = document.getElementById('btn-executar');
const btnVoltar = document.getElementById('btn-voltar');
const formBody = document.querySelector('.card-body');
const loadingArea = document.getElementById('loading-area');
const successArea = document.getElementById('success-area');

// Simulação de Execução
btnExecutar.addEventListener('click', () => {
    // 1. Esconde o form
    formBody.classList.add('hidden');

    // 2. Mostra Spinner
    loadingArea.classList.remove('hidden');

    // 3. Simula processo (aqui entraria sua chamada Python/Backend)
    setTimeout(() => {
        // Quando terminar:
        loadingArea.classList.add('hidden');
        successArea.classList.remove('hidden');
    }, 3000); // 3 segundos simulados
});

// Botão para resetar e fazer nova consulta
btnVoltar.addEventListener('click', () => {
    successArea.classList.add('hidden');
    formBody.classList.remove('hidden');
    // Opcional: limpar campos
    // document.querySelector('form').reset(); 
});

/* ==========================================
   LÓGICA DO MODAL DE SELEÇÃO DE EMPRESAS
   ========================================== */

const modalEmpresa = document.getElementById('modal-selecao-empresa');
const btnBuscarEmpresa = document.getElementById('btn-buscar-empresa');
const modalInputFiltro = document.getElementById('modal-input-filtro');
const modalTbody = document.getElementById('modal-lista-tbody');
const modalContador = document.getElementById('modal-contador');
const btnConfirmarSelecao = document.getElementById('btn-confirmar-selecao');
const btnsFecharModal = document.querySelectorAll('.btn-close-modal');

let empresaSelecionadaTemp = null; // Guarda a seleção antes de confirmar

// 1. Abrir Modal
btnBuscarEmpresa.addEventListener('click', () => {
    modalEmpresa.classList.remove('hidden');
    empresaSelecionadaTemp = null;
    atualizarEstadoBotaoConfirmar();

    // Limpa filtro e foca
    modalInputFiltro.value = '';
    renderizarListaModal(); // Renderiza todas ou as filtradas
    setTimeout(() => modalInputFiltro.focus(), 100);
});

// 2. Fechar Modal
btnsFecharModal.forEach(btn => {
    btn.addEventListener('click', () => {
        modalEmpresa.classList.add('hidden');
    });
});

// Fechar ao clicar fora (Overlay)
modalEmpresa.addEventListener('click', (e) => {
    if (e.target === modalEmpresa) {
        modalEmpresa.classList.add('hidden');
    }
});

// 3. Renderizar Lista na Tabela
function renderizarListaModal(termo = '') {
    modalTbody.innerHTML = '';
    const todasEmpresas = window.Sistema.Dados.empresas || [];
    const termoLower = termo.toLowerCase();

    // Filtrar
    const filtradas = todasEmpresas.filter(emp =>
        emp.cod.toString().includes(termoLower) ||
        emp.nome.toLowerCase().includes(termoLower)
    );

    // Preencher Tabela
    filtradas.forEach(emp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${emp.cod}</strong></td>
            <td>${emp.nome}</td>
        `;

        // Evento de clique (Seleção única)
        tr.addEventListener('click', () => {
            selecionarLinha(tr, emp);
        });

        // Evento de clique duplo (Seleciona e Confirma)
        tr.addEventListener('dblclick', () => {
            selecionarLinha(tr, emp);
            confirmarSelecaoEmpresa();
        });

        modalTbody.appendChild(tr);
    });

    modalContador.textContent = `${filtradas.length} empresas listadas`;
}

// 4. Lógica de Seleção Visual
function selecionarLinha(tr, empresa) {
    // Remove seleção anterior
    const anterior = modalTbody.querySelector('.selected');
    if (anterior) anterior.classList.remove('selected');

    // Adiciona nova seleção
    tr.classList.add('selected');
    empresaSelecionadaTemp = empresa;
    atualizarEstadoBotaoConfirmar();
}

function atualizarEstadoBotaoConfirmar() {
    if (empresaSelecionadaTemp) {
        btnConfirmarSelecao.removeAttribute('disabled');
    } else {
        btnConfirmarSelecao.setAttribute('disabled', 'true');
    }
}

// 5. Filtro em Tempo Real
modalInputFiltro.addEventListener('input', (e) => {
    renderizarListaModal(e.target.value);
});

// 6. Confirmar Seleção
function confirmarSelecaoEmpresa() {
    if (empresaSelecionadaTemp) {
        // Usa a função existente do seu código para preencher
        preencherCampos(empresaSelecionadaTemp);
        modalEmpresa.classList.add('hidden');

        // Opcional: focar no próximo campo (Data Inicial)
        document.getElementById('data-ini').focus();
    }
}

btnConfirmarSelecao.addEventListener('click', confirmarSelecaoEmpresa);