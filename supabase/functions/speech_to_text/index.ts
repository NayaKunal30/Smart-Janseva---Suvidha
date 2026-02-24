const integrationApiKey = Deno.env.get("INTEGRATIONS_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const formData = await req.formData();
    const audioFile = formData.get("file");
    const responseFormat = formData.get("response_format") || "json";
    const language = formData.get("language");

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "Audio file is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Forward to Speech-to-Text API
    const apiFormData = new FormData();
    apiFormData.append("file", audioFile);
    apiFormData.append("response_format", responseFormat as string);
    if (language) {
      apiFormData.append("language", language as string);
    }

    const response = await fetch(
      "https://app-9q2bxa1uy875-api-DY8MNQoqOnMa.gateway.appmedo.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          "X-Gateway-Authorization": `Bearer ${integrationApiKey}`,
        },
        body: apiFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`STT API error: ${errorText}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        text: data.text,
        language: data.language,
        duration: data.duration,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("STT error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
