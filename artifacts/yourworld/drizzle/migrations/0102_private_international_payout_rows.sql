-- Private international payout rows are accessed only through scoped RPCs.
REVOKE ALL ON public.international_payout_profiles
  FROM PUBLIC, anon, authenticated, service_role;
