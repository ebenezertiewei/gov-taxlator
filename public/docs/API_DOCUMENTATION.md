# TAXLATOR BACKEND API DOCUMENTATION

This document contains all available backend API endpoints for the Taxlator project.

## BASE URL
https://gov-taxlator-api.onrender.com

## API DOCUMENTATION
https://gov-taxlator-api.onrender.com/docs/API_DOCUMENTATION.pdf

---

## HEALTH CHECK 🩺
Used to confirm that the backend service is running.

| Method | Endpoint | Description |
|--------|---------|------------|
| GET    | /health | Confirms the API is live |

---

## AUTHENTICATION ENDPOINTS 🔐

### SIGNUP
Register a new user.

| Method | Endpoint | Description |
|--------|---------|------------|
| POST   | /api/auth/signup | Create a new user |

### SIGNIN
Authenticate an existing user and return a JWT.

| Method | Endpoint | Description |
|--------|---------|------------|
| POST   | /api/auth/signin | Signin an existing user |

### SEND VERIFICATION CODE
| Method | Endpoint | Description |
|--------|---------|------------|
| POST   | /api/auth/sendVerificationCode | Send verification code |

### SIGNOUT
| Method | Endpoint | Description |
|--------|---------|------------|
| GET/POST | /api/auth/signout | Signout user |

---

## CALCULATION ENDPOINTS 💰

### TAX
| Method | Endpoint | Description |
|--------|---------|------------|
| POST   | /api/tax/calculate | Calculator endpoint |

### VAT
| Method | Endpoint | Description |
|--------|---------|------------|
| POST   | /api/vat/calculate | Calculator endpoint |

---

## STATUS CODES ⚠

- `400` – Bad request / validation error  
- `401` – Unauthorized / invalid token  
- `404` – Resource not found  
- `500` – Server error