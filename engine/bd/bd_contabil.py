from bd.conexao import criar_conexao
import sys

def gerar_balancete_hierarquico_bruto(empresa, data_ini, data_fim):
    """
    Calcula valores. A chave do dicionário agora é o ID DA CONTA (CONTACTB),
    pois classificações podem se repetir nas analíticas.
    """
    conexao = criar_conexao()
    if not conexao:
        return None

    try:
        cursor = conexao.cursor()

        cursor.execute("""
            SELECT CONTACTB, CLASSIFCONTA, DESCRCONTA, TIPOCONTA 
            FROM PLANOESPEC 
            WHERE CODIGOEMPRESA = ?
        """, (empresa,))
        
        plano_contas = {}      
        mapa_sinteticas = {}   
        
        rows = cursor.fetchall() 
        
        for row in rows:
            conta_real = row[0] 
            classif = row[1]    
            descr = row[2]
            tipo = row[3] 
            
            nivel = classif.count('.') + 1

            plano_contas[conta_real] = {
                "conta_real": conta_real, 
                "classif": classif,
                "descricao": descr,
                "tipo": tipo,
                "nivel": nivel,
                "debito": 0.0,
                "credito": 0.0
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
                if tipo_operacao == 'D':
                    plano_contas[conta_id_origem]['debito'] += valor
                else:
                    plano_contas[conta_id_origem]['credito'] += valor
                
                classif_origem = plano_contas[conta_id_origem]['classif']
                
                partes = classif_origem.split('.')
                
                partes.pop() 
                
                acumulado = ""
                for parte in partes:
                    if acumulado:
                        acumulado += "." + parte
                    else:
                        acumulado = parte
                    
                    if acumulado in mapa_sinteticas:
                        id_pai = mapa_sinteticas[acumulado]
                        if tipo_operacao == 'D':
                            plano_contas[id_pai]['debito'] += valor
                        else:
                            plano_contas[id_pai]['credito'] += valor

        for id_deb, id_cred, valor in lancamentos:
            valor_float = float(valor)

            if id_deb in plano_contas:
                propagar_valor(id_deb, valor_float, 'D')

            if id_cred in plano_contas:
                propagar_valor(id_cred, valor_float, 'C')

        return plano_contas

    except Exception as e:
        import traceback
        traceback.print_exc()
        return None
    finally:
        if conexao:
            conexao.close()