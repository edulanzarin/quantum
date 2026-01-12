const inputEmpresa = document.getElementById('input-codigoEmpresa');
const inputNome = document.getElementById('input-nomeEmpresa');
const inputDataIni = document.getElementById('data-ini');
const inputDataFim = document.getElementById('data-fim');
const inputCodPlano = document.getElementById('input-codigoPlano');
const selectNomePlano = document.getElementById('select-nomePlano');

const listaSugestoesCod = document.getElementById('lista-sugestoes-cod');
const listaSugestoesNome = document.getElementById('lista-sugestoes-nome');
const logArea = document.getElementById('log-area');

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
            console.error("Erro Python:", json.erro);
        }
    } catch (e) {
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

function esconderListas() {
    listaSugestoesCod.style.display = 'none';
    listaSugestoesNome.style.display = 'none';
}

// Auto-preenchimento ao perder foco ou pressionar Enter - EMPRESA
function autoPreencherEmpresa(campo) {
    const todasEmpresas = window.Sistema.Dados.empresas || [];
    const valor = campo.value.trim();

    if (!valor) return;

    let empresaEncontrada = null;

    if (campo === inputEmpresa) {
        // Busca por código
        empresaEncontrada = todasEmpresas.find(emp =>
            emp.cod.toString() === valor
        );
    } else if (campo === inputNome) {
        // Busca por nome (exato ou similar)
        empresaEncontrada = todasEmpresas.find(emp =>
            emp.nome.toLowerCase() === valor.toLowerCase()
        );

        // Se não encontrou exato, busca o primeiro que contém
        if (!empresaEncontrada) {
            empresaEncontrada = todasEmpresas.find(emp =>
                emp.nome.toLowerCase().includes(valor.toLowerCase())
            );
        }
    }

    if (empresaEncontrada) {
        preencherCampos(empresaEncontrada);
        esconderListas();
    }
}

// Eventos para código da empresa
inputEmpresa.addEventListener('blur', () => {
    setTimeout(() => autoPreencherEmpresa(inputEmpresa), 100);
});

inputEmpresa.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        autoPreencherEmpresa(inputEmpresa);
        esconderListas();
    }
});

// Eventos para nome da empresa
inputNome.addEventListener('blur', () => {
    setTimeout(() => autoPreencherEmpresa(inputNome), 100);
});

inputNome.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        autoPreencherEmpresa(inputNome);
        esconderListas();
    }
});

// Configuração do autocomplete
configurarAutocomplete(inputEmpresa, listaSugestoesCod, 'cod');
configurarAutocomplete(inputNome, listaSugestoesNome, 'nome');

document.addEventListener('click', (e) => {
    if (e.target !== inputEmpresa && e.target !== inputNome) {
        esconderListas();
    }
});

// === PLANO DE CONFERÊNCIA ===

// ====== DADOS DE TESTE - PLANOS ======
const planosTemporarios = [
    { cod: "1", nome: "Padrão" },
    { cod: "2", nome: "Simplificado" },
    { cod: "3", nome: "Detalhado" },
    { cod: "4", nome: "Resumido" },
    { cod: "5", nome: "Personalizado A" }
];

// Preenche o select com os dados de teste
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

// Carrega planos de teste
setTimeout(() => {
    const planosTemporarios = [
        { cod: "1", nome: "Padrão" },
        { cod: "2", nome: "Simplificado" },
        { cod: "3", "nome": "Detalhado" },
        { cod: "4", nome: "Resumido" },
        { cod: "5", nome: "Personalizado A" }
    ];
    preencherSelectPlanos(planosTemporarios);
}, 100);

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
        console.log(`Plano com código ${codigoDigitado} não encontrado`);
    }
}

selectNomePlano.addEventListener('change', () => {
    const optionSelecionada = selectNomePlano.options[selectNomePlano.selectedIndex];

    if (optionSelecionada && optionSelecionada.dataset.codigo) {
        inputCodPlano.value = optionSelecionada.dataset.codigo;
    } else {
        inputCodPlano.value = selectNomePlano.value;
    }
});

inputCodPlano.addEventListener('blur', () => {
    sincronizarPlanoPorCodigo();
});

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

// Botão de configurar plano
const btnConfigPlano = document.getElementById('btn-config-plano');

btnConfigPlano.addEventListener('click', () => {
    const planoId = selectNomePlano.value;

    if (!planoId) {
        alert('Por favor, selecione um plano antes de configurar.');
        return;
    }

    // Navega para a página de configuração passando o ID como parâmetro
    window.location.href = `../config_plano/config_plano.html?id=${planoId}`;
});

// Mostra estado de carregamento
function mostrarCarregamento() {
    logArea.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Gerando relatório...</p>
            <small style="color: #6c757d;">Isso pode levar alguns minutos</small>
        </div>
    `;
}