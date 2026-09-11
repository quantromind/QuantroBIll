# QuantroBill Agent Rules: Production Readiness & Dynamic URLs

1. **No Hardcoded URLs**: Never hardcode `http://localhost:5000` or specific IP addresses in frontend code. Always use dynamic base URL resolution functions (`getBaseApiUrl()`, `getHubUrl()`) with `import.meta.env.VITE_API_BASE_URL` override support.
2. **3-Tier Role Isolation**:
   - SuperAdmin: token `quantrobill_superadmin_token`, store `useSuperAdminAuthStore`, path `/superadmin/*`.
   - Restaurant Owner/Admin: token `quantrobill_owner_token`, store `useOwnerAuthStore`, path `/owner/*`.
   - POS Staff / Cashier / Waiter: token `petbharke_access_token`, store `useAuthStore`, path `/billing`, `/tables`, `/kds`, mobile app.
3. **Black & White Aesthetics for Owner Portal**: Maintain clean, high-contrast monochrome design (Black, White, Slate) for Level 2 Owner Dashboard and sub-modules as requested by the user.
4. **TypeScript Strictness**: Always remove unused imports and variables before committing to satisfy strict `tsc -b` rules.
