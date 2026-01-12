from bd import bd_empresas

def obter_empresas_para_select():
    dados_brutos = bd_empresas.listar_todas_empresas()
    
    lista_objetos = [
        {
            "cod": emp.get('CODIGOEMPRESA'),
            "nome": emp.get('NOMEEMPRESA')
        }
        for emp in dados_brutos
    ]
    
    return lista_objetos