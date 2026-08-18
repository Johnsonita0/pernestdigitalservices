-- Create profiles table to store user profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  profile_image_url TEXT, -- path/URL stored in the Supabase 'bank_prof' bucket
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  food_preferences TEXT, -- JSON or comma-separated preferences
  dietary_restrictions TEXT, -- e.g., "vegetarian, gluten-free"
  delivery_notes TEXT,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user orders table to track orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  order_total DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, confirmed, preparing, ready, delivered, cancelled
  delivery_address TEXT,
  delivery_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  food_name TEXT NOT NULL,
  food_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure the shared storage bucket for user profile photos and bank proof uploads exists.
-- Store files using a user-scoped path such as:
-- profiles/{auth.uid()}/avatar.jpg
-- bank-proof/{auth.uid()}/proof-{timestamp}.jpg
-- Example: supabase.storage.from('bank_prof').upload(`${user.id}/bank-proof/${Date.now()}.jpg`, file)
INSERT INTO storage.buckets (id, name, public)
VALUES ('bank_prof', 'bank_prof', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('food_img', 'food_img', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create menu_items table for admin-managed food menu items.
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  tag TEXT,
  badge TEXT,
  featured BOOLEAN DEFAULT FALSE,
  available BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so the script can be re-run safely
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view order items from their orders" ON order_items;
DROP POLICY IF EXISTS "Admin can manage menu items" ON menu_items;
DROP POLICY IF EXISTS "Admin can manage food_img files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own bank_prof files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own bank_prof files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own bank_prof files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own bank_prof files" ON storage.objects;

-- Create RLS policy: users can only see their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create RLS policy: users can only see their own preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only see their own orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can only see items from their own orders
CREATE POLICY "Users can view order items from their orders"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Admin access to all profile/order data
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;
DROP POLICY IF EXISTS "Admin can update all orders" ON orders;

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Admin can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Admin can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Admin can update all orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Admin can manage menu items"
  ON menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Admin can upload food images to food_img bucket
CREATE POLICY "Admin can manage food_img files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'food_img'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    bucket_id = 'food_img'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Users can read only files they uploaded to the shared bank_prof bucket.
-- Files should be stored inside a folder like: {auth.uid()}/profile/*.jpg or {auth.uid()}/bank-proof/*.jpg
CREATE POLICY "Users can view their own bank_prof files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'bank_prof'
    AND name LIKE auth.uid()::text || '/%'
  );

CREATE POLICY "Users can upload their own bank_prof files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'bank_prof'
    AND name LIKE auth.uid()::text || '/%'
  );

CREATE POLICY "Users can update their own bank_prof files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'bank_prof'
    AND name LIKE auth.uid()::text || '/%'
  )
  WITH CHECK (
    bucket_id = 'bank_prof'
    AND name LIKE auth.uid()::text || '/%'
  );

CREATE POLICY "Users can delete their own bank_prof files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'bank_prof'
    AND name LIKE auth.uid()::text || '/%'
  );

-- Helper function for checking if the current auth user is the app admin
CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_user_id = '58876079-3e57-4b35-9a54-b7f3d00a18c7'
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = p_user_id
        AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically create a profile entry when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    email,
    phone,
    address
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Also create an empty preferences entry
  INSERT INTO public.user_preferences (user_id) 
  VALUES (NEW.id) 
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the app admin profile exists and is marked as admin
INSERT INTO public.profiles (
  id,
  username,
  full_name,
  email,
  phone,
  address,
  is_admin
)
VALUES (
  '58876079-3e57-4b35-9a54-b7f3d00a18c7',
  'admin',
  'Trophy Admin',
  'admin@trophysip.com',
  '0000000000',
  'Head Office',
  true
)
ON CONFLICT (id)
DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  is_admin = true,
  updated_at = NOW();

-- Add payment method and proof of payment columns to orders table if they don't exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS proof_of_payment TEXT,
ADD COLUMN IF NOT EXISTS proof_of_payment_filename TEXT,
ADD COLUMN IF NOT EXISTS proof_of_payment_mime_type TEXT,
ADD COLUMN IF NOT EXISTS proof_of_payment_size INTEGER,
ADD COLUMN IF NOT EXISTS proof_of_payment_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Create dedicated payment proof table to store uploaded proof metadata
CREATE TABLE IF NOT EXISTS payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin notifications table for payment confirmations
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL, -- 'bank_transfer_payment', 'order_update', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  proof_of_payment_url TEXT,
  proof_of_payment_filename TEXT,
  proof_of_payment_mime_type TEXT,
  proof_of_payment_size INTEGER,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  order_total DECIMAL(10, 2),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_notifications and payment_proofs
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so the script can be re-run safely
DROP POLICY IF EXISTS "Admin can view all notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admin can update notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Users can view their own payment proof" ON payment_proofs;
DROP POLICY IF EXISTS "Users can insert their own payment proof" ON payment_proofs;

-- Admin can view all notifications
CREATE POLICY "Admin can view all notifications"
  ON admin_notifications FOR SELECT
  USING (true);

-- Admin can update notification status
CREATE POLICY "Admin can update notifications"
  ON admin_notifications FOR UPDATE
  USING (true);

-- Users can view their own payment proof records
CREATE POLICY "Users can view their own payment proof"
  ON payment_proofs FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own payment proof records
CREATE POLICY "Users can insert their own payment proof"
  ON payment_proofs FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at 
  ON admin_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read 
  ON admin_notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_payment_proofs_order_id
  ON payment_proofs(order_id);

