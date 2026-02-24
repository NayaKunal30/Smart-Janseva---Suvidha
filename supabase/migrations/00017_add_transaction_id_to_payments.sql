-- Add transaction_id column and Stripe support to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Make razorpay columns optional since we now use Stripe too
ALTER TABLE public.payments ALTER COLUMN razorpay_order_id DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN razorpay_payment_id DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN razorpay_signature DROP NOT NULL;
