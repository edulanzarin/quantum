from bd import bd_contabil, bd_fiscal, bd_interno


def obter_detalhes_conta(
    empresa,
    data_ini,
    data_fim,
    conta_alvo_id,
    regras_usuario=None,
    conta_imposto_fixa=None,
):
    plano, mapa = bd_contabil.carregar_estrutura_plano(empresa)
    if not plano or int(conta_alvo_id) not in plano:
        return []

    conta_alvo_id = int(conta_alvo_id)
    classif_alvo = plano[conta_alvo_id]["classif"]

    ids_envolvidos = set()
    for cid, dados in plano.items():
        if dados["classif"].startswith(classif_alvo):
            ids_envolvidos.add(cid)

    lancamentos = bd_contabil.buscar_lancamentos_saida(empresa, data_ini, data_fim)
    notas = bd_fiscal.buscar_notas_saida(empresa, data_ini, data_fim)

    mapa_notas = {nf["id_fiscal"]: nf for nf in notas}

    ids_notas_referenciadas = set()
    extrato = []

    for lcto in lancamentos:
        deb = lcto["conta_debito"]
        cred = lcto["conta_credito"]

        if deb in ids_envolvidos or cred in ids_envolvidos:
            item = lcto.copy()
            eh_debito = deb in ids_envolvidos

            item["tipo_origem"] = "CONTABIL"
            item["tipo_operacao"] = "D" if eh_debito else "C"
            item["conta_atuante"] = deb if eh_debito else cred
            item["nome_conta"] = plano[item["conta_atuante"]]["descricao"]
            item["cfop"] = "-"

            status = "OK"
            motivo = ""

            chave = item["chave_origem"]
            id_origem = None

            if chave and chave.startswith("MS"):
                try:
                    id_origem = int(chave.replace("MS", ""))
                except:
                    pass

            if id_origem and id_origem in mapa_notas:
                ids_notas_referenciadas.add(id_origem)

                nota = mapa_notas[id_origem]
                item["cfop"] = str(nota["cfop"])
                cfop = nota["cfop"]
                val_imposto = nota.get("valor_imposto", 0.0)

                if regras_usuario:
                    if cfop not in regras_usuario:
                        status = "ERRO"
                        motivo = f"CFOP {cfop} contabilizada indevidamente (s/ regra)"
                    else:
                        regra = regras_usuario[cfop]
                        chave_regra = "deb" if item["tipo_operacao"] == "D" else "cred"
                        conta_esperada = regra.get(chave_regra)

                        match_venda = False
                        if conta_esperada and conta_esperada in plano:
                            if plano[item["conta_atuante"]]["classif"].startswith(
                                plano[conta_esperada]["classif"]
                            ):
                                match_venda = True

                        match_imposto = False
                        if conta_imposto_fixa and val_imposto > 0:
                            if conta_imposto_fixa in plano:
                                if plano[item["conta_atuante"]]["classif"].startswith(
                                    plano[conta_imposto_fixa]["classif"]
                                ):
                                    match_imposto = True

                        if not match_venda and not match_imposto:
                            status = "ERRO"
                            motivo = f"CFOP {cfop}: Conta incorreta ou regra divergente"
            else:
                status = "ERRO"
                motivo = "Lançamento sem vínculo fiscal (Manual ou Nota Excluída)"

            item["status_conciliacao"] = status
            item["motivo_divergencia"] = motivo

            if status == "ERRO":
                extrato.append(item)

    classif_alvo_str = plano[conta_alvo_id]["classif"]

    for nota in notas:
        if nota["id_fiscal"] in ids_notas_referenciadas:
            continue

        cfop = nota["cfop"]
        val_total = nota["valor_total"]
        val_imposto = nota.get("valor_imposto", 0.0)

        if not regras_usuario or cfop not in regras_usuario:
            continue

        regra = regras_usuario[cfop]

        deveria_estar_aqui = False
        motivo_omissao = ""
        operacao_esperada = ""

        if "deb" in regra and regra["deb"] in plano:
            if plano[regra["deb"]]["classif"].startswith(classif_alvo_str):
                deveria_estar_aqui = True
                motivo_omissao = f"Nota {nota['numero_nf']} (CFOP {cfop}) não contabilizada no Débito"
                operacao_esperada = "D"

        if not deveria_estar_aqui and "cred" in regra and regra["cred"] in plano:
            if plano[regra["cred"]]["classif"].startswith(classif_alvo_str):
                deveria_estar_aqui = True
                motivo_omissao = f"Nota {nota['numero_nf']} (CFOP {cfop}) não contabilizada no Crédito"
                operacao_esperada = "C"

        if (
            not deveria_estar_aqui
            and conta_imposto_fixa
            and val_imposto > 0
            and conta_imposto_fixa in plano
        ):
            if plano[conta_imposto_fixa]["classif"].startswith(classif_alvo_str):
                deveria_estar_aqui = True
                motivo_omissao = (
                    f"Imposto da Nota {nota['numero_nf']} não contabilizado"
                )
                operacao_esperada = "C"
                val_total = val_imposto

        if deveria_estar_aqui:
            extrato.append(
                {
                    "tipo_origem": "FISCAL",
                    "data_lancamento": nota["data"],
                    "conta_atuante": "-",
                    "cfop": str(cfop),
                    "hist_complemento": f"Nota Fiscal {nota['numero_nf']} - OMISSÃO",
                    "tipo_operacao": operacao_esperada,
                    "valor": val_total,
                    "status_conciliacao": "ERRO",
                    "motivo_divergencia": motivo_omissao,
                }
            )

    apenas_erros = [
        x for x in extrato if x["status_conciliacao"] == "ERRO" and x["valor"] > 0.001
    ]

    apenas_erros.sort(key=lambda x: x["data_lancamento"])

    return apenas_erros


def _formatar_saida_bp(plano_calculado):
    """
    Filtra e formata o dicionário do plano para uma lista ordenada.
    """
    lista_final = []
    lista_ordenada = sorted(plano_calculado.values(), key=lambda x: x["classif"])

    for dados in lista_ordenada:
        classif = dados["classif"]

        if not (classif.startswith("1") or classif.startswith("2")):
            continue

        if dados["nivel"] > 3:
            continue

        if abs(dados["debito"]) < 0.001 and abs(dados["credito"]) < 0.001:
            continue

        saldo = dados["debito"] - dados["credito"]

        lista_final.append(
            {
                "conta": dados["conta_real"],
                "classificacao": dados["classif"],
                "descricao": dados["descricao"],
                "nivel": dados["nivel"],
                "valorDebito": dados["debito"],
                "valorCredito": dados["credito"],
                "saldo": saldo,
            }
        )

    return lista_final


def gerar_bp_contabil(empresa, data_ini, data_fim):
    plano, mapa = bd_contabil.carregar_estrutura_plano(empresa)
    if not plano:
        return []

    lancamentos = bd_contabil.buscar_lancamentos_saida(empresa, data_ini, data_fim)

    for lcto in lancamentos:
        val = lcto["valor"]
        bd_contabil.somar_hierarquicamente(plano, mapa, lcto["conta_debito"], val, "D")
        bd_contabil.somar_hierarquicamente(plano, mapa, lcto["conta_credito"], val, "C")

    return _formatar_saida_bp(plano)


def gerar_bp_fiscal(
    empresa, data_ini, data_fim, regras_usuario, conta_imposto_fixa=None
):
    plano, mapa = bd_contabil.carregar_estrutura_plano(empresa)
    if not plano:
        return []

    notas = bd_fiscal.buscar_notas_saida(empresa, data_ini, data_fim)

    for nota in notas:
        cfop = int(nota["cfop"])
        valor_total = nota["valor_total"]

        valor_imposto = nota.get("valor_imposto", 0.0)

        if cfop not in regras_usuario:
            continue

        regra = regras_usuario[cfop]

        if "deb" in regra and regra["deb"]:
            bd_contabil.somar_hierarquicamente(
                plano, mapa, regra["deb"], valor_total, "D"
            )

        if "cred" in regra and regra["cred"]:
            bd_contabil.somar_hierarquicamente(
                plano, mapa, regra["cred"], valor_total, "C"
            )

        if conta_imposto_fixa and valor_imposto > 0:
            bd_contabil.somar_hierarquicamente(
                plano, mapa, conta_imposto_fixa, valor_imposto, "C"
            )

    return _formatar_saida_bp(plano)


def listar_planos_para_grid():
    bd_interno.inicializar_tabela()
    return bd_interno.listar_planos_com_contas()


def salvar_plano(dados):
    id_plano = dados.get("id")
    if id_plano == "" or id_plano == "Novo":
        id_plano = None
    else:
        try:
            id_plano = int(id_plano)
        except:
            id_plano = None

    return bd_interno.salvar_plano_completo(id_plano, dados["nome"], dados["contas"])


def excluir_plano(dados):
    return bd_interno.excluir_plano_por_id(dados["id"])
