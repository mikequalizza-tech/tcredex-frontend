# Backend Integration Guide

This guide explains how the tCredex frontend integrates with the tCredex backend API and how to set up and test the integration.

## Architecture Overview

The tCredex application follows a **frontend-backend separation** pattern:

- **Frontend (Next.js)**: Handles UI, authentication, and API route endpoints
- **Backend (Go/Python)**: Handles business logic, automatch, scoring, compliance checks

```
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│  Next.js        │ ──────► │  Backend API     │
│  Frontend       │         │  (Port 8080)     │
│  (Port 3000)    │ ◄────── │                  │
│                 │         │                  │
└─────────────────┘         └──────────────────┘
        │                            │
        │                            │
        ▼                            ▼
┌─────────────────────────────────────────────┐
│                                             │
│          Supabase Database                  │
│                                             │
└─────────────────────────────────────────────┘
```

## Backend API Requirements

### 1. Backend URL Configuration

The backend must be accessible at the URL specified in `NEXT_PUBLIC_API_URL`:

**Development:**
```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080
```

**Production:**
```bash
NEXT_PUBLIC_API_URL=https://api.tcredex.com
```

### 2. CORS Configuration

The backend must allow cross-origin requests from the frontend domain.

**Required CORS Headers:**

```
Access-Control-Allow-Origin: http://localhost:3000  (development)
Access-Control-Allow-Origin: https://tcredex.com    (production)
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, Accept
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

**Example Go Configuration (using gin):**

```go
import "github.com/gin-contrib/cors"

func main() {
    r := gin.Default()
    
    // CORS middleware
    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:3000", "https://tcredex.com"},
        AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Content-Type", "Authorization", "Accept"},
        AllowCredentials: true,
        MaxAge:           86400,
    }))
    
    // Routes...
}
```

**Example Python Configuration (using FastAPI):**

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://tcredex.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Required API Endpoints

The frontend expects the following backend API endpoints:

#### Health Check
- `GET /health` - Basic health check
- `GET /api/health` - API health with version info

#### Automatch & Scoring
- `POST /api/automatch` - Run automatch for a deal
- `POST /api/scoring/tract` - Score a census tract
- `GET /api/scoring` - Get scoring configuration

#### Deals
- `GET /api/deals` - List all deals
- `GET /api/deals?visible=true` - List visible deals only
- `GET /api/deals/:id` - Get deal details
- `POST /api/deals` - Create new deal
- `PUT /api/deals/:id` - Update deal

#### CDEs
- `GET /api/cdes` - List all CDEs
- `GET /api/cdes/:id` - Get CDE details

#### Investors
- `GET /api/investors` - List all investors

#### Documents
- `POST /api/documents/pdf` - Generate PDF
- `POST /api/documents/analyze` - Analyze document

#### Compliance
- `POST /api/compliance/check` - Run compliance checks

## Testing the Integration

### 1. Start the Backend

First, ensure the backend is running on port 8080:

```bash
# In the tcredex-backend repository
go run main.go
# or
python -m uvicorn main:app --host 127.0.0.1 --port 8080
```

Verify it's running:
```bash
curl http://127.0.0.1:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-24T01:00:00Z"
}
```

### 2. Start the Frontend

```bash
# In the tcredex-frontend repository
pnpm dev
```

The dev server should start on port 3000.

### 3. Test API Connectivity

Open the browser console on `http://localhost:3000` and run:

```javascript
// Test backend connectivity
fetch('http://127.0.0.1:8080/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

If you see CORS errors, the backend CORS configuration needs to be updated.

### 4. Test Deals API

Navigate to `/deals` page and check the browser console. You should see:
- No CORS errors
- Successful API calls to the backend
- Deals loading properly

### 5. Test Automatch

1. Navigate to `/dashboard/automatch`
2. Enter a deal ID
3. Click "Run Automatch"
4. Check browser console for API calls to `/api/automatch`

## Common Integration Issues

### Issue 1: ECONNREFUSED 127.0.0.1:8080

**Symptom:** Frontend can't connect to backend

**Causes:**
- Backend is not running
- Backend is running on different port
- Firewall blocking connection

**Solutions:**
1. Verify backend is running: `curl http://127.0.0.1:8080/health`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Ensure no firewall rules blocking port 8080

### Issue 2: CORS Errors

**Symptom:** Browser shows CORS policy error

```
Access to fetch at 'http://127.0.0.1:8080/api/deals' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solutions:**
1. Add CORS middleware to backend (see examples above)
2. Ensure `Access-Control-Allow-Origin` includes `http://localhost:3000`
3. Ensure `Access-Control-Allow-Credentials` is `true`
4. Handle preflight OPTIONS requests

### Issue 3: API Route Mismatch

**Symptom:** 404 errors when calling backend endpoints

**Solutions:**
1. Check backend route definitions match frontend expectations
2. Verify API versioning (e.g., `/api/v1/deals` vs `/api/deals`)
3. Check HTTP methods (GET, POST, etc.)

### Issue 4: Authentication Issues

**Symptom:** 401 Unauthorized errors

**Solutions:**
1. Ensure Supabase auth is working
2. Check session cookies are being sent
3. Verify backend can validate Supabase JWT tokens
4. Check `Authorization` header format

## API Client Usage

The frontend uses a centralized API client in `lib/api/client.ts`:

```typescript
import { backendApi } from '@/lib/api/client';

// Example: Run automatch
const result = await backendApi.runAutomatch(dealId);

// Example: Score a tract
const score = await backendApi.scoreTract(geoid);

// Example: Check health
const health = await backendApi.healthCheck();
```

## Environment Variables

The following environment variables control backend integration:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080

# Supabase (shared with backend for auth validation)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Deployment Considerations

### Development
- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:8080`
- CORS: Allow `localhost:3000`

### Staging
- Frontend: `https://staging.tcredex.com`
- Backend: `https://api-staging.tcredex.com`
- CORS: Allow `staging.tcredex.com`

### Production
- Frontend: `https://tcredex.com`
- Backend: `https://api.tcredex.com`
- CORS: Allow `tcredex.com`
- Use HTTPS for all communication
- Implement rate limiting
- Add API authentication

## Monitoring

Monitor the following for integration health:

1. **API Response Times**: Track latency of backend calls
2. **Error Rates**: Monitor 4xx and 5xx responses
3. **CORS Errors**: Check browser console for CORS issues
4. **Connection Failures**: Monitor ECONNREFUSED errors

## Security Checklist

- [ ] Backend uses HTTPS in production
- [ ] CORS is restricted to known origins
- [ ] API keys are not exposed in client code
- [ ] Authentication tokens are validated on backend
- [ ] Rate limiting is implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection

## Getting Help

If you encounter integration issues:

1. Check the browser console for errors
2. Check the backend logs for request errors
3. Verify CORS configuration
4. Test with `curl` to isolate frontend vs backend issues
5. Review the [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
