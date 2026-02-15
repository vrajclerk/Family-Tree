# 🔧 Troubleshooting Guide

## Common Issues and Solutions

---

## TailwindCSS PostCSS Error

### Error Message:
```
[postcss] It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin.
The PostCSS plugin has moved to a separate package...
```

### Solution: ✅ FIXED
This has been resolved! The project now uses:
- `@tailwindcss/postcss` plugin
- TailwindCSS v4 syntax with `@import "tailwindcss"`

If you still see this error:
1. Delete `node_modules` folder
2. Run `npm install`
3. Restart dev server with `npm run dev`

---

## Missing Supabase Environment Variables

### Error Message:
```
Missing Supabase environment variables. Please check your .env file.
```

### Solution:
1. Copy `.env.example` to `.env`
2. Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Restart dev server

---

## Cannot Find Module 'lucide-react'

### Error Message:
```
Cannot find module 'lucide-react' or its corresponding type declarations.
```

### Solution:
This is a TypeScript linting error that doesn't affect the running app. The module is installed correctly. To fix the linting errors:

```bash
npm install -D @types/node
```

Or ignore these errors - they don't affect functionality.

---

## Port Already in Use

### Error Message:
```
Port 5173 is already in use
```

### Solution:
1. Stop the existing dev server (Ctrl+C)
2. Or kill the process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :5173
   taskkill /PID <process_id> /F
   ```
3. Restart dev server

---

## Build Fails with TypeScript Errors

### Solution:
TypeScript linting errors don't prevent the app from running in development. To check for actual build errors:

```bash
npm run build
```

Most linting errors are cosmetic and can be fixed later.

---

## Authentication Not Working

### Issue: Can't sign up or sign in

### Solution:
1. Verify Supabase is set up (see `SUPABASE_SETUP.md`)
2. Check database schema is deployed
3. Verify environment variables are correct
4. Check browser console for errors
5. Ensure Site URL is set in Supabase Auth settings

---

## Database Connection Errors

### Issue: RLS policy violations

### Solution:
1. Verify schema was deployed correctly
2. Check that you're signed in
3. Verify RLS policies exist:
   ```sql
   SELECT * FROM pg_policies;
   ```
4. Re-run `database/schema.sql` if needed

---

## Styles Not Loading

### Issue: App has no styling

### Solution:
1. Verify TailwindCSS is configured correctly
2. Check `postcss.config.js` uses `@tailwindcss/postcss`
3. Check `src/style.css` uses `@import "tailwindcss"`
4. Restart dev server
5. Clear browser cache

---

## Hot Reload Not Working

### Solution:
1. Restart dev server
2. Check file is saved
3. Clear browser cache
4. Try hard refresh (Ctrl+Shift+R)

---

## npm install Fails

### Solution:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm cache clean --force`
3. Run `npm install` again
4. If still failing, check Node.js version (need 18+)

---

## Dark Mode Not Working

### Solution:
Dark mode is automatic based on system preferences. To test:
1. Change your OS theme
2. Or add dark mode toggle (not implemented yet)
3. Check browser DevTools for `dark` class on `<html>`

---

## Images/Icons Not Loading

### Issue: Lucide icons not showing

### Solution:
Icons should load automatically. If not:
1. Verify `lucide-react` is installed: `npm list lucide-react`
2. Restart dev server
3. Check browser console for errors

---

## Deployment Issues

### Issue: Build succeeds but app doesn't work in production

### Solution:
1. Check environment variables are set in deployment platform
2. Verify all variables start with `VITE_`
3. Check Supabase Site URL matches production domain
4. Review deployment logs for errors

---

## Performance Issues

### Issue: App is slow

### Solution:
1. Check browser DevTools Network tab
2. Verify Supabase region is close to you
3. Check for console errors
4. Clear browser cache
5. Try incognito mode

---

## TypeScript Errors in IDE

### Common Errors:

**"Cannot find module 'react'"**
- Run: `npm install -D @types/react @types/react-dom`

**"JSX element implicitly has type 'any'"**
- This is normal during development
- Doesn't affect functionality

**"Cannot use JSX unless '--jsx' flag is provided"**
- Vite handles this automatically
- Ignore this error

---

## Need More Help?

### Resources:
1. Check `README.md` for full documentation
2. Review `QUICKSTART.md` for setup steps
3. See `SUPABASE_SETUP.md` for backend setup
4. Read `IMPLEMENTATION_PLAN.md` for feature guidance

### External Resources:
- [Vite Troubleshooting](https://vitejs.dev/guide/troubleshooting.html)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [React Docs](https://react.dev)

---

## Still Stuck?

If none of these solutions work:

1. **Check browser console** for error messages
2. **Check terminal** for build errors
3. **Try fresh install**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```
4. **Check Node.js version**: `node --version` (need 18+)
5. **Check npm version**: `npm --version` (need 8+)

---

**Last Updated**: February 14, 2026
**Status**: TailwindCSS v4 compatibility fixed ✅
