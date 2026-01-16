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

    const { submissionId, videoUrl } = await req.json();
    
    // Validate submissionId format
    if (!submissionId || !UUID_REGEX.test(submissionId)) {
      return new Response(
        JSON.stringify({ error: "ID de envío inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "URL de vídeo requerida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate videoUrl is from our storage bucket
    const allowedDomain = supabaseUrl;
    if (!videoUrl.startsWith(`${allowedDomain}/storage/v1/object/public/challenge-videos/`)) {
      return new Response(
        JSON.stringify({ error: "URL de vídeo no permitida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY not configured");
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
      .select("user_id")
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

    // Update status to processing
    await supabase
      .from("challenge_submissions")
      .update({ transcription_status: "processing" })
      .eq("id", submissionId);

    // Download the video
    console.log("Downloading video for submission:", submissionId);
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      console.error("Failed to download video:", videoResponse.status);
      throw new Error("Error descargando el vídeo");
    }
    const videoBlob = await videoResponse.blob();

    // Create form data for ElevenLabs
    const formData = new FormData();
    formData.append("file", videoBlob, "video.mp4");
    formData.append("model_id", "scribe_v2");
    formData.append("language_code", "spa"); // Spanish

    console.log("Sending to ElevenLabs for transcription...");
    const transcriptionResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error("ElevenLabs error:", errorText);
      throw new Error("Error en el servicio de transcripción");
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcription = transcriptionResult.text || "";

    console.log("Transcription complete for submission:", submissionId);

    // Update the submission with transcription
    await supabase
      .from("challenge_submissions")
      .update({ 
        transcription,
        transcription_status: "transcribed"
      })
      .eq("id", submissionId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Transcription error:", error);
    
    // Try to update status to failed
    try {
      const body = await req.clone().json();
      if (body.submissionId && UUID_REGEX.test(body.submissionId)) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from("challenge_submissions")
          .update({ transcription_status: "failed" })
          .eq("id", body.submissionId);
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }

    return new Response(
      JSON.stringify({ error: "Error procesando el vídeo. Inténtalo de nuevo." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});