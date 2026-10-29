-- Update the shared earning split helpers used by the live creator_earnings
-- trigger. Existing settled ledger rows are intentionally not recalculated.

CREATE OR REPLACE FUNCTION public.creator_share_for_source(
  p_source text,
  p_base_amount numeric
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT round(
    GREATEST(COALESCE(p_base_amount, 0), 0) *
    CASE p_source
      WHEN 'ads' THEN 0.70
      WHEN 'course' THEN 0.80
      WHEN 'vip' THEN 0.80
      WHEN 'video' THEN 0.80
      ELSE 0
    END,
    2
  );
$$;

CREATE OR REPLACE FUNCTION public.platform_share_for_source(
  p_source text,
  p_base_amount numeric
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT round(
    GREATEST(COALESCE(p_base_amount, 0), 0) *
    CASE p_source
      WHEN 'ads' THEN 0.30
      WHEN 'course' THEN 0.20
      WHEN 'vip' THEN 0.20
      WHEN 'video' THEN 0.20
      ELSE 0
    END,
    2
  );
$$;
