const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      investigation_data, 
      my_investigation, 
      final_analysis, 
      solution, 
      responses_sent 
    } = await req.json();

    // Gerar relatório formatado
    const report = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              RELATÓRIO DE INVESTIGAÇÃO TÉCNICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Data do Relatório: ${new Date().toLocaleString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. RECLAMAÇÃO DO CLIENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${investigation_data?.reclamacao_cliente || 'Não informado'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. DADOS DA CORRIDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ID da Corrida: ${investigation_data?.dados_corrida?.id_corrida || 'N/A'}
Data/Hora: ${investigation_data?.dados_corrida?.data_hora ? new Date(investigation_data.dados_corrida.data_hora).toLocaleString('pt-BR') : 'N/A'}
Origem: ${investigation_data?.dados_corrida?.origem || 'N/A'}
Destino: ${investigation_data?.dados_corrida?.destino || 'N/A'}
Valor: ${investigation_data?.dados_corrida?.valor || 'N/A'}
Status: ${investigation_data?.dados_corrida?.status || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. DADOS DO MOTORISTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nome: ${investigation_data?.dados_motorista?.nome || 'N/A'}
ID: ${investigation_data?.dados_motorista?.id || 'N/A'}
Telefone: ${investigation_data?.dados_motorista?.telefone || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. DADOS DO PASSAGEIRO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nome: ${investigation_data?.dados_passageiro?.nome || 'N/A'}
ID: ${investigation_data?.dados_passageiro?.id || 'N/A'}
Telefone: ${investigation_data?.dados_passageiro?.telefone || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. ANÁLISE DA IA DAS EVIDÊNCIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${investigation_data?.analise_ia || 'Nenhuma análise automática foi realizada'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. INVESTIGAÇÃO REALIZADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${my_investigation || 'Não informado'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. ANÁLISE FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${final_analysis || 'Não informado'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. SOLUÇÃO APLICADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${solution || 'Nenhuma solução foi aplicada ainda'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. RESPOSTAS ENVIADAS AO CLIENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${responses_sent && responses_sent.length > 0 
  ? responses_sent.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n\n')
  : 'Nenhuma resposta foi enviada ainda'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. EVIDÊNCIAS ANEXADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${investigation_data?.evidencias && investigation_data.evidencias.length > 0
  ? investigation_data.evidencias.map((e: string, i: number) => `${i + 1}. ${e}`).join('\n')
  : 'Nenhuma evidência foi anexada'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              FIM DO RELATÓRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    return new Response(
      JSON.stringify({ report }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: unknown) {
    console.error('Erro ao gerar relatório:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});