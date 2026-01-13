"""
main.py - Entry point do backend Python
Compatível com seu Electron existente (run-python / python-resposta)
"""
import sys
import json
import argparse
from decimal import Decimal
from servicos import servico_geral, servico_conf_fiscal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj) 
        return super(DecimalEncoder, self).default(obj)

sys.stdout.reconfigure(encoding='utf-8')

def iniciar():
    """
    Função principal que processa os argumentos e executa as ações
    """
    parser = argparse.ArgumentParser(description='Backend Python do Sistema Fiscal')
    parser.add_argument("--modulo", help="Módulo a executar (geral, conf_fiscal)")
    parser.add_argument("--acao", help="Ação a executar dentro do módulo")
    parser.add_argument("--dados", default="{}", help="JSON com parâmetros da requisição")
    
    args = parser.parse_args()
    
    try:
        # Validação básica
        if not args.modulo or not args.acao:
            raise ValueError("Módulo e ação são obrigatórios")
        
        # Parse dos dados de entrada
        dados_entrada = json.loads(args.dados) if args.dados else {}
        
        # Processa baseado no módulo
        resultado_dados = None
        
        if args.modulo == 'geral':
            resultado_dados = processar_modulo_geral(args.acao, dados_entrada)
            
        elif args.modulo == 'conf_fiscal':
            resultado_dados = processar_modulo_conf_fiscal(args.acao, dados_entrada)
            
        else:
            raise ValueError(f"Módulo desconhecido: {args.modulo}")
        
        # Monta resposta de sucesso com o campo 'acao'
        resposta = {
            "sucesso": True,
            "acao": args.acao,
            "dados": resultado_dados
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        
        # Monta resposta de erro
        resposta = {
            "sucesso": False,
            "acao": args.acao if args.acao else "",
            "erro": str(e),
            "dados": []
        }
    
    # Envia resposta para stdout (Electron lê daqui)
    print(json.dumps(resposta, ensure_ascii=False, cls=DecimalEncoder))
    sys.stdout.flush()


def processar_modulo_geral(acao, dados):
    """
    Processa ações do módulo geral
    """
    if acao == 'listar_empresas':
        return servico_geral.obter_empresas_para_select()
    
    else:
        raise ValueError(f"Ação '{acao}' não implementada no módulo geral")


def processar_modulo_conf_fiscal(acao, dados):
    """
    Processa ações do módulo de conferência fiscal
    """
    if acao == 'gerar_bp':
        empresa = dados.get('empresa')
        data_inicio = dados.get('dataInicio')
        data_fim = dados.get('dataFim')
        
        if not empresa:
            raise ValueError("Parâmetro 'empresa' é obrigatório")
        if not data_inicio:
            raise ValueError("Parâmetro 'dataInicio' é obrigatório")
        if not data_fim:
            raise ValueError("Parâmetro 'dataFim' é obrigatório")
        
        return servico_conf_fiscal.obter_bp(empresa, data_inicio, data_fim)
    
    elif acao == 'conferir_cfop':
        empresa = dados.get('empresa')
        data_inicio = dados.get('dataInicio')
        data_fim = dados.get('dataFim')
        conta_alvo = dados.get('contaAlvo') 
        cfops = dados.get('cfops')          
        
        if not all([empresa, data_inicio, data_fim, conta_alvo, cfops]):
             raise ValueError("Parâmetros obrigatórios faltando para conferência de CFOP")

        return servico_conf_fiscal.conferir_cfop_x_contabil(
            empresa, data_inicio, data_fim, int(conta_alvo), cfops
        )
    
    else:
        raise ValueError(f"Ação '{acao}' não implementada no módulo conf_fiscal")


if __name__ == "__main__":
    iniciar()