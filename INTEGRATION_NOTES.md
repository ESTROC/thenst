# NST Learn Integration — Complete Unified Auth Flow

## Architecture

NST Learn has been fully integrated into thenst-main as a **single, unified platform** with:

- **One Firebase project**: `thenst` (nst-learn's separate `nst-learn` project is no longer used)
- **One auth system**: thenst-main's auth context (lib/auth-context) flows through an adapter
- **One deployment**: Single Next.js app, single codebase, single auth database

## Auth Flow — How It Works

### 1. User Logs In at thenst.co
- Uses `/login` or `/register` (main site)
- Creates auth session in thenst Firebase project
- User authenticated in `lib/auth-context` (parent RootLayout)

### 2. User Clicks "NST Learn" or Navigates to /learn
- `app/learn/layout.tsx` wraps all routes with `RouteGuard`
- RouteGuard checks: "Is user authenticated?"
- If YES → Allow access, render NST Learn pages
- If NO → Redirect to `/login?redirect=/learn`

### 3. After Login, User Returns to /learn
- Login redirect param sends user back
- RouteGuard sees user is authenticated
- NST Learn dashboard loads (no second login needed)

### 4. In NST Learn Pages
- Components call `useAuth()` from `context/AuthContext` (the adapter)
- Adapter reads from thenst-main's `lib/auth-context`
- **User is already logged in — no separate NST Learn login**

### 5. User Logs Out
- Clicks "Logout" in Header or Sidebar
- Logs out from thenst-main's auth system
- Subsequent navigation to `/learn` triggers redirect to `/login?redirect=/learn`

## ✅ NST Learn Has NO Separate Login

✅ NST Learn has NO login form
✅ NST Learn has NO separate auth database
✅ All authentication happens on the main site
✅ NST Learn pages are protected by RouteGuard
✅ Once logged in on main site, user is automatically in NST Learn
✅ Logout button shows only when authenticated (always)

## Route Protection

**All /learn routes (except /learn/login):**
- Protected by `RouteGuard` in `app/learn/layout.tsx`
- Unauthenticated → redirect to `/login?redirect=/learn`
- Authenticated → access granted

**All /learn/admin routes:**
- Protected by role check in `app/learn/admin/layout.tsx`
- Requires `user.role === "admin"` (thenst-main admin/superadmin)
- Non-admin → redirect to `/learn/admin/login` → `/login?redirect=/learn/admin`

## Role Mapping

| thenst-main | NST Learn |
|---|---|
| `admin` | `admin` |
| `superadmin` | `admin` |
| `guard`, `hr`, `intern`, etc. | `student` |

## User Experience

### Logged-Out User Clicks "NST Learn"
1. Not logged in, clicks button → goes to `/learn`
2. RouteGuard redirects to `/login?redirect=/learn`
3. Signs up/logs in
4. Redirected back to `/learn`
5. Dashboard loads (no second login)

### Logged-In User Clicks "NST Learn"
1. Already logged in
2. Clicks button → goes to `/learn`
3. RouteGuard sees auth → allows access
4. Dashboard loads immediately

### User Logs Out
1. Clicks "Logout" in NST Learn UI
2. Logs out from thenst-main's auth
3. Next visit to `/learn` → redirected to login

## Deployment

```bash
npm install
npm run build
npm start
# or
vercel --prod
```

No new environment variables needed.

## One-Time Setup

If migrating courses from old nst-learn Firebase:

1. Export `courses` collection from old project
2. Export `enrollments` collection from old project
3. Import both into `thenst` Firestore
4. Deploy Firestore rules: `firebase deploy --only firestore:rules`
5. Delete old nst-learn Firebase project

## Testing

### Test 1: Unauthenticated Access
- Go to `/learn` without logging in
- Should redirect to `/login?redirect=/learn` ✅

### Test 2: Authenticated Access
- Log in at `/login`
- Go to `/learn`
- Should load dashboard (same user as main site) ✅

### Test 3: Logout
- In NST Learn, click logout
- Go back to `/learn`
- Should redirect to login ✅

### Test 4: Admin Access
- Log in as admin
- Go to `/learn/admin`
- Should load admin dashboard ✅

## Key Files Changed

| File | Change |
|---|---|
| `app/learn/layout.tsx` | Added RouteGuard + AuthProvider adapter |
| `components/learn/route-guard.tsx` | NEW: Protects routes, redirects if not auth'd |
| `components/learn/layout/Header.tsx` | UPDATED: User profile menu + logout (no sign-in) |
| `components/learn/layout/Sidebar.tsx` | UPDATED: Removed sign-in button |
| `context/AuthContext.tsx` | Adapter from thenst-main auth → NST Learn shape |
| `firestore.rules` | Added courses + enrollments collection rules |

## Troubleshooting

**Q: Still seeing sign-in button in NST Learn?**
A: Verify `app/learn/layout.tsx` has RouteGuard wrapping children.

**Q: User logged in on main site but redirected to login in /learn?**
A: Check `context/AuthContext.tsx` is importing from `lib/auth-context` correctly.

**Q: Courses not loading?**
A: Run `firebase deploy --only firestore:rules`. Verify `courses` collection exists in thenst Firestore.

**Q: Admin access not working?**
A: Verify user's role is "admin" or "superadmin" in thenst Firestore. Check role mapping in adapter.

---

**Status:** ✅ Integration complete — Single unified auth system
