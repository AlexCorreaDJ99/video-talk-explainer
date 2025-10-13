const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar API Key
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada. Configure nas secrets do projeto.');
    }
    const formData = await req.formData();
    const files: File[] = [];
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      throw new Error('Nenhum arquivo foi enviado');
    }

    console.log(`Analisando ${files.length} arquivo(s)...`);

    // Processar imagens com IA
    const imageAnalyses = await Promise.all(
      files.map(async (file) => {
        if (file.type.startsWith('image/')) {
          const buffer = await file.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          const dataUrl = `data:${file.type};base64,${base64}`;

          // Usar Lovable AI para analisar a imagem
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: `Analise esta imagem de evidência de um bug/problema de aplicativo de corridas/delivery. 
                             Extraia e identifique informações estruturadas:
                             
                             1. PESSOAS:
                                - Nome do motorista (se visível)
                                - Nome do passageiro/cliente (se visível)
                                - CPF ou identificadores (se visível)
                             
                             2. VALORES E DADOS:
                                - Valores da corrida
                                - Horários/timestamps
                                - IDs de transação
                                - Endereços
                             
                             3. PROBLEMA:
                                - Descrição do erro/bug
                                - Mensagens de erro visíveis
                                - Inconsistências encontradas
                             
                             Seja específico e técnico. Liste APENAS as informações realmente visíveis na imagem.`
                    },
                    {
                      type: 'image_url',
                      image_url: { url: dataUrl }
                    }
                  ]
                }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "extract_evidence_data",
                    description: "Extrai dados estruturados de evidências de aplicativo",
                    parameters: {
                      type: "object",
                      properties: {
                        motorista: {
                          type: "object",
                          properties: {
                            nome: { type: "string" },
                            identificador: { type: "string" }
                          }
                        },
                        passageiro: {
                          type: "object",
                          properties: {
                            nome: { type: "string" },
                            identificador: { type: "string" }
                          }
                        },
                        valores: {
                          type: "object",
                          properties: {
                            valor_corrida: { type: "string" },
                            valor_cobrado: { type: "string" },
                            diferenca: { type: "string" }
                          }
                        },
                        reclamacao: { type: "string" },
                        horario: { type: "string" },
                        localizacao: { type: "string" },
                        erro_tecnico: { type: "string" },
                        observacoes: { type: "string" }
                      },
                      required: [],
                      additionalProperties: false
                    }
                  }
                }
              ],
              tool_choice: { type: "function", function: { name: "extract_evidence_data" } }
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na análise da imagem:', errorText);
            
            if (response.status === 429) {
              return { file: file.name, error: 'Limite de requisições excedido', data: null };
            }
            if (response.status === 402) {
              return { file: file.name, error: 'Créditos insuficientes', data: null };
            }
            if (response.status === 401) {
              return { file: file.name, error: 'API Key inválida', data: null };
            }
            
            return { file: file.name, error: `Erro ao analisar - ${errorText}`, data: null };
          }

          const data = await response.json();
          
          // Extrair dados estruturados do tool call
          const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
          const extractedData = toolCall?.function?.arguments ? 
            JSON.parse(toolCall.function.arguments) : {};
          
          const textAnalysis = data.choices?.[0]?.message?.content || '';
          
          return {
            file: file.name,
            data: extractedData,
            analysis: textAnalysis
          };
        }
        return { file: file.name, data: null, analysis: `Arquivo não-imagem (análise manual necessária)` };
      })
    );

    // Combinar dados extraídos
    const combinedData = {
      motorista: {} as any,
      passageiro: {} as any,
      valores: {} as any,
      reclamacao: '',
      horario: '',
      localizacao: '',
      erro_tecnico: '',
      observacoes: [] as string[]
    };

    const detailedAnalyses: string[] = [];

    imageAnalyses.forEach((result) => {
      if (result.data) {
        // Mesclar dados do motorista
        if (result.data.motorista) {
          if (result.data.motorista.nome) combinedData.motorista.nome = result.data.motorista.nome;
          if (result.data.motorista.identificador) combinedData.motorista.identificador = result.data.motorista.identificador;
        }
        
        // Mesclar dados do passageiro
        if (result.data.passageiro) {
          if (result.data.passageiro.nome) combinedData.passageiro.nome = result.data.passageiro.nome;
          if (result.data.passageiro.identificador) combinedData.passageiro.identificador = result.data.passageiro.identificador;
        }
        
        // Mesclar valores
        if (result.data.valores) {
          if (result.data.valores.valor_corrida) combinedData.valores.valor_corrida = result.data.valores.valor_corrida;
          if (result.data.valores.valor_cobrado) combinedData.valores.valor_cobrado = result.data.valores.valor_cobrado;
          if (result.data.valores.diferenca) combinedData.valores.diferenca = result.data.valores.diferenca;
        }
        
        // Priorizar primeira reclamação não vazia
        if (result.data.reclamacao && !combinedData.reclamacao) {
          combinedData.reclamacao = result.data.reclamacao;
        }
        
        if (result.data.horario && !combinedData.horario) {
          combinedData.horario = result.data.horario;
        }
        
        if (result.data.localizacao && !combinedData.localizacao) {
          combinedData.localizacao = result.data.localizacao;
        }
        
        if (result.data.erro_tecnico && !combinedData.erro_tecnico) {
          combinedData.erro_tecnico = result.data.erro_tecnico;
        }
        
        if (result.data.observacoes) {
          combinedData.observacoes.push(result.data.observacoes);
        }
      }
      
      if (result.analysis) {
        detailedAnalyses.push(`📸 ${result.file}:\n${result.analysis}`);
      }
    });

    const fullAnalysis = detailedAnalyses.join('\n\n');

    console.log('Análise concluída com sucesso');
    console.log('Dados extraídos:', JSON.stringify(combinedData, null, 2));

    return new Response(
      JSON.stringify({ 
        analise: fullAnalysis,
        dados_estruturados: combinedData,
        total_files: files.length 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: unknown) {
    console.error('Erro ao analisar evidências:', error);
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