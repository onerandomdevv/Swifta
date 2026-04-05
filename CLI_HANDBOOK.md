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
