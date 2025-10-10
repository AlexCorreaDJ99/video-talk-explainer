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
    
    const audioFile = formData.get('file') as File;
    const provider = formData.get('provider') as string;
    const apiKey = formData.get('apiKey') as string;
    
    if (!audioFile) {
      throw new Error('Nenhum arquivo de áudio fornecido');
    }
    
    if (!provider || !apiKey) {
      throw new Error('Provider ou API Key não fornecidos');
    }
    
    console.log(`[transcribe-audio] Transcrevendo ${audioFile.name} com ${provider}`);
    
    // Preparar FormData para Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    
    let url = "";
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${apiKey}`,
    };
    
    if (provider === "openai") {
      url = "https://api.openai.com/v1/audio/transcriptions";
      whisperFormData.append('model', 'whisper-1');
    } else if (provider === "groq") {
      url = "https://api.groq.com/openai/v1/audio/transcriptions";
      whisperFormData.append('model', 'whisper-large-v3');
    } else {
      throw new Error(`Provider não suportado: ${provider}`);
    }
    
    console.log(`[transcribe-audio] Enviando para ${url}...`);
    
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: whisperFormData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[transcribe-audio] Erro ${response.status}:`, errorText);
      
      if (response.status === 401 || response.status === 403) {
        throw new Error(`API Key inválida para ${provider}`);
      } else if (response.status === 429) {
        throw new Error('Limite de requisições excedido. Aguarde e tente novamente.');
      } else if (response.status === 413) {
        throw new Error('Arquivo muito grande. Limite: 25MB');
      }
      
      throw new Error(`Erro ao transcrever: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[transcribe-audio] ✅ Transcrição concluída: ${result.text?.length || 0} caracteres`);
    
    return new Response(
      JSON.stringify({ text: result.text || "" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[transcribe-audio] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
