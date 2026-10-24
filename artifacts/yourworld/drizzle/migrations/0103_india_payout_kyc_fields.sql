-- Additional owner-scoped KYC details for Indian payout profiles.
ALTER TABLE public.creator_payout_profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS mobile_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_passbook_path text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pan_card_path text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.creator_payout_profiles.bank_passbook_path IS
  'Owner-scoped private path in the documents bucket; never a public URL.';
COMMENT ON COLUMN public.creator_payout_profiles.pan_card_path IS
  'Owner-scoped private path in the documents bucket; never a public URL.';
