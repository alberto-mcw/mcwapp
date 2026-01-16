import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
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

    const { submissionId } = await req.json();
    
    // Validate submissionId format
    if (!submissionId || !UUID_REGEX.test(submissionId)) {
      return new Response(
        JSON.stringify({ error: "ID de envío inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify ownership of submission
    const { data: submission, error: fetchError } = await supabase
      .from("challenge_submissions")
      .select("user_id, transcription")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      return new Response(
        JSON.stringify({ error: "Envío no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (submission.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "No autorizado para este envío" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!submission.transcription) {
      return new Response(
        JSON.stringify({ error: "La transcripción no está disponible" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Extracting recipe from transcription for submission:", submissionId);

    // Call Lovable AI to extract recipe data
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Eres un experto en cocina que extrae información de recetas. 
Analiza la transcripción de un vídeo de cocina y extrae:
1. Ingredientes mencionados (con cantidades si se mencionan)
2. Pasos de ejecución/preparación (en orden)
3. Utensilios de cocina mencionados

Responde SOLO con JSON válido, sin markdown, en este formato exacto:
{
  "ingredients": ["ingrediente 1", "ingrediente 2"],
  "steps": ["paso 1", "paso 2"],
  "utensils": ["utensilio 1", "utensilio 2"]
}

Si no puedes identificar alguna categoría, usa un array vacío.`
          },
          {
            role: "user",
            content: `Transcripción del vídeo de cocina:\n\n${submission.transcription}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible. Inténtalo más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente no disponible." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI Gateway error:", aiResponse.status);
      throw new Error("Error en el servicio de IA");
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    let recipeData;
    try {
      // Clean up the response in case it has markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      recipeData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response");
      recipeData = {
        ingredients: [],
        steps: [],
        utensils: []
      };
    }

    // Update the submission with recipe data
    const { error: updateError } = await supabase
      .from("challenge_submissions")
      .update({ 
        recipe_data: recipeData,
        transcription_status: "complete"
      })
      .eq("id", submissionId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, recipe: recipeData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Recipe extraction error:", error);
    return new Response(
      JSON.stringify({ error: "Error procesando la receta. Inténtalo de nuevo." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});