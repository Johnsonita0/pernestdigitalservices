
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Supabase Storage buckets for registration uploads.

-- Secure client/admin application editing. Clients must provide the reference and
-- matching email; authenticated administrators may edit by reference from the dashboard.
DROP FUNCTION IF EXISTS public.get_application_for_edit(text, text);
CREATE OR REPLACE FUNCTION public.get_application_for_edit(p_reference text, p_email text)
RETURNS TABLE (application_type text, application jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  table_name text;
  type_name text;
  candidate jsonb;
BEGIN
  IF nullif(trim(p_reference), '') IS NULL AND nullif(trim(p_email), '') IS NULL THEN
    RETURN;
  END IF;

  FOREACH table_name IN ARRAY ARRAY['internship_applications', 'ngo_applications', 'company_applications', 'business_applications', 'scuml_applications', 'nin_applications', 'nin_name_changes', 'nin_date_changes'] LOOP
    EXECUTE format('SELECT to_jsonb(row_data) FROM public.%I AS row_data WHERE upper(row_data.reference_number) = upper($1) OR lower(to_jsonb(row_data)->>''email'') = lower($2) OR (nullif(trim($2), '''') IS NOT NULL AND regexp_replace(coalesce(to_jsonb(row_data)->>''phone'', ''''), ''[^0-9]'', '''', ''g'') = regexp_replace($2, ''[^0-9]'', '''', ''g'')) LIMIT 1', table_name)
      INTO candidate USING p_reference, p_email;
    IF candidate IS NOT NULL THEN
      type_name := CASE table_name
        WHEN 'internship_applications' THEN 'Internship Registration'
        WHEN 'ngo_applications' THEN 'NGO Registration'
        WHEN 'company_applications' THEN 'Company Registration'
        WHEN 'business_applications' THEN 'Business Registration'
        WHEN 'scuml_applications' THEN 'SCUML Registration'
        WHEN 'nin_applications' THEN 'NIN Verification'
        WHEN 'nin_name_changes' THEN 'NIN Name Change'
        ELSE 'NIN Date Change'
      END;
      application_type := type_name;
      application := candidate;
      RETURN NEXT;
      RETURN;
    END IF;
  END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS public.update_application_for_edit(text, text, jsonb, uuid);
DROP FUNCTION IF EXISTS public.update_application_for_edit(text, text, jsonb);
CREATE OR REPLACE FUNCTION public.update_application_for_edit(p_reference text, p_email text, p_changes jsonb, p_id uuid DEFAULT NULL)
RETURNS TABLE (application_type text, application jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  table_name text;
  type_name text;
  record_id uuid;
  is_admin_user boolean := public.is_admin();
  allowed_columns text[];
  requested_column text;
  set_clause text := '';
  candidate jsonb;
BEGIN
  IF p_changes IS NULL OR jsonb_typeof(p_changes) <> 'object' THEN
    RAISE EXCEPTION 'Invalid application changes';
  END IF;

  FOREACH table_name IN ARRAY ARRAY['internship_applications', 'ngo_applications', 'company_applications', 'business_applications', 'scuml_applications', 'nin_applications', 'nin_name_changes', 'nin_date_changes'] LOOP
    IF p_id IS NOT NULL THEN
      EXECUTE format('SELECT row_data.id FROM public.%I AS row_data WHERE row_data.id = $1 AND ($2 OR lower(to_jsonb(row_data)->>''email'') = lower($3)) LIMIT 1', table_name)
        INTO record_id USING p_id, is_admin_user, p_email;
    ELSE
      EXECUTE format('SELECT row_data.id FROM public.%I AS row_data WHERE upper(row_data.reference_number) = upper($1) AND ($2 OR lower(to_jsonb(row_data)->>''email'') = lower($3) OR (nullif(trim($3), '''') IS NOT NULL AND regexp_replace(coalesce(to_jsonb(row_data)->>''phone'', ''''), ''[^0-9]'', '''', ''g'') = regexp_replace($3, ''[^0-9]'', '''', ''g''))) LIMIT 1', table_name)
        INTO record_id USING p_reference, is_admin_user, p_email;
    END IF;
    IF record_id IS NOT NULL THEN EXIT; END IF;
  END LOOP;

  IF record_id IS NULL THEN
    RAISE EXCEPTION 'No editable application matched those details';
  END IF;

  allowed_columns := CASE table_name
    WHEN 'internship_applications' THEN ARRAY['first_name','last_name','email','phone','date_of_birth','address','city','state','institution','course_field','education_level','year_of_study','previous_experience','why_interested','goals','skills_interested']
    WHEN 'ngo_applications' THEN ARRAY['proposed_name_1','proposed_name_2','proposed_name_3','email','office_address','state','lga','town','house_number','street_name','trustee_count','trustee_tenure','aims','source_of_income','trustees']
    WHEN 'company_applications' THEN ARRAY['proposed_name_1','proposed_name_2','email','phone','state','lga','town','house_number','street_name','objects','witness','directors','shareholders']
    WHEN 'business_applications' THEN ARRAY['proposed_name_1','proposed_name_2','email','phone','state','lga','town','house_number','street_name','proprietors']
    WHEN 'scuml_applications' THEN ARRAY['entity_name','registration_number','registered_address','tax_id','persons','bank_name','account_number','account_name']
    WHEN 'nin_applications' THEN ARRAY['nin','phone','surname','first_name','date_of_birth','email','address']
    WHEN 'nin_name_changes' THEN ARRAY['nin','new_surname','new_first_name','new_middle_name','new_phone_number','email']
    ELSE ARRAY['nin','surname','first_name','middle_name','gender','old_date_of_birth','new_date_of_birth','marital_status','state_of_origin','lga_of_origin','town_of_origin','phone','state_of_birth','lga_of_birth','state_of_residence','lga_of_residence','residential_address','education','occupation','work_address','father_surname','father_first_name','father_state','father_lga','father_town','mother_surname','mother_first_name','mother_maiden_name','mother_state','mother_lga','mother_town','email']
  END;

  FOR requested_column IN SELECT jsonb_object_keys(p_changes) LOOP
    IF NOT requested_column = ANY(allowed_columns) THEN
      RAISE EXCEPTION 'Field % cannot be edited', requested_column;
    END IF;
    set_clause := set_clause || CASE WHEN set_clause = '' THEN '' ELSE ', ' END || format('%I = (jsonb_populate_record(NULL::public.%I, $1)).%I', requested_column, table_name, requested_column);
  END LOOP;
  set_clause := set_clause || CASE WHEN set_clause = '' THEN '' ELSE ', ' END || 'updated_at = now()';
  set_clause := set_clause || ', edit_history = coalesce(edit_history, ''[]''::jsonb) || jsonb_build_array(jsonb_build_object(''timestamp'', now(), ''actor'', $3, ''activity'', $4, ''fields'', (SELECT coalesce(jsonb_agg(changed_key), ''[]''::jsonb) FROM jsonb_object_keys($1) AS changed(changed_key))))';
  IF NOT is_admin_user THEN
    set_clause := set_clause || ', status = ' || CASE
      WHEN table_name = 'internship_applications' THEN '''pending'''
      WHEN table_name LIKE 'nin_%' THEN '''pending'''
      ELSE 'CASE WHEN payment_slip IS NOT NULL THEN ''payment_submitted'' ELSE ''payment_pending'' END'
    END;
  END IF;

  EXECUTE format('UPDATE public.%I SET %s WHERE id = $2', table_name, set_clause) USING p_changes, record_id, CASE WHEN is_admin_user THEN 'Administrator' ELSE 'Client' END, CASE WHEN is_admin_user THEN 'Application updated by administrator' ELSE 'Application edited and resubmitted' END;
  EXECUTE format('SELECT to_jsonb(row_data) FROM public.%I row_data WHERE id = $1', table_name) INTO candidate USING record_id;
  type_name := CASE table_name WHEN 'internship_applications' THEN 'Internship Registration' WHEN 'ngo_applications' THEN 'NGO Registration' WHEN 'company_applications' THEN 'Company Registration' WHEN 'business_applications' THEN 'Business Registration' WHEN 'scuml_applications' THEN 'SCUML Registration' WHEN 'nin_applications' THEN 'NIN Verification' WHEN 'nin_name_changes' THEN 'NIN Name Change' ELSE 'NIN Date Change' END;
  application_type := type_name;
  application := candidate;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.get_application_for_edit(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_application_for_edit(text, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.update_application_for_edit(text, text, jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_application_for_edit(text, text, jsonb, uuid) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.update_payment_slip(text, jsonb);
CREATE OR REPLACE FUNCTION public.update_payment_slip(p_reference text, p_payment_slip jsonb)
RETURNS TABLE (reference_number text, status text, updated_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['ngo_applications', 'company_applications', 'business_applications', 'scuml_applications', 'nin_applications', 'nin_name_changes', 'nin_date_changes'] LOOP
    EXECUTE format('UPDATE public.%I SET payment_slip = $1, status = ''payment_submitted'', updated_at = now() WHERE upper(reference_number) = upper($2) RETURNING reference_number, status, updated_at', table_name)
      INTO reference_number, status, updated_at USING p_payment_slip, p_reference;
    IF reference_number IS NOT NULL THEN
      RETURN NEXT;
      RETURN;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.update_payment_slip(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_payment_slip(text, jsonb) TO anon, authenticated;
-- Keep these buckets private because they contain identity and payment documents.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('application-id-documents', 'application-id-documents', false, 10485760, ARRAY['image/*', 'application/pdf']),
  ('application-signatures', 'application-signatures', false, 5242880, ARRAY['image/*', 'application/pdf']),
  ('application-passport-photos', 'application-passport-photos', false, 5242880, ARRAY['image/*']),
  ('application-payment-slips', 'application-payment-slips', false, 10485760, ARRAY['image/*', 'application/pdf']),
  ('application-registration-documents', 'application-registration-documents', false, 20971520, ARRAY['image/*', 'application/pdf'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Admin access control
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role = 'admin'),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.admin_users (user_id, email, role)
VALUES ('a6c19c01-1f16-4b23-8783-73099802a153', 'admin@pernestdigitalservices.com', 'admin')
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email, role = EXCLUDED.role;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to view their own role" ON public.admin_users;
CREATE POLICY "Allow admins to view their own role" ON public.admin_users
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

DROP POLICY IF EXISTS "Allow application upload submissions" ON storage.objects;
CREATE POLICY "Allow application upload submissions" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id IN (
    'application-id-documents',
    'application-signatures',
    'application-passport-photos',
    'application-payment-slips',
    'application-registration-documents'
  ));

DROP POLICY IF EXISTS "Allow admins to view application uploads" ON storage.objects;
CREATE POLICY "Allow admins to view application uploads" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN (
      'application-id-documents',
      'application-signatures',
      'application-passport-photos',
      'application-payment-slips',
      'application-registration-documents'
    )
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Allow admins to manage application uploads" ON storage.objects;
CREATE POLICY "Allow admins to manage application uploads" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN (
      'application-id-documents',
      'application-signatures',
      'application-passport-photos',
      'application-payment-slips',
      'application-registration-documents'
    )
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id IN (
      'application-id-documents',
      'application-signatures',
      'application-passport-photos',
      'application-payment-slips',
      'application-registration-documents'
    )
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Allow admins to delete application uploads" ON storage.objects;
CREATE POLICY "Allow admins to delete application uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN (
      'application-id-documents',
      'application-signatures',
      'application-passport-photos',
      'application-payment-slips',
      'application-registration-documents'
    )
    AND public.is_admin()
  );

-- Location reference data. Populate nigerian_lgas with the official LGA list.
CREATE TABLE IF NOT EXISTS public.nigerian_states (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.nigerian_lgas (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  state_name text NOT NULL REFERENCES public.nigerian_states(name) ON UPDATE CASCADE,
  name text NOT NULL,
  UNIQUE (state_name, name)
);

INSERT INTO public.nigerian_states (name)
SELECT state_name
FROM unnest(ARRAY[
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara', 'Federal Capital Territory'
]) AS state_name
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.nigerian_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nigerian_lgas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public location reads" ON public.nigerian_states;
CREATE POLICY "Allow public location reads" ON public.nigerian_states FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public LGA reads" ON public.nigerian_lgas;
CREATE POLICY "Allow public LGA reads" ON public.nigerian_lgas FOR SELECT USING (true);

-- After running `npm run seed-locations`, verify the complete reference data:
-- SELECT count(*) AS state_count FROM public.nigerian_states; -- 37
-- SELECT count(*) AS lga_count FROM public.nigerian_lgas; -- 774
-- SELECT state_name, count(*) FROM public.nigerian_lgas GROUP BY state_name ORDER BY state_name;

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

-- Contact messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON public.contact_messages (status);
CREATE INDEX IF NOT EXISTS contact_messages_email_idx ON public.contact_messages (email);

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
  status text NOT NULL DEFAULT 'payment_pending' CHECK (status IN ('payment_pending', 'payment_submitted', 'payment_confirmed', 'approved', 'rejected')),
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
  status text NOT NULL DEFAULT 'payment_pending' CHECK (status IN ('payment_pending', 'payment_submitted', 'payment_confirmed', 'approved', 'rejected')),
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
  status text NOT NULL DEFAULT 'payment_pending' CHECK (status IN ('payment_pending', 'payment_submitted', 'payment_confirmed', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_applications_status_idx ON public.business_applications (status);
CREATE INDEX IF NOT EXISTS business_applications_email_idx ON public.business_applications (email);

-- SCUML applications
CREATE TABLE IF NOT EXISTS public.scuml_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE NOT NULL,
  entity_name text NOT NULL,
  registration_number text NOT NULL,
  registered_address text NOT NULL,
  tax_id text NOT NULL,
  persons jsonb NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  payment_slip jsonb,
  status text NOT NULL DEFAULT 'payment_pending' CHECK (status IN ('payment_pending', 'payment_submitted', 'payment_confirmed', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scuml_applications_status_idx ON public.scuml_applications (status);
CREATE INDEX IF NOT EXISTS scuml_applications_entity_idx ON public.scuml_applications (entity_name);

-- Paid registration workflow: clients submit payment evidence, then admins confirm payment.
ALTER TABLE public.ngo_applications DROP CONSTRAINT IF EXISTS ngo_applications_status_check;
ALTER TABLE public.ngo_applications ADD CONSTRAINT ngo_applications_status_check CHECK (status IN ('payment_pending', 'payment_submitted', 'payment_confirmed', 'approved', 'rejected'));
ALTER TABLE public.company_applications DROP CONSTRAINT IF EXISTS company_applications_status_check;
ALTER TABLE public.company_applications ADD CONSTRAINT company_applications_status_check CHECK (status IN ('payment_pending', 'payment_submitted', 'payment_confirmed', 'approved', 'rejected'));
ALTER TABLE public.business_applications DROP CONSTRAINT IF EXISTS business_applications_status_check;
ALTER TABLE public.business_applications ADD CONSTRAINT business_applications_status_check CHECK (status IN ('payment_pending', 'payment_submitted', 'payment_confirmed', 'approved', 'rejected'));
ALTER TABLE public.scuml_applications DROP CONSTRAINT IF EXISTS scuml_applications_status_check;
ALTER TABLE public.scuml_applications ADD CONSTRAINT scuml_applications_status_check CHECK (status IN ('payment_pending', 'payment_submitted', 'payment_confirmed', 'approved', 'rejected'));
ALTER TABLE public.nin_applications DROP CONSTRAINT IF EXISTS nin_applications_status_check;
ALTER TABLE public.nin_applications ADD CONSTRAINT nin_applications_status_check CHECK (status IN ('payment_pending', 'payment_submitted', 'payment_confirmed', 'pending', 'in_review', 'completed', 'rejected'));
ALTER TABLE public.nin_name_changes DROP CONSTRAINT IF EXISTS nin_name_changes_status_check;
ALTER TABLE public.nin_name_changes ADD CONSTRAINT nin_name_changes_status_check CHECK (status IN ('payment_pending', 'payment_submitted', 'payment_confirmed', 'pending', 'in_review', 'completed', 'rejected'));
ALTER TABLE public.nin_date_changes DROP CONSTRAINT IF EXISTS nin_date_changes_status_check;
ALTER TABLE public.nin_date_changes ADD CONSTRAINT nin_date_changes_status_check CHECK (status IN ('payment_pending', 'payment_submitted', 'payment_confirmed', 'pending', 'in_review', 'completed', 'rejected'));

-- NIN verification applications
CREATE TABLE IF NOT EXISTS public.nin_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE NOT NULL,
  nin text,
  phone text,
  surname text,
  first_name text,
  date_of_birth date,
  email text NOT NULL,
  address text,
  payment_slip jsonb,
  status text NOT NULL DEFAULT 'payment_pending' CHECK (status IN ('payment_pending', 'payment_submitted', 'payment_confirmed', 'pending', 'in_review', 'completed', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nin_applications_status_idx ON public.nin_applications (status);
CREATE INDEX IF NOT EXISTS nin_applications_email_idx ON public.nin_applications (email);

-- NIN name-change applications
CREATE TABLE IF NOT EXISTS public.nin_name_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE NOT NULL,
  nin text NOT NULL,
  new_surname text NOT NULL,
  new_first_name text NOT NULL,
  new_middle_name text,
  new_phone_number text NOT NULL,
  email text NOT NULL,
  payment_slip jsonb,
  status text NOT NULL DEFAULT 'payment_pending' CHECK (status IN ('payment_pending', 'payment_submitted', 'payment_confirmed', 'pending', 'in_review', 'completed', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nin_name_changes_status_idx ON public.nin_name_changes (status);
CREATE INDEX IF NOT EXISTS nin_name_changes_email_idx ON public.nin_name_changes (email);

-- NIN date-of-birth change applications
CREATE TABLE IF NOT EXISTS public.nin_date_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE NOT NULL,
  nin text NOT NULL,
  surname text NOT NULL,
  first_name text NOT NULL,
  middle_name text,
  gender text NOT NULL,
  old_date_of_birth date NOT NULL,
  new_date_of_birth date NOT NULL,
  marital_status text NOT NULL,
  state_of_origin text NOT NULL,
  lga_of_origin text NOT NULL,
  town_of_origin text NOT NULL,
  phone text NOT NULL,
  state_of_birth text NOT NULL,
  lga_of_birth text NOT NULL,
  state_of_residence text NOT NULL,
  lga_of_residence text NOT NULL,
  residential_address text NOT NULL,
  education text NOT NULL,
  occupation text NOT NULL,
  work_address text,
  father_surname text NOT NULL,
  father_first_name text NOT NULL,
  father_state text NOT NULL,
  father_lga text NOT NULL,
  father_town text NOT NULL,
  mother_surname text NOT NULL,
  mother_first_name text NOT NULL,
  mother_maiden_name text NOT NULL,
  mother_state text NOT NULL,
  mother_lga text NOT NULL,
  mother_town text NOT NULL,
  email text NOT NULL,
  payment_slip jsonb,
  status text NOT NULL DEFAULT 'payment_pending' CHECK (status IN ('payment_pending', 'payment_submitted', 'payment_confirmed', 'pending', 'in_review', 'completed', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nin_date_changes_status_idx ON public.nin_date_changes (status);
CREATE INDEX IF NOT EXISTS nin_date_changes_email_idx ON public.nin_date_changes (email);

-- Row-level security
-- Certificates and official registration documents uploaded by administrators.
-- Keep document metadata in JSON so each file can carry its storage name, display label,
-- MIME type, size, and data/storage URL. The array check prevents malformed values.
ALTER TABLE public.internship_applications ADD COLUMN IF NOT EXISTS registration_documents jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.ngo_applications ADD COLUMN IF NOT EXISTS registration_documents jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.company_applications ADD COLUMN IF NOT EXISTS registration_documents jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.business_applications ADD COLUMN IF NOT EXISTS registration_documents jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.scuml_applications ADD COLUMN IF NOT EXISTS registration_documents jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.nin_applications ADD COLUMN IF NOT EXISTS registration_documents jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.nin_name_changes ADD COLUMN IF NOT EXISTS registration_documents jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.nin_date_changes ADD COLUMN IF NOT EXISTS registration_documents jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.internship_applications ADD COLUMN IF NOT EXISTS edit_history jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.ngo_applications ADD COLUMN IF NOT EXISTS edit_history jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.company_applications ADD COLUMN IF NOT EXISTS edit_history jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.business_applications ADD COLUMN IF NOT EXISTS edit_history jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.scuml_applications ADD COLUMN IF NOT EXISTS edit_history jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.nin_applications ADD COLUMN IF NOT EXISTS edit_history jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.nin_name_changes ADD COLUMN IF NOT EXISTS edit_history jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.nin_date_changes ADD COLUMN IF NOT EXISTS edit_history jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.log_application_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.edit_history IS NOT DISTINCT FROM OLD.edit_history THEN
    NEW.edit_history := coalesce(OLD.edit_history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'timestamp', now(),
      'actor', CASE WHEN public.is_admin() THEN 'Administrator' ELSE 'Client' END,
      'activity', CASE WHEN public.is_admin() THEN 'Application updated by administrator' ELSE 'Application edited and resubmitted' END,
      'fields', '[]'::jsonb
    ));
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['internship_applications', 'ngo_applications', 'company_applications', 'business_applications', 'scuml_applications', 'nin_applications', 'nin_name_changes', 'nin_date_changes'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', table_name || '_activity_trigger', table_name);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_application_activity()', table_name || '_activity_trigger', table_name);
  END LOOP;
END $$;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'internship_applications', 'ngo_applications', 'company_applications',
    'business_applications', 'scuml_applications', 'nin_applications',
    'nin_name_changes', 'nin_date_changes'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', table_name, table_name || '_registration_documents_check');
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (jsonb_typeof(registration_documents) = ''array'')', table_name, table_name || '_registration_documents_check');
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', table_name, table_name || '_edit_history_check');
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (jsonb_typeof(edit_history) = ''array'')', table_name, table_name || '_edit_history_check');
    EXECUTE format('GRANT UPDATE (registration_documents, edit_history, status, updated_at) ON public.%I TO authenticated', table_name);
  END LOOP;
END $$;

-- Public status lookup returns only non-sensitive tracking details by reference number.
DROP FUNCTION IF EXISTS public.lookup_application_status(text);
CREATE OR REPLACE FUNCTION public.lookup_application_status(lookup_reference text)
RETURNS TABLE (application_type text, applicant_name text, reference_number text, status text, created_at timestamptz, updated_at timestamptz, registration_documents jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'Internship', concat_ws(' ', first_name, last_name), reference_number, status, created_at, updated_at, registration_documents FROM public.internship_applications WHERE upper(reference_number) = upper(lookup_reference)
  UNION ALL SELECT 'NGO Registration', proposed_name_1, reference_number, status, created_at, updated_at, registration_documents FROM public.ngo_applications WHERE upper(reference_number) = upper(lookup_reference)
  UNION ALL SELECT 'Company Registration', proposed_name_1, reference_number, status, created_at, updated_at, registration_documents FROM public.company_applications WHERE upper(reference_number) = upper(lookup_reference)
  UNION ALL SELECT 'Business Registration', proposed_name_1, reference_number, status, created_at, updated_at, registration_documents FROM public.business_applications WHERE upper(reference_number) = upper(lookup_reference)
  UNION ALL SELECT 'SCUML Registration', entity_name, reference_number, status, created_at, updated_at, registration_documents FROM public.scuml_applications WHERE upper(reference_number) = upper(lookup_reference)
  UNION ALL SELECT 'NIN Verification', concat_ws(' ', first_name, surname), reference_number, status, created_at, updated_at, registration_documents FROM public.nin_applications WHERE upper(reference_number) = upper(lookup_reference)
  UNION ALL SELECT 'NIN Name Change', concat_ws(' ', new_first_name, new_surname), reference_number, status, created_at, updated_at, registration_documents FROM public.nin_name_changes WHERE upper(reference_number) = upper(lookup_reference)
  UNION ALL SELECT 'NIN Date Change', concat_ws(' ', first_name, surname), reference_number, status, created_at, updated_at, registration_documents FROM public.nin_date_changes WHERE upper(reference_number) = upper(lookup_reference)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_application_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_application_status(text) TO anon, authenticated;

ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngo_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scuml_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nin_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nin_name_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nin_date_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public internship submissions" ON public.internship_applications;
CREATE POLICY "Allow public internship submissions" ON public.internship_applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated internship review" ON public.internship_applications;
CREATE POLICY "Allow authenticated internship review" ON public.internship_applications FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Allow authenticated internship status updates" ON public.internship_applications;
CREATE POLICY "Allow authenticated internship status updates" ON public.internship_applications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Allow admins to delete internship applications" ON public.internship_applications;
CREATE POLICY "Allow admins to delete internship applications" ON public.internship_applications FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow public testimonial submissions" ON public.testimonials;
CREATE POLICY "Allow public testimonial submissions" ON public.testimonials FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public approved testimonials" ON public.testimonials;
CREATE POLICY "Allow public approved testimonials" ON public.testimonials FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS "Allow authenticated testimonial review" ON public.testimonials;
CREATE POLICY "Allow authenticated testimonial review" ON public.testimonials FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Allow authenticated testimonial status updates" ON public.testimonials;
CREATE POLICY "Allow authenticated testimonial status updates" ON public.testimonials FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Allow admins to delete testimonials" ON public.testimonials;
CREATE POLICY "Allow admins to delete testimonials" ON public.testimonials FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow public contact submissions" ON public.contact_messages;
CREATE POLICY "Allow public contact submissions" ON public.contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated contact review" ON public.contact_messages;
CREATE POLICY "Allow authenticated contact review" ON public.contact_messages FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Allow authenticated contact status updates" ON public.contact_messages;
CREATE POLICY "Allow authenticated contact status updates" ON public.contact_messages FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Allow admins to delete contact messages" ON public.contact_messages;
CREATE POLICY "Allow admins to delete contact messages" ON public.contact_messages FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow public NGO submissions" ON public.ngo_applications;
CREATE POLICY "Allow public NGO submissions" ON public.ngo_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated NGO review" ON public.ngo_applications;
CREATE POLICY "Allow authenticated NGO review" ON public.ngo_applications FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Allow authenticated NGO status updates" ON public.ngo_applications;
CREATE POLICY "Allow authenticated NGO status updates" ON public.ngo_applications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Allow admins to delete NGO applications" ON public.ngo_applications;
CREATE POLICY "Allow admins to delete NGO applications" ON public.ngo_applications FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow public company submissions" ON public.company_applications;
CREATE POLICY "Allow public company submissions" ON public.company_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated company review" ON public.company_applications;
CREATE POLICY "Allow authenticated company review" ON public.company_applications FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Allow authenticated company status updates" ON public.company_applications;
CREATE POLICY "Allow authenticated company status updates" ON public.company_applications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Allow admins to delete company applications" ON public.company_applications;
CREATE POLICY "Allow admins to delete company applications" ON public.company_applications FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow public business submissions" ON public.business_applications;
CREATE POLICY "Allow public business submissions" ON public.business_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated business review" ON public.business_applications;
CREATE POLICY "Allow authenticated business review" ON public.business_applications FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Allow authenticated business status updates" ON public.business_applications;
CREATE POLICY "Allow authenticated business status updates" ON public.business_applications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Allow admins to delete business applications" ON public.business_applications;
CREATE POLICY "Allow admins to delete business applications" ON public.business_applications FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow public SCUML submissions" ON public.scuml_applications;
CREATE POLICY "Allow public SCUML submissions" ON public.scuml_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated SCUML review" ON public.scuml_applications;
CREATE POLICY "Allow authenticated SCUML review" ON public.scuml_applications FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Allow authenticated SCUML status updates" ON public.scuml_applications;
CREATE POLICY "Allow authenticated SCUML status updates" ON public.scuml_applications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Allow admins to delete SCUML applications" ON public.scuml_applications;
CREATE POLICY "Allow admins to delete SCUML applications" ON public.scuml_applications FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow public NIN submissions" ON public.nin_applications;
CREATE POLICY "Allow public NIN submissions" ON public.nin_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated NIN review" ON public.nin_applications;
CREATE POLICY "Allow authenticated NIN review" ON public.nin_applications FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Allow authenticated NIN status updates" ON public.nin_applications;
CREATE POLICY "Allow authenticated NIN status updates" ON public.nin_applications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Allow admins to delete NIN applications" ON public.nin_applications;
CREATE POLICY "Allow admins to delete NIN applications" ON public.nin_applications FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow public NIN name-change submissions" ON public.nin_name_changes;
CREATE POLICY "Allow public NIN name-change submissions" ON public.nin_name_changes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated NIN name-change review" ON public.nin_name_changes;
CREATE POLICY "Allow authenticated NIN name-change review" ON public.nin_name_changes FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Allow authenticated NIN name-change status updates" ON public.nin_name_changes;
CREATE POLICY "Allow authenticated NIN name-change status updates" ON public.nin_name_changes FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Allow admins to delete NIN name changes" ON public.nin_name_changes;
CREATE POLICY "Allow admins to delete NIN name changes" ON public.nin_name_changes FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow public NIN date-change submissions" ON public.nin_date_changes;
CREATE POLICY "Allow public NIN date-change submissions" ON public.nin_date_changes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated NIN date-change review" ON public.nin_date_changes;
CREATE POLICY "Allow authenticated NIN date-change review" ON public.nin_date_changes FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Allow authenticated NIN date-change status updates" ON public.nin_date_changes;
CREATE POLICY "Allow authenticated NIN date-change status updates" ON public.nin_date_changes FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Allow admins to delete NIN date changes" ON public.nin_date_changes;
CREATE POLICY "Allow admins to delete NIN date changes" ON public.nin_date_changes FOR DELETE TO authenticated USING (public.is_admin());
