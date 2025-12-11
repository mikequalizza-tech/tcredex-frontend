# Code Review Instructions for GitHub Copilot

**Project:** tCredex Platform v1.6  
**Reviewer:** GitHub Copilot Chat

---

## 🧠 Architecture Awareness

- **Framework:** Next.js 15 (App Router)
- **Styling:** TailwindCSS v4 (strict mode)
- **Build system:** pnpm, postcss, Vercel deployment
- **Features:** DealCard viewer, map overlays, dashboards, AI matching

---

## 🧾 Review Goals

### ✅ Tailwind Usage

- Detect any use of unsupported or purged utility classes (e.g., `rounded-lg`, `bg-*`, etc.)
- Confirm Tailwind classes match expected HTML/JSX structure
- Ensure `tailwind.config.js` content paths cover all file types used
- Validate that only Tailwind v4-compatible utilities are used

### ✅ App Router Structure

Validate correct file placement:

- **Pages:** `app/{route}/page.tsx`
- **Layouts:** `app/{route}/layout.tsx`
- **No legacy `pages/` directory** should exist for routes

Ensure:
- Route groups use parentheses: `app/(group)/route/page.tsx`
- Server components are default (no `'use client'` unless necessary)
- Client components are explicitly marked with `'use client'` directive

### ✅ Map Integration Readiness

If Mapbox is imported:

- Confirm access token is **not hardcoded** in components
- Validate layers and event handlers are performant
- Tract overlays must load via GeoJSON or API route
- Check for proper error handling on map load failures
- Ensure map interactions (click/hover) include proper event handling

### ✅ Matching Logic

For Deal ↔ CDE match logic:

- Flag where hard-coded filters exist
- Suggest separating filtering into a shared utility
- Match criteria should use `.includes()` for arrays or use `Set` logic for efficiency
- Validate type safety for match parameters
- Ensure match algorithms are testable and maintainable

### ✅ PostCSS + Tailwind Plugin Check

Validate `postcss.config.js` uses the correct configuration:

```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

**Do NOT use:**
- `tailwindcss: {}` (legacy syntax)
- Any other PostCSS plugins that conflict with Tailwind v4

### ✅ Session-aware Logic

For dashboard pages:

- Ensure `getServerSession()` is used to gate access in Server Components
- Validate route redirects based on `user.character` or role
- Check that protected routes properly redirect unauthenticated users
- Verify session data is properly typed with TypeScript
- Ensure client-side session checks use appropriate hooks

---

## 🛑 What to Flag Immediately

### Critical Issues

1. **Using `tailwindcss: {}` in PostCSS** → Must be `@tailwindcss/postcss: {}`
2. **Misplaced `layout.tsx`** or missing root `app/layout.tsx`
3. **Broken map interactions** (click/hover with no `preventDefault` or proper event handling)
4. **Hard-coded env secrets or API tokens** in any file
5. **Legacy `pages/` directory** being used for routing (should use App Router)
6. **Missing `'use client'` directive** on components using hooks, event handlers, or browser APIs
7. **Server components trying to use client-only features** (useState, useEffect, etc.)
8. **Importing server-only code in client components**

### Security Concerns

- API keys, tokens, or secrets in source code
- Unvalidated user input in database queries
- Missing authentication checks on protected routes
- Exposed environment variables on client side
- SQL injection vulnerabilities
- XSS vulnerabilities in user-generated content

### Performance Issues

- Large bundles due to improper imports (import entire libraries instead of specific functions)
- Missing `loading.tsx` for routes with data fetching
- Blocking operations in Server Components
- Unnecessary client-side JavaScript for static content

---

## 📋 Additional Guidelines

### File Organization

- Components should be in `/components` directory
- Utilities should be in `/utils` or `/lib` directory
- Types should be co-located or in a shared `/types` directory
- API routes should be in `app/api/` directory

### TypeScript

- Prefer explicit types over `any`
- Use interfaces for object shapes
- Use type for unions and primitives
- Ensure proper typing for API responses

### Testing

- Critical business logic should have unit tests
- API routes should have integration tests
- Complex utilities should have test coverage

### Accessibility

- Semantic HTML usage
- ARIA labels where appropriate
- Keyboard navigation support
- Color contrast compliance

---

## 🎯 Review Checklist

When reviewing code, systematically check:

- [ ] Tailwind classes are v4-compatible
- [ ] PostCSS config uses `@tailwindcss/postcss`
- [ ] Files are in correct App Router locations
- [ ] No hardcoded secrets or API tokens
- [ ] Server/Client component boundaries are correct
- [ ] Session checks exist on protected routes
- [ ] Map integrations follow best practices
- [ ] Matching logic is maintainable and testable
- [ ] TypeScript types are properly defined
- [ ] No critical security vulnerabilities

---

## 💡 Best Practices

### Next.js 15 App Router

- Use Server Components by default for better performance
- Only use Client Components when needed (interactivity, browser APIs)
- Leverage `loading.tsx`, `error.tsx`, and `not-found.tsx` for better UX
- Use Route Handlers (`route.ts`) for API endpoints
- Implement proper caching strategies with `revalidate`

### TailwindCSS v4

- Use the new v4 syntax and configuration
- Leverage CSS variables for theme customization
- Use `@tailwindcss/postcss` plugin instead of legacy setup
- Ensure content paths include all relevant file types

### Code Quality

- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper error boundaries
- Implement proper loading states
- Write descriptive commit messages
- Document complex logic with comments

---

**Last Updated:** December 2025  
**Version:** 1.0
