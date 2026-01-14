/* Mapeamento */
const Elements = {
  // Lista Esquerda
  btnNovo: document.getElementById("btn-novo-plano"),
  inputFiltro: document.getElementById("input-filtro-planos"),
  listaPlanos: document.getElementById("container-lista-planos"),

  // Editor Direita
  tituloEditor: document.getElementById("titulo-editor"),
  acoesEditor: document.getElementById("acoes-editor"),
  inputCodigo: document.getElementById("input-codigo-plano"),
  inputNome: document.getElementById("input-nome-plano"),

  // -- Novo Filtro --
  inputFiltroContas: document.getElementById("input-filtro-contas"),

  tbodyContas: document.getElementById("tbody-contas"),
  btnAddConta: document.getElementById("btn-add-conta"),
  btnSalvar: document.getElementById("btn-salvar-plano"),
  btnCancelar: document.getElementById("btn-cancelar-edicao"),
  btnExcluir: document.getElementById("btn-excluir-plano"),

  // Modal
  modal: document.getElementById("modal-conta"),
  tituloModal: document.getElementById("titulo-modal-conta"),
  inpCfop: document.getElementById("modal-cfop"),
  inpDeb: document.getElementById("modal-deb"),
  inpCred: document.getElementById("modal-cred"),
  btnConfirmModal: document.getElementById("btn-confirmar-conta"),
  btnsCloseModal: document.querySelectorAll(".btn-fechar-modal"),
};

/* Estado */
const AppState = {
  listaCache: [],
  planoAtual: { id: null, nome: "", contas: [] },
  contaIndex: null,
};

function inicializar() {
  configurarBackend();
  configurarEventos();
  carregarLista();
  modoNovoPlano();
}

function configurarBackend() {
  window.api.aoReceberResposta((raw) => {
    try {
      const json = JSON.parse(raw);
      if (!json.sucesso) return window.Sistema.Toast.error("Erro", json.erro);

      if (json.acao === "listar_planos") {
        AppState.listaCache = json.dados || [];
        renderizarLista();
      } else if (json.acao === "salvar_plano") {
        window.Sistema.Toast.success("Salvo", "Plano gravado com sucesso.");
        carregarLista();
        // Limpa editor para garantir sync com novo ID
        modoNovoPlano();
      } else if (json.acao === "excluir_plano") {
        window.Sistema.Toast.success("Excluído", "Plano removido.");
        carregarLista();
        modoNovoPlano();
      }
    } catch (e) {
      console.error(e);
    }
  });
}

function carregarLista() {
  window.api.rodarPython({
    modulo: "conf_fiscal",
    acao: "listar_planos",
    dados: {},
  });
}

function salvarBackend() {
  const nome = Elements.inputNome.value.trim();
  if (!nome)
    return window.Sistema.Toast.warning("Atenção", "Informe o nome do plano.");

  window.api.rodarPython({
    modulo: "conf_fiscal",
    acao: "salvar_plano",
    dados: {
      id: AppState.planoAtual.id,
      nome: nome,
      contas: AppState.planoAtual.contas,
    },
  });
}

function renderizarLista() {
  const termo = Elements.inputFiltro.value.toLowerCase();
  const lista = AppState.listaCache.filter((p) =>
    p.nome.toLowerCase().includes(termo)
  );

  Elements.listaPlanos.innerHTML = "";

  if (lista.length === 0) {
    Elements.listaPlanos.innerHTML = `<div class="empty-state"><p>Nenhum plano encontrado.</p></div>`;
    return;
  }

  lista.forEach((plano) => {
    const div = document.createElement("div");
    div.className = "list-item";

    if (AppState.planoAtual.id && AppState.planoAtual.id == plano.id) {
      div.classList.add("active");
    }

    // REMOVIDO O SPAN COM ID - MOSTRA APENAS O NOME
    div.innerHTML = `
        <div>
            <strong style="color:#333; font-size:13px;">${plano.nome}</strong>
        </div>
    `;

    div.onclick = () => selecionarPlano(plano);
    Elements.listaPlanos.appendChild(div);
  });
}

/* --- ESTADOS DO EDITOR --- */

function modoNovoPlano() {
  AppState.planoAtual = { id: null, nome: "", contas: [] };
  AppState.contaIndex = null;

  Elements.inputCodigo.value = "Novo";
  Elements.inputNome.value = "";
  Elements.tituloEditor.textContent = "Criando Novo Plano";
  Elements.acoesEditor.classList.add("hidden");

  // Limpa filtro de contas ao criar novo
  Elements.inputFiltroContas.value = "";

  const activeItem = document.querySelector(".list-item.active");
  if (activeItem) activeItem.classList.remove("active");

  renderizarContas();
  Elements.inputNome.focus();
}

function selecionarPlano(plano) {
  AppState.planoAtual = JSON.parse(JSON.stringify(plano)); // Clone

  Elements.inputCodigo.value = plano.id;
  Elements.inputNome.value = plano.nome;
  Elements.tituloEditor.textContent = "Editando Plano";
  Elements.acoesEditor.classList.remove("hidden");

  Elements.inputFiltroContas.value = "";

  renderizarContas();
  renderizarLista();
}

function renderizarContas() {
  const tbody = Elements.tbodyContas;
  tbody.innerHTML = "";

  const todasContas = AppState.planoAtual.contas || [];
  const termoFiltro = Elements.inputFiltroContas.value.trim().toLowerCase();

  const contasFiltradas = todasContas.filter(
    (c) =>
      c.cfop.toLowerCase().includes(termoFiltro) ||
      (c.ctdeb && c.ctdeb.includes(termoFiltro)) ||
      (c.ctcred && c.ctcred.includes(termoFiltro))
  );

  if (contasFiltradas.length === 0) {
    const msg =
      todasContas.length === 0
        ? "Nenhuma conta configurada neste plano."
        : "Nenhuma conta encontrada com este filtro.";

    tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding: 20px; color: #999;">${msg}</td></tr>`;
    return;
  }

  contasFiltradas.forEach((c) => {
    const indexReal = todasContas.indexOf(c);

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><strong>${c.cfop}</strong></td>
        <td>${c.ctdeb || "-"}</td>
        <td>${c.ctcred || "-"}</td>
        <td class="text-center">
            <span class="material-icons-round cursor-pointer" style="font-size:16px; margin-right:8px; color:#666;" onclick="editarConta(${indexReal})">edit</span>
            <span class="material-icons-round cursor-pointer" style="font-size:16px; color:#dc3545;" onclick="removerConta(${indexReal})">delete</span>
        </td>
    `;
    tbody.appendChild(tr);
  });
}

/* --- MODAIS E EVENTOS --- */
window.editarConta = (idx) => {
  AppState.contaIndex = idx;
  const c = AppState.planoAtual.contas[idx];
  Elements.tituloModal.textContent = "EDITAR REGRA";
  Elements.inpCfop.value = c.cfop;
  Elements.inpDeb.value = c.ctdeb;
  Elements.inpCred.value = c.ctcred;
  Elements.modal.classList.remove("hidden");
  setTimeout(() => Elements.inpCfop.focus(), 100);
};

window.removerConta = (idx) => {
  AppState.planoAtual.contas.splice(idx, 1);
  renderizarContas();
};

function abrirModalNovo() {
  AppState.contaIndex = null;
  Elements.tituloModal.textContent = "NOVA REGRA";
  Elements.inpCfop.value = "";
  Elements.inpDeb.value = "";
  Elements.inpCred.value = "";
  Elements.modal.classList.remove("hidden");
  setTimeout(() => Elements.inpCfop.focus(), 100);
}

function salvarContaModal() {
  const cfop = Elements.inpCfop.value.trim();
  if (!cfop) return window.Sistema.Toast.warning("Atenção", "CFOP obrigatório");

  const item = {
    cfop: cfop,
    ctdeb: Elements.inpDeb.value.trim(),
    ctcred: Elements.inpCred.value.trim(),
  };

  if (AppState.contaIndex !== null) {
    AppState.planoAtual.contas[AppState.contaIndex] = item;
  } else {
    AppState.planoAtual.contas.push(item);
  }

  Elements.modal.classList.add("hidden");
  renderizarContas();
}

function configurarEventos() {
  Elements.btnNovo.onclick = modoNovoPlano;
  Elements.btnCancelar.onclick = modoNovoPlano;
  Elements.btnSalvar.onclick = salvarBackend;

  Elements.btnExcluir.onclick = () => {
    if (AppState.planoAtual.id) {
      window.api.rodarPython({
        modulo: "conf_fiscal",
        acao: "excluir_plano",
        dados: { id: AppState.planoAtual.id },
      });
    }
  };

  Elements.inputFiltro.oninput = renderizarLista;

  // Listener do novo filtro da tabela de contas
  Elements.inputFiltroContas.oninput = renderizarContas;

  Elements.btnAddConta.onclick = abrirModalNovo;
  Elements.btnConfirmModal.onclick = salvarContaModal;

  Elements.btnsCloseModal.forEach(
    (b) => (b.onclick = () => Elements.modal.classList.add("hidden"))
  );

  [Elements.inpCfop, Elements.inpDeb, Elements.inpCred].forEach(
    (i) =>
      (i.onkeydown = (e) => {
        if (e.key === "Enter") salvarContaModal();
      })
  );
}

inicializar();
