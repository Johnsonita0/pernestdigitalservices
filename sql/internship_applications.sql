-- Run this in Supabase SQL editor

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

CREATE INDEX IF NOT EXISTS internship_applications_email_idx
  ON public.internship_applications (email);

CREATE INDEX IF NOT EXISTS internship_applications_status_idx
  ON public.internship_applications (status);

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

CREATE INDEX IF NOT EXISTS testimonials_status_idx
  ON public.testimonials (status);

-- If the table already exists and you're only adding missing columns:
-- ALTER TABLE public.internship_applications
--   ADD COLUMN IF NOT EXISTS reference_number text,
--   ADD COLUMN IF NOT EXISTS first_name text,
--   ADD COLUMN IF NOT EXISTS last_name text,
--   ADD COLUMN IF NOT EXISTS email text,
--   ADD COLUMN IF NOT EXISTS phone text,
--   ADD COLUMN IF NOT EXISTS date_of_birth date,
--   ADD COLUMN IF NOT EXISTS address text,
--   ADD COLUMN IF NOT EXISTS city text,
--   ADD COLUMN IF NOT EXISTS state text,
--   ADD COLUMN IF NOT EXISTS institution text,
--   ADD COLUMN IF NOT EXISTS course_field text,
--   ADD COLUMN IF NOT EXISTS education_level text,
--   ADD COLUMN IF NOT EXISTS year_of_study text,
--   ADD COLUMN IF NOT EXISTS previous_experience text,
--   ADD COLUMN IF NOT EXISTS why_interested text,
--   ADD COLUMN IF NOT EXISTS goals text,
--   ADD COLUMN IF NOT EXISTS skills_interested text,
--   ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
--   ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
--   ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Optional: make sure the reference number is unique if the table already exists
-- CREATE UNIQUE INDEX IF NOT EXISTS internship_applications_reference_number_unique
--   ON public.internship_applications (reference_number);
