import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      throw new Error('Nenhum vídeo fornecido');
    }

    console.log('Processando vídeo:', videoFile.name, videoFile.type);

    // Extrair áudio do vídeo e transcrever com OpenAI Whisper
    const audioFormData = new FormData();
    audioFormData.append('file', videoFile, videoFile.name);
    audioFormData.append('model', 'whisper-1');
    audioFormData.append('language', 'pt');
    audioFormData.append('response_format', 'verbose_json');

    console.log('Transcrevendo áudio com Whisper...');
    const transcriptionResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: audioFormData,
    });

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      console.error('Erro na transcrição:', error);
      throw new Error(`Erro ao transcrever áudio: ${error}`);
    }

    const transcription = await transcriptionResponse.json();
    console.log('Transcrição completa:', transcription.text);

    // Analisar o conteúdo com Lovable AI (Gemini)
    console.log('Analisando contexto com IA...');
    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especializado em análise de conteúdo de vídeos.
Sua tarefa é analisar transcrições de vídeos e fornecer:
1. Um resumo claro do contexto geral
2. Os principais tópicos discutidos
3. Problemas, desafios ou questões mencionadas
4. Insights e observações importantes

Formate sua resposta em JSON com a seguinte estrutura:
{
  "contexto": "resumo geral do vídeo",
  "topicos": ["tópico 1", "tópico 2", ...],
  "problemas": ["problema 1", "problema 2", ...],
  "insights": ["insight 1", "insight 2", ...]
}`
          },
          {
            role: 'user',
            content: `Analise a seguinte transcrição de vídeo:\n\n${transcription.text}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!analysisResponse.ok) {
      const error = await analysisResponse.text();
      console.error('Erro na análise:', error);
      
      if (analysisResponse.status === 429) {
        throw new Error('Limite de requisições excedido. Por favor, tente novamente mais tarde.');
      }
      if (analysisResponse.status === 402) {
        throw new Error('Créditos insuficientes. Por favor, adicione créditos ao seu workspace.');
      }
      
      throw new Error(`Erro ao analisar conteúdo: ${error}`);
    }

    const analysisData = await analysisResponse.json();
    const analysis = JSON.parse(analysisData.choices[0].message.content);

    console.log('Análise completa');

    return new Response(
      JSON.stringify({
        transcricao: transcription.text,
        segmentos: transcription.segments || [],
        analise: analysis
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro no processamento:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido no processamento do vídeo'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
