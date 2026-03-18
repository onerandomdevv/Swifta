$ErrorActionPreference = "Stop"

Write-Host "Checking out branch..."
git checkout -b feat/presentation-ready-b2c

Write-Host "Running Backend Checks..."
Set-Location -Path "apps/backend"
pnpm run lint
npx tsc --noEmit
pnpm run build

Write-Host "Running Frontend Checks..."
Set-Location -Path "../../apps/web"
pnpm run lint
npx tsc --noEmit
pnpm run build

Write-Host "Committing and Pushing..."
Set-Location -Path "../.."
git add .
git commit -m "feat: complete b2c marketplace transition and generalization"
git push origin feat/presentation-ready-b2c

Write-Host "All done! Ready for presentation."
