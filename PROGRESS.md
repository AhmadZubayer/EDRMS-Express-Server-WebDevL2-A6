# PROGRESS

Tracking the migration of EDRMS to Express 5 + Prisma 7.

| # | Task | Status |
|---|------|--------|
| 1 | Convert the project to Express (skill template) and remove the old framework files | done |
| 2 | Authentication: register with email OTP, verify, login, refresh, forgot/reset/change password, Google ID-token login | done |
| 3 | Redis for OTP storage | done |
| 4 | Cloudinary uploads (in-memory Multer) | done, verified with a live upload |
| 5 | Biome formatter and linter | done |
| 6 | Zod server-side validation on every route | done |
| 7 | SuperAdmin role (creates admins, inherits every admin power) and schema update | done |
| 8 | Stripe and bKash payments (Strategy + Adapter) | done, checkout creation verified for both |
| 9 | Previous ORM replaced with Prisma | done |
| 10 | Prisma Postgres cloud database | done, `init` migration applied |
| 11 | Git: 30+ pushes under the owner's account | done (60+ commits) |
| 12 | 15 Bangladeshi sample records per entity through the endpoints | done |
| 13 | Vercel deployment branch `Deployment` | see git branches |
| 14 | Swagger docs for every endpoint | done |
| 15 | README and draw.io ER diagram | done |

## Modules

| Module | Mount | Status |
|--------|-------|--------|
| auth | `/api/auth` | done |
| user | `/api/users` | done |
| admin (+ super admin) | `/api/admin` | done |
| disaster | `/api/disasters` | done |
| shelter | `/api/shelters` | done |
| reliefOrg | `/api/relief-orgs` | done |
| missingPerson | `/api/missing-persons` | done |
| rescueRequest | `/api/rescue-requests` | done |
| communityPost | `/api/community-posts` | done |
| donation + payment | `/api/donations`, `/api/payments` | done |
| volunteer | `/api/volunteers` | done |
| volunteerNetwork | `/api/volunteers` | done |
| trash | `/api/trash` | done |

## Notes

- Free-tier database: only light smoke checks were run, no load testing.
- Stripe webhook needs `STRIPE_WEBHOOK_SECRET` from `stripe listen`; bKash uses the sandbox credentials.
