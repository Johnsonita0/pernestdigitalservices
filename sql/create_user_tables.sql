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
  role TEXT NOT NULL DEFAULT 'customer', -- customer, rider, admin
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

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';

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

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';

CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_items_title_unique
  ON menu_items(title);

-- Seed the original menu into Supabase. Existing rows with the same title are kept.
INSERT INTO menu_items (title, description, price, tag, badge, featured, available, image_url)
VALUES
  ('Jollof Rice & Chicken', 'Tomato stew rice, grilled chicken, roasted peppers, and fiery pepper sauce.', 12000, 'Chef special', 'Hot today', true, true, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80'),
  ('Egusi Soup Deluxe', 'Thick melon seed soup with spinach, goat meat, and pounded yam.', 15000, 'Fresh pick', 'Popular', true, true, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80'),
  ('Suya Bowl', 'Spiced grilled meat, fried plantain, rice, slaw, and spicy suya sauce.', 13500, 'Bestseller', 'Best seller', true, false, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80'),
  ('Plantain & Fish', 'Golden plantain served with peppered fish, onions, and fresh tomato relish.', 9000, 'Side', 'Add-on', false, true, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80'),
  ('Amala & Ewedu', 'Smooth amala with ewedu, gbegiri, and a choice of beef or fish.', 11000, 'Starter', 'Classic', false, false, 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80'),
  ('Chin Chin & Zobo', 'Crispy Nigerian snack bites with chilled hibiscus zobo drink.', 6000, 'Dessert', 'Sweet', false, true, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80'),
  ('Yam Porridge Special', 'Creamy yam porridge with smoked fish, onions, and green pepper.', 9800, 'Comfort food', 'Cozy', false, true, 'https://images.unsplash.com/photo-1670381543120-b5e6d0ca9f1c?auto=format&fit=crop&w=900&q=80'),
  ('Beef Shawarma Wrap', 'Juicy beef wraps with lettuce, tomatoes, and garlic sauce drizzle.', 8500, 'Grab & go', 'Lunch', false, true, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80'),
  ('Spicy Chicken Pasta', 'Creamy pasta with grilled chicken, chilli flakes, and herbs.', 12500, 'Fusion', 'New', false, false, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80'),
  ('Pepper Soup Mix', 'Hot, savory pepper soup with assorted meats and fresh herbs.', 10500, 'Soup', 'Warm', false, true, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80'),
  ('Crispy Chicken Burger', 'Double-patty burger with crispy chicken, cheese, and house sauce.', 11500, 'Fast bite', 'Popular', false, true, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80'),
  ('Fruit Salad Bowl', 'Fresh seasonal fruit mix with yogurt and honey drizzle.', 7000, 'Fresh', 'Light', false, true, 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80'),
  ('Turkey Rice Skillet', 'Flavour-packed rice with turkey strips, bell peppers, and onion.', 13000, 'Tonight', 'Chef pick', false, true, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80'),
  ('Moi Moi & Plantain', 'Soft steamed bean pudding served with golden plantain and pepper sauce.', 8200, 'Local favorite', 'Classic', false, false, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80'),
  ('Noodles & Chicken', 'Stir-fried noodles with chicken, vegetables, and savory sauce.', 11500, 'Wok', 'Quick', false, true, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80'),
  ('Coconut Rice Bowl', 'Aromatic coconut rice with grilled prawns and herb garnish.', 14500, 'Seafood', 'Fresh', false, true, 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80'),
  ('Beef & Veggie Stew', 'Rich stew with tender beef, vegetables, and warm traditional spices.', 12800, 'Comfort', 'Home style', false, true, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80'),
  ('Crunchy Chicken Salad', 'Crisp greens, grilled chicken, carrots, cucumber, and tangy dressing.', 9200, 'Healthy', 'Fresh', false, true, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=900&q=80'),
  ('Puff Puff & Tea', 'Soft and airy dough bites with a warm cup of local tea.', 5500, 'Snack', 'Sweet', false, true, 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'),
  ('Banga Soup Combo', 'Palm nut soup with catfish, assorted meats, and soft starch.', 16000, 'Traditional', 'Special', false, false, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80')
ON CONFLICT (title) DO NOTHING;

-- Helper function for admin checks inside RLS policies.
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

CREATE OR REPLACE FUNCTION public.is_rider_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_user_id = '054bb3f4-feb1-45b6-bd0c-0bede0a24e9d'
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = p_user_id
        AND email = 'rider@trophy.com'
        AND role = 'rider'
        AND is_admin = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies so the script can be re-run safely
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can cancel eligible cash orders" ON orders;
DROP POLICY IF EXISTS "Users can view order items from their orders" ON order_items;
DROP POLICY IF EXISTS "Riders can view ready orders" ON orders;
DROP POLICY IF EXISTS "Riders can view delivered orders" ON orders;
DROP POLICY IF EXISTS "Riders can mark ready orders delivered" ON orders;
DROP POLICY IF EXISTS "Riders can view ready order items" ON order_items;
DROP POLICY IF EXISTS "Riders can view delivered order items" ON order_items;
DROP POLICY IF EXISTS "Admin can manage menu items" ON menu_items;
DROP POLICY IF EXISTS "Anyone can view available menu items" ON menu_items;
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

CREATE POLICY "Users can cancel eligible cash orders"
  ON orders FOR UPDATE
  USING (
    auth.uid() = user_id
    AND payment_method = 'cash'
    AND status IN ('pending', 'confirmed')
  )
  WITH CHECK (
    auth.uid() = user_id
    AND payment_method = 'cash'
    AND status = 'cancelled'
  );

-- Create RLS policy: users can only see items from their own orders
CREATE POLICY "Users can view order items from their orders"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Riders can view ready orders"
  ON orders FOR SELECT
  USING (
    public.is_rider_user(auth.uid())
    AND status = 'ready'
  );

CREATE POLICY "Riders can view delivered orders"
  ON orders FOR SELECT
  USING (
    public.is_rider_user(auth.uid())
    AND status = 'delivered'
  );

CREATE POLICY "Riders can mark ready orders delivered"
  ON orders FOR UPDATE
  USING (
    public.is_rider_user(auth.uid())
    AND status = 'ready'
  )
  WITH CHECK (
    public.is_rider_user(auth.uid())
    AND status = 'delivered'
  );

CREATE POLICY "Riders can view ready order items"
  ON order_items FOR SELECT
  USING (
    public.is_rider_user(auth.uid())
    AND order_id IN (
      SELECT id FROM orders WHERE status = 'ready'
    )
  );

CREATE POLICY "Riders can view delivered order items"
  ON order_items FOR SELECT
  USING (
    public.is_rider_user(auth.uid())
    AND order_id IN (
      SELECT id FROM orders WHERE status = 'delivered'
    )
  );

-- Admin access to all profile/order data
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;
DROP POLICY IF EXISTS "Admin can update all orders" ON orders;

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admin can update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admin can view all orders"
  ON orders FOR SELECT
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admin can update all orders"
  ON orders FOR UPDATE
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admin can manage menu items"
  ON menu_items FOR ALL
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "Anyone can view available menu items"
  ON menu_items FOR SELECT
  USING (available = true);

-- Admin can upload food images to food_img bucket
CREATE POLICY "Admin can manage food_img files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'food_img'
    AND public.is_admin_user(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'food_img'
    AND public.is_admin_user(auth.uid())
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
  role = 'admin',
  updated_at = NOW();

-- Ensure the delivery rider profile exists and has rider-only privileges.
INSERT INTO public.profiles (
  id,
  username,
  full_name,
  email,
  phone,
  address,
  is_admin,
  role
)
VALUES (
  '054bb3f4-feb1-45b6-bd0c-0bede0a24e9d',
  'rider',
  'Trophy Rider',
  'rider@trophy.com',
  '0000000000',
  'Delivery Desk',
  false,
  'rider'
)
ON CONFLICT (id)
DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  is_admin = false,
  role = 'rider',
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

