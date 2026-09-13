# QuantroBill POS — Setup Guide

This document covers everything needed to deploy and configure QuantroBill POS from scratch.

---

## Prerequisites

| Component | Version | Purpose |
|-----------|---------|---------|
| .NET SDK | 8.0+ | Backend API |
| Node.js | 18+ | Frontend & mobile |
| MongoDB Atlas | (or local) | Database |
| npm | 9+ | Package management |

---

## 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd QuantroBIll

# Backend
cd src/PetBharke.API
dotnet restore

# Frontend
cd ../../client
npm install

# (Optional) Waiter mobile
cd ../waiter-mobile
npm install
```

---

## 2. Environment Variables & Secrets

### Required Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `MongoDB:ConnectionString` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/QuantroBill?retryWrites=true&w=majority` |
| `Jwt:Key` | JWT signing key (min 32 chars, random) | `YourSuperSecretKeyAtLeast32CharsLong!` |
| `Jwt:Issuer` | JWT issuer identifier | `QuantroBill` |
| `Jwt:Audience` | JWT audience identifier | `QuantroBillUsers` |
| `AllowedOrigins` | Comma-separated allowed CORS origins | `http://localhost:5173,https://yourdomain.com` |

### Local Development (Recommended: dotnet user-secrets)

```bash
cd src/PetBharke.API

# Initialize (already done if you see a UserSecretsId in .csproj)
dotnet user-secrets init

# Set secrets
dotnet user-secrets set "MongoDB:ConnectionString" "mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/QuantroBill?retryWrites=true&w=majority"
dotnet user-secrets set "Jwt:Key" "YOUR_RANDOM_SECRET_KEY_AT_LEAST_32_CHARS"
```

### Docker / Production

Copy `.env.example` to `.env` at the project root and fill in values:

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

Or use your cloud provider's secrets manager (AWS Secrets Manager, Azure Key Vault, etc.).

> **⚠️ NEVER commit `.env` files with real credentials to version control.**

---

## 3. MongoDB Atlas Setup

1. **Create a free cluster** at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Create a database user** with read/write permissions.
3. **Whitelist your IP** under Network Access → IP Access List.
   - For development: add your current IP.
   - For production: add your server's static IP, or `0.0.0.0/0` (less secure).
4. **Get the connection string** from the cluster's "Connect" → "Connect your application" → "Driver: C# / .NET".
5. Replace `<password>` with the database user's password.

---

## 4. First Run

### Backend

```bash
cd src/PetBharke.API
dotnet run
```

On first launch, the `DbSeeder` will:
- Create the MongoDB database and collections.
- Seed a **SuperAdmin** account with default credentials:
  - **Email:** `superadmin@quantrobill.com`
  - **Password:** `Admin@123`
  - **⚠️ MustChangePassword:** The SuperAdmin is flagged to force a password change on first login. Change it immediately.

### Frontend

```bash
cd client
npm run dev
```

The Vite dev server starts at `http://localhost:5173`.

### Swagger (Development Only)

API documentation is available at `http://localhost:5000/swagger` when running in the `Development` environment.

---

## 5. First Login & Password Rotation

1. Open the frontend at `http://localhost:5173`.
2. Log in with `superadmin@quantrobill.com` / `Admin@123`.
3. The API will return `mustChangePassword: true` — the frontend should redirect you to change your password.
4. Set a **strong, unique password** immediately.

---

## 6. Rotate JWT Signing Key

Generate a cryptographically random key:

```bash
# PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object { [byte](Get-Random -Max 256) }))

# Linux / macOS
openssl rand -base64 48
```

Set it via user-secrets or environment variable as described in Section 2.

---

## 7. Onboarding a New Restaurant (Tenant)

Currently, tenant provisioning is done through the SuperAdmin portal UI (being built), or can be done via the API:

1. **Log in as SuperAdmin** and navigate to Tenant Management.
2. **Create a new Tenant** with restaurant name and configuration.
3. **Create the Owner user** for that tenant.
4. The Owner can then:
   - Set up their menu (Categories → Items).
   - Configure tables and floor plan.
   - Add staff users (Managers, Cashiers, Waiters).
   - Configure billing, KDS, and receipt settings.

---

## 8. Running with Docker

```bash
# Build and run
docker-compose up --build

# With .env file for secrets
docker-compose --env-file .env up --build
```

---

## 9. Project Structure

```
QuantroBIll/
├── src/
│   ├── PetBharke.API/           # ASP.NET Core Web API
│   ├── PetBharke.Application/   # Business logic, DTOs, interfaces
│   ├── PetBharke.Domain/        # Entity models
│   └── PetBharke.Infrastructure/# MongoDB, services, seeding
├── client/                      # React 19 + Vite + Zustand frontend
├── desktop-electron/            # Electron wrapper for desktop POS
├── waiter-mobile/               # React Native / Expo mobile app
├── tests/                       # Integration tests
└── docs/                        # Architecture documentation
```

---

## 10. Troubleshooting

| Problem | Solution |
|---------|----------|
| `MongoDB connection failed` | Check Atlas IP whitelist and connection string |
| `JWT validation failed` | Ensure `Jwt:Key` is set and matches between API starts |
| `CORS errors in browser` | Add your frontend URL to `AllowedOrigins` in config |
| `Swagger not loading` | Only available in `Development` environment |
| `SuperAdmin can't log in` | Run the API once to trigger `DbSeeder`, then use `Admin@123` |
