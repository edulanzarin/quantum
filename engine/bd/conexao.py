import fdb
import os
import sys

CONFIG_BANCO = {
    'host': '192.168.15.43',
    'database': r'C:\nQuestorBase\manutencao20251112\_QUESTOR.FDB',
    'user': 'SYSDBA',
    'password': 'masterkey',
    'charset': 'WIN1252'
}

def criar_conexao():
    try:
        pasta_atual = os.path.dirname(os.path.abspath(__file__))
        dll_local = os.path.join(pasta_atual, "fbclient.dll")

        try:
            if os.path.exists(dll_local):
                fdb.load_api(dll_local)
            else:
                fdb.load_api("fbclient.dll")
        except:
            pass

        conexao = fdb.connect(**CONFIG_BANCO)
        return conexao

    except Exception as e:
        sys.stderr.write(f"Erro fatal BD: {str(e)}\n")
        return None