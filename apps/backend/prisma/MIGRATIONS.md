# Migration Discipline

Prisma migration files are append-only history. Do not delete or edit an applied
migration after it has reached Neon, Render, Vercel preview data, or any shared
environment.

Use this flow for schema changes:

1. Change `schema.prisma`.
2. Create a new migration folder with Prisma or a hand-written SQL migration.
3. Review generated SQL for destructive operations before applying it.
4. Test against a disposable Neon branch when data may be affected.
5. Apply with `pnpm exec prisma migrate deploy`.
6. Verify with `pnpm exec prisma migrate status --schema prisma/schema.prisma`.
7. If production drift exists, fix it with a new repair migration. Do not mark a
   migration as applied unless the matching SQL has truly been applied.

Destructive changes, such as dropping tables, columns, enum values, or foreign
keys, should live in their own cleanup migration after data ownership has been
confirmed.
