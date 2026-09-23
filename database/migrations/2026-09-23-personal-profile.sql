-- TUCITA: private personal data for account holders, not public service profiles.
-- Apply on staging-vercel first; production only after testing/approval.
ALTER TABLE public.app_user_profiles
  ADD COLUMN IF NOT EXISTS national_id text,
  ADD COLUMN IF NOT EXISTS birth_date date;

-- public.patients already has national_id and birth_date; no duplicate table.
