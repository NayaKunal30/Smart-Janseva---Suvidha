import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  identifier: string;
  otp: string;
}

const MAX_ATTEMPTS = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, otp }: VerifyOTPRequest = await req.json();

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

    // If it's a phone login, we need to make sure the user can actually log in.
    // Hack: We'll set their password to the OTP temporarily if they exist.
    // If they don't exist, they should register first.
    if (otpRecord.otp_type === 'phone') {
      try {
        // Find user by phone
        // Note: This requires the users to be in auth.users
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
        const user = users.find(u => u.phone === identifier || u.phone === `+${identifier}` || u.phone === identifier.replace('+', ''));

        if (user) {
          // Update password to the OTP
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: otp }
          );
          if (updateError) {
            console.error("Error updating user password:", updateError);
          } else {
            console.log("Temporarily set password for user:", user.id);
          }
        }
      } catch (err) {
        console.error("Error in phone login helper:", err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP verified successfully",
        identifier,
        type: otpRecord.otp_type,
        // Inform the client that they can now use the OTP as password to sign in
        canLogin: true
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

