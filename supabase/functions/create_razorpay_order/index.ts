import { createClient } from "jsr:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  billId: string;
  amount: number;
  currency?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: "Razorpay credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { billId, amount, currency = "INR" }: CreateOrderRequest = await req.json();

    if (!billId || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing billId or amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify bill belongs to user and get bill details
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .select("*, utility_services(service_name, utility_type)")
      .eq("id", billId)
      .eq("user_id", user.id)
      .single();

    if (billError || !bill) {
      return new Response(
        JSON.stringify({ error: "Bill not found or unauthorized" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate actual amount to pay
    const remainingAmount = bill.amount - bill.amount_paid + bill.late_fee;
    const paymentAmount = Math.min(amount, remainingAmount);

    if (paymentAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Bill already paid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Razorpay order
    const orderData = {
      amount: Math.round(paymentAmount * 100), // Convert to paise
      currency: currency,
      receipt: `bill_${billId}_${Date.now()}`,
      notes: {
        bill_id: billId,
        user_id: user.id,
        bill_number: bill.bill_number,
        service_name: bill.utility_services?.service_name || "Utility Service",
      },
    };

    const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json();
      throw new Error(`Razorpay error: ${errorData.error?.description || "Unknown error"}`);
    }

    const razorpayOrder = await razorpayResponse.json();

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        bill_id: billId,
        payment_method: "razorpay",
        amount: paymentAmount,
        status: "pending",
        razorpay_order_id: razorpayOrder.id,
        metadata: {
          currency: currency,
          bill_number: bill.bill_number,
          service_name: bill.utility_services?.service_name,
        },
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Database error: ${paymentError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: razorpayOrder.id,
        amount: paymentAmount,
        currency: currency,
        paymentId: payment.id,
        keyId: razorpayKeyId,
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
