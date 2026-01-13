"""
Serviço de Conferência Fiscal
Regras de negócio DISTINTAS para Balanço e DRE
"""
import sys
from bd import bd_contabil, bd_fiscal

def obter_bp(empresa_id, data_inicio, data_fim):
    try:
        plano_bruto = bd_contabil.gerar_balancete_hierarquico_bruto(empresa_id, data_inicio, data_fim)
        if not plano_bruto: return []
        
        lista_ordenada = sorted(plano_bruto.values(), key=lambda x: x['classif'])
        
        lista_final = []

        for dados in lista_ordenada:
            classif = dados['classif']

            if not (classif.startswith('1') or classif.startswith('2')):
                continue

            if dados['nivel'] > 3: 
                continue 
            
            if abs(dados['debito']) < 0.001 and abs(dados['credito']) < 0.001:
                continue
            
            saldo = dados['debito'] - dados['credito']

            lista_final.append({
                "conta": dados['conta_real'],  
                "classificacao": dados['classif'],
                "descricao": dados['descricao'],
                "nivel": dados['nivel'],
                "valorDebito": dados['debito'],
                "valorCredito": dados['credito'],
                "saldo": saldo
            })
        
        return lista_final
    except Exception:
        import traceback
        traceback.print_exc()
        return []
    
def conferir_cfop_x_contabil(empresa, data_ini, data_fim, conta_alvo_id, lista_cfops):
    """
    Verifica se a soma das notas fiscais (CFOPs X, Y, Z) bate com o saldo
    da conta contábil Alvo e todos os seus descendentes.
    """
    try:
        notas = bd_fiscal.buscar_notas_por_cfop(empresa, data_ini, data_fim, lista_cfops)
        
        total_fiscal = sum(n['valor'] for n in notas)
        
        plano_completo = bd_contabil.gerar_balancete_hierarquico_bruto(empresa, data_ini, data_fim)
        
        if not plano_completo:
            return {"erro": "Não foi possível carregar dados contábeis"}

        dados_conta_alvo = plano_completo.get(conta_alvo_id) 
        
        if not dados_conta_alvo:
            return {
                "sucesso": False,
                "mensagem": f"Conta {conta_alvo_id} não encontrada no plano."
            }
            
        saldo_contabil = dados_conta_alvo['debito'] - dados_conta_alvo['credito']
        
        diferenca = total_fiscal - saldo_contabil
        
        return {
            "sucesso": True,
            "conta_analisada": {
                "id": dados_conta_alvo['conta_real'],
                "descricao": dados_conta_alvo['descricao'],
                "classificacao": dados_conta_alvo['classif']
            },
            "cfops_analisados": lista_cfops,
            "total_fiscal": total_fiscal,
            "total_contabil": saldo_contabil,
            "diferenca": diferenca,
            "status": "OK" if abs(diferenca) < 0.01 else "DIVERGENTE"
        }

    except Exception:
        import traceback
        traceback.print_exc()
        return {"erro": "Erro interno ao processar conferência"}

def obter_dre(empresa_id, data_inicio, data_fim):
    try:
        plano_bruto = bd_contabil.gerar_balancete_hierarquico_bruto(empresa_id, data_inicio, data_fim)
        if not plano_bruto: return []
        
        lista_final = []
        classificacoes = sorted(plano_bruto.keys())

        for classif in classificacoes:
            dados = plano_bruto[classif]

            if classif.startswith('1') or classif.startswith('2'):
                continue

            if dados['nivel'] <= 4:
                if dados['debito'] == 0 and dados['credito'] == 0: continue
                
                if classif.startswith('3'): 
                     saldo = dados['credito'] - dados['debito']
                else: 
                     saldo = dados['debito'] - dados['credito']

                lista_final.append({
                    "conta": dados['conta_real'],
                    "classificacao": dados['classif'],
                    "descricao": dados['descricao'],
                    "nivel": dados['nivel'],
                    "saldo": saldo 
                })
        
        return lista_final
    except Exception:
        import traceback
        traceback.print_exc()
        return []