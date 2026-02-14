# ✅ Supabase Setup Checklist

Follow these steps to get your family tree application fully functional.

---

## Step 1: Create Supabase Account

- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Click "Start your project"
- [ ] Sign up with GitHub, Google, or email
- [ ] Verify your email if required

---

## Step 2: Create New Project

- [ ] Click "New Project"
- [ ] Choose or create an organization
- [ ] Fill in project details:
  - **Name**: `family-tree` (or your preferred name)
  - **Database Password**: Generate a strong password (save it!)
  - **Region**: Choose closest to your location
- [ ] Click "Create new project"
- [ ] Wait 2-3 minutes for provisioning

---

## Step 3: Deploy Database Schema

- [ ] In Supabase dashboard, click "SQL Editor" in the left sidebar
- [ ] Click "New query"
- [ ] Open `database/schema.sql` from your project
- [ ] Copy the ENTIRE contents (all ~450 lines)
- [ ] Paste into the SQL Editor
- [ ] Click "Run" (or press Ctrl+Enter)
- [ ] Wait for "Success. No rows returned" message

### Verify Schema Deployment

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these 8 tables:
- [ ] audit_log
- [ ] families
- [ ] family_history
- [ ] family_members
- [ ] family_memberships
- [ ] persons
- [ ] relationships
- [ ] users

---

## Step 4: Configure Authentication

- [ ] Go to "Authentication" → "Settings" in the left sidebar
- [ ] Under "Site URL", enter: `http://localhost:5173`
- [ ] Under "Redirect URLs", add: `http://localhost:5173/**`
- [ ] Scroll to "Email Auth"
- [ ] Ensure "Enable Email provider" is ON
- [ ] (Optional) Customize email templates
- [ ] Click "Save"

---

## Step 5: Get API Credentials

- [ ] Go to "Settings" → "API" in the left sidebar
- [ ] Find "Project URL" - copy this value
- [ ] Find "Project API keys" → "anon public" - copy this value
- [ ] Keep these handy for the next step

---

## Step 6: Configure Environment Variables

- [ ] In your project folder, find `.env.example`
- [ ] Create a copy and rename it to `.env`
- [ ] Open `.env` in your editor
- [ ] Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

With your actual values:

```env
VITE_SUPABASE_URL=<paste your Project URL here>
VITE_SUPABASE_ANON_KEY=<paste your anon key here>
```

- [ ] Save the file

---

## Step 7: Restart Development Server

If your dev server is running:

- [ ] Press `Ctrl+C` in the terminal to stop it
- [ ] Run `npm run dev` to start it again
- [ ] The app will now connect to Supabase!

---

## Step 8: Test Authentication

- [ ] Open http://localhost:5173 in your browser
- [ ] Click "Sign Up" or "Get Started"
- [ ] Fill in the sign-up form:
  - Full Name: Your name
  - Email: Your email
  - Password: At least 6 characters
  - Confirm Password: Same password
- [ ] Click "Create Account"
- [ ] Check your email for confirmation (if required)
- [ ] You should be redirected to the Dashboard

---

## Step 9: Create Your First Family Tree

- [ ] On the Dashboard, click "Create New Family Tree"
- [ ] Fill in the form:
  - Family Name: e.g., "The Smith Family"
  - Description: Optional description
  - Owner Password: A password to protect this family tree
- [ ] Click "Create"
- [ ] You should see your new family tree card!

---

## Step 10: Verify Database Connection

Let's verify everything is working:

- [ ] Go back to Supabase dashboard
- [ ] Click "Table Editor" in the left sidebar
- [ ] Click on "users" table
- [ ] You should see your user account
- [ ] Click on "families" table
- [ ] You should see your family tree
- [ ] Click on "family_memberships" table
- [ ] You should see your membership with role "owner"

---

## 🎉 Setup Complete!

If all checkboxes are checked, your Supabase backend is fully configured!

### What You Can Do Now:

✅ Sign up and sign in
✅ Create family trees
✅ View your dashboard
✅ All data is securely stored in Supabase

### What's Next:

The foundation is complete! Now you can start implementing Phase 2 features:

1. Add family members
2. Create relationships
3. Build tree visualization
4. Add export functionality

See `IMPLEMENTATION_PLAN.md` for detailed guidance!

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables"

**Problem**: App shows this error on startup

**Solution**:
- Make sure you created `.env` file (not `.env.example`)
- Verify the file contains both variables
- Restart the dev server
- Check for typos in variable names (must start with `VITE_`)

### "Invalid API key"

**Problem**: Authentication fails

**Solution**:
- Double-check you copied the "anon public" key (not the service role key)
- Ensure no extra spaces in the `.env` file
- Verify the key starts with `eyJ`

### "Email not confirmed"

**Problem**: Can't sign in after signing up

**Solution**:
- Check your email for confirmation link
- Click the link to confirm your account
- Try signing in again
- Or disable email confirmation in Supabase Auth settings

### "Row Level Security policy violation"

**Problem**: Can't access data

**Solution**:
- Verify the schema was deployed correctly
- Check that RLS policies were created
- Re-run the schema.sql file if needed

### Can't create family tree

**Problem**: Error when creating family

**Solution**:
- Check browser console for errors
- Verify you're signed in
- Make sure password is at least 6 characters
- Check Supabase logs in dashboard

---

## 📞 Still Need Help?

### Check These Resources:

1. **Supabase Documentation**: https://supabase.com/docs
2. **Project README**: `README.md` in your project
3. **Quick Start Guide**: `QUICKSTART.md`

### Common Issues:

- **CORS errors**: Make sure Site URL is set correctly in Supabase
- **Database errors**: Re-run the schema.sql file
- **Auth errors**: Check email confirmation settings

---

## 🔒 Security Notes

### Important:

- ✅ Never commit `.env` file to Git (it's in `.gitignore`)
- ✅ Never share your API keys publicly
- ✅ Use different credentials for production
- ✅ The "anon" key is safe for client-side use
- ❌ Never use the "service_role" key in your frontend

### Your Data is Secure:

- All data is encrypted in transit (HTTPS)
- Row-Level Security prevents unauthorized access
- Passwords are hashed with bcrypt
- Supabase provides automatic backups

---

## ✅ Final Checklist

Before moving to development:

- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] All 8 tables exist
- [ ] Authentication configured
- [ ] Environment variables set
- [ ] Dev server restarted
- [ ] Successfully signed up
- [ ] Successfully signed in
- [ ] Created a test family tree
- [ ] Verified data in Supabase dashboard

**All checked? You're ready to build! 🚀**

---

*Next: Read `IMPLEMENTATION_PLAN.md` to start Phase 2*
