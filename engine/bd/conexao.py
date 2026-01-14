import fdb
import sqlite3
import os
import sys

CONFIG_QUESTOR = {
    "host": "192.168.15.43",
    "database": r"C:\nQuestorBase\manutencao20251112\_QUESTOR.FDB",
    "user": "SYSDBA",
    "password": "masterkey",
    "charset": "WIN1252",
}

NOME_BANCO_INTERNO = "Quantum.db"


def criar_conexao_questor():
    """Conecta no banco oficial do Questor (Firebird)"""
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

        conexao = fdb.connect(**CONFIG_QUESTOR)
        return conexao

    except Exception as e:
        sys.stderr.write(f"Erro Conexão Questor: {str(e)}\n")
        return None


def criar_conexao_interna():
    """Conecta no seu banco de configurações (SQLite)"""
    try:
        pasta_atual = os.path.dirname(os.path.abspath(__file__))
        caminho_banco = os.path.join(pasta_atual, NOME_BANCO_INTERNO)

        conexao = sqlite3.connect(caminho_banco)
        return conexao
    except Exception as e:
        sys.stderr.write(f"Erro Conexão Interna: {str(e)}\n")
        return None
