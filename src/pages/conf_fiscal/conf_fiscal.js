/**
 * Conferência Fiscal - Módulo Principal
 * Gerencia a interface de geração de relatórios fiscais
 */

/* Elementos do DOM */
const Elements = {
  // Inputs principais
  inputEmpresa: document.getElementById("input-codigoEmpresa"),
  inputNome: document.getElementById("input-nomeEmpresa"),
  inputDataIni: document.getElementById("data-ini"),
  inputDataFim: document.getElementById("data-fim"),
  inputCodPlano: document.getElementById("input-codigoPlano"),
  selectNomePlano: document.getElementById("select-nomePlano"),
  inputCaminho: document.getElementById("input-caminho"),

  // Botões
  btnBuscarEmpresa: document.getElementById("btn-buscar-empresa"),
  btnProcurar: document.getElementById("btn-procurar"),
  btnExecutar: document.getElementById("btn-executar"),

  // Modal
  modalEmpresa: document.getElementById("modal-selecao-empresa"),
  modalInputFiltro: document.getElementById("modal-input-filtro"),
  modalTbody: document.getElementById("modal-lista-tbody"),
  modalContador: document.getElementById("modal-contador"),
  btnConfirmarSelecao: document.getElementById("btn-confirmar-selecao"),
  btnsFecharModal: document.querySelectorAll(".btn-close-modal"),
};

/* Estado da aplicação */
const AppState = {
  empresaSelecionadaTemp: null,
};

/**
 * Inicializa o módulo carregando dados e configurando eventos
 */
function inicializar() {
  carregarEmpresas();
  carregarPlanos();
  configurarEventos();
}

/**
 * Solicita a lista de empresas do backend
 */
function carregarEmpresas() {
  window.Sistema.Funcoes.solicitarEmpresas();

  window.api.aoReceberResposta((respostaTexto) => {
    try {
      const json = JSON.parse(respostaTexto);

      if (json.sucesso && json.dados && Array.isArray(json.dados)) {
        window.Sistema.Dados.empresas = json.dados;
        console.log(`Empresas carregadas: ${json.dados.length}`);
      } else {
        window.Sistema.Toast.error(
          "Erro no Sistema",
          json.erro || "Erro ao carregar empresas."
        );
      }
    } catch (e) {
      window.Sistema.Toast.error(
        "Erro de Processamento",
        "Não foi possível ler a resposta do servidor."
      );
      console.error("Erro JSON:", e);
    }
  });
}

/**
 * Preenche os campos de empresa com os dados fornecidos
 * @param {Object} empresa - Objeto contendo cod e nome da empresa
 */
function preencherCamposEmpresa(empresa) {
  Elements.inputEmpresa.value = empresa.cod;
  Elements.inputNome.value = empresa.nome;
}

/**
 * Tenta preencher automaticamente os campos de empresa baseado no valor digitado
 * @param {HTMLElement} campo - Campo que disparou o evento (código ou nome)
 */
function autoPreencherEmpresa(campo) {
  const empresas = window.Sistema.Dados.empresas || [];
  const valor = campo.value.trim();

  if (!valor) return;

  let empresaEncontrada = null;

  if (campo === Elements.inputEmpresa) {
    empresaEncontrada = empresas.find((emp) => emp.cod.toString() === valor);
  } else if (campo === Elements.inputNome) {
    empresaEncontrada = empresas.find(
      (emp) => emp.nome.toLowerCase() === valor.toLowerCase()
    );

    if (!empresaEncontrada) {
      empresaEncontrada = empresas.find((emp) =>
        emp.nome.toLowerCase().includes(valor.toLowerCase())
      );
    }
  }

  if (empresaEncontrada) {
    preencherCamposEmpresa(empresaEncontrada);
  }
}

/**
 * Carrega a lista de planos de contas disponíveis
 * TODO: Substituir por chamada real da API
 */
function carregarPlanos() {
  setTimeout(() => {
    const planos = [
      { cod: "1", nome: "Padrão" },
      { cod: "2", nome: "Simplificado" },
      { cod: "3", nome: "Detalhado" },
      { cod: "4", nome: "Resumido" },
      { cod: "5", nome: "Personalizado A" },
    ];

    preencherSelectPlanos(planos);
  }, 100);
}

/**
 * Popula o select de planos com as opções fornecidas
 * @param {Array} planos - Array de objetos {cod, nome}
 */
function preencherSelectPlanos(planos) {
  Elements.selectNomePlano.innerHTML =
    '<option value="" disabled selected></option>';

  planos.forEach((plano) => {
    const option = document.createElement("option");
    option.value = plano.cod;
    option.textContent = plano.nome;
    option.dataset.codigo = plano.cod;
    Elements.selectNomePlano.appendChild(option);
  });
}

/**
 * Sincroniza o select de planos com o código digitado manualmente
 */
function sincronizarPlanoPorCodigo() {
  const codigoDigitado = Elements.inputCodPlano.value.trim();

  if (!codigoDigitado) return;

  const options = Elements.selectNomePlano.querySelectorAll("option");
  let encontrou = false;

  for (let option of options) {
    if (
      option.value === codigoDigitado ||
      option.dataset.codigo === codigoDigitado
    ) {
      Elements.selectNomePlano.value = option.value;
      encontrou = true;
      break;
    }
  }

  if (!encontrou) {
    window.Sistema.Toast.warning(
      "Plano não encontrado",
      `O código de plano ${codigoDigitado} não existe.`
    );
  }
}

/**
 * Abre o modal de seleção de empresas
 */
function abrirModalEmpresa() {
  Elements.modalEmpresa.classList.remove("hidden");
  AppState.empresaSelecionadaTemp = null;
  atualizarBotaoConfirmar();
  Elements.modalInputFiltro.value = "";
  renderizarListaModal();
  setTimeout(() => Elements.modalInputFiltro.focus(), 100);
}

/**
 * Fecha o modal de seleção de empresas
 */
function fecharModalEmpresa() {
  Elements.modalEmpresa.classList.add("hidden");
}

/**
 * Renderiza a lista de empresas no modal com filtro opcional
 * @param {string} termo - Termo de busca para filtrar empresas
 */
function renderizarListaModal(termo = "") {
  Elements.modalTbody.innerHTML = "";

  const empresas = window.Sistema.Dados.empresas || [];
  const termoLower = termo.toLowerCase();

  const filtradas = empresas.filter(
    (emp) =>
      emp.cod.toString().includes(termoLower) ||
      emp.nome.toLowerCase().includes(termoLower)
  );

  filtradas.forEach((emp) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${emp.cod}</strong></td>
      <td>${emp.nome}</td>
    `;

    tr.addEventListener("click", () => selecionarLinha(tr, emp));
    tr.addEventListener("dblclick", () => {
      selecionarLinha(tr, emp);
      confirmarSelecaoEmpresa();
    });

    Elements.modalTbody.appendChild(tr);
  });

  Elements.modalContador.textContent = `${filtradas.length} empresas listadas`;
}

/**
 * Marca uma linha como selecionada no modal
 * @param {HTMLElement} tr - Elemento TR da linha clicada
 * @param {Object} empresa - Dados da empresa selecionada
 */
function selecionarLinha(tr, empresa) {
  const anterior = Elements.modalTbody.querySelector(".selected");
  if (anterior) anterior.classList.remove("selected");

  tr.classList.add("selected");
  AppState.empresaSelecionadaTemp = empresa;
  atualizarBotaoConfirmar();
}

/**
 * Atualiza o estado do botão confirmar baseado na seleção
 */
function atualizarBotaoConfirmar() {
  if (AppState.empresaSelecionadaTemp) {
    Elements.btnConfirmarSelecao.removeAttribute("disabled");
  } else {
    Elements.btnConfirmarSelecao.setAttribute("disabled", "true");
  }
}

/**
 * Confirma a seleção de empresa e fecha o modal
 */
function confirmarSelecaoEmpresa() {
  if (AppState.empresaSelecionadaTemp) {
    preencherCamposEmpresa(AppState.empresaSelecionadaTemp);
    fecharModalEmpresa();
    Elements.inputDataIni.focus();
  }
}

/**
 * Abre o diálogo de seleção de pasta do sistema
 */
async function selecionarPasta() {
  const caminho = await window.Sistema.Funcoes.selecionarPasta();
  if (caminho) {
    Elements.inputCaminho.value = caminho;
    Elements.inputCaminho.dispatchEvent(new Event("input"));
  }
}

/**
 * Valida e executa a geração do relatório fiscal
 */
function executarRelatorio() {
  const camposObrigatorios = [
    Elements.inputEmpresa.value,
    Elements.inputDataIni.value,
    Elements.inputDataFim.value,
    Elements.selectNomePlano.value,
    Elements.inputCaminho.value,
  ];

  if (camposObrigatorios.some((campo) => !campo)) {
    window.Sistema.Toast.warning(
      "Campos obrigatórios",
      "Preencha todos os campos para processar o relatório."
    );
    return;
  }

  window.Sistema.Toast.info("Processando", "Gerando relatório...");

  // TODO: Implementar chamada ao backend
  // window.Sistema.Funcoes.gerarRelatorio({
  //   empresa: Elements.inputEmpresa.value,
  //   dataIni: Elements.inputDataIni.value,
  //   dataFim: Elements.inputDataFim.value,
  //   plano: Elements.selectNomePlano.value,
  //   tipo: document.getElementById("select-tipo").value,
  //   formato: document.getElementById("select-formato").value,
  //   caminho: Elements.inputCaminho.value
  // });
}

/**
 * Configura todos os event listeners da página
 */
function configurarEventos() {
  // Eventos do campo empresa
  Elements.inputEmpresa.addEventListener("blur", () =>
    setTimeout(() => autoPreencherEmpresa(Elements.inputEmpresa), 100)
  );

  Elements.inputEmpresa.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      autoPreencherEmpresa(Elements.inputEmpresa);
      Elements.inputNome.focus();
    }
  });

  // Eventos do campo nome
  Elements.inputNome.addEventListener("blur", () =>
    setTimeout(() => autoPreencherEmpresa(Elements.inputNome), 100)
  );

  Elements.inputNome.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      autoPreencherEmpresa(Elements.inputNome);
    }
  });

  // Eventos de plano de contas
  Elements.selectNomePlano.addEventListener("change", () => {
    const optionSelecionada =
      Elements.selectNomePlano.options[Elements.selectNomePlano.selectedIndex];
    Elements.inputCodPlano.value =
      optionSelecionada.dataset.codigo || Elements.selectNomePlano.value;
  });

  Elements.inputCodPlano.addEventListener("blur", sincronizarPlanoPorCodigo);

  Elements.inputCodPlano.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sincronizarPlanoPorCodigo();
    }
  });

  // Eventos dos botões principais
  Elements.btnBuscarEmpresa.addEventListener("click", abrirModalEmpresa);
  Elements.btnProcurar.addEventListener("click", selecionarPasta);
  Elements.btnExecutar.addEventListener("click", executarRelatorio);

  // Eventos do modal
  Elements.btnsFecharModal.forEach((btn) => {
    btn.addEventListener("click", fecharModalEmpresa);
  });

  Elements.modalEmpresa.addEventListener("click", (e) => {
    if (e.target === Elements.modalEmpresa) {
      fecharModalEmpresa();
    }
  });

  Elements.modalInputFiltro.addEventListener("input", (e) => {
    renderizarListaModal(e.target.value);
  });

  Elements.btnConfirmarSelecao.addEventListener(
    "click",
    confirmarSelecaoEmpresa
  );
}

// Inicializa a aplicação quando o DOM estiver pronto
inicializar();
