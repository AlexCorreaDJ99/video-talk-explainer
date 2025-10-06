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
    
    // Coletar todos os arquivos de mídia e imagens
    const mediaFiles: File[] = [];
    const imageFiles: File[] = [];
    let pastedText = '';
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('media_') && value instanceof File) {
        mediaFiles.push(value);
      } else if (key.startsWith('image_') && value instanceof File) {
        imageFiles.push(value);
      } else if (key === 'pasted_text' && typeof value === 'string') {
        pastedText = value;
      }
    }

    if (mediaFiles.length === 0 && imageFiles.length === 0 && !pastedText) {
      throw new Error('Nenhum arquivo ou texto fornecido');
    }

    console.log(`Processando ${mediaFiles.length} arquivo(s) de mídia e ${imageFiles.length} imagem(ns)`);

    // Processar arquivos de mídia (vídeo/áudio) com Whisper
    let allTranscriptions = '';
    let allSegments: any[] = [];
    
    for (const mediaFile of mediaFiles) {
      console.log('Transcrevendo:', mediaFile.name, mediaFile.type);
      
      const audioFormData = new FormData();
      audioFormData.append('file', mediaFile, mediaFile.name);
      audioFormData.append('model', 'whisper-large-v3-turbo');
      audioFormData.append('language', 'pt');
      audioFormData.append('response_format', 'verbose_json');

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
        throw new Error(`Erro ao transcrever ${mediaFile.name}: ${error}`);
      }

      const transcription = await transcriptionResponse.json();
      allTranscriptions += `\n\n[${mediaFile.name}]\n${transcription.text}`;
      allSegments = allSegments.concat(transcription.segments || []);
    }
    
    console.log('Transcrições completas');
    
    // Processar imagens e converter para base64
    const imageContents = [];
    for (const imageFile of imageFiles) {
      console.log('Processando imagem:', imageFile.name);
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      imageContents.push({
        type: "image_url",
        image_url: {
          url: `data:${imageFile.type};base64,${base64}`
        }
      });
    }

    // Analisar o conteúdo com Lovable AI (Gemini)
    console.log('Analisando contexto com IA...');
    
    // Construir mensagem com texto e imagens
    const userContent: any[] = [];
    
    if (allTranscriptions) {
      userContent.push({
        type: "text",
        text: `Analise o seguinte conteúdo de mídia:\n\n${allTranscriptions}`
      });
    }
    
    if (pastedText) {
      userContent.push({
        type: "text",
        text: `\n\nTexto colado pelo usuário (conversas, mensagens):\n\n${pastedText}`
      });
    }
    
    if (imageContents.length > 0) {
      userContent.push({
        type: "text",
        text: `\n\nAlém do conteúdo acima, também foram fornecidas ${imageContents.length} imagem(ns). Analise o conteúdo visual e integre com o contexto:`
      });
      userContent.push(...imageContents);
    }
    
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
            content: `Você é um assistente especializado em análise de conteúdo multimídia (vídeos, áudios e imagens).
Sua tarefa é analisar transcrições e imagens fornecidas e fornecer:
1. Um resumo claro do contexto geral integrando todos os elementos
2. Os principais tópicos discutidos ou mostrados
3. Problemas, desafios ou questões mencionadas ou visíveis
4. Insights e observações importantes baseados em todo o conteúdo
5. Análise de sentimento do cliente (positivo, neutro, frustrado, irritado, confuso)
6. Nível de urgência do caso (baixa, media, alta, critica)
7. Categoria do problema (bug, duvida, funcionalidade, pagamento, desempenho, outro)
8. Resumo ultra-conciso em no máximo 100 caracteres

Formate sua resposta em JSON com a seguinte estrutura:
{
  "contexto": "resumo geral integrando texto e imagens",
  "topicos": ["tópico 1", "tópico 2", ...],
  "problemas": ["problema 1", "problema 2", ...],
  "insights": ["insight 1", "insight 2", ...],
  "sentimento": "positivo|neutro|frustrado|irritado|confuso",
  "urgencia": "baixa|media|alta|critica",
  "categoria": "bug|duvida|funcionalidade|pagamento|desempenho|outro",
  "resumo_curto": "resumo em até 100 caracteres"
}`
          },
          {
            role: 'user',
            content: userContent
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

    // Combinar todo o conteúdo textual
    let fullTranscription = '';
    if (allTranscriptions) fullTranscription += allTranscriptions;
    if (pastedText) fullTranscription += `\n\n[Texto Colado]\n${pastedText}`;
    
    return new Response(
      JSON.stringify({
        transcricao: fullTranscription || 'Nenhum conteúdo textual disponível',
        segmentos: allSegments,
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
