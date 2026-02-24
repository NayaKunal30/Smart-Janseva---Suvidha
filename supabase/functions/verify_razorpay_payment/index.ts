import { createClient } from "jsr:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: "Razorpay credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature }: VerifyPaymentRequest = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return new Response(
        JSON.stringify({ error: "Missing payment verification data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = createHmac("sha256", razorpayKeySecret)
      .update(text)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return new Response(
        JSON.stringify({ error: "Invalid payment signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*, bills(*)")
      .eq("razorpay_order_id", razorpayOrderId)
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment record not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update payment status
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        status: "completed",
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        transaction_date: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updatePaymentError) {
      throw new Error(`Failed to update payment: ${updatePaymentError.message}`);
    }

    // Update bill status
    if (payment.bill_id) {
      const bill = payment.bills;
      const newAmountPaid = bill.amount_paid + payment.amount;
      const totalAmount = bill.amount + bill.late_fee;
      const newStatus = newAmountPaid >= totalAmount ? "paid" : "partial";

      const { error: updateBillError } = await supabase
        .from("bills")
        .update({
          amount_paid: newAmountPaid,
          status: newStatus,
        })
        .eq("id", payment.bill_id);

      if (updateBillError) {
        console.error("Failed to update bill:", updateBillError);
      }

      // Create notification
      await supabase
        .from("notifications")
        .insert({
          user_id: payment.user_id,
          type: "payment",
          title: "Payment Successful",
          message: `Your payment of ₹${payment.amount} for bill ${bill.bill_number} has been processed successfully.`,
          link: `/bills/${payment.bill_id}`,
          metadata: {
            payment_id: payment.id,
            bill_id: payment.bill_id,
            amount: payment.amount,
          },
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
        paymentId: payment.id,
        amount: payment.amount,
        status: "completed",
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
