import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();
    
    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "Missing submissionId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the transcription
    const { data: submission, error: fetchError } = await supabase
      .from("challenge_submissions")
      .select("transcription")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      throw new Error("Submission not found");
    }

    if (!submission.transcription) {
      throw new Error("No transcription available");
    }

    console.log("Extracting recipe from transcription...");

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
          JSON.stringify({ error: "Límite de solicitudes excedido. Inténtalo más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    console.log("AI response:", content);

    // Parse the JSON response
    let recipeData;
    try {
      // Clean up the response in case it has markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      recipeData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      recipeData = {
        ingredients: [],
        steps: [],
        utensils: [],
        raw_response: content
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
