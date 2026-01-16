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

    const systemPrompt = `Eres un experto chef y educador culinario. Genera retos diarios divertidos y educativos sobre gastronomía.

IMPORTANTE: Responde SOLO con JSON válido, sin texto adicional ni markdown.

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
- Con nivel de dificultad medio`;

    const userPrompt = `Genera un reto tipo "${challengeType}" para hoy.

Responde con este JSON exacto:
{
  "type": "${challengeType}",
  "title": "Título corto y atractivo",
  "question": "La pregunta o descripción del reto",
  "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
  "correct_answer": 0,
  "explanation": "Explicación educativa de la respuesta correcta",
  "fun_fact": "Dato curioso relacionado",
  "difficulty": "fácil|medio|difícil",
  "energy_reward": 25
}

correct_answer es el índice (0-3) de la respuesta correcta.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible. Inténtalo en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", response.status);
      throw new Error("Error en el servicio de generación");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No se recibió respuesta del modelo");
    }

    // Parse the JSON response
    let challenge;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      challenge = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Error parsing AI response");
      throw new Error("Error procesando la respuesta");
    }

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