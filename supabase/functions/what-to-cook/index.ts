import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { ingredients, images, leadId } = await req.json();

    if (!ingredients?.length && !images?.length) {
      return new Response(
        JSON.stringify({ error: "Debes proporcionar ingredientes o imágenes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate: derive userId from JWT, never trust request body
    let authenticatedUserId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) authenticatedUserId = user.id;
    }

    // Require either authentication or valid leadId
    if (!authenticatedUserId && !leadId) {
      return new Response(
        JSON.stringify({ error: "Authentication or lead ID required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate leadId format
    if (leadId && !UUID_REGEX.test(leadId)) {
      return new Response(
        JSON.stringify({ error: "Invalid lead ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify leadId exists in database if provided
    if (leadId && !authenticatedUserId) {
      const { data: lead } = await supabase
        .from("recetario_leads")
        .select("id")
        .eq("id", leadId)
        .single();
      if (!lead) {
        return new Response(
          JSON.stringify({ error: "Invalid lead" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Step 1: If images provided, extract ingredients using AI vision
    let allIngredients: string[] = [...(ingredients || [])];

    if (images?.length) {
      const imageContent = images.map((img: string) => ({
        type: "image_url" as const,
        image_url: { url: img },
      }));

      const extractResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Eres un experto en identificar ingredientes de cocina en fotografías.
Analiza las imágenes y devuelve SOLO una lista de ingredientes que puedas identificar.
Responde en formato JSON: { "ingredientes": ["ingrediente1", "ingrediente2", ...] }
Sé específico pero conciso. Incluye cantidades aproximadas si son visibles.`
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Identifica todos los ingredientes que ves en estas imágenes de mi nevera/despensa:" },
                ...imageContent,
              ],
            },
          ],
        }),
      });

      if (!extractResponse.ok) {
        const status = extractResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Demasiadas solicitudes, inténtalo de nuevo en unos segundos" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Créditos de IA agotados" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI service error");
      }

      const extractData = await extractResponse.json();
      const extractText = extractData.choices?.[0]?.message?.content || "";
      
      try {
        const jsonMatch = extractText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.ingredientes) {
            allIngredients = [...allIngredients, ...parsed.ingredientes];
          }
        }
      } catch {
        console.error("Failed to parse ingredient extraction");
      }
    }

    // Remove duplicates
    allIngredients = [...new Set(allIngredients.map((i: string) => i.toLowerCase().trim()))];

    if (allIngredients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se pudieron identificar ingredientes", extractedIngredients: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Search user's own recipes — use authenticated userId (never from body)
    let userRecipes: any[] = [];
    if (authenticatedUserId || leadId) {
      let query = supabase
        .from("recipes")
        .select("id, title, structured_data, original_image_url, difficulty, estimated_time, servings, recipe_type")
        .eq("status", "completed");

      if (authenticatedUserId) {
        query = query.eq("user_id", authenticatedUserId);
      } else if (leadId) {
        query = query.eq("lead_id", leadId);
      }

      const { data } = await query;
      userRecipes = data || [];
    }

    // Step 3: Search public recipes
    const { data: publicRecipes } = await supabase
      .from("recipes")
      .select("id, title, structured_data, original_image_url, difficulty, estimated_time, servings, recipe_type")
      .eq("status", "completed")
      .eq("visibility", "public")
      .limit(200);

    // Step 4: Use AI to match recipes and suggest new ones
    const userRecipeSummaries = userRecipes.map((r) => {
      const sd = r.structured_data as any;
      return {
        id: r.id,
        titulo: sd?.titulo || r.title,
        ingredientes: sd?.ingredientes?.map((i: any) => i.nombre || i) || [],
        tipo: r.recipe_type,
      };
    });

    const publicRecipeSummaries = (publicRecipes || [])
      .filter((r) => !userRecipes.some((ur) => ur.id === r.id))
      .map((r) => {
        const sd = r.structured_data as any;
        return {
          id: r.id,
          titulo: sd?.titulo || r.title,
          ingredientes: sd?.ingredientes?.map((i: any) => i.nombre || i) || [],
          tipo: r.recipe_type,
        };
      });

    const suggestResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Eres un chef experto. El usuario tiene estos ingredientes disponibles: ${allIngredients.join(", ")}.

Tu tarea:
1. PRIMERO: De las "recetas del usuario", identifica cuáles puede hacer con los ingredientes disponibles (al menos 50% de coincidencia).
2. SEGUNDO: De las "recetas públicas", identifica cuáles puede hacer.
3. TERCERO: Sugiere 3-5 recetas NUEVAS que podría hacer con esos ingredientes.

Responde SOLO en JSON con esta estructura exacta:
{
  "matching_user_recipes": [{ "id": "uuid", "reason": "breve explicación de por qué encaja" }],
  "matching_public_recipes": [{ "id": "uuid", "reason": "breve explicación" }],
  "ai_suggestions": [
    {
      "titulo": "Nombre de la receta",
      "descripcion": "Breve descripción apetecible",
      "ingredientes_principales": ["ing1", "ing2"],
      "tiempo_estimado": "30 min",
      "dificultad": "fácil|media|difícil"
    }
  ]
}`
          },
          {
            role: "user",
            content: `Ingredientes disponibles: ${allIngredients.join(", ")}

Recetas del usuario:
${JSON.stringify(userRecipeSummaries.slice(0, 50))}

Recetas públicas:
${JSON.stringify(publicRecipeSummaries.slice(0, 100))}`
          }
        ],
      }),
    });

    if (!suggestResponse.ok) {
      const status = suggestResponse.status;
      if (status === 429 || status === 402) {
        return new Response(JSON.stringify({ error: status === 429 ? "Demasiadas solicitudes" : "Créditos agotados" }), {
          status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service error");
    }

    const suggestData = await suggestResponse.json();
    const suggestText = suggestData.choices?.[0]?.message?.content || "";

    let result = { matching_user_recipes: [], matching_public_recipes: [], ai_suggestions: [] };
    try {
      const jsonMatch = suggestText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error("Failed to parse suggestions");
    }

    // Enrich matched recipes with full data
    const enrichedUserMatches = (result.matching_user_recipes || []).map((match: any) => {
      const recipe = userRecipes.find((r) => r.id === match.id);
      return recipe ? { ...recipe, match_reason: match.reason } : null;
    }).filter(Boolean);

    const enrichedPublicMatches = (result.matching_public_recipes || []).map((match: any) => {
      const recipe = (publicRecipes || []).find((r) => r.id === match.id);
      return recipe ? { ...recipe, match_reason: match.reason } : null;
    }).filter(Boolean);

    return new Response(
      JSON.stringify({
        extractedIngredients: allIngredients,
        userMatches: enrichedUserMatches,
        publicMatches: enrichedPublicMatches,
        aiSuggestions: result.ai_suggestions || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("what-to-cook error:", e);
    return new Response(
      JSON.stringify({ error: "Error processing request. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
