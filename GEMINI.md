# GIT WORKFLOW — RULES

You must follow these rules exactly when committing and pushing code changes to the HARDWARE OS repository. No exceptions.

---

## BRANCH STRUCTURE

```
main              ← Production. NEVER push here directly.
  │
  └── dev         ← Integration branch. All features merge here via PR.
       │
       └── feature/*   ← Your working branches. Push freely here.
```

- **main**: Fully protected. Only receives merges from dev via PR with 1 approval.
- **dev**: Protected. Only receives merges from feature branches via PR with 1 approval.
- **feature/\***: Your working branches. You push directly to these.

---

## BEFORE MAKING ANY CHANGES

Always start from the latest dev:

```bash
git checkout dev
git pull origin dev
```

Then create a feature branch:

```bash
git checkout -b feature/<module>-<short-description>
```

---

## BRANCH NAMING

Pattern: `<type>/<module>-<short-description>`

Types:
- `feature/` — New functionality
- `fix/` — Bug fixes
- `hotfix/` — Urgent production fixes (rare, PR directly to main)

Rules:
- All lowercase
- Use hyphens (not underscores or spaces)
- Always include the module name
- Keep it short but descriptive

Examples:
```
feature/auth-register-login
feature/auth-jwt-refresh
feature/order-state-machine
feature/payment-paystack-webhook
fix/payment-duplicate-webhook
fix/order-invalid-transition
```

---

## COMMIT MESSAGE FORMAT

Every commit must follow Conventional Commits:

```
<type>(<scope>): <short description>
```

### Types

| Type | When To Use |
|------|------------|
| feat | New feature or functionality |
| fix | Bug fix |
| refactor | Code change (not a feature, not a fix) |
| docs | Documentation only |
| test | Adding or updating tests |
| chore | Build, config, dependencies |
| style | Formatting only (no logic change) |

### Scopes (module names)

```
auth, merchant, product, rfq, quote, order, payment,
inventory, notification, frontend, shared, infra
```

### Examples

```
feat(auth): implement register endpoint with bcrypt hashing
feat(auth): add JWT refresh token rotation with Redis
feat(order): implement order state machine with transition validation
feat(payment): add Paystack webhook signature verification
fix(payment): prevent duplicate webhook processing
fix(inventory): correct stock cache update in reservation
refactor(order): extract OTP generation to utility function
test(order): add unit tests for all state machine transitions
docs(readme): add backend API endpoint reference
chore(infra): update Docker Compose Redis version
```

### Bad Commits (never do these)

```
❌ "changes"
❌ "fix stuff"
❌ "update"
❌ "WIP"
❌ "misc fixes"
```

---

## HOW TO COMMIT AND PUSH

### Step 1: Stage your changes

```bash
git add .
```

Or stage specific files:

```bash
git add apps/backend/src/modules/auth/auth.service.ts
git add apps/backend/src/modules/auth/auth.controller.ts
```

### Step 2: Commit with proper message

```bash
git commit -m "feat(auth): implement register endpoint with bcrypt hashing"
```

If you made multiple logical changes, make separate commits:

```bash
git add apps/backend/src/modules/auth/auth.service.ts
git commit -m "feat(auth): implement register and login services"

git add apps/backend/src/common/guards/
git commit -m "feat(auth): add JwtAuthGuard and RolesGuard"

git add apps/backend/src/common/decorators/
git commit -m "feat(auth): add CurrentUser and Roles decorators"
```

### Step 3: Push to your feature branch

```bash
git push -u origin feature/<your-branch-name>
```

---

## AFTER FINISHING A FEATURE

Do NOT merge locally. The developer will create a Pull Request on GitHub.

Just tell the developer:

> "Changes pushed to `feature/<branch-name>`. Ready for PR to dev."

The developer will:
1. Go to GitHub
2. Create PR: `feature/<branch-name>` → `dev`
3. Get 1 review
4. Squash and merge

---

## STARTING THE NEXT TASK

After a PR is merged, always start fresh:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/<next-task>
```

---

## HANDLING MERGE CONFLICTS

If you get conflicts when pulling or pushing:

```bash
# 1. Fetch latest
git fetch origin

# 2. Rebase your branch on dev
git rebase origin/dev

# 3. If conflicts appear, fix them in the affected files
# Remove the conflict markers: <<<<<<<, =======, >>>>>>>

# 4. After fixing each conflicted file
git add <fixed-file>
git rebase --continue

# 5. Force-push your feature branch (this is OK for feature branches only)
git push --force-with-lease
```

**NEVER force-push to main or dev.**

---

## WHAT TO CHECK BEFORE EVERY COMMIT

Before committing, verify:

1. Code builds without errors:
```bash
pnpm build
```

2. No .env files or secrets in the commit:
```bash
git diff --cached --name-only | grep -i "\.env"
# Should return nothing
```

3. No console.log left in production code (unless intentional debug logging)

4. No node_modules in the commit:
```bash
git diff --cached --name-only | grep node_modules
# Should return nothing
```

---

## RULES SUMMARY

### ALWAYS
1. Branch from dev (never from main)
2. Pull latest dev before creating a new branch
3. Use the commit message format: `type(scope): description`
4. Push to your feature branch only
5. Make small, focused commits (one logical change per commit)
6. Verify the build passes before pushing

### NEVER
1. Push directly to main or dev
2. Force-push to main or dev
3. Commit .env files, API keys, or secrets
4. Commit node_modules/
5. Use vague commit messages ("fix stuff", "changes", "update")
6. Merge dev into your feature branch (rebase instead)
7. Leave console.log statements in production code

---

## QUICK REFERENCE

```bash
# Start work
git checkout dev
git pull origin dev
git checkout -b feature/<module>-<description>

# During work
git add .
git commit -m "feat(<module>): <what you did>"

# Push when ready
git push -u origin feature/<module>-<description>

# After PR is merged, start next task
git checkout dev
git pull origin dev
git checkout -b feature/<next-task>
```
