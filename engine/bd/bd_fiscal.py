from bd.conexao import criar_conexao_questor


def buscar_notas_saida(empresa, data_ini, data_fim):
    """
    Busca notas de saída fiscais (LCTOFISSAI) e seus CFOPs.
    Retorna lista de dicionários padronizada.
    """
    conn = criar_conexao_questor()
    if not conn:
        return []

    try:
        cursor = conn.cursor()
        sql = """
            SELECT 
                F.CHAVELCTOFISSAI, 
                F.NUMERONF, 
                F.VALORCONTABIL, 
                F.DATALCTOFIS,
                CF.CODIGOCFOP,
                CF.VALORIMPOSTO,   
                CF.ALIQIMPOSTO     
            FROM LCTOFISSAI F
            INNER JOIN LCTOFISSAICFOP CF 
                ON (F.CHAVELCTOFISSAI = CF.CHAVELCTOFISSAI 
                    AND F.CODIGOEMPRESA = CF.CODIGOEMPRESA)
            WHERE F.CODIGOEMPRESA = ? 
              AND F.DATALCTOFIS BETWEEN ? AND ?
        """
        cursor.execute(sql, (empresa, data_ini, data_fim))

        return [
            {
                "id_fiscal": row[0],
                "numero_nf": row[1],
                "valor_total": float(row[2]) if row[2] else 0.0,
                "data": row[3],
                "cfop": row[4],
                "valor_imposto": float(row[5]) if row[5] else 0.0,
                "aliquota": float(row[6]) if row[6] else 0.0,
            }
            for row in cursor.fetchall()
        ]

    except Exception as e:
        print(f"[bd_fiscal] Erro ao buscar notas: {e}")
        return []
    finally:
        conn.close()
