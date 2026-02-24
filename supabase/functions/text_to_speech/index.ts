const integrationApiKey = Deno.env.get("INTEGRATIONS_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TTSRequest {
  text: string;
  voice?: string;
  format?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!integrationApiKey) {
      return new Response(
        JSON.stringify({ error: "Integration API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, voice = "heart", format = "mp3" }: TTSRequest = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Text-to-Speech API
    const response = await fetch(
      "https://app-9q2bxa1uy875-api-GYX1lzGw01Xa.gateway.appmedo.com/v1/audio/speech",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gateway-Authorization": `Bearer ${integrationApiKey}`,
        },
        body: JSON.stringify({
          input: text,
          voice: voice,
          response_format: format,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS API error: ${errorText}`);
    }

    // Return audio file
    const audioData = await response.arrayBuffer();

    return new Response(audioData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="speech.${format}"`,
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
