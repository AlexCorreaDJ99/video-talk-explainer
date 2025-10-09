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
                      text: `Analise esta imagem de evidência de um bug/problema de aplicativo de corridas. 
                             Identifique: dados visíveis (IDs, nomes, valores), erros na tela, timestamps, 
                             e qualquer informação relevante para debug. Seja detalhado e técnico.`
                    },
                    {
                      type: 'image_url',
                      image_url: { url: dataUrl }
                    }
                  ]
                }
              ],
            }),
          });

          if (!response.ok) {
            console.error('Erro na análise da imagem:', await response.text());
            return `${file.name}: Erro ao analisar`;
          }

          const data = await response.json();
          const analysis = data.choices?.[0]?.message?.content || 'Sem análise';
          return `📸 ${file.name}:\n${analysis}`;
        }
        return `📄 ${file.name}: Arquivo não-imagem (análise manual necessária)`;
      })
    );

    const fullAnalysis = imageAnalyses.join('\n\n');

    console.log('Análise concluída com sucesso');

    return new Response(
      JSON.stringify({ 
        analise: fullAnalysis,
        total_files: files.length 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
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