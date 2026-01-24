# Environment Configuration Guide

This document explains how to configure environment variables for the tCredex frontend application.

## Required Environment Variables

### Supabase (Required)

The application uses Supabase for authentication and database access.

```bash
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important**: 
- The Supabase URL must start with `https://`
- The anon key is safe to expose in client-side code
- Never commit the service role key to the frontend repository (it belongs in the backend)

### Backend API (Optional)

The frontend communicates with the tCredex backend API.

```bash
# Development (default if not set)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080

# Production
NEXT_PUBLIC_API_URL=https://api.tcredex.com
```

**Default**: If not set, defaults to `http://localhost:8080`

## Optional Environment Variables

### Maps & Location

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your-google-places-key
```

### LiveKit (Video/Audio)

```bash
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-cloud-url
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

### File Uploads (UploadThing)

```bash
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_TOKEN=...
```

### Email (Resend)

```bash
RESEND_API_KEY=re_...
```

### AI Services

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Other Configuration

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/tcredex
```

## Setup Instructions

### 1. Copy the Example File

```bash
cp .env.example .env.local
```

### 2. Fill in Required Values

At minimum, you need:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Verify Configuration

The application will validate environment variables on startup. If required variables are missing, you'll see an error message in the console.

## Environment Variable Validation

The application includes automatic validation of environment variables at startup. This is handled by `lib/config/env-validation.ts`.

### Validation Rules

1. **Required Variables**: Must be present or the application will throw an error
2. **Optional Variables**: Will show a warning if missing but won't prevent startup
3. **Format Validation**: Some variables (like NEXT_PUBLIC_SUPABASE_URL) have format requirements

### Example Validation Output

**Success:**
```
✅ Environment variables validated successfully
```

**Missing Required Variables:**
```
❌ Environment variable validation failed:
  - Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL (Supabase project URL)
  - NEXT_PUBLIC_SUPABASE_URL must start with https://
```

**Missing Optional Variables:**
```
⚠️  Environment variable warnings:
  - Missing optional environment variable: NEXT_PUBLIC_API_URL (Backend API URL (defaults to http://localhost:8080))
```

## Common Issues

### Backend Connection Refused

**Error**: `ECONNREFUSED 127.0.0.1:8080`

**Solution**: 
- Ensure the backend API is running on port 8080
- Check that `NEXT_PUBLIC_API_URL` is set correctly
- During development, the backend must be started separately

### Invalid Supabase URL

**Error**: `NEXT_PUBLIC_SUPABASE_URL must start with https://`

**Solution**: 
- Ensure your Supabase URL starts with `https://`
- Check for typos in the URL

### Environment Variables Not Updating

**Solution**:
- Restart the Next.js dev server after changing `.env.local`
- Clear the `.next` cache: `rm -rf .next`
- Ensure you're editing `.env.local` not `.env.example`

## Production Deployment

### Vercel

1. Set environment variables in the Vercel dashboard
2. Ensure all `NEXT_PUBLIC_*` variables are set
3. Set `NEXT_PUBLIC_API_URL` to your production backend URL

### Other Platforms

Consult your platform's documentation for setting environment variables. Ensure all required variables are set before deployment.

## Security Best Practices

1. ✅ **DO** use `.env.local` for local development
2. ✅ **DO** add `.env.local` to `.gitignore` (already done)
3. ✅ **DO** use `NEXT_PUBLIC_*` prefix for client-side variables
4. ❌ **DON'T** commit `.env.local` to git
5. ❌ **DON'T** use the Supabase service role key in the frontend
6. ❌ **DON'T** expose secret API keys in client-side code

## Getting Help

If you encounter issues with environment configuration:

1. Check the console for validation errors
2. Verify all required variables are set
3. Ensure the backend API is running and accessible
4. Check the [Development Guide](./DEVELOPMENT.md) for more information
