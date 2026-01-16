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
    const { submissionId, videoUrl } = await req.json();
    
    if (!submissionId || !videoUrl) {
      return new Response(
        JSON.stringify({ error: "Missing submissionId or videoUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update status to processing
    await supabase
      .from("challenge_submissions")
      .update({ transcription_status: "processing" })
      .eq("id", submissionId);

    // Download the video
    console.log("Downloading video from:", videoUrl);
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`);
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
      throw new Error(`ElevenLabs transcription failed: ${transcriptionResponse.status}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcription = transcriptionResult.text || "";

    console.log("Transcription complete:", transcription.substring(0, 200));

    // Update the submission with transcription
    await supabase
      .from("challenge_submissions")
      .update({ 
        transcription,
        transcription_status: "transcribed"
      })
      .eq("id", submissionId);

    return new Response(
      JSON.stringify({ success: true, transcription }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Transcription error:", error);
    
    // Try to update status to failed
    try {
      const { submissionId } = await req.clone().json();
      if (submissionId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from("challenge_submissions")
          .update({ transcription_status: "failed" })
          .eq("id", submissionId);
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
