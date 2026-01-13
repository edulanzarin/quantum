"""
Serviço Geral
Funções gerais do sistema (empresas, configurações, etc)
"""
import sys
from bd import bd_empresas


def obter_empresas_para_select():
    """
    Obtém a lista de empresas do banco e formata para exibição no frontend.
    """
    try:
        dados_brutos = bd_empresas.listar_todas_empresas()
        
        if not dados_brutos:
            return []
        
        lista_objetos = [
            {
                "cod": emp.get('CODIGOEMPRESA'),
                "nome": emp.get('NOMEEMPRESA')
            }
            for emp in dados_brutos
            if emp.get('CODIGOEMPRESA') and emp.get('NOMEEMPRESA')
        ]
        
        return lista_objetos
        
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        return []