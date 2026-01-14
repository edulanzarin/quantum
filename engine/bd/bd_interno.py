from bd.conexao import criar_conexao_interna


def inicializar_tabela():
    """Cria as tabelas necessárias (planos e itens_plano)"""
    conn = criar_conexao_interna()
    if not conn:
        return

    try:
        cursor = conn.cursor()

        # Tabela Pai (planos) - REMOVIDO codigo_usuario
        cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS planos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL
        );
        """
        )

        # Tabela Filha (Itens/Contas)
        cursor.execute(
            """
        CREATE TABLE IF NOT EXISTS itens_plano (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_plano INTEGER NOT NULL,
            cfop TEXT NOT NULL,
            ctdeb TEXT,
            ctcred TEXT,
            FOREIGN KEY(id_plano) REFERENCES planos(id) ON DELETE CASCADE
        );
        """
        )

        conn.commit()
    finally:
        conn.close()


def listar_planos_com_contas():
    conn = criar_conexao_interna()
    if not conn:
        return []

    try:
        cursor = conn.cursor()

        # 1. Busca todos os planos (ID e Nome apenas)
        cursor.execute("SELECT id, nome FROM planos ORDER BY id")
        planos_db = cursor.fetchall()

        resultado = []

        for p in planos_db:
            id_plano = p[0]
            nome = p[1]

            # 2. Busca as contas desse plano
            cursor.execute(
                "SELECT cfop, ctdeb, ctcred FROM itens_plano WHERE id_plano = ?",
                (id_plano,),
            )
            contas = []
            for item in cursor.fetchall():
                contas.append({"cfop": item[0], "ctdeb": item[1], "ctcred": item[2]})

            resultado.append(
                {
                    "id": id_plano,  # O ID do banco agora é o código principal
                    "nome": nome,
                    "contas": contas,
                }
            )

        return resultado
    except Exception as e:
        print(f"Erro ao listar planos: {e}")
        return []
    finally:
        conn.close()


def salvar_plano_completo(id_plano, nome, lista_contas):
    conn = criar_conexao_interna()
    if not conn:
        return False

    try:
        cursor = conn.cursor()
        novo_id = id_plano

        # 1. Decide entre INSERT ou UPDATE baseado se veio ID
        if id_plano:
            # Verifica se existe
            cursor.execute("SELECT id FROM planos WHERE id = ?", (id_plano,))
            if cursor.fetchone():
                # UPDATE
                cursor.execute(
                    "UPDATE planos SET nome = ? WHERE id = ?", (nome, id_plano)
                )
                # Limpa itens antigos para regravar
                cursor.execute(
                    "DELETE FROM itens_plano WHERE id_plano = ?", (id_plano,)
                )
            else:
                # Se veio ID mas não achou, faz insert
                cursor.execute("INSERT INTO planos (nome) VALUES (?)", (nome,))
                novo_id = cursor.lastrowid
        else:
            # INSERT (Novo)
            cursor.execute("INSERT INTO planos (nome) VALUES (?)", (nome,))
            novo_id = cursor.lastrowid

        # 2. Insere os itens
        if lista_contas:
            dados_insercao = []
            for conta in lista_contas:
                dados_insercao.append(
                    (novo_id, conta["cfop"], conta["ctdeb"], conta["ctcred"])
                )

            cursor.executemany(
                "INSERT INTO itens_plano (id_plano, cfop, ctdeb, ctcred) VALUES (?, ?, ?, ?)",
                dados_insercao,
            )

        conn.commit()
        return True
    except Exception as e:
        print(f"Erro ao salvar plano: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


def excluir_plano_por_id(id_plano):
    conn = criar_conexao_interna()
    if not conn:
        return False

    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM itens_plano WHERE id_plano = ?", (id_plano,))
        cursor.execute("DELETE FROM planos WHERE id = ?", (id_plano,))
        conn.commit()
        return True
    except Exception as e:
        print(f"Erro ao excluir: {e}")
        return False
    finally:
        conn.close()
