-- Pernest Digital Services database setup
-- Run this complete file in the Supabase SQL editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Internship applications
CREATE TABLE IF NOT EXISTS public.internship_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  date_of_birth date NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  institution text NOT NULL,
  course_field text NOT NULL,
  education_level text NOT NULL,
  year_of_study text,
  previous_experience text NOT NULL,
  why_interested text NOT NULL,
  goals text NOT NULL,
  skills_interested text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS internship_applications_email_idx ON public.internship_applications (email);
CREATE INDEX IF NOT EXISTS internship_applications_status_idx ON public.internship_applications (status);

-- Testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text NOT NULL,
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS testimonials_status_idx ON public.testimonials (status);

-- NGO applications
CREATE TABLE IF NOT EXISTS public.ngo_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE NOT NULL,
  proposed_name_1 text NOT NULL,
  proposed_name_2 text,
  proposed_name_3 text,
  email text NOT NULL,
  office_address text NOT NULL,
  state text,
  lga text,
  town text,
  house_number text,
  street_name text,
  trustee_count integer NOT NULL,
  trustee_tenure text NOT NULL,
  aims text NOT NULL,
  source_of_income text NOT NULL,
  trustees jsonb NOT NULL,
  payment_slip jsonb,
  status text NOT NULL DEFAULT 'payment_pending' CHECK (status IN ('payment_pending', 'payment_submitted', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ngo_applications_status_idx ON public.ngo_applications (status);
CREATE INDEX IF NOT EXISTS ngo_applications_email_idx ON public.ngo_applications (email);

-- Company applications
CREATE TABLE IF NOT EXISTS public.company_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE NOT NULL,
  proposed_name_1 text NOT NULL,
  proposed_name_2 text,
  email text NOT NULL,
  phone text NOT NULL,
  state text,
  lga text,
  town text,
  house_number text,
  street_name text,
  objects text NOT NULL,
  witness jsonb NOT NULL,
  directors jsonb NOT NULL,
  shareholders jsonb NOT NULL,
  payment_slip jsonb,
  status text NOT NULL DEFAULT 'payment_pending' CHECK (status IN ('payment_pending', 'payment_submitted', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS company_applications_status_idx ON public.company_applications (status);
CREATE INDEX IF NOT EXISTS company_applications_email_idx ON public.company_applications (email);

-- Business name applications
CREATE TABLE IF NOT EXISTS public.business_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE NOT NULL,
  proposed_name_1 text NOT NULL,
  proposed_name_2 text,
  email text NOT NULL,
  phone text NOT NULL,
  state text,
  lga text,
  town text,
  house_number text,
  street_name text,
  proprietors jsonb NOT NULL,
  payment_slip jsonb,
  status text NOT NULL DEFAULT 'payment_pending' CHECK (status IN ('payment_pending', 'payment_submitted', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_applications_status_idx ON public.business_applications (status);
CREATE INDEX IF NOT EXISTS business_applications_email_idx ON public.business_applications (email);

-- Row-level security
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngo_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public internship submissions" ON public.internship_applications;
CREATE POLICY "Allow public internship submissions" ON public.internship_applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated internship review" ON public.internship_applications;
CREATE POLICY "Allow authenticated internship review" ON public.internship_applications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated internship status updates" ON public.internship_applications;
CREATE POLICY "Allow authenticated internship status updates" ON public.internship_applications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public testimonial submissions" ON public.testimonials;
CREATE POLICY "Allow public testimonial submissions" ON public.testimonials FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public approved testimonials" ON public.testimonials;
CREATE POLICY "Allow public approved testimonials" ON public.testimonials FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS "Allow authenticated testimonial review" ON public.testimonials;
CREATE POLICY "Allow authenticated testimonial review" ON public.testimonials FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated testimonial status updates" ON public.testimonials;
CREATE POLICY "Allow authenticated testimonial status updates" ON public.testimonials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public NGO submissions" ON public.ngo_applications;
CREATE POLICY "Allow public NGO submissions" ON public.ngo_applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public payment updates" ON public.ngo_applications;
CREATE POLICY "Allow public payment updates" ON public.ngo_applications FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated NGO review" ON public.ngo_applications;
CREATE POLICY "Allow authenticated NGO review" ON public.ngo_applications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated NGO status updates" ON public.ngo_applications;
CREATE POLICY "Allow authenticated NGO status updates" ON public.ngo_applications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public company submissions" ON public.company_applications;
CREATE POLICY "Allow public company submissions" ON public.company_applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public company payment updates" ON public.company_applications;
CREATE POLICY "Allow public company payment updates" ON public.company_applications FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated company review" ON public.company_applications;
CREATE POLICY "Allow authenticated company review" ON public.company_applications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated company status updates" ON public.company_applications;
CREATE POLICY "Allow authenticated company status updates" ON public.company_applications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public business submissions" ON public.business_applications;
CREATE POLICY "Allow public business submissions" ON public.business_applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public business payment updates" ON public.business_applications;
CREATE POLICY "Allow public business payment updates" ON public.business_applications FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated business review" ON public.business_applications;
CREATE POLICY "Allow authenticated business review" ON public.business_applications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated business status updates" ON public.business_applications;
CREATE POLICY "Allow authenticated business status updates" ON public.business_applications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
