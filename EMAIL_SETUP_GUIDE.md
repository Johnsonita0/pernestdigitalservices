# 🏆 Trophy Custom Email Template Setup Guide

## How to Use This Template in Supabase

### Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your **Trophy** project
3. Click **Authentication** (left sidebar)

### Step 2: Access Email Templates
1. Click **Email Templates** (under Authentication)
2. Look for "Confirm signup" email
3. Click **Edit** to customize it

### Step 3: Copy Template Content
1. Open the `TROPHY_EMAIL_TEMPLATE.html` file (in your Trophy project folder)
2. Copy ALL the HTML code
3. In Supabase, click the **HTML** tab (if available)
4. Paste the entire template code

### Step 4: Important Template Variables
The template uses Supabase variables that will be automatically filled:

- `{{ .ConfirmationURL }}` → Link for user to confirm email
- `{{ .Email }}` → User's email address (if needed)
- `{{ .Token }}` → Confirmation token

✅ **These variables are already in the template!**

### Step 5: Customize for Your Needs

You can modify these sections:

#### Phone Number
- Find: `+2349063316300`
- Replace with your Trophy phone number

#### Social Media Links
- Find: `https://instagram.com`, `https://facebook.com`, `https://wa.me/2349063316300`
- Update with your actual social media URLs

#### Address
- Find: `12 Lekki Phase 1, Lagos`
- Update with your actual location

#### Support Email/Contact
- Modify contact information as needed

### Step 6: Save and Enable
1. Click **Save** in Supabase
2. Go to **Providers** → **Email**
3. Toggle **ON** the "Confirm email" switch
4. Save changes

✅ **Done!** Users will now receive this branded email when they sign up.

---

## 📧 Email Features

This custom template includes:

✨ **Professional Branding**
- Trophy logo and tagline
- Orange & gold color scheme (matching your app)
- Modern gradient design

🎯 **Clear Call-to-Action**
- Large, eye-catching confirmation button
- Backup link option for reliability
- Security messaging

📱 **Responsive Design**
- Works on mobile & desktop
- Readable on all email clients (Gmail, Outlook, etc.)

🔐 **Trust Elements**
- Security badge
- Contact information visible
- Professional footer with links

---

## Alternative: Quick Links

If you want users to confirm with just text links instead of a button:

Replace this:
```html
<a href="{{ .ConfirmationURL }}" class="confirm-btn">Confirm Email Address</a>
```

With just:
```html
<a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a>
```

---

## Testing

After setting up:
1. Sign up for an account on your Trophy app
2. Check your email inbox
3. Verify the email looks good
4. Test the confirmation link

If you don't see the email:
- Check spam/promotions folder
- Verify email settings in Supabase are correct
- Check Supabase logs for errors

---

## Need Help?

If the email doesn't send or has issues:

1. **Check Email Provider Settings:**
   - Go to Authentication → Providers → Email
   - Verify settings are correct

2. **Check Auth Logs:**
   - Go to Authentication → Logs
   - Look for any error messages

3. **Verify Domain:**
   - If using custom domain, make sure DNS is configured
   - Default Supabase emails come from `no-reply@...supabase.co`

---

## 🎨 Customization Tips

### Change Colors
Find these color codes and replace:
- `#ff7b42` → Primary orange
- `#ff5b2e` → Dark orange
- `#1a1516` → Dark text
- `#5a453d` → Medium text

Example: Change orange to blue
```css
background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
```

### Add Your Logo
If you want to use an image instead of text:
Replace:
```html
<div class="email-logo">🏆 Trophy</div>
```

With:
```html
<img src="https://your-domain.com/logo.png" alt="Trophy" style="width: 100px; height: auto;">
```

### Change Features Section
Edit these to match your offerings:
```html
<div class="feature-item">
  <div class="feature-icon">🍽️</div>
  <p class="feature-title">Browse & Order</p>
</div>
```

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] All contact info updated (phone, address, social links)
- [ ] Logo/branding looks correct
- [ ] Confirmation link works
- [ ] Email looks good on mobile
- [ ] No spelling or grammar errors
- [ ] Colors match Trophy branding

---

**Good luck! Your Trophy email is ready to wow customers.** 🎉
