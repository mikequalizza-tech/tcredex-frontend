# Copilot Instructions for tCredex Frontend

## Project Overview

This is the frontend application for **tCredex**, an AI-powered tax credit marketplace that provides deal intelligence for NMTC, LIHTC, HTC, OZ, Brownfield, and more.

**Tech Stack:**
- Framework: Next.js 15.1.6 (App Router)
- Language: TypeScript
- UI Library: React 19
- Styling: Tailwind CSS 4.x
- Additional: MDX for content, AOS for animations

## Project Structure

```
/app                    # Next.js App Router pages and API routes
  /(default)            # Default layout group
  /(auth)               # Authentication pages
  /api                  # API routes
  /css                  # Global styles
  /pricing              # Pricing pages
/components             # React components
  /ui                   # Reusable UI components (header, footer, logo, mobile-menu)
  /mdx                  # MDX-related components
  /*.tsx                # Feature-specific components
/public                 # Static assets
/utils                  # Utility functions
/hooks                  # Custom React hooks
/content                # Content files
```

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Coding Standards

### TypeScript
- **Use TypeScript for all new files** with proper type annotations
- Avoid `any` types - use specific types or `unknown` when necessary
- Define interfaces for component props
- Use TypeScript's strict mode (enabled in tsconfig.json)

### React Components
- **Functional components only** - use React hooks
- **Default exports** for page and component files
- **File naming:** Use PascalCase for components (e.g., `HeroHome.tsx`)
- **Component structure:**
  ```tsx
  export default function ComponentName() {
    return (
      <section>
        {/* Component content */}
      </section>
    );
  }
  ```

### Styling
- **Tailwind CSS is the primary styling solution**
- Use utility classes extensively
- Follow existing patterns for responsive design: `sm:`, `md:` breakpoints
- Common patterns used in this project:
  - Gradient backgrounds: `bg-[linear-gradient(...)]`
  - Border gradients: `before:[border-image:...]`
  - Custom colors from theme: `var(--color-gray-800)`
- **No inline styles** unless absolutely necessary

### Next.js Specifics
- Use `Image` from `next/image` for all images
- Use `Link` from `next/link` for navigation
- Define metadata in page files or layout files
- Use the App Router structure (not Pages Router)
- Path aliases: Use `@/` prefix for imports (e.g., `@/components/ui/header`)

### Code Organization
- Keep components focused and single-purpose
- Extract reusable UI components to `/components/ui`
- Co-locate related files when appropriate
- Use barrel exports (index files) sparingly

### ESLint Configuration
- The project uses `eslint-config-next`
- `react/no-unescaped-entities` is disabled
- Always run `npm run lint` before committing

## Testing Guidelines

- Currently, no test infrastructure exists in this project
- When adding tests, use Jest and React Testing Library (Next.js defaults)
- Focus on integration tests over unit tests for React components

## Common Tasks

### Adding a New Page
1. Create a new directory under `/app` with appropriate route name
2. Add `page.tsx` with default export
3. Add `layout.tsx` if needed for shared layout
4. Define metadata for SEO

### Adding a New Component
1. Create file in `/components` with PascalCase name
2. Use TypeScript with proper prop types
3. Follow existing styling patterns
4. Use `Image` and `Link` from Next.js when needed

### Modifying Styles
1. Use Tailwind utility classes
2. Check `tailwind.config.ts` for custom configuration
3. Global styles are in `/app/css/style.css`
4. Maintain responsive design patterns

### Working with MDX
1. MDX files are supported for content
2. MDX utilities are in `/components/mdx`
3. Use `@next/mdx` for processing

## Important Considerations

### Performance
- Always use Next.js `Image` component for images (automatic optimization)
- Lazy load components when appropriate
- Keep client-side JavaScript minimal

### Accessibility
- Use semantic HTML elements
- Include `aria-hidden="true"` for decorative elements
- Provide alt text for all images
- Ensure keyboard navigation works

### SEO
- Define metadata in each page
- Use proper heading hierarchy (h1, h2, h3)
- Implement structured data when relevant

## Dependencies
- Avoid adding new dependencies without strong justification
- Check for security vulnerabilities before adding packages
- Prefer well-maintained packages with active communities
- Use the same package manager (npm) consistently

## Git Workflow
- Write clear, descriptive commit messages
- Keep commits focused and atomic
- Test builds locally before pushing
- Run linter before committing

## Known Project Patterns

### Animation
- Uses AOS (Animate On Scroll) library for scroll animations
- Common classes: `aos-init`, `aos-animate`, `animate-[gradient_6s_linear_infinite]`

### Images
- Images stored in `/public/images`
- Import images as modules: `import Logo from "@/public/images/logo.svg"`
- Use Next.js Image component with proper width/height

### Layout Patterns
- Common layout: `<section>` with `<div className="mx-auto max-w-6xl px-4 sm:px-6">`
- Blurred shapes used as decorative background elements
- Border styling with gradient effects

## Contact & Resources
- Repository: https://github.com/mikequalizza-tech/tcredex-frontend
- Next.js Documentation: https://nextjs.org/docs
- Tailwind CSS Documentation: https://tailwindcss.com/docs
