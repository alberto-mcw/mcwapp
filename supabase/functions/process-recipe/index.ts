import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, recipeId, action, recipeData, servings } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Route to appropriate handler
    if (action === "ocr") {
      return await handleOCR(imageUrl, recipeId, LOVABLE_API_KEY, supabase);
    } else if (action === "structure") {
      return await handleStructure(recipeId, LOVABLE_API_KEY, supabase);
    } else if (action === "healthy") {
      return await handleHealthy(recipeId, LOVABLE_API_KEY, supabase);
    } else if (action === "alternatives") {
      return await handleAlternatives(recipeId, LOVABLE_API_KEY, supabase);
    } else if (action === "shopping-list") {
      return await handleShoppingList(recipeId, LOVABLE_API_KEY, supabase);
    } else if (action === "adjust-servings") {
      return await handleAdjustServings(recipeId, servings, LOVABLE_API_KEY, supabase);
    } else if (action === "full-process") {
      return await handleFullProcess(imageUrl, recipeId, LOVABLE_API_KEY, supabase);
    } else if (action === "generate-image") {
      return await handleGenerateImage(recipeId, LOVABLE_API_KEY, supabase);
    } else if (action === "update-recipe") {
      return await handleUpdateRecipe(recipeId, recipeData, supabase);
    } else {
      throw new Error("Invalid action: " + action);
    }
  } catch (e) {
    console.error("process-recipe error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function callAI(messages: any[], LOVABLE_API_KEY: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded, please try again later");
    if (response.status === 402) throw new Error("AI credits exhausted");
    const t = await response.text();
    throw new Error(`AI gateway error ${response.status}: ${t}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callAIWithTools(messages: any[], tools: any[], toolChoice: any, LOVABLE_API_KEY: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      tools,
      tool_choice: toolChoice,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded, please try again later");
    if (response.status === 402) throw new Error("AI credits exhausted");
    const t = await response.text();
    throw new Error(`AI gateway error ${response.status}: ${t}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall) {
    return JSON.parse(toolCall.function.arguments);
  }
  // Fallback: try to parse content as JSON
  const content = data.choices?.[0]?.message?.content || "";
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]);
    return JSON.parse(content);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}

const recipeStructureTool = {
  type: "function" as const,
  function: {
    name: "structure_recipe",
    description: "Structure a recipe from OCR text into a clean JSON format",
    parameters: {
      type: "object",
      properties: {
        titulo: { type: "string", description: "Recipe title" },
        ingredientes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nombre: { type: "string" },
              cantidad: { type: "number" },
              unidad: { type: "string" },
              categoria: { type: "string", enum: ["verduras", "carnes_pescados", "lacteos", "despensa", "otros"] },
            },
            required: ["nombre", "cantidad", "unidad", "categoria"],
          },
        },
        pasos: { type: "array", items: { type: "string" } },
        tiempo_estimado: { type: "string" },
        dificultad: { type: "string", enum: ["facil", "media", "dificil"] },
        tipo_receta: { type: "string", enum: ["dulce", "salado", "bebida", "postre", "entrante", "principal"] },
        estilo_regional: { type: "string" },
        raciones: { type: "number" },
        calorias_por_racion: { type: "number" },
        historia_emocional: { type: "string", description: "A brief emotional story about this type of traditional recipe, 2-3 sentences" },
        consejo_final: { type: "string", description: "A final tip or advice from a grandmother" },
      },
      required: ["titulo", "ingredientes", "pasos", "tiempo_estimado", "dificultad", "tipo_receta", "raciones"],
    },
  },
};

async function handleFullProcess(imageUrl: string, recipeId: string, apiKey: string, supabase: any) {
  // Step 1: OCR + Structure in one call
  const messages = [
    {
      role: "system",
      content: `Eres un experto en gastronomía tradicional española y latinoamericana. 
Tu tarea es analizar una imagen de una receta manuscrita y extraer toda la información.

INSTRUCCIONES:
1. Lee el texto manuscrito de la imagen con la mayor precisión posible
2. Corrige errores ortográficos
3. Interpreta medidas antiguas (cucharadas, pellizcos, puñados) y conviértelas a medidas estándar
4. Normaliza las unidades (g, ml, unidades, cucharadas, etc.)
5. Si faltan datos, infiere con sentido común gastronómico
6. Genera una historia emocional breve sobre este tipo de receta tradicional
7. Estima calorías por ración
8. Clasifica cada ingrediente en su categoría de compra

Responde SIEMPRE en español.`,
    },
    {
      role: "user",
      content: [
        { type: "text", text: "Analiza esta receta manuscrita y extrae toda la información estructurada:" },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    },
  ];

  const structured = await callAIWithTools(
    messages,
    [recipeStructureTool],
    { type: "function", function: { name: "structure_recipe" } },
    apiKey
  );

  // Generate shopping list from ingredients
  const shoppingList: Record<string, any[]> = {
    verduras: [],
    carnes_pescados: [],
    lacteos: [],
    despensa: [],
    otros: [],
  };

  for (const ing of structured.ingredientes || []) {
    const cat = ing.categoria || "otros";
    if (shoppingList[cat]) {
      shoppingList[cat].push({ nombre: ing.nombre, cantidad: ing.cantidad, unidad: ing.unidad });
    } else {
      shoppingList.otros.push({ nombre: ing.nombre, cantidad: ing.cantidad, unidad: ing.unidad });
    }
  }

  // Update recipe in DB
  const { error } = await supabase
    .from("recipes")
    .update({
      title: structured.titulo || "Receta sin título",
      ocr_text: "Procesado con IA",
      corrected_text: "Procesado con IA",
      structured_data: structured,
      recipe_type: structured.tipo_receta || "salado",
      regional_style: structured.estilo_regional,
      servings: structured.raciones || 4,
      estimated_time: structured.tiempo_estimado,
      difficulty: structured.dificultad || "media",
      shopping_list: shoppingList,
      ai_story: structured.historia_emocional,
      calories_per_serving: structured.calorias_por_racion,
      status: "completed",
    })
    .eq("id", recipeId);

  if (error) throw new Error("DB update failed: " + error.message);

  return new Response(
    JSON.stringify({ success: true, recipe: structured, shoppingList }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleOCR(imageUrl: string, recipeId: string, apiKey: string, supabase: any) {
  const ocrText = await callAI(
    [
      { role: "system", content: "Eres un experto en OCR de textos manuscritos en español. Extrae el texto exacto de la imagen, preservando la estructura original. Solo devuelve el texto extraído, sin comentarios adicionales." },
      { role: "user", content: [{ type: "text", text: "Extrae el texto de esta receta manuscrita:" }, { type: "image_url", image_url: { url: imageUrl } }] },
    ],
    apiKey
  );

  await supabase.from("recipes").update({ ocr_text: ocrText }).eq("id", recipeId);

  return new Response(
    JSON.stringify({ success: true, ocrText }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleStructure(recipeId: string, apiKey: string, supabase: any) {
  const { data: recipe } = await supabase.from("recipes").select("ocr_text, corrected_text").eq("id", recipeId).single();
  const text = recipe?.corrected_text || recipe?.ocr_text;
  if (!text) throw new Error("No text to structure");

  const structured = await callAIWithTools(
    [
      { role: "system", content: "Eres un experto en gastronomía. Estructura esta receta en formato JSON. Corrige ortografía, interpreta medidas antiguas, normaliza unidades, infiere datos faltantes. Responde en español." },
      { role: "user", content: `Estructura esta receta:\n\n${text}` },
    ],
    [recipeStructureTool],
    { type: "function", function: { name: "structure_recipe" } },
    apiKey
  );

  await supabase.from("recipes").update({ structured_data: structured, title: structured.titulo, status: "completed" }).eq("id", recipeId);

  return new Response(
    JSON.stringify({ success: true, recipe: structured }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleHealthy(recipeId: string, apiKey: string, supabase: any) {
  const { data: recipe } = await supabase.from("recipes").select("structured_data").eq("id", recipeId).single();
  if (!recipe?.structured_data) throw new Error("No structured data");

  const healthyTool = {
    type: "function" as const,
    function: {
      name: "create_healthy_version",
      description: "Create a healthy version of a recipe",
      parameters: {
        type: "object",
        properties: {
          ingredientes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nombre: { type: "string" },
                cantidad: { type: "number" },
                unidad: { type: "string" },
                cambio: { type: "string", description: "What was changed and why" },
              },
              required: ["nombre", "cantidad", "unidad"],
            },
          },
          pasos: { type: "array", items: { type: "string" } },
          calorias_por_racion: { type: "number" },
          resumen_cambios: { type: "string" },
        },
        required: ["ingredientes", "pasos", "calorias_por_racion", "resumen_cambios"],
      },
    },
  };

  const healthy = await callAIWithTools(
    [
      { role: "system", content: "Eres nutricionista y chef. Crea una versión saludable de esta receta: reduce grasas, azúcares, ajusta pasos, pero mantén la esencia tradicional. Estima calorías. Responde en español." },
      { role: "user", content: `Receta original:\n${JSON.stringify(recipe.structured_data, null, 2)}` },
    ],
    [healthyTool],
    { type: "function", function: { name: "create_healthy_version" } },
    apiKey
  );

  await supabase.from("recipes").update({ healthy_version: healthy, healthy_version_active: true }).eq("id", recipeId);

  return new Response(
    JSON.stringify({ success: true, healthy }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleAlternatives(recipeId: string, apiKey: string, supabase: any) {
  const { data: recipe } = await supabase.from("recipes").select("structured_data").eq("id", recipeId).single();
  if (!recipe?.structured_data) throw new Error("No structured data");

  const altTool = {
    type: "function" as const,
    function: {
      name: "generate_alternatives",
      description: "Generate ingredient alternatives",
      parameters: {
        type: "object",
        properties: {
          alternativas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ingrediente_original: { type: "string" },
                alternativa_saludable: { type: "string" },
                alternativa_economica: { type: "string" },
                alternativa_tradicional: { type: "string" },
              },
              required: ["ingrediente_original", "alternativa_saludable", "alternativa_economica", "alternativa_tradicional"],
            },
          },
        },
        required: ["alternativas"],
      },
    },
  };

  const alternatives = await callAIWithTools(
    [
      { role: "system", content: "Eres un chef experto. Para cada ingrediente, sugiere 3 alternativas: saludable, económica y tradicional. Responde en español." },
      { role: "user", content: `Ingredientes:\n${JSON.stringify(recipe.structured_data.ingredientes, null, 2)}` },
    ],
    [altTool],
    { type: "function", function: { name: "generate_alternatives" } },
    apiKey
  );

  await supabase.from("recipes").update({ alternatives }).eq("id", recipeId);

  return new Response(
    JSON.stringify({ success: true, alternatives }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleShoppingList(recipeId: string, apiKey: string, supabase: any) {
  const { data: recipe } = await supabase.from("recipes").select("structured_data").eq("id", recipeId).single();
  if (!recipe?.structured_data) throw new Error("No structured data");

  const ingredients = recipe.structured_data.ingredientes || [];
  const shoppingList: Record<string, any[]> = {
    verduras: [],
    carnes_pescados: [],
    lacteos: [],
    despensa: [],
    otros: [],
  };

  for (const ing of ingredients) {
    const cat = ing.categoria || "otros";
    const target = shoppingList[cat] || shoppingList.otros;
    const existing = target.find((i: any) => i.nombre === ing.nombre);
    if (existing) {
      existing.cantidad += ing.cantidad;
    } else {
      target.push({ nombre: ing.nombre, cantidad: ing.cantidad, unidad: ing.unidad });
    }
  }

  await supabase.from("recipes").update({ shopping_list: shoppingList }).eq("id", recipeId);

  return new Response(
    JSON.stringify({ success: true, shoppingList }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleAdjustServings(recipeId: string, servings: number, apiKey: string, supabase: any) {
  const { data: recipe } = await supabase.from("recipes").select("structured_data, servings").eq("id", recipeId).single();
  if (!recipe?.structured_data) throw new Error("No structured data");

  const originalServings = recipe.structured_data.raciones || recipe.servings || 4;
  const ratio = servings / originalServings;

  const adjustedIngredients = (recipe.structured_data.ingredientes || []).map((ing: any) => ({
    ...ing,
    cantidad: Math.round(ing.cantidad * ratio * 100) / 100,
  }));

  const adjustedData = {
    ...recipe.structured_data,
    ingredientes: adjustedIngredients,
    raciones: servings,
  };

  // Also adjust shopping list
  const shoppingList: Record<string, any[]> = {
    verduras: [],
    carnes_pescados: [],
    lacteos: [],
    despensa: [],
    otros: [],
  };

  for (const ing of adjustedIngredients) {
    const cat = ing.categoria || "otros";
    const target = shoppingList[cat] || shoppingList.otros;
    target.push({ nombre: ing.nombre, cantidad: ing.cantidad, unidad: ing.unidad });
  }

  await supabase
    .from("recipes")
    .update({ structured_data: adjustedData, servings, shopping_list: shoppingList })
    .eq("id", recipeId);

  return new Response(
    JSON.stringify({ success: true, recipe: adjustedData, shoppingList }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleGenerateImage(recipeId: string, apiKey: string, supabase: any) {
  const { data: recipe } = await supabase.from("recipes").select("structured_data, title").eq("id", recipeId).single();
  if (!recipe?.structured_data) throw new Error("No structured data");

  const recipeInfo = recipe.structured_data;
  const prompt = `Genera una fotografía gastronómica profesional y apetitosa del plato "${recipeInfo.titulo || recipe.title}". 
Ingredientes principales: ${(recipeInfo.ingredientes || []).slice(0, 5).map((i: any) => i.nombre).join(", ")}.
Estilo: ${recipeInfo.tipo_receta || "tradicional"}, ${recipeInfo.estilo_regional || "cocina casera"}.
La foto debe ser cenital o en ángulo de 45 grados, con iluminación natural cálida, sobre una mesa de madera rústica con elementos decorativos tradicionales. Ultra high resolution.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Image generation error ${response.status}: ${t}`);
  }

  const data = await response.json();
  const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  if (!imageData) throw new Error("No image generated");

  // Upload base64 image to storage
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  
  const filePath = `generated/${recipeId}.png`;
  const { error: uploadError } = await supabase.storage
    .from("recipe-images")
    .upload(filePath, imageBytes, { contentType: "image/png", upsert: true });

  if (uploadError) throw new Error("Upload failed: " + uploadError.message);

  const { data: publicUrl } = supabase.storage.from("recipe-images").getPublicUrl(filePath);
  
  // Save URL - use original_image_url field but only if no user image exists, otherwise use a separate approach
  // We'll store in structured_data as generated_image_url
  const updatedData = { ...recipeInfo, generated_image_url: publicUrl.publicUrl };
  await supabase.from("recipes").update({ structured_data: updatedData }).eq("id", recipeId);

  return new Response(
    JSON.stringify({ success: true, imageUrl: publicUrl.publicUrl }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleUpdateRecipe(recipeId: string, recipeData: any, supabase: any) {
  if (!recipeData) throw new Error("No recipe data provided");

  const { data: recipe } = await supabase.from("recipes").select("structured_data").eq("id", recipeId).single();
  if (!recipe) throw new Error("Recipe not found");

  const updatedStructured = { ...recipe.structured_data, ...recipeData };

  // Also update top-level fields
  const updateFields: any = { structured_data: updatedStructured };
  if (recipeData.titulo) updateFields.title = recipeData.titulo;
  if (recipeData.tiempo_estimado) updateFields.estimated_time = recipeData.tiempo_estimado;
  if (recipeData.dificultad) updateFields.difficulty = recipeData.dificultad;
  if (recipeData.raciones) updateFields.servings = recipeData.raciones;

  // Regenerate shopping list from updated ingredients
  if (recipeData.ingredientes) {
    const shoppingList: Record<string, any[]> = {
      verduras: [], carnes_pescados: [], lacteos: [], despensa: [], otros: [],
    };
    for (const ing of recipeData.ingredientes) {
      const cat = ing.categoria || "otros";
      const target = shoppingList[cat] || shoppingList.otros;
      target.push({ nombre: ing.nombre, cantidad: ing.cantidad, unidad: ing.unidad });
    }
    updateFields.shopping_list = shoppingList;
  }

  const { error } = await supabase.from("recipes").update(updateFields).eq("id", recipeId);
  if (error) throw new Error("Update failed: " + error.message);

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
