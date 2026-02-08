-- Remove the overly permissive INSERT policy that allows anyone to insert
DROP POLICY IF EXISTS "Allow insert for all" ON public.curated_problems;