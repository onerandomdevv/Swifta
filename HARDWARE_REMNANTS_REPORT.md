# HARDWARE_REMNANTS_REPORT.md

This report identifies all remnants of the old "hardware/construction-only" branding and B2B-specific infrastructure within the codebase.

| File Path | Line Number | Exact Text Found | Context | Action Needed |
|-----------|-------------|------------------|---------|---------------|
| `package.json` | 2 | `"name": "hardware-os"` | Root package name | RENAME |
| `DEPLOYMENT.md` | 3 | `SwiftTrade Backend` | Deployment guide header | UPDATE TEXT |
| `DEPLOYMENT.md` | 18 | `hardware-os-cache` | Redis instance name suggestion | RENAME |
| `DEPLOYMENT.md` | 27 | `hardware-os` repository | GitHub repo link text | UPDATE TEXT |
| `DEPLOYMENT.md` | 29 | `hardware-os-backend` | Render service name suggestion | RENAME |
| `DEPLOYMENT.md` | 58 | `admin@swifttrade.ng` | Default bootstrap email | UPDATE TEXT (to swifta.ng) |
| `DEPLOYMENT.md` | 102 | `hardware-os-backend.onrender.com` | Example backend URL | RENAME |
| `DEPLOYMENT.md` | 112 | `hardware-os.vercel.app` | Example frontend URL | RENAME |
| `DEPLOYMENT.md` | 118 | `SwiftTrade is now fully live` | Success message | UPDATE TEXT |
| `docker-compose.yml` | 9 | `POSTGRES_DB: hardware_os` | Database name | RENAME |
| `apps/backend/package.json` | 2 | `"name": "@swifta/backend"` | Backend package name | RENAME |
| `apps/backend/package.json` | 3 | `"description": "HARDWARE OS Backend"` | Package description | UPDATE TEXT |
| `apps/web/package.json` | 2 | `"name": "@swifta/web"` | Web package name | RENAME |
| `packages/shared/package.json` | 2 | `"name": "@swifta/shared"` | Shared package name | RENAME |
| `packages/shared/README.md` | 1 | `# @swifta/shared (SwiftTrade)` | README header | UPDATE TEXT |
| `packages/shared/README.md` | 95 | `@swifta/shared` | Build command filter | RENAME |
| `apps/backend/src/prisma/schema.prisma` | 128 | `quoteId String? @unique @map("quote_id")` | Remnant of removed Quote system | DELETE (Check if used for legacy) |
| `apps/backend/src/prisma/seed.ts` | 10 | `const LEGACY_ADMIN_EMAIL = "admin@swifttrade.ng";` | Seed email constant | UPDATE TEXT |
| `apps/backend/src/prisma/seed.ts` | 73 | `firstName: "HARDWARE"` | Bootstrap admin first name | UPDATE TEXT |
| `apps/backend/src/prisma/seed.ts` | 112 | `name: "Building Materials"` | General category | KEEP |
| `apps/backend/src/prisma/seed.ts` | 268 | `Seed Sample Building Materials Catalogue` | Seeding comment | UPDATE TEXT |
| `apps/backend/src/prisma/seed.ts` | 270 | `merchant@demo.swifttrade.ng` | Demo merchant email | UPDATE TEXT |
| `apps/backend/src/prisma/seed.ts` | 289 | `businessName: "Demo Building Materials Ltd"` | Demo merchant name | UPDATE TEXT |
| `apps/backend/src/prisma/seed.ts` | 400 | `demo-building-${baseNameSlug}` | Product code prefix | RENAME |
| `apps/web/src/lib/api/location.api.ts` | 20 | `'User-Agent': 'HardwareOS/1.0'` | API User-Agent header | UPDATE TEXT |
| `apps/web/src/components/shared/product-detail-view.tsx` | 437 | `hardware supply designed for heavy-duty construction` | Default product description | UPDATE TEXT |
| `README.md` | 1 | `SwiftTrade (Hardware OS)` | Root README header | UPDATE TEXT |
| `README.md` | 11 | `purpose-built trade infrastructure... Lagos hardware market` | Project description | UPDATE TEXT |
| `apps/web/src/components/layout/notification-center.tsx` | 72 | `real-time B2B trade alerts` | Notification description | UPDATE TEXT |
| `apps/web/src/app/(dashboard)/buyer/orders/[id]/receipt/page.tsx` | 133 | `Digital Trade Infrastructure` | Receipt footer text | UPDATE TEXT |
| `apps/web/src/app/(auth)/admin/login/page.tsx` | 88 | `alt="Construction materials logistics"` | Login page image alt text | UPDATE TEXT |
| `apps/web/src/app/(auth)/register/page.tsx` | 230 | `alt="Construction materials"` | Register page image alt text | UPDATE TEXT |
| `apps/backend/src/modules/whatsapp/whatsapp.constants.ts` | (Multiple) | `SwiftTrade` | WhatsApp bot constants | UPDATE TEXT |
| `apps/backend/src/modules/trade-financing/bnpl-partner.interface.ts` | (Multiple) | `SwiftTrade` | Trade financing interfaces | UPDATE TEXT |

## Detailed Findings

### Package Namspacing
The entire monorepo uses the `@swifta/` scope. This includes:
- `@swifta/backend`
- `@swifta/web`
- `@swifta/shared`
**Action: RENAME** to `@swifta/` or similar.

### Database Remnants
The `Order` model in `schema.prisma` still contains `quote_id`. Since the RFQ/Quote system has been phased out for the B2C marketplace, this field is no longer populated by current flows.
**Action: MIGRATION NEEDED** (eventual removal).

### Seed Data
The `seed.ts` file is heavily themed around "Building Materials" for demonstration. While these are legitimate product categories, the demo merchant and admin user names/emails should reflect the new "Swifta" branding.
**Action: UPDATE TEXT**

### Documentation
`DEPLOYMENT.md`, `DESIGN.md`, and all `README.md` files contain multiple references to "SwiftTrade" and "Hardware OS".
**Action: UPDATE TEXT** (Global search and replace recommended for documentation).

### Infrastructure
- `docker-compose.yml` uses `hardware_os` as the database name.
- Deployment instructions for Render/Vercel suggest `hardware-os-backend` and `hardware-os` respectively.
**Action: RENAME**
