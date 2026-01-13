from bd.conexao import criar_conexao
import sys

def buscar_notas_por_cfop(empresa, data_ini, data_fim, lista_cfops):
    """
    Busca notas fiscais de entrada que tenham os CFOPs especificados.
    Retorna uma lista de dicionários com os dados da nota.
    """
    conexao = criar_conexao()
    if not conexao:
        return []

    try:
        cursor = conexao.cursor()
        
        cfops_str = ",".join(str(c) for c in lista_cfops)
        
        sql = f"""
            SELECT 
                C.CODIGOCFOP,
                N.NUMERONF,
                N.DATAEMISSAO,
                N.CODIGOPESSOA,
                SUM(C.VALORCONTABILIMPOSTO) as VALOR_TOTAL
            FROM LCTOFISENT N
            JOIN LCTOFISENTCFOP C ON N.CHAVELCTOFISENT = C.CHAVELCTOFISENT 
                                 AND N.CODIGOEMPRESA = C.CODIGOEMPRESA
            WHERE N.CODIGOEMPRESA = ?
              AND N.DATAENTRADA BETWEEN ? AND ?
              AND C.CODIGOCFOP IN ({cfops_str})
            GROUP BY C.CODIGOCFOP, N.NUMERONF, N.DATAEMISSAO, N.CODIGOPESSOA
        """
        
        cursor.execute(sql, (empresa, data_ini, data_fim))
        
        resultados = []
        for row in cursor.fetchall():
            resultados.append({
                "cfop": row[0],
                "numero_nf": row[1],
                "data_emissao": row[2],
                "codigo_pessoa": row[3],
                "valor": float(row[4])
            })
            
        return resultados

    except Exception as e:
        import traceback
        traceback.print_exc()
        return []
    finally:
        if conexao:
            conexao.close()