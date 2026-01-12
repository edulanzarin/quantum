import sys
import json
import argparse
from servicos import servico_geral

def iniciar():
    parser = argparse.ArgumentParser()
    parser.add_argument("--modulo", help="Qual módulo (geral, fiscal, email)")
    parser.add_argument("--acao", help="Qual função executar")
    parser.add_argument("--dados", help="JSON com parametros")
    
    args = parser.parse_args()
    
    try:
        dados_entrada = json.loads(args.dados) if args.dados else {}
        resultado = {}

        if args.modulo == 'geral':
            if args.acao == 'listar_empresas':
                lista = servico_geral.obter_empresas_para_select()
                resultado = {"sucesso": True, "dados": lista}
        
        elif args.modulo == 'fiscal':
            pass

        print(json.dumps(resultado))
        
    except Exception as e:
        print(json.dumps({"sucesso": False, "erro": str(e)}))
    
    sys.stdout.flush()

if __name__ == "__main__":
    iniciar()