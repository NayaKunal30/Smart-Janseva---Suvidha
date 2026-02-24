const integrationApiKey = Deno.env.get("INTEGRATIONS_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  message: string;
  history?: Array<{ role: string; content: string }>;
  language?: string;
}

const SYSTEM_PROMPT = `You are a helpful AI assistant for SMART JANSEVA, an Indian government service delivery platform. 
Your role is to help citizens with:
- Understanding government services and how to apply
- Tracking complaints and service applications
- Explaining bill payments and utility services
- Providing information about various government schemes
- Guiding users through the platform features

Be polite, professional, and provide accurate information. If you don't know something, admit it and suggest contacting customer support.
Keep responses concise and actionable. Use simple language that's easy to understand.`;

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

    const { message, history = [], language = "en" }: ChatRequest = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build conversation history for Gemini 2.5 Flash API
    const contents = [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: "model",
        parts: [{ text: "I understand. I'm here to help citizens with SMART JANSEVA services." }],
      },
    ];

    // Add conversation history
    for (const msg of history) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Call official Gemini 2.5 Flash API
    const response = await fetch(
      "https://app-9q2bxa1uy875-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gateway-Authorization": `Bearer ${integrationApiKey}`,
        },
        body: JSON.stringify({
          contents: contents,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }

    // Parse SSE stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let aiResponse = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                aiResponse += text;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    }

    if (!aiResponse) {
      aiResponse = "I apologize, but I couldn't generate a response. Please try again.";
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
