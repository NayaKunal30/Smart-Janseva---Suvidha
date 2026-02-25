import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateUserRequest {
    email: string;
    password?: string;
    phone?: string;
    fullName: string;
    role: string;
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { email, password, phone, fullName, role }: CreateUserRequest = await req.json();

        if (!email && !phone) {
            return new Response(
                JSON.stringify({ error: "Missing email or phone" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Creating user: ${email || phone} with role: ${role}`);

        // Create user via Admin API
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email: email || undefined,
            phone: phone || undefined,
            password: password || Math.random().toString(36).slice(-10), // Random password if none provided
            email_confirm: true,
            phone_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: role,
                phone: phone || '',
            }
        });

        if (userError) {
            console.error("Admin create user error:", userError.message);
            return new Response(
                JSON.stringify({ error: userError.message }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const userId = userData.user.id;
        console.log(`User created successfully: ${userId}`);

        // The profile should be created by the database trigger
        // but let's double check or wait a bit if needed.

        return new Response(
            JSON.stringify({
                success: true,
                user: userData.user,
                message: "User created and confirmed successfully via Admin API"
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
