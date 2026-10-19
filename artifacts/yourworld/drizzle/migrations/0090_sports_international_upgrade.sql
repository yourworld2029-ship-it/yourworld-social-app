-- Record whether a pending Sports Verification request upgrades an already
-- verified National profile to International. This keeps approved identity
-- details and the user's profile ID in place throughout review.
ALTER TABLE public.sports_verification_details
  ADD COLUMN IF NOT EXISTS upgrade_to_international boolean NOT NULL DEFAULT false;
