/**
 * Conferência Fiscal
 * Gerencia a interface de geração de relatórios fiscais
 */

/* Elementos do DOM */
const Elements = {
  inputEmpresa: document.getElementById("input-codigoEmpresa"),
  inputNome: document.getElementById("input-nomeEmpresa"),
  inputDataIni: document.getElementById("data-ini"),
  inputDataFim: document.getElementById("data-fim"),
  inputCodPlano: document.getElementById("input-codigoPlano"),
  selectNomePlano: document.getElementById("select-nomePlano"),
  inputCaminho: document.getElementById("input-caminho"),

  btnBuscarEmpresa: document.getElementById("btn-buscar-empresa"),
  btnProcurar: document.getElementById("btn-procurar"),
  btnExecutar: document.getElementById("btn-executar"),

  modalEmpresa: document.getElementById("modal-selecao-empresa"),
  modalInputFiltro: document.getElementById("modal-input-filtro"),
  modalTbody: document.getElementById("modal-lista-tbody"),
  modalContador: document.getElementById("modal-contador"),
  btnConfirmarSelecao: document.getElementById("btn-confirmar-selecao"),
  btnsFecharModal: document.querySelectorAll(".btn-close-modal"),

  cardBalancete: document.getElementById("card-balancete"),
  loaderBalancete: document.getElementById("loader-balancete"),
  containerTabela: document.getElementById("container-tabela"),
  tbodyBalancete: document.getElementById("tbody-balancete"),
};

/* Estado da aplicação */
const AppState = {
  empresaSelecionadaTemp: null,
};

/**
 * Inicializa o módulo carregando dados e configurando eventos
 */
function inicializar() {
  configurarOuvinteBackend();
  carregarEmpresas();
  carregarPlanos();
  configurarEventos();
}

/**
 * Central de recebimento de dados do Python
 * Escuta todas as respostas e distribui para as funções corretas
 */
function configurarOuvinteBackend() {
  window.api.aoReceberResposta((respostaTexto) => {
    try {
      const json = JSON.parse(respostaTexto);
      console.log("[Frontend] Resposta recebida:", json);

      if (!json.sucesso) {
        Elements.loaderBalancete.classList.add("hidden");
        window.Sistema.Toast.error("Erro", json.erro || "Erro desconhecido.");
        return;
      }

      const dados = json.dados;
      const acao = json.acao;

      if (acao === "listar_empresas") {
        processarListaEmpresas(dados);
      } else if (acao === "gerar_bp") {
        finalizarCarregamentoBalancete(dados);
      } else {
        console.warn("[Frontend] Ação não reconhecida:", acao);
      }
    } catch (e) {
      console.error("Erro ao processar resposta do backend:", e);
      Elements.loaderBalancete.classList.add("hidden");
      window.Sistema.Toast.error(
        "Erro de Processamento",
        "Resposta inválida do servidor."
      );
    }
  });
}

/**
 * Processa a lista de empresas recebida do backend
 */
function processarListaEmpresas(dados) {
  if (!Array.isArray(dados)) {
    console.error("[Frontend] Dados de empresas inválidos:", dados);
    window.Sistema.Toast.error(
      "Erro",
      "Formato de dados de empresas inválido."
    );
    return;
  }

  window.Sistema.Dados.empresas = dados;
  console.log(`[Frontend] Empresas carregadas: ${dados.length}`);

  if (dados.length === 0) {
    window.Sistema.Toast.warning(
      "Aviso",
      "Nenhuma empresa encontrada no sistema."
    );
  }
}

/**
 * Solicita a lista de empresas do backend
 */
function carregarEmpresas() {
  console.log("[Frontend] Solicitando empresas...");

  window.api.rodarPython({
    modulo: "geral",
    acao: "listar_empresas",
    dados: {},
  });
}

/**
 * Preenche os campos de empresa com os dados fornecidos
 */
function preencherCamposEmpresa(empresa) {
  Elements.inputEmpresa.value = empresa.cod;
  Elements.inputNome.value = empresa.nome;
}

/**
 * Tenta preencher automaticamente os campos de empresa baseado no valor digitado
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
 * Valida e executa a geração do relatório fiscal
 */
function executarRelatorio() {
  const camposObrigatorios = [
    Elements.inputEmpresa.value,
    Elements.inputDataIni.value,
    Elements.inputDataFim.value,
  ];

  if (camposObrigatorios.some((campo) => !campo)) {
    window.Sistema.Toast.warning("Atenção", "Preencha Empresa e Período.");
    return;
  }

  Elements.cardBalancete.classList.remove("hidden");
  Elements.loaderBalancete.classList.remove("hidden");
  Elements.containerTabela.classList.add("hidden");
  Elements.tbodyBalancete.innerHTML = "";

  Elements.cardBalancete.scrollIntoView({ behavior: "smooth", block: "start" });

  console.log("[Frontend] Solicitando balancete...");

  window.api.rodarPython({
    modulo: "conf_fiscal",
    acao: "gerar_bp",
    dados: {
      empresa: Elements.inputEmpresa.value,
      dataInicio: Elements.inputDataIni.value,
      dataFim: Elements.inputDataFim.value,
    },
  });
}

/**
 * Chamado automaticamente quando os dados do balancete chegam
 */
function finalizarCarregamentoBalancete(listaDados) {
  console.log(
    "[Frontend] Finalizando carregamento do balancete. Registros:",
    listaDados?.length || 0
  );

  Elements.loaderBalancete.classList.add("hidden");
  Elements.containerTabela.classList.remove("hidden");

  renderizarBalancete(listaDados);

  if (listaDados && listaDados.length > 0) {
    window.Sistema.Toast.success(
      "Sucesso",
      `Balancete carregado com ${listaDados.length} registros.`
    );
  } else {
    window.Sistema.Toast.info(
      "Aviso",
      "Nenhum dado encontrado para o período."
    );
  }
}

/**
 * Renderiza a tabela HTML do balancete
 */
function renderizarBalancete(listaDados) {
  const formatador = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const tbody = document.getElementById("tbody-balancete");

  if (!listaDados || listaDados.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #777;">Nenhum registro encontrado.</td></tr>';
    return;
  }

  const htmlLinhas = listaDados
    .map((item) => {
      // Estilo visual: Nível 1 e 2 em Negrito
      const isNegrito = item.nivel <= 2;
      const estiloExtra = isNegrito
        ? 'style="font-weight: bold; background-color: #f9f9f9;"'
        : "";

      // Indentação visual simples
      const paddingDescricao = (item.nivel - 1) * 15;

      // Sem eventos de clique, sem setinhas. Apenas dados.
      return `
        <tr ${estiloExtra}>
            <td>${item.conta}</td>
            <td>${item.classificacao}</td>
            
            <td style="padding-left: ${paddingDescricao}px;">
                ${item.descricao}
            </td>
            
            <td class="text-right">${formatador.format(item.valorDebito)}</td>
            <td class="text-right">${formatador.format(item.valorCredito)}</td>
        </tr>
      `;
    })
    .join("");

  tbody.innerHTML = htmlLinhas;
}

/**
 * Função global para expandir/recolher linhas filhas
 * Chamada quando clica numa linha de nível 4
 */
window.toggleFilhos = function (classifPai) {
  const filhas = document.querySelectorAll(`tr[data-pai="${classifPai}"]`);
  const linhaPai = event.currentTarget;

  if (filhas.length > 0) {
    linhaPai.classList.toggle("expandido");

    filhas.forEach((tr) => {
      tr.classList.toggle("hidden");
    });
  } else {
    window.Sistema.Toast.info(
      "Info",
      "Esta conta não possui subcontas analíticas lançadas."
    );
  }
};

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
 * Configura todos os event listeners da página
 */
function configurarEventos() {
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

  Elements.inputNome.addEventListener("blur", () =>
    setTimeout(() => autoPreencherEmpresa(Elements.inputNome), 100)
  );

  Elements.inputNome.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      autoPreencherEmpresa(Elements.inputNome);
    }
  });

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

  Elements.btnBuscarEmpresa.addEventListener("click", abrirModalEmpresa);
  Elements.btnProcurar.addEventListener("click", selecionarPasta);
  Elements.btnExecutar.addEventListener("click", executarRelatorio);

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

inicializar();
