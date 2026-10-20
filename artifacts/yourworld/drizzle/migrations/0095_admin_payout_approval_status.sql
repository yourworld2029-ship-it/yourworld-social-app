ALTER TABLE public.payout_requests
  ADD COLUMN IF NOT EXISTS admin_payment_reference text;

ALTER TABLE public.payout_requests
  DROP CONSTRAINT IF EXISTS payout_requests_status_check;

ALTER TABLE public.payout_requests
  ADD CONSTRAINT payout_requests_status_check
  CHECK (status IN ('processing', 'approved', 'completed', 'failed'));

COMMENT ON COLUMN public.payout_requests.admin_payment_reference IS
  'Admin-entered bank/UPI transaction reference when a payout is marked paid.';
