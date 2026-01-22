# tCredex Authentication & Onboarding API Reference

## Endpoints

### POST /api/auth/register
**Description:** Canonical registration endpoint for all new users and organizations.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "string",
  "name": "Full Name",
  "organizationName": "Org Name",
  "role": "sponsor" | "cde" | "investor"
}
```

**Success Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Full Name",
    "role": "ORG_ADMIN",
    "organizationId": "uuid",
    "organizationType": "sponsor" | "cde" | "investor",
    "entityId": "uuid"
  }
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Optional details"
}
```

---

### POST /api/auth/signup
**Description:** Delegates to /api/auth/register. Accepts the same payload and returns the same response.

---

### POST /api/onboarding
**Description:** Delegates to /api/auth/register. Accepts the same payload and returns the same response.

---

## Notes
- All endpoints expect and return JSON.
- All errors are returned with HTTP 400 or 500 and a JSON error message.
- Organization and role assignment is unified and validated in the backend.
- Use only the documented fields; extra fields are ignored.

---

For more details, see the implementation in `/app/api/auth/register/route.ts`.
