const integrationApiKey = Deno.env.get("INTEGRATIONS_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranslateRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
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

    const { text, targetLanguage, sourceLanguage }: TranslateRequest = await req.json();

    if (!text || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: "Text and target language are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Google Cloud Translation API
    const body: any = {
      q: text,
      target: targetLanguage,
      format: "text",
    };

    if (sourceLanguage) {
      body.source = sourceLanguage;
    }

    const response = await fetch(
      "https://app-9q2bxa1uy875-api-GaDwZ8DX7jPY.gateway.appmedo.com/language/translate/v2",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gateway-Authorization": `Bearer ${integrationApiKey}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Translation API error: ${errorText}`);
    }

    const data = await response.json();
    const translatedText = data.data?.translations?.[0]?.translatedText;
    const detectedLanguage = data.data?.translations?.[0]?.detectedSourceLanguage;

    if (!translatedText) {
      throw new Error("Translation failed");
    }

    return new Response(
      JSON.stringify({
        success: true,
        translatedText,
        detectedSourceLanguage: detectedLanguage,
        targetLanguage,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
