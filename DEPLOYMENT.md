# 🚀 Deployment Guide

## Quick Deployment Checklist

- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] RLS policies enabled
- [ ] Environment variables configured
- [ ] Frontend deployed
- [ ] Custom domain configured (optional)

## Supabase Setup (Backend)

### 1. Create Supabase Project

1. Visit [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization
4. Enter project details:
   - **Name**: family-tree-prod
   - **Database Password**: (generate strong password)
   - **Region**: Choose closest to your users
5. Wait 2-3 minutes for provisioning

### 2. Deploy Database Schema

1. Go to SQL Editor in Supabase dashboard
2. Create new query
3. Copy entire contents of `database/schema.sql`
4. Click "Run"
5. Verify success (should see "Success. No rows returned")

### 3. Verify Database Setup

Check that all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see:
- users
- families
- persons
- family_members
- relationships
- family_memberships
- family_history
- audit_log

### 4. Configure Authentication

1. Go to Authentication → Settings
2. **Site URL**: Set to your production domain (e.g., `https://familytree.app`)
3. **Redirect URLs**: Add your domain
4. Enable Email provider
5. Configure email templates (optional but recommended)

### 5. Configure Storage (for media uploads)

1. Go to Storage
2. Create new bucket: `family-photos`
3. Set bucket to **private**
4. Add RLS policy:

```sql
CREATE POLICY "Users can upload to their families"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'family-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT family_id::text 
    FROM family_memberships 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their family photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'family-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT family_id::text 
    FROM family_memberships 
    WHERE user_id = auth.uid()
  )
);
```

### 6. Get API Credentials

1. Go to Settings → API
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...`
3. Save these for frontend deployment

## Frontend Deployment

### Option 1: Vercel (Recommended)

#### Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```
6. Click "Deploy"

#### Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

### Option 2: Netlify

#### Via Netlify Dashboard

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to Git provider
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add Environment Variables:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```
6. Click "Deploy"

#### Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

### Option 3: Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to Pages
3. Click "Create a project"
4. Connect Git repository
5. Configure:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Add Environment Variables
7. Deploy

## Post-Deployment

### 1. Update Supabase Site URL

Go back to Supabase → Authentication → Settings and update:
- **Site URL**: Your production domain
- **Redirect URLs**: Add production domain

### 2. Test Authentication Flow

1. Visit your deployed site
2. Try signing up
3. Check email for confirmation
4. Try signing in
5. Create a test family tree

### 3. Configure Custom Domain (Optional)

#### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

#### Netlify
1. Go to Site Settings → Domain management
2. Add custom domain
3. Update DNS records

### 4. Enable HTTPS

All platforms (Vercel, Netlify, Cloudflare) automatically provision SSL certificates.

### 5. Set Up Monitoring

#### Vercel Analytics
```bash
npm install @vercel/analytics
```

Add to `src/main.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

// In your render
<Analytics />
```

#### Sentry (Error Tracking)
```bash
npm install @sentry/react
```

Configure in `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

## Environment Variables Reference

### Development (.env)
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

### Production
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

## Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Troubleshooting

### Build Fails

**Issue**: Build fails with TypeScript errors
**Solution**: Run `npm run type-check` locally and fix errors

**Issue**: Environment variables not found
**Solution**: Ensure all `VITE_` prefixed variables are set in deployment platform

### Authentication Issues

**Issue**: Users can't sign up
**Solution**: Check Supabase Auth settings, ensure Site URL is correct

**Issue**: Email confirmations not sending
**Solution**: Configure SMTP in Supabase or use default (may go to spam)

### Database Connection Issues

**Issue**: RLS policies blocking queries
**Solution**: Verify policies are correctly set up, check user authentication

### Performance Issues

**Issue**: Slow initial load
**Solution**: 
- Enable code splitting
- Lazy load routes
- Optimize images
- Use CDN

## Scaling Considerations

### Free Tier Limits

**Supabase Free Tier:**
- 500 MB database space
- 1 GB file storage
- 2 GB bandwidth
- Unlimited API requests

**Vercel Free Tier:**
- 100 GB bandwidth
- Unlimited deployments
- Automatic SSL

### When to Upgrade

Consider upgrading when:
- Database > 400 MB
- > 50,000 monthly active users
- Need custom SMTP
- Need priority support

### Performance Optimization

1. **Enable caching**:
   - Add cache headers
   - Use React Query caching
   - Implement service workers

2. **Optimize queries**:
   - Add database indexes
   - Use query pagination
   - Implement infinite scroll

3. **CDN optimization**:
   - Use image CDN
   - Compress assets
   - Enable gzip/brotli

## Backup Strategy

### Database Backups

Supabase automatically backs up your database daily (free tier: 7 days retention).

For manual backups:
```bash
# Using Supabase CLI
supabase db dump -f backup.sql
```

### Restore from Backup

```bash
supabase db reset
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f backup.sql
```

## Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (Supabase Pro)
- [ ] Audit logging active
- [ ] Regular security updates

---

**Deployment complete! 🎉**

Your family tree application is now live and ready to preserve family legacies!
