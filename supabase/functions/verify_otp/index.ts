import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PHONE_AUTH_SECRET = Deno.env.get("PHONE_AUTH_SECRET") || "smart-janseva-secure-salt-2026";

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface VerifyOTPRequest {
  identifier: string;
  otp: string;
  fullName?: string;
  mode?: 'login' | 'register';
}

const MAX_ATTEMPTS = 5;

// Generate a deterministic password for a phone number
async function generateDeterministicPassword(phone: string): Promise<string> {
  const data = new TextEncoder().encode(phone + PHONE_AUTH_SECRET);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(hashBuffer).substring(0, 32); // Use first 32 chars for password
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let { identifier, otp, fullName, mode = 'login' }: VerifyOTPRequest = await req.json();

    if (!identifier || !otp) {
      return new Response(
        JSON.stringify({ error: "Missing identifier or OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize identifier for database consistency
    const originalIdentifier = identifier;
    // Assuming type logic - if it looks like phone (all digits or starts with +)
    // Actually, we should check otp_verifications for either format, 
    // but better to normalize here too.
    if (!identifier.includes("@")) {
      identifier = identifier.replace(/\D/g, "");
    } else {
      identifier = identifier.toLowerCase().trim();
    }
    
    console.log(`[VerifyOTP] Normalized: ${originalIdentifier} -> ${identifier}`);

    // Get the latest OTP for this identifier
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("identifier", identifier)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "No OTP found. Please request a new one." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if OTP has expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "OTP has expired. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check max attempts
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return new Response(
        JSON.stringify({ error: "Maximum verification attempts exceeded. Please request a new OTP." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify OTP
    if (otpRecord.otp_code !== otp) {
      // Increment attempts
      await supabase
        .from("otp_verifications")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);

      const remainingAttempts = MAX_ATTEMPTS - (otpRecord.attempts + 1);
      return new Response(
        JSON.stringify({
          error: "Invalid OTP. Please try again.",
          remainingAttempts
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as verified
    await supabase
      .from("otp_verifications")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Generate deterministic credentials
    const cleanPhone = identifier.replace(/\D/g, '');
    const secretPassword = await generateDeterministicPassword(cleanPhone);
    const ghostEmail = `${cleanPhone}@phone.local`;
    
    console.log(`[VerifyOTP] Normalizing for: ${identifier} -> ${ghostEmail}`);
    
    // Check if user exists - listing users is the only reliable way to find by ghost email via admin API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("[VerifyOTP] Admin listUsers failed:", listError.message);
      throw listError;
    }

    let targetUser = users.find((u: any) => 
      u.email === ghostEmail || 
      (u.phone && u.phone.replace(/\D/g, '') === cleanPhone)
    );

    if (!targetUser) {
      if (mode === 'register') {
        console.log(`[VerifyOTP] Creating new ghost account for ${fullName || 'User'}`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: ghostEmail,
          password: secretPassword,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || 'User',
            role: 'citizen',
            phone_number: identifier
          }
        });

        if (createError) {
          console.error("[VerifyOTP] Account creation error:", createError.message);
          throw createError;
        }
        targetUser = newUser.user;
      } else {
        return new Response(
          JSON.stringify({ error: "User not registered. Please sign up first." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.log(`[VerifyOTP] Account exists (${targetUser.id}). Synchronizing session secret...`);
      // Update password to deterministic secret to allow immediate login
      const { error: updateError } = await supabase.auth.admin.updateUserById(targetUser.id, { 
        password: secretPassword,
        email_confirm: true
      });
      if (updateError) console.error('[VerifyOTP] Failed to sync session secret:', updateError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP verified",
        canLogin: true,
        secretPassword: secretPassword,
        loginIdentifier: ghostEmail,
        type: otpRecord.otp_type
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


