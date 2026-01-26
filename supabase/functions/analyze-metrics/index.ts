import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing metrics screenshot:", imageUrl);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are an expert at analyzing social media metrics screenshots from Instagram Reels and TikTok videos.
Your task is to extract the exact numbers of views and likes from the screenshot.
Be very precise and look for:
- Views/Reproducciones: Usually shown with an eye icon or "views"/"reproducciones"
- Likes: Usually shown with a heart icon or "me gusta"/"likes"

IMPORTANT: Return ONLY the raw numbers without any formatting (no commas, no dots, no K/M suffixes).
If you see "1.5K" views, return 1500. If you see "10M", return 10000000.
If you cannot find a metric, return 0 for that field.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this social media metrics screenshot and extract the views and likes counts. Return ONLY a JSON object with 'views' and 'likes' as integer numbers."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_metrics",
              description: "Extract views and likes from the screenshot",
              parameters: {
                type: "object",
                properties: {
                  views: {
                    type: "integer",
                    description: "Number of views/reproducciones"
                  },
                  likes: {
                    type: "integer",
                    description: "Number of likes/me gusta"
                  }
                },
                required: ["views", "likes"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_metrics" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_metrics") {
      throw new Error("Failed to extract metrics from AI response");
    }

    const metrics = JSON.parse(toolCall.function.arguments);
    const views = Math.max(0, parseInt(metrics.views) || 0);
    const likes = Math.max(0, parseInt(metrics.likes) || 0);

    // Calculate energy: 10 per 1000 views + 1 per like
    const energyFromViews = Math.floor(views / 1000) * 10;
    const energyFromLikes = likes;
    const totalEnergy = energyFromViews + energyFromLikes;

    console.log(`Metrics extracted - Views: ${views}, Likes: ${likes}, Energy: ${totalEnergy}`);

    return new Response(
      JSON.stringify({
        views,
        likes,
        energyFromViews,
        energyFromLikes,
        totalEnergy
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error analyzing metrics:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
