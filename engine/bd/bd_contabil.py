from bd.conexao import criar_conexao_questor


def carregar_estrutura_plano(empresa_id):
    """
    Retorna um dicionário representando o plano de contas preparado para cálculos.
    Também retorna um mapa de Classificação -> ID para achar os pais facilmente.
    """
    conn = criar_conexao_questor()
    if not conn:
        return {}, {}

    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT CONTACTB, CLASSIFCONTA, DESCRCONTA, TIPOCONTA 
            FROM PLANOESPEC 
            WHERE CODIGOEMPRESA = ?
        """,
            (empresa_id,),
        )

        plano = {}
        mapa_classif_id = {}

        for row in cursor.fetchall():
            conta_id = row[0]
            classif = row[1]
            nivel = classif.count(".") + 1

            plano[conta_id] = {
                "conta_real": conta_id,
                "classif": classif,
                "descricao": row[2],
                "tipo": row[3],
                "nivel": nivel,
                "debito": 0.0,
                "credito": 0.0,
            }
            mapa_classif_id[classif] = conta_id

        return plano, mapa_classif_id
    finally:
        conn.close()


def somar_hierarquicamente(plano, mapa_classif, conta_id, valor, tipo_operacao):
    """
    Função utilitária que recebe um valor em uma conta filha e
    propaga a soma para todos os pais sintéticos até a raiz.
    """
    if conta_id not in plano:
        return

    if tipo_operacao == "D":
        plano[conta_id]["debito"] += valor
    else:
        plano[conta_id]["credito"] += valor

    classif_atual = plano[conta_id]["classif"]
    partes = classif_atual.split(".")

    partes.pop()

    while partes:
        classif_pai = ".".join(partes)

        if classif_pai in mapa_classif:
            id_pai = mapa_classif[classif_pai]
            if tipo_operacao == "D":
                plano[id_pai]["debito"] += valor
            else:
                plano[id_pai]["credito"] += valor

        partes.pop()


def buscar_lancamentos_saida(empresa, data_ini, data_fim):
    """
    Busca lançamentos contábeis de saída.
    """
    conn = criar_conexao_questor()
    if not conn:
        return []

    try:
        cursor = conn.cursor()
        sql = """
            SELECT 
                CHAVELCTOCTB,
                CONTACTBDEB,
                CONTACTBCRED,
                VALORLCTOCTB,
                CHAVEORIGEM,
                CODIGOHISTCTB,
                COMPLHIST,
                DATALCTOCTB  -- <--- ADICIONADO AQUI
            FROM LCTOCTB
            WHERE CODIGOEMPRESA = ? 
              AND DATALCTOCTB BETWEEN ? AND ?
              AND CODIGOORIGLCTOCTB = 'FI'
              AND CHAVEORIGEM LIKE 'MS%'
        """
        cursor.execute(sql, (empresa, data_ini, data_fim))

        return [
            {
                "id_contabil": row[0],
                "conta_debito": row[1],
                "conta_credito": row[2],
                "valor": float(row[3]) if row[3] else 0.0,
                "chave_origem": row[4],
                "hist_codigo": row[5],
                "hist_complemento": row[6],
                "data_lancamento": row[7],
            }
            for row in cursor.fetchall()
        ]

    except Exception as e:
        print(f"[bd_contabil] Erro: {e}")
        return []
    finally:
        conn.close()


def gerar_balancete_hierarquico_bruto(empresa, data_ini, data_fim):
    """
    Calcula valores. A chave do dicionário agora é o ID DA CONTA (CONTACTB),
    pois classificações podem se repetir nas analíticas.
    """
    conexao = criar_conexao_questor()
    if not conexao:
        return None

    try:
        cursor = conexao.cursor()

        cursor.execute(
            """
            SELECT CONTACTB, CLASSIFCONTA, DESCRCONTA, TIPOCONTA 
            FROM PLANOESPEC 
            WHERE CODIGOEMPRESA = ?
        """,
            (empresa,),
        )

        plano_contas = {}
        mapa_sinteticas = {}

        rows = cursor.fetchall()

        for row in rows:
            conta_real = row[0]
            classif = row[1]
            descr = row[2]
            tipo = row[3]

            nivel = classif.count(".") + 1

            plano_contas[conta_real] = {
                "conta_real": conta_real,
                "classif": classif,
                "descricao": descr,
                "tipo": tipo,
                "nivel": nivel,
                "debito": 0.0,
                "credito": 0.0,
            }

            if nivel <= 4:
                mapa_sinteticas[classif] = conta_real

        sql_lcto = """
            SELECT CONTACTBDEB, CONTACTBCRED, VALORLCTOCTB
            FROM LCTOCTB
            WHERE CODIGOEMPRESA = ? 
              AND DATALCTOCTB BETWEEN ? AND ?
              AND CODIGOORIGLCTOCTB = 'FI'
        """
        cursor.execute(sql_lcto, (empresa, data_ini, data_fim))
        lancamentos = cursor.fetchall()

        def propagar_valor(conta_id_origem, valor, tipo_operacao):
            if conta_id_origem in plano_contas:
                if tipo_operacao == "D":
                    plano_contas[conta_id_origem]["debito"] += valor
                else:
                    plano_contas[conta_id_origem]["credito"] += valor

                classif_origem = plano_contas[conta_id_origem]["classif"]

                partes = classif_origem.split(".")

                partes.pop()

                acumulado = ""
                for parte in partes:
                    if acumulado:
                        acumulado += "." + parte
                    else:
                        acumulado = parte

                    if acumulado in mapa_sinteticas:
                        id_pai = mapa_sinteticas[acumulado]
                        if tipo_operacao == "D":
                            plano_contas[id_pai]["debito"] += valor
                        else:
                            plano_contas[id_pai]["credito"] += valor

        for id_deb, id_cred, valor in lancamentos:
            valor_float = float(valor)

            if id_deb in plano_contas:
                propagar_valor(id_deb, valor_float, "D")

            if id_cred in plano_contas:
                propagar_valor(id_cred, valor_float, "C")

        return plano_contas

    except Exception as e:
        import traceback

        traceback.print_exc()
        return None
    finally:
        if conexao:
            conexao.close()
