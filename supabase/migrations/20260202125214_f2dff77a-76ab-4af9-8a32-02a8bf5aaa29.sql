CREATE TABLE public.curated_problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  role TEXT,
  overview TEXT,      -- Panel 1
  gap TEXT,           -- Panel 2
  automation TEXT,    -- Panel 3
  action TEXT,        -- Panel 4
  source_type TEXT DEFAULT 'reddit', 
  source_url TEXT,
  search_query TEXT, 
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.curated_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Problems are publicly viewable" ON public.curated_problems FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.curated_problems FOR INSERT WITH CHECK (true);
CREATE INDEX idx_curated_problems_created_at ON public.curated_problems(created_at DESC);