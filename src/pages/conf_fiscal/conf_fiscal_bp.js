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
      } else if (json.acao === "detalhar_conta") {
        renderizarDetalhesConta(json.dados);
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
 * Agora espera receber { contabil: [], fiscal: [] }
 */
function finalizarCarregamentoBalancete(dadosBackend) {
  Elements.loaderBalancete.classList.add("hidden");
  Elements.containerTabela.classList.remove("hidden");

  const listaContabil = dadosBackend.contabil || [];
  const listaFiscal = dadosBackend.fiscal || [];

  console.log(
    `[Frontend] Dados recebidos -> Contábil: ${listaContabil.length}, Fiscal: ${listaFiscal.length}`
  );

  const dadosUnificados = unificarListas(listaContabil, listaFiscal);

  renderizarBalanceteUnificado(dadosUnificados);

  if (dadosUnificados.length > 0) {
    window.Sistema.Toast.success("Sucesso", "Conferência gerada com sucesso.");
  } else {
    window.Sistema.Toast.info("Aviso", "Nenhum dado encontrado.");
  }
}

/**
 * Mescla as duas listas em uma só, garantindo que contas que
 * só existem em um dos lados apareçam na tabela.
 */
function unificarListas(listaContabil, listaFiscal) {
  const mapa = new Map();

  const criarEstrutura = (item) => ({
    conta: item.conta,
    classificacao: item.classificacao,
    descricao: item.descricao,
    nivel: item.nivel,
    debContabil: 0,
    credContabil: 0,
    saldoContabil: 0,
    debFiscal: 0,
    credFiscal: 0,
    saldoFiscal: 0,
  });

  listaContabil.forEach((item) => {
    if (!mapa.has(item.conta)) {
      mapa.set(item.conta, criarEstrutura(item));
    }
    const reg = mapa.get(item.conta);
    reg.debContabil = item.valorDebito;
    reg.credContabil = item.valorCredito;
    reg.saldoContabil = item.saldo;
  });

  listaFiscal.forEach((item) => {
    if (!mapa.has(item.conta)) {
      mapa.set(item.conta, criarEstrutura(item));
    }
    const reg = mapa.get(item.conta);
    reg.debFiscal = item.valorDebito;
    reg.credFiscal = item.valorCredito;
    reg.saldoFiscal = item.saldo;
  });

  return Array.from(mapa.values()).sort((a, b) => {
    return a.classificacao.localeCompare(b.classificacao, undefined, {
      numeric: true,
    });
  });
}

/**
 * Renderiza a tabela HTML SEM AS COLUNAS DE SALDO
 */
function renderizarBalanceteUnificado(listaDados) {
  const formatador = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const tbody = document.getElementById("tbody-balancete");

  if (!listaDados || listaDados.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="9" class="text-center" style="padding: 20px;">Nenhum registro encontrado.</td></tr>';
    return;
  }

  const htmlLinhas = listaDados
    .map((item) => {
      let classeLinha = "";

      if (item.nivel === 1) classeLinha = "nivel-1";
      else if (item.nivel === 2) classeLinha = "nivel-2";
      else if (item.nivel === 3) classeLinha = "nivel-3";
      else classeLinha = "nivel-analitico";

      const indent = "&nbsp;".repeat((item.nivel - 1) * 3);

      const diferenca = item.saldoContabil - item.saldoFiscal;

      const temDiferenca = Math.abs(diferenca) > 0.02;
      const classeDiff = temDiferenca ? "diff-erro cursor-pointer" : "diff-ok";
      const eventoClick = temDiferenca
        ? `onclick="abrirDetalhesConta(${item.conta}, '${item.descricao}')"`
        : "";

      const fmt = (val) => {
        if (Math.abs(val) < 0.01 && item.nivel > 1)
          return '<span class="text-muted">-</span>';
        return formatador.format(val);
      };

      return `
        <tr class="${classeLinha}">
            <td title="${item.conta}">${item.conta}</td>
            <td title="${item.classificacao}">${item.classificacao}</td>
            <td title="${item.descricao}">
                ${indent}${item.descricao}
            </td>
            
            <td class="text-right">${fmt(item.debContabil)}</td>
            
            <td class="text-right" style="border-right: 2px solid #dee2e6;">
                ${fmt(item.credContabil)}
            </td>

            <td class="col-separator"></td>

            <td class="text-right">${fmt(item.debFiscal)}</td>
            <td class="text-right">${fmt(item.credFiscal)}</td>

            <td class="text-right ${classeDiff}" ${eventoClick} title="Clique para ver detalhes">
                ${fmt(diferenca)}
            </td>
        </tr>
      `;
    })
    .join("");

  tbody.innerHTML = htmlLinhas;
}

Elements.modalDetalhes = document.getElementById("modal-detalhes-conta");
Elements.tbodyDetalhes = document.getElementById("tbody-detalhes");
Elements.tituloDetalhes = document.getElementById("titulo-modal-detalhes");

/**
 * Ação ao clicar na célula de diferença
 */
window.abrirDetalhesConta = function (contaId, nomeConta) {
  Elements.tituloDetalhes.textContent = `DIFERENÇAS ${contaId} - ${nomeConta}`;
  Elements.tbodyDetalhes.innerHTML =
    '<tr><td colspan="6" class="text-center p-4">Carregando lançamentos...</td></tr>';
  Elements.modalDetalhes.classList.remove("hidden");

  window.api.rodarPython({
    modulo: "conf_fiscal",
    acao: "detalhar_conta",
    dados: {
      empresa: Elements.inputEmpresa.value,
      dataInicio: Elements.inputDataIni.value,
      dataFim: Elements.inputDataFim.value,
      contaAlvo: contaId,
    },
  });
};

function renderizarDetalhesConta(listaLancamentos) {
  const tbody = Elements.tbodyDetalhes;
  tbody.innerHTML = "";

  if (!listaLancamentos || listaLancamentos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center p-4 text-success">Tudo certo! Nenhuma divergência encontrada.</td></tr>';
    return;
  }

  const fmtMoeda = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 });

  listaLancamentos.forEach((item) => {
    let dataFmt = item.data_lancamento;
    try {
      if (dataFmt && dataFmt.includes("-")) {
        const partes = dataFmt.split("-");
        dataFmt = `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    } catch (e) {}

    let badgeOrigem = "";
    let corLinha = "";

    if (item.tipo_origem === "FISCAL") {
      badgeOrigem = `<span class="badge bg-warning text-dark">FALTA NO CONTÁBIL</span>`;
      corLinha = "background-color: #fff3cd;";
    } else {
      badgeOrigem = `<span class="badge bg-danger">ERRO CONTÁBIL</span>`;
      corLinha = "background-color: #fff5f5;";
    }

    const cfopTexto = item.cfop && item.cfop !== "-" ? item.cfop : "";
    const badgeCfop = cfopTexto
      ? `<span style="background:#e0e0e0; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:0.9em;">${cfopTexto}</span>`
      : '<span class="text-muted">-</span>';

    let textoPrincipal = "";
    if (item.tipo_origem === "FISCAL") {
      textoPrincipal = `<strong>${item.motivo_divergencia}</strong>`;
    } else {
      textoPrincipal = `
            ${item.hist_complemento || item.hist_codigo || "Sem histórico"}
            <div style="font-size:0.85em; color:#dc3545; margin-top:2px;">
                ⚠️ ${item.motivo_divergencia}
            </div>
        `;
    }

    const tr = document.createElement("tr");
    tr.style = corLinha;

    tr.innerHTML = `
        <td style="vertical-align:middle">${dataFmt}</td>
        
        <td style="vertical-align:middle; text-align:center;">
            ${badgeOrigem}
        </td>

        <td class="text-center" style="vertical-align:middle">
            ${badgeCfop}
        </td>

        <td style="vertical-align:middle">
            ${textoPrincipal}
        </td>

        <td class="text-center" style="vertical-align:middle">
            <span style="font-weight:bold; color: ${
              item.tipo_operacao === "D" ? "#0d6efd" : "#dc3545"
            }">
                ${item.tipo_operacao}
            </span>
        </td>

        <td class="text-right" style="vertical-align:middle">
            ${fmtMoeda.format(item.valor)}
        </td>
    `;
    tbody.appendChild(tr);
  });
}

document.querySelectorAll(".btn-close-modal").forEach((btn) => {
  btn.addEventListener("click", () => {
    Elements.modalDetalhes.classList.add("hidden");
  });
});

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
