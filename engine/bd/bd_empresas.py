from bd.conexao import criar_conexao_questor
import sys


def listar_todas_empresas():
    conexao = criar_conexao_questor()
    if not conexao:
        return []

    try:
        cursor = conexao.cursor()
        sql = "SELECT CODIGOEMPRESA, NOMEEMPRESA FROM EMPRESA"
        cursor.execute(sql)

        nomes_colunas = [desc[0] for desc in cursor.description]

        lista_empresas = []
        for linha in cursor.fetchall():
            lista_empresas.append(dict(zip(nomes_colunas, linha)))

        return lista_empresas

    except Exception as e:
        sys.stderr.write(f"Erro na query de empresas: {e}\n")
        return []
    finally:
        if conexao:
            conexao.close()
