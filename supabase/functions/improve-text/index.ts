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
    const { text, type } = await req.json();
    
    if (!text || !type) {
      throw new Error('Texto e tipo são obrigatórios');
    }

    console.log(`[improve-text] Melhorando texto do tipo: ${type}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const prompts: Record<string, string> = {
      investigation: `Corrija erros de ortografia e gramática, e melhore a clareza do seguinte texto de investigação técnica. Mantenha o tom profissional e técnico. Retorne apenas o texto melhorado, sem adicionar explicações ou comentários:

${text}`,
      analysis: `Corrija erros de ortografia e gramática, e melhore a estrutura do seguinte texto de análise técnica. Mantenha o tom profissional. Retorne apenas o texto melhorado, sem adicionar explicações ou comentários:

${text}`,
      solution: `Corrija erros de ortografia e gramática, e melhore a clareza da seguinte descrição de solução técnica. Organize melhor as informações e mantenha o tom profissional. Retorne apenas o texto melhorado, sem adicionar explicações ou comentários:

${text}`,
      response: `Corrija erros de ortografia e gramática, e melhore a clareza da seguinte resposta ao cliente. Torne o texto mais claro e amigável, mas mantenha profissionalismo. Retorne apenas o texto melhorado, sem adicionar explicações ou comentários:

${text}`
    };

    const prompt = prompts[type] || prompts.solution;

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
            role: 'system', 
            content: 'Você é um assistente que corrige ortografia, gramática e melhora a clareza de textos técnicos. Sempre retorne APENAS o texto melhorado, sem adicionar comentários, explicações ou formatação extra.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[improve-text] Erro na API:', errorText);
      throw new Error(`Erro ao melhorar texto: ${response.status}`);
    }

    const data = await response.json();
    const improvedText = data.choices[0]?.message?.content?.trim() || text;

    console.log('[improve-text] ✅ Texto melhorado com sucesso');

    return new Response(
      JSON.stringify({ improvedText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[improve-text] Erro:', error);
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
