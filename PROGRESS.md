# PROGRESS

Tracking the NestJS → Express 5 + Prisma 7 migration of EDRMS.

| # | Task | Status |
|---|------|--------|
| 1 | Convert NestJS project to Express (skill template) and remove NestJS files | in progress |
| 2 | Re-implement authentication (register + email OTP, login, refresh, forgot/reset/change password, Google ID-token login) | in progress |
| 3 | Redis for OTP storage | scaffolded, verifying |
| 4 | Cloudinary uploads (in-memory Multer) | scaffolded, verifying |
| 5 | Biome formatter + linter | done (config in `biome.json`) |
| 6 | Zod server-side validation (replaces class-validator) | in progress |
| 7 | SuperAdmin role (creates admins, inherits all admin powers) + schema update | schema done, endpoints in progress |
| 8 | Stripe + bKash payments (Strategy + Adapter) | in progress |
| 9 | TypeORM → Prisma | done (schema + migration) |
| 10 | Prisma Postgres cloud database | done (migration `init` applied) |
| 11 | Git: 30+ pushes under the owner's account | in progress |
| 12 | Push 15 Bangladeshi sample records through the endpoints | pending |
| 13 | Vercel deployment branch (`Deployment`) | pending |
| 14 | Swagger docs for every endpoint | in progress |
| 15 | README + draw.io ER diagram | pending |

## Module status

| Module | Mount | Status |
|--------|-------|--------|
| auth | `/api/auth` | scaffolded |
| user | `/api/users` | pending |
| admin (+ super admin) | `/api/admin` | pending |
| disaster | `/api/disasters` | pending |
| shelter | `/api/shelters` | pending |
| reliefOrg | `/api/relief-orgs` | pending |
| missingPerson | `/api/missing-persons` | pending |
| rescueRequest | `/api/rescue-requests` | pending |
| communityPost | `/api/community-posts` | pending |
| donation + payment | `/api/donations`, `/api/payments` | pending |
| volunteer | `/api/volunteers` | pending |
| volunteerNetwork | `/api/volunteers` | pending |
| trash | `/api/trash` | pending |
