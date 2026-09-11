# QuantroBill - Production Deployment, Dynamic API & 3-Tier Isolation Rules

## 1. Golden Architectural Rules for Production Readiness

### Rule 1: Zero Hardcoded URLs or Ports
- **Never** hardcode `http://localhost:5000` or arbitrary IP addresses in client application code.
- Always resolve API base URLs dynamically using the unified environment discovery resolver:
  1. If `import.meta.env.VITE_API_BASE_URL` is set, use it.
  2. If running on a production custom domain or subdomain (e.g., `app.quantrobill.com`, `restaurant.com`), dynamically use the current browser origin (`window.location.origin + '/api'`) or relative `/api`.
  3. Fallback to `http://localhost:5000/api` **only** when running on local development port 5173 / localhost.

### Rule 2: Dynamic Multi-Tenant Subdomain & Domain Resolution
- Tenancy can be identified either via:
  - Custom Subdomain: `[subdomain].quantrobill.com` (extracted via `window.location.hostname.split('.')[0]`).
  - Custom White-label Domain: `billing.myrestaurant.com` (resolved via backend reverse proxy lookup).
  - Explicit Tenant Header: `X-Tenant-Id` attached to every outgoing HTTP & WebSocket request.

### Rule 3: Strict 3-Tier Session & Token Isolation
- To ensure zero session contamination between roles operating on the same machine:
  | Role | Isolated LocalStorage Key | Auth Store | Protected Route Guard |
  |---|---|---|---|
  | **Level 1: SuperAdmin** | `quantrobill_superadmin_token` | `useSuperAdminAuthStore` | `<SuperAdminPrivateRoute>` |
  | **Level 2: Restaurant Owner** | `quantrobill_owner_token` | `useOwnerAuthStore` | `<OwnerPrivateRoute>` |
  | **Level 3: Staff POS & Waiter** | `petbharke_access_token` | `useAuthStore` | `<PrivateRoute>` |
- Logging into the Owner Portal never invalidates an active Cashier session, and SuperAdmin tokens are never sent to tenant-level POS endpoints.

---

## 2. Dynamic API & WebSocket Discovery Pattern

```typescript
// Shared production resolver pattern
export const getBaseApiUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    // Local Vite dev server fallback
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // Production / Staging deployment: use relative /api or same origin
    return `${origin}/api`;
  }
  return '/api';
};

export const getHubUrl = (hubName: string): string => {
  const base = getBaseApiUrl().replace(/\/api$/, '');
  return `${base}/hubs/${hubName}`;
};
```

---

## 3. Deployment Topology & Reverse Proxy (NGINX / Cloudflare)

In production, frontend single-page applications (SPA) and the ASP.NET Core backend run behind a unified reverse proxy:

```nginx
server {
    listen 80;
    server_name *.quantrobill.com app.quantrobill.com;

    # Frontend Static Assets
    location / {
        root /var/www/quantrobill/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Dynamic API Reverse Proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SignalR Realtime WebSocket Proxy
    location /hubs/ {
        proxy_pass http://localhost:5000/hubs/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 4. Checklist Before Production Deployment

- [x] Zero hardcoded `localhost:5000` URLs in production bundles.
- [x] TypeScript compilation passes with strict mode (`tsc -b && vite build` exit code 0).
- [x] Session tokens partitioned across `quantrobill_superadmin_token`, `quantrobill_owner_token`, and `petbharke_access_token`.
- [x] Offline fallback: Waiter app & POS billing queues can operate locally and sync when connection restores.
- [x] Black & White executive design: Lightweight, high-contrast, zero slow render cycles.
