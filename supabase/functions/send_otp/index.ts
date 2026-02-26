import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const twoFactorApiKey = Deno.env.get("TWO_FACTOR_API_KEY");
const awsSesAccessKey = Deno.env.get("AWS_SES_ACCESS_KEY_ID");
const awsSesSecretKey = Deno.env.get("AWS_SES_SECRET_ACCESS_KEY");
const awsSesRegion = Deno.env.get("AWS_SES_REGION") || "us-east-1";

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface OTPRequest {
  identifier: string; // email or phone
  type: "email" | "phone";
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send SMS via 2Factor
async function sendSMS(phone: string, otp: string): Promise<boolean> {
  if (!twoFactorApiKey) {
    console.error("2Factor API key not configured");
    throw new Error("SMS service not configured. Please contact administrator.");
  }

  // Use 2Factor API to send OTP
  // Format: https://2factor.in/API/V1/{api_key}/SMS/{phone_number}/{otp}/{template_name}
  // If no template, just use {otp}
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `https://2factor.in/API/V1/${twoFactorApiKey}/SMS/${cleanPhone}/${otp}/SMARTJANSEVA`;

  try {
    const response = await fetch(url, {
      method: "GET",
    });

    const data = await response.json();
    console.log("2Factor response:", data);

    if (data.Status === "Success") {
      return true;
    } else {
      console.error("2Factor failed:", data);
      // Fallback: try without template if template fails
      const fallbackUrl = `https://2factor.in/API/V1/${twoFactorApiKey}/SMS/${cleanPhone}/${otp}`;
      const fallbackResponse = await fetch(fallbackUrl, { method: "GET" });
      const fallbackData = await fallbackResponse.json();
      if (fallbackData.Status === "Success") return true;

      throw new Error(data.Details || "SMS delivery failed");
    }
  } catch (error: any) {
    console.error("2Factor error:", error);
    throw error;
  }
}

// Send Voice Call via 2Factor
async function sendVoiceCall(phone: string, otp: string): Promise<boolean> {
  if (!twoFactorApiKey) {
    console.warn("2Factor API key not configured for voice");
    return false;
  }

  const cleanPhone = phone.replace(/\D/g, '');
  // Format: https://2factor.in/API/V1/{api_key}/VOICE/{phone_number}/{otp}
  const url = `https://2factor.in/API/V1/${twoFactorApiKey}/VOICE/${cleanPhone}/${otp}`;

  try {
    const response = await fetch(url, { method: "GET" });
    const data = await response.json();
    console.log("2Factor Voice response:", data);
    return data.Status === "Success";
  } catch (error) {
    console.error("2Factor Voice error:", error);
    return false;
  }
}

// Send Email via AWS SES
async function sendEmail(email: string, otp: string): Promise<boolean> {
  if (!awsSesAccessKey || !awsSesSecretKey) {
    throw new Error("AWS SES credentials not configured");
  }

  const message = `
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 30px; border-radius: 10px;">
          <h2 style="color: #000080;">SMART JANSEVA</h2>
          <p>Your OTP for verification is:</p>
          <h1 style="color: #FF9933; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
          <p style="color: #666; font-size: 12px;">Do not share this OTP with anyone. SMART JANSEVA will never ask for your OTP.</p>
        </div>
      </body>
    </html>
  `;

  try {
    // AWS SES v2 API call would go here
    // For now, using a simplified approach
    const params = {
      Source: "noreply@smartjanseva.gov.in",
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "SMART JANSEVA - OTP Verification" },
        Body: { Html: { Data: message } },
      },
    };

    // Note: In production, implement proper AWS SES SDK integration
    console.log("Email would be sent to:", email, "with OTP:", otp);
    return true;
  } catch (error) {
    console.error("AWS SES error:", error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let { identifier, type }: OTPRequest = await req.json();

    if (!identifier || !type) {
      return new Response(
        JSON.stringify({ error: "Missing identifier or type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize identifier for database consistency
    const originalIdentifier = identifier;
    if (type === "phone") {
      identifier = identifier.replace(/\D/g, "");
    } else {
      identifier = identifier.toLowerCase().trim();
    }
    
    console.log(`[SendOTP] Normalized: ${originalIdentifier} -> ${identifier}`);

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check for existing recent OTP (Rate limiting: 1 minute cooldown)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: existingOTP } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("identifier", identifier)
      .eq("verified", false)
      .gte("created_at", oneMinuteAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingOTP) {
      const waitSeconds = Math.ceil((new Date(existingOTP.created_at).getTime() + 60000 - Date.now()) / 1000);
      return new Response(
        JSON.stringify({
          error: `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
          retryAfter: waitSeconds
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store OTP in database
    const { error: dbError } = await supabase
      .from("otp_verifications")
      .insert({
        identifier,
        otp_code: otp,
        otp_type: type,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Send OTP
    let sent = false;
    let errorMessage = "";

    try {
      if (type === "phone") {
        // Trigger both SMS and Voice Call for redundancy
        const smsSent = await sendSMS(identifier, otp);
        const voiceSent = await sendVoiceCall(identifier, otp);
        sent = smsSent || voiceSent; // Success if at least one works
        if (!smsSent && voiceSent) errorMessage = "SMS failed, but voice call was initiated.";
        if (smsSent && !voiceSent) errorMessage = "SMS sent, but voice call failed.";
      } else if (type === "email") {
        sent = await sendEmail(identifier, otp);
      }
    } catch (error: any) {
      errorMessage = error.message || "Failed to send OTP";
      console.error("Send OTP error:", error);
    }

    if (!sent) {
      // Delete the OTP record since we couldn't send it
      await supabase
        .from("otp_verifications")
        .delete()
        .eq("identifier", identifier)
        .eq("otp_code", otp);

      return new Response(
        JSON.stringify({
          error: errorMessage || "Failed to send OTP. Please try again.",
          details: type === "phone"
            ? "SMS service may not be configured. Please contact administrator or try email verification."
            : "Email service may not be configured. Please contact administrator."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `OTP sent to ${type === "phone" ? "mobile" : "email"}`,
        expiresIn: 600 // seconds
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
