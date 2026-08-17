# Supabase Setup Instructions

## Database Schema Setup

### Step 1: Run SQL in Supabase
1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `sql/create_user_tables.sql` from this repository
5. Paste it into the SQL editor
6. Click **Run**

This will create:
- `profiles` table: stores user profile information (username, full_name, email, phone, address)
- `user_preferences` table: stores food preferences, dietary restrictions, and delivery notes
- `orders` table: tracks all orders
- `order_items` table: tracks items in each order
- Automatic trigger: creates a profile record when a user signs up

### Step 2: Verify Tables Created
In Supabase SQL Editor, run:
```sql
SELECT * FROM profiles;
SELECT * FROM user_preferences;
```

Both should return empty results (no rows yet), which is correct.

## How It Works

### On Sign Up
1. User fills in signup form (email, password, fullName, username, phone, address)
2. SignUpPage.jsx sends auth.signUp() with email/password to Supabase Auth
3. Supabase Auth creates the user
4. The `on_auth_user_created` trigger automatically:
   - Creates a row in the `profiles` table with user info
   - Creates an empty row in the `user_preferences` table

### User Profile Access
- Signed-in users can view/edit their profile via the Account tab
- The app now loads user data from both auth metadata and the profiles table
- Profile preferences are stored in user_preferences

## Future Enhancements

- Add photo upload to profiles table (profile_image_url column already exists)
- Store order history in orders/order_items tables
- Implement order tracking UI
- Add food preference filtering based on user_preferences

## Troubleshooting

If users aren't being created in the profiles table after signup:
1. Check the Supabase logs: **SQL Editor** → **Query Logs**
2. Verify the trigger is active: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
3. Check user_metadata is being sent correctly from SignUpPage.jsx
