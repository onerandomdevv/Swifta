$ErrorActionPreference = "Stop"

# Parameterize the branch name
$branchName = if ($args[0]) { $args[0] } else { "feat/presentation-ready" }

function Invoke-SafeCommand {
    param([string]$Command, [string[]]$CommandArgs)
    Write-Host "Executing: $Command $($CommandArgs -join ' ')" -ForegroundColor Cyan
    & $Command @CommandArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Command '$Command' failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
}

Write-Host "--- twizrr Pre-commit Checks ---" -ForegroundColor Yellow

# Check if branch exists
$exists = git rev-parse --verify $branchName 2>$null
if ($exists) {
    Write-Host "Branch '$branchName' already exists. Checking it out..."
    Invoke-SafeCommand "git" @("checkout", $branchName)
} else {
    Write-Host "Creating and checking out branch '$branchName'..."
    Invoke-SafeCommand "git" @("checkout", "-b", $branchName)
}

Write-Host "`nRunning Backend Checks..." -ForegroundColor Green
Set-Location -Path "apps/backend"
Invoke-SafeCommand "pnpm" @("run", "lint")
Invoke-SafeCommand "npx" @("tsc", "--noEmit")
Invoke-SafeCommand "pnpm" @("run", "build")

Write-Host "`nRunning Frontend Checks..." -ForegroundColor Green
Set-Location -Path "../../apps/web"
Invoke-SafeCommand "pnpm" @("run", "lint")
Invoke-SafeCommand "npx" @("tsc", "--noEmit")
Invoke-SafeCommand "pnpm" @("run", "build")

Write-Host "`nCommitting changes..." -ForegroundColor Green
Set-Location -Path "../.."
Invoke-SafeCommand "git" @("add", ".")
# Avoid failing if nothing to commit
git diff-index --quiet HEAD --
if ($LASTEXITCODE -ne 0) {
    Invoke-SafeCommand "git" @("commit", "-m", "chore: system findings cleanup and hardening")
} else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
}

Write-Host "`n--- All checks passed! Ready to push manually. ---" -ForegroundColor Cyan
Write-Host "Command: git push origin $branchName"
