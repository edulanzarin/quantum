const Elements = {
  btnAuditar: document.getElementById("btn-auditar"),
  inpEmpresa: document.getElementById("input-empresa"),
  inpDataIni: document.getElementById("input-data-ini"),
  inpDataFim: document.getElementById("input-data-fim"),
  inpConta: document.getElementById("input-conta"),
  inpCfops: document.getElementById("input-cfops"),

  resContainer: document.getElementById("resultado-container"),
  resFiscal: document.getElementById("res-fiscal"),
  resContabil: document.getElementById("res-contabil"),
  resDiferenca: document.getElementById("res-diferenca"),
  resStatus: document.getElementById("res-status"),
};

// Formatação de Moeda
const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

Elements.btnAuditar.addEventListener("click", () => {
  // Tratamento dos inputs
  const empresa = Elements.inpEmpresa.value;
  const conta = Elements.inpConta.value; // ID da conta (ex: 140)

  // Transforma string "5101, 6101" em array [5101, 6101]
  const cfopsTexto = Elements.inpCfops.value;
  const cfopsArray = cfopsTexto
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));

  if (!empresa || !conta || cfopsArray.length === 0) {
    alert("Preencha todos os campos!");
    return;
  }

  console.log("Enviando para Python...", { empresa, conta, cfopsArray });

  // Chama o Python
  window.api.rodarPython({
    modulo: "conf_fiscal",
    acao: "conferir_cfop", // <--- AÇÃO NOVA QUE CRIAMOS NO MAIN.PY
    dados: {
      empresa: empresa,
      dataInicio: Elements.inpDataIni.value,
      dataFim: Elements.inpDataFim.value,
      contaAlvo: conta,
      cfops: cfopsArray,
    },
  });
});

// Recebe resposta
window.api.aoReceberResposta((respostaTexto) => {
  try {
    const json = JSON.parse(respostaTexto);
    console.log("Resposta:", json);

    if (!json.sucesso && !json.dados?.status) {
      alert("Erro: " + json.erro);
      return;
    }

    // Como o retorno direto da função é o dicionário de dados (se você fez return direto no main.py)
    // Ou se ele vem dentro de json.dados, ajuste conforme seu main.py
    // Assumindo que seu main.py empacota tudo em 'dados':
    const resultado = json.dados;

    if (resultado.erro) {
      alert(resultado.erro);
      return;
    }

    // Renderiza
    Elements.resContainer.classList.remove("hidden");
    Elements.resFiscal.innerText = BRL.format(resultado.total_fiscal);
    Elements.resContabil.innerText = BRL.format(resultado.total_contabil);
    Elements.resDiferenca.innerText = BRL.format(resultado.diferenca);

    const divStatus = Elements.resStatus;
    if (resultado.status === "OK") {
      divStatus.style.backgroundColor = "#198754"; // Verde
      divStatus.innerText = "SUCESSO: VALORES BATEM!";
    } else {
      divStatus.style.backgroundColor = "#dc3545"; // Vermelho
      divStatus.innerText = "ATENÇÃO: DIVERGÊNCIA ENCONTRADA";
    }
  } catch (e) {
    console.error("Erro JS:", e);
  }
});
