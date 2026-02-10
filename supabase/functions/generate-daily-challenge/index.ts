import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHALLENGE_TYPES = [
  "trivia",      // Pregunta de cultura gastronómica
  "guess_dish",  // Adivina el plato por descripción
  "ingredient",  // ¿Qué ingrediente falta?
  "technique",   // Técnica culinaria
  "origin"       // Origen del plato
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header for user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autenticación requerida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create client with user's auth to verify identity
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuario no autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body for optional context
    let context = '';
    try {
      const body = await req.json();
      context = body?.context || '';
    } catch {
      // No body or invalid JSON, that's fine
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Error de configuración del servidor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pick a random challenge type
    const challengeType = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];

    const brandInstructions = context
      ? `\n\nCONTEXTO DE MARCA/PATROCINIO: El reto está patrocinado o relacionado con "${context}". Integra la marca de forma natural en el título (ej: "Mini Reto ${context.split('(')[0].trim()}") y en el contenido del reto. Las preguntas deben estar relacionadas con el producto o temática de la marca.`
      : '';

    const systemPrompt = `Eres un experto chef y educador culinario. Genera retos diarios divertidos y educativos sobre gastronomía.

Tipos de reto:
- trivia: Pregunta de cultura gastronómica con 4 opciones
- guess_dish: Describe un plato famoso sin nombrarlo, usuario adivina
- ingredient: Presenta una receta incompleta, usuario adivina el ingrediente clave
- technique: Pregunta sobre técnicas culinarias
- origin: ¿De qué país/región es este plato?

El reto debe ser:
- Completable en 1-2 minutos
- Educativo pero divertido
- Variado (cocinas del mundo, no solo española)
- Con nivel de dificultad medio${brandInstructions}`;

    const userPrompt = `Genera un reto tipo "${challengeType}" para hoy.${context ? ` Contexto de marca: "${context}".` : ''} Devuelve SOLO el JSON sin explicaciones.`;

    // Use tool calling for structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_trivia",
              description: "Create a daily trivia challenge",
              parameters: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["trivia", "guess_dish", "ingredient", "technique", "origin"] },
                  title: { type: "string", description: "Título corto y atractivo" },
                  question: { type: "string", description: "La pregunta o descripción del reto" },
                  options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                  correct_answer: { type: "number", description: "Índice (0-3) de la respuesta correcta" },
                  explanation: { type: "string", description: "Explicación educativa de la respuesta correcta" },
                  fun_fact: { type: "string", description: "Dato curioso relacionado" },
                  difficulty: { type: "string", enum: ["fácil", "medio", "difícil"] },
                  energy_reward: { type: "number", default: 25 }
                },
                required: ["type", "title", "question", "options", "correct_answer", "explanation", "fun_fact", "difficulty"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_trivia" } },
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible. Inténtalo en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402 || response.status === 500) {
        return new Response(
          JSON.stringify({ error: "Servicio de IA temporalmente no disponible. Inténtalo en unos minutos." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Error en el servicio de generación. Inténtalo de nuevo." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extract from tool call response
    let challenge;
    const toolCalls = data.choices?.[0]?.message?.tool_calls;
    
    if (toolCalls && toolCalls.length > 0) {
      // Parse from tool call arguments
      const args = toolCalls[0].function?.arguments;
      if (args) {
        try {
          challenge = typeof args === 'string' ? JSON.parse(args) : args;
          console.log("Parsed from tool call:", challenge.title);
        } catch (e) {
          console.error("Error parsing tool call arguments:", args);
          throw new Error("Error procesando la respuesta del modelo");
        }
      }
    }
    
    // Fallback to content if no tool call
    if (!challenge) {
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          let cleanContent = content
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();
          const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) cleanContent = jsonMatch[0];
          challenge = JSON.parse(cleanContent);
        } catch (e) {
          console.error("Error parsing content fallback");
          throw new Error("Error procesando la respuesta");
        }
      }
    }

    if (!challenge) {
      console.error("No valid response from AI:", JSON.stringify(data).substring(0, 500));
      throw new Error("No se recibió respuesta válida del modelo");
    }

    // Ensure energy_reward has default
    challenge.energy_reward = challenge.energy_reward || 25;

    return new Response(JSON.stringify(challenge), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-daily-challenge error:", error);
    return new Response(
      JSON.stringify({ error: "Error generando el reto. Inténtalo de nuevo." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});