# 🛠️ Twizrr CLI Handbook

This guide contains all the important commands you will need to develop, maintain, and professionalize the Twizrr platform. Use this as your official reference.

---

## 🏗️ Workspace Management (Root)
*Run these from the main `twizrr` folder.*

| Command | Function |
| :--- | :--- |
| `pnpm install` | Installs all dependencies for the entire project (Backend, Web, and Shared). |
| `pnpm build` | Builds the whole project. **Always run this before any deployment.** |
| `pnpm dev` | Starts both the **Backend** and **Web** frontend simultaneously. |

---

## 🚀 Development Workflow
*Starting servers and watching for changes.*

| Command | Location | Function |
| :--- | :--- | :--- |
| `pnpm run dev` | Root | Hot-reloading development for the entire platform. |
| `pnpm --filter @twizrr/backend run dev` | Root | Starts **only** the Backend API. |
| `pnpm --filter @twizrr/web run dev` | Root | Starts **only** the Web Frontend. |

---

## 🗄️ Database & Prisma
*Managing the PostgreSQL schema and data.*

| Command | Location | Function |
| :--- | :--- | :--- |
| **`npx prisma generate`** | `apps/backend` | **CRITICAL**: Regenerates the TypeScript client after any schema change. |
| `npx prisma migrate dev` | `apps/backend` | Applies schema changes and creates a migration file. |
| `npx prisma studio` | `apps/backend` | Opens a visual UI in your browser to view/edit database data. |
| `pnpm run seed` | `apps/backend` | Populates the database with dummy data for testing. |

---

## 💎 Quality Assurance (The "Pre-Commit Gate")
*These checks protect the repository from "broken" code.*

| Command | Location | Function |
| :--- | :--- | :--- |
| `pnpm run lint` | Root | Checks for styling (ESLint) and formatting (Prettier) issues. |
| **`npx tsc --noEmit`** | `apps/backend` | **Deep Check**: Verifies there are zero TypeScript errors in the backend. |
| `git commit -m "..."` | Root | **Gatekeeper**: This automatically runs the Lint and Type checks before allowing the commit. |

---

## 🏥 Production Monitoring
*Checking the health of the live system.*

| Command | Function |
| :--- | :--- |
| **`curl http://localhost:3001/health`** | Checks if **Database**, **Redis**, **Memory**, and **Disk** are all healthy. |

---

## ⚠️ Common Troubleshooting
*   **"Module not found"**: Run `pnpm install` at the root.
*   **Prisma Type Errors**: Run `npx prisma generate` in the `apps/backend` folder.
*   **Git Commit Blocked**: Read the terminal output; it will tell you the exact line number that has an error!

# 🛡️ Twizrr Local Security Shield (LSS) Guide

This guide explains how to use the automated security guards I've installed to protect Twizrr from vulnerabilities.

## 🚀 How it works (Automated)

You don't need to do anything manually for most checks! They are baked into your Git workflow:

1.  **On Every Commit (`git commit`)**:
    - **Husky & lint-staged** automatically run the **Twizrr Security Sentinel**.
    - If you have a hardcoded secret, a `console.log`, or use `@IsNumber` for a price field, the commit will be **blocked** with a clear error message.
    - **ESLint** will also check for common security pitfalls (like unsafe regex) and hidden passwords.

2.  **Before Every Push (`.\precommit.ps1`)**:
    - This script now performs a **High-Level Dependency Audit** (`pnpm audit`).
    - If a third-party package you've installed has a critical security flaw, the push will be blocked until it's fixed.

## 🛠️ Manual Security Tools

### 1. Run a Full Security Scan
To scan the entire backend or web app for architectural violations:
```bash
node scripts/security-sentinel.js apps/backend
node scripts/security-sentinel.js apps/web
```

### 2. Deep Production Audit (Manual)
Before pushing to production, run the pre-commit audit manually to catch hidden dependency vulnerabilities:
```powershell
.\precommit.ps1
```

---

## 🤖 CodeRabbit AI (The Reviews)

Twizrr is integrated with **CodeRabbit AI** for professional code reviews and security analysis.

| Tool | Integration | Purpose |
| :--- | :--- | :--- |
| **GitHub App** | Pull Requests | Automatically reviews every PR for bugs, security risks, and logic flaws. |
| **IDE Extension** | VS Code / Cursor | Provides real-time AI feedback in your sidebar as you code. |
| **CLI Auditor** | Terminal | Can be used locally to run reviews before pushing. |

**Pro Tip**: If CodeRabbit flags a change in a PR, always address it before asking for a human review!
