import sys
import json
import argparse
import traceback
from decimal import Decimal
from datetime import date, datetime
from typing import Dict, Any, Callable

from servicos import servico_geral, servico_conf_fiscal

sys.stdout.reconfigure(encoding="utf-8")


class DecimalEncoder(json.JSONEncoder):
    """
    Garante que valores monetários (Decimal) e Datas virem texto no JSON
    """

    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)

        if isinstance(obj, (date, datetime)):
            return obj.isoformat()

        return super(DecimalEncoder, self).default(obj)


def validar_params(dados: Dict, campos_obrigatorios: list):
    """Validador genérico de parâmetros"""
    faltantes = [
        campo for campo in campos_obrigatorios if campo not in dados or not dados[campo]
    ]
    if faltantes:
        raise ValueError(f"Parâmetros obrigatórios faltando: {', '.join(faltantes)}")


def handle_listar_empresas(dados: Dict):
    return servico_geral.obter_empresas_para_select()


def handle_gerar_balancetes(dados: Dict):
    validar_params(dados, ["empresa", "dataInicio", "dataFim"])

    empresa = dados["empresa"]
    ini = dados["dataInicio"]
    fim = dados["dataFim"]

    regras = dados.get("regras")

    if not regras:
        regras = {
            5101: {"deb": 140},
            6101: {"deb": 140},
            5102: {"deb": 140},
            6102: {"deb": 140},
            6107: {"deb": 140},
            9000001: {"deb": 140},
            6201: {"deb": 1494, "cred": 502},
        }

    CONTA_IMPOSTO_PADRAO = 1539

    bp_contabil = servico_conf_fiscal.gerar_bp_contabil(empresa, ini, fim)

    bp_fiscal = servico_conf_fiscal.gerar_bp_fiscal(
        empresa, ini, fim, regras, conta_imposto_fixa=CONTA_IMPOSTO_PADRAO
    )

    return {"contabil": bp_contabil, "fiscal": bp_fiscal}


def handle_conferir_cfop(dados: Dict):
    validar_params(dados, ["empresa", "dataInicio", "dataFim", "contaAlvo", "cfops"])

    return servico_conf_fiscal.conferir_cfop_x_contabil(
        dados["empresa"],
        dados["dataInicio"],
        dados["dataFim"],
        int(dados["contaAlvo"]),
        dados["cfops"],
    )


def handle_detalhar_conta(dados: Dict):
    validar_params(dados, ["empresa", "dataInicio", "dataFim", "contaAlvo"])

    regras = dados.get("regras")
    if not regras:
        regras = {
            5101: {"deb": 140},
            6101: {"deb": 140},
            5102: {"deb": 140},
            6102: {"deb": 140},
            6107: {"deb": 140},
            9000001: {"deb": 140},
            6201: {"deb": 1494, "cred": 502},
        }

    CONTA_IMPOSTO_PADRAO = 1539

    return servico_conf_fiscal.obter_detalhes_conta(
        dados["empresa"],
        dados["dataInicio"],
        dados["dataFim"],
        dados["contaAlvo"],
        regras,
        conta_imposto_fixa=CONTA_IMPOSTO_PADRAO,
    )


# ========== HANDLERS PARA PLANOS DE CONFERÊNCIA ==========


def handle_listar_planos(dados: Dict):
    return servico_conf_fiscal.listar_planos_para_grid()


def handle_salvar_plano(dados: Dict):
    if not dados.get("nome"):
        raise ValueError("O nome do plano é obrigatório.")

    servico_conf_fiscal.salvar_plano(dados)
    return {"status": "ok"}


def handle_excluir_plano(dados: Dict):
    if not dados.get("id"):
        raise ValueError("ID do plano é obrigatório para exclusão.")

    servico_conf_fiscal.excluir_plano(dados)
    return {"status": "ok"}


# ========== TABELA DE ROTAS ==========

ROTAS: Dict[str, Dict[str, Callable]] = {
    "geral": {"listar_empresas": handle_listar_empresas},
    "conf_fiscal": {
        "gerar_bp": handle_gerar_balancetes,
        "conferir_cfop": handle_conferir_cfop,
        "detalhar_conta": handle_detalhar_conta,
        "listar_planos": handle_listar_planos,
        "salvar_plano": handle_salvar_plano,
        "excluir_plano": handle_excluir_plano,
    },
}


def processar_requisicao(modulo: str, acao: str, dados: Dict) -> Any:
    """Encontra o handler correto e executa"""
    if modulo not in ROTAS:
        raise ValueError(f"Módulo '{modulo}' não existe.")

    if acao not in ROTAS[modulo]:
        raise ValueError(f"Ação '{acao}' não existe no módulo '{modulo}'.")

    handler_func = ROTAS[modulo][acao]
    return handler_func(dados)


def main():
    parser = argparse.ArgumentParser(description="Backend Python Fiscal")
    parser.add_argument(
        "--modulo", required=True, help="Módulo (ex: geral, conf_fiscal)"
    )
    parser.add_argument("--acao", required=True, help="Ação a executar")
    parser.add_argument("--dados", default="{}", help="JSON com parâmetros")

    args = parser.parse_args()

    resposta = {"sucesso": False, "acao": args.acao, "dados": None, "erro": None}

    try:
        dados_entrada = json.loads(args.dados) if args.dados else {}

        resultado = processar_requisicao(args.modulo, args.acao, dados_entrada)

        resposta["sucesso"] = True
        resposta["dados"] = resultado

    except json.JSONDecodeError:
        resposta["erro"] = "Erro ao decodificar JSON de entrada."
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        resposta["erro"] = str(e)

    print(json.dumps(resposta, ensure_ascii=False, cls=DecimalEncoder))
    sys.stdout.flush()


if __name__ == "__main__":
    main()
