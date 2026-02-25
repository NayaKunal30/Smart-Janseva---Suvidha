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
    const { identifier, otp, fullName, mode = 'login' }: VerifyOTPRequest = await req.json();

    if (!identifier || !otp) {
      return new Response(
        JSON.stringify({ error: "Missing identifier or OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Generate the deterministic password using normalized phone (digits only)
    const cleanPhone = identifier.replace(/\D/g, '');
    const secretPassword = await generateDeterministicPassword(cleanPhone);
    const ghostEmail = `${cleanPhone}@phone.local`;
    
    console.log(`[VerifyOTP] Normalized: ${cleanPhone}, GhostEmail: ${ghostEmail}`);
    
    let userExists = false;

    // Security check/User handling
    if (otpRecord.otp_type === 'phone') {
      try {
        // Search for user by phone OR our special ghost email
        console.log('[VerifyOTP] Searching for user...');
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        let user = users.find((u: any) =>
          u.phone?.replace(/\D/g, '') === cleanPhone ||
          u.email === ghostEmail
        );

        if (user) {
          console.log(`[VerifyOTP] Found existing user: ${user.id}`);
          userExists = true;
          
          // Force password update to our deterministic secret
          const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { 
            password: secretPassword,
            // If they were a phone-only user, we convert them to an email-based 'ghost' account 
            // so login doesn't fail even if phone logins are disabled.
            email: user.email || ghostEmail,
            email_confirm: true
          });
          if (updateError) console.error('[VerifyOTP] Failed to sync account:', updateError.message);
        } else if (mode === 'register') {
          console.log('[VerifyOTP] Creating new ghost account...');
          // Create the account using the ghost email to bypass Supabase Phone provider requirements
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
            console.error("[VerifyOTP] Registration failed:", createError.message);
            throw createError;
          }
          userExists = true;
        } else {
          console.warn("[VerifyOTP] User not found during login");
          return new Response(
            JSON.stringify({ error: "User not found. Please register first." }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (err: any) {
        console.error("[VerifyOTP] Critical error:", err.message);
        return new Response(
          JSON.stringify({ error: "Auth system error: " + err.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`[VerifyOTP] Success. Logging in with: ${ghostEmail}`);
    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP verified successfully",
        identifier: identifier,
        type: otpRecord.otp_type,
        canLogin: true,
        secretPassword: secretPassword,
        userExists: true,
        loginIdentifier: ghostEmail // ALWAYS use the ghost email for the actual sign-in
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


