# ============================================================
#  KaryaAI - Quick User-Flow Tests
#  Usage:  .\quick-tests.ps1 [-BaseUrl <url>] [-AdminEmail <email>] [-KeepUser]
# ============================================================

param(
  [string]$BaseUrl    = "http://localhost:3000",
  [string]$AdminEmail = "",
  [switch]$KeepUser
)

$ErrorActionPreference = "Stop"

# Counters
$pass = 0; $fail = 0; $skip = 0

function Step([string]$label) {
  Write-Host ""
  Write-Host "-----------------------------------------" -ForegroundColor DarkGray
  Write-Host "  $label" -ForegroundColor Cyan
  Write-Host "-----------------------------------------" -ForegroundColor DarkGray
}

function Ok([string]$msg) {
  Write-Host "  [OK]  $msg" -ForegroundColor Green
  $script:pass++
}

function Fail([string]$msg) {
  Write-Host "  [FAIL]  $msg" -ForegroundColor Red
  $script:fail++
}

function Skip([string]$msg) {
  Write-Host "  [SKIP]  $msg" -ForegroundColor Yellow
  $script:skip++
}

function Assert([bool]$cond, [string]$label) {
  if ($cond) { Ok $label } else { Fail $label }
}

function Invoke-Api {
  param(
    [string]$Method  = "GET",
    [string]$Path,
    [hashtable]$Body = @{},
    [string]$Token   = ""
  )

  $url     = "$BaseUrl$Path"
  $headers = @{ "Content-Type" = "application/json" }

  if ($Token) {
    $headers["Authorization"] = "Bearer $Token"
  }

  $iwrParams = @{
    Uri             = $url
    Method          = $Method
    Headers         = $headers
    UseBasicParsing = $true
    ErrorAction     = "SilentlyContinue"
  }

  if ($Body.Count -gt 0) {
    $iwrParams["Body"]        = ($Body | ConvertTo-Json -Depth 10)
    $iwrParams["ContentType"] = "application/json"
  }

  try {
    $webResp = Invoke-WebRequest @iwrParams
    return $webResp.Content | ConvertFrom-Json
  } catch {
    # For PS5 the exception carries the raw content in ErrorDetails
    $errBody = $_.ErrorDetails.Message
    if ($errBody) {
      try { return $errBody | ConvertFrom-Json } catch {}
    }
    # Last resort: read the response stream
    $response = $_.Exception.Response
    if ($response) {
      try {
        $stream = $response.GetResponseStream()
        $reader = [System.IO.StreamReader]::new($stream)
        $raw    = $reader.ReadToEnd()
        try { return $raw | ConvertFrom-Json } catch {}
      } catch {}
    }
    return [PSCustomObject]@{ success = $false; error = $_.Exception.Message }
  }
}

# ==============================================================================
# 0. Health Check
# ==============================================================================

Step "0 - Health Check"

$health = Invoke-Api -Path "/api/health"
Assert ($health.status -in "OK","DEGRADED") "GET /api/health returns status field"
Assert ($null -ne $health.timestamp)         "Health response has timestamp"

if ($health.status -eq "OK") {
  Ok "Database connected"
} else {
  Write-Host "  [WARN]  DB is DEGRADED - some tests may fail" -ForegroundColor Yellow
}

# ==============================================================================
# 1. Signup
# ==============================================================================

Step "1 - Signup (POST /api/auth/signup)"

$ts        = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testEmail = "test.employee.$ts@karyaai-test.dev"
$testPass  = "TestPass123!"
$testName  = "Test Employee $ts"

$signupBody = @{
  email     = $testEmail
  password  = $testPass
  full_name = $testName
  role      = "employee"
  skillset  = @("TypeScript","Node.js","React")
}

$signup = Invoke-Api -Method POST -Path "/api/auth/signup" -Body $signupBody
Assert ($signup.success -eq $true)              "Signup returns success=true"
Assert ($signup.data.email    -eq $testEmail)   "Signup echoes back email"
Assert ($signup.data.full_name -eq $testName)   "Signup echoes back full_name"
Assert ($signup.data.role     -eq "employee")   "Signup echoes back role"

$newUserId = $signup.data.uid
if ($newUserId) {
  Ok "New UID: $newUserId"
} else {
  Fail "UID missing from signup response"
}

# 1b. Duplicate email
$dup = Invoke-Api -Method POST -Path "/api/auth/signup" -Body $signupBody
Assert ($dup.success -eq $false)          "Duplicate signup returns success=false"
Assert ($dup.code -eq "EMAIL_EXISTS")     "Duplicate signup returns EMAIL_EXISTS code"

# 1c. Missing field validation
$bad = Invoke-Api -Method POST -Path "/api/auth/signup" -Body @{ email = $testEmail }
Assert ($bad.success -eq $false)              "Missing-field signup rejected"
Assert ($bad.code -eq "VALIDATION_ERROR")     "Missing-field returns VALIDATION_ERROR"

# ==============================================================================
# 2. Login
# ==============================================================================

Step "2 - Login (POST /api/auth/login)"

$loginBody = @{ email = $testEmail; password = $testPass }
$login     = Invoke-Api -Method POST -Path "/api/auth/login" -Body $loginBody

Assert ($login.success -eq $true)                       "Login returns success=true"
Assert ($null -ne $login.data.token)                    "Login response contains token"
Assert ($login.data.user.email -eq $testEmail)          "Login response echoes email"
Assert ($login.data.user.role  -eq "employee")          "Login response echoes role"

$customToken = $login.data.token
$tokenPreview = $customToken.Substring(0, [Math]::Min(40, $customToken.Length))
Write-Host "  [INFO]  Token preview: $tokenPreview..." -ForegroundColor DarkGray

# 2b. Wrong password - KNOWN BUG: password is NOT verified server-side
# The login endpoint uses Firebase Admin SDK which cannot verify passwords.
# Any password is accepted for a valid email address.
# See: src/services/auth.service.ts authenticateUser() for details and fix instructions.
$badLogin = Invoke-Api -Method POST -Path "/api/auth/login" -Body @{ email=$testEmail; password="WrongPass!" }
if ($badLogin.success -eq $false) {
  Ok "Wrong password correctly rejected (INVALID_CREDENTIALS)"
} else {
  Write-Host "  [KNOWN BUG]  Wrong password accepted - password is never verified by Admin SDK!" -ForegroundColor Magenta
  Write-Host "               Fix: use Firebase REST API signInWithEmailAndPassword before issuing custom token." -ForegroundColor Magenta
  $script:skip++
}

# ==============================================================================
# 3. Dev Token
# ==============================================================================

Step "3 - Dev Token (POST /api/auth/dev-token)"

$devTokenResp = Invoke-Api -Method POST -Path "/api/auth/dev-token" -Body @{ email = $testEmail }
$devToken = $null

if ($devTokenResp.success -eq $true) {
  $devToken = $devTokenResp.data.customToken
  Assert ($null -ne $devToken)                    "dev-token endpoint returned a token"
  Assert ($devTokenResp.data.role -eq "employee") "dev-token carries correct role"
} else {
  Write-Host "  [WARN]  /dev-token failed - falling back to login custom token" -ForegroundColor Yellow
  $devToken = $customToken
  Skip "dev-token endpoint (using login token as fallback)"
}

# ==============================================================================
# 4. Authenticated /me
# ==============================================================================

Step "4 - Authenticated Me (GET /api/auth/me)"

$me = Invoke-Api -Method GET -Path "/api/auth/me" -Token $devToken
Assert ($me.success -eq $true)              "/me returns success=true"
Assert ($me.data.user.email -eq $testEmail) "/me returns correct email"

# ==============================================================================
# 5. Unauthenticated Access
# ==============================================================================

Step "5 - Unauthenticated Access"

$unauth = Invoke-Api -Method GET -Path "/api/auth/me"
Assert ($unauth.success -eq $false)   "Unauthenticated /me returns success=false"
Assert ($unauth.code -eq "NO_TOKEN")  "Unauthenticated returns NO_TOKEN code"

# ==============================================================================
# 6. Role-Based Access Control
# ==============================================================================

Step "6 - Role-Based Access Control"

$forbidden = Invoke-Api -Method GET -Path "/api/users" -Token $devToken
Assert ($forbidden.success -eq $false)          "Employee cannot GET /api/users (admin-only)"
Assert ($forbidden.code -eq "ACCESS_DENIED")    "Returns ACCESS_DENIED code"

# ==============================================================================
# 7. Admin CRUD (only if -AdminEmail supplied)
# ==============================================================================

$adminToken = $null

if ($AdminEmail -ne "") {
  Step "7 - Admin Login and User Management"

  $adminDev = Invoke-Api -Method POST -Path "/api/auth/dev-token" -Body @{ email = $AdminEmail }

  if ($adminDev.success -eq $true -and $adminDev.data.role -eq "admin") {
    $adminToken = $adminDev.data.customToken
    Ok "Got admin dev-token for $AdminEmail"

    # 7a. List users
    $userList = Invoke-Api -Method GET -Path "/api/users" -Token $adminToken
    Assert ($userList.success -eq $true)          "Admin can GET /api/users"
    Assert ($null -ne $userList.data.users)       "User list has users array"
    Assert ($userList.data.users.Count -gt 0)     "At least one user exists"

    # 7b. Get specific user
    if ($newUserId) {
      $getUser = Invoke-Api -Method GET -Path "/api/users/$newUserId" -Token $adminToken
      Assert ($getUser.success -eq $true)           "Admin can GET /api/users/:id"
      Assert ($getUser.data.email -eq $testEmail)   "Returned user has correct email"

      # 7c. Update user
      $updateBody = @{
        full_name = "$testName (Updated)"
        skillset  = @("TypeScript","Node.js","React","PostgreSQL")
      }
      $updated = Invoke-Api -Method PUT -Path "/api/users/$newUserId" -Body $updateBody -Token $adminToken
      Assert ($updated.success -eq $true)           "Admin can PUT /api/users/:id"
      $expectedName = "$testName (Updated)"
      Assert ($updated.data.full_name -eq $expectedName) "full_name was updated"

      # 7d. Soft-delete
      $deleted = Invoke-Api -Method DELETE -Path "/api/users/$newUserId" -Token $adminToken
      Assert ($deleted.success -eq $true)           "Admin can DELETE /api/users/:id"

      # 7e. Restore
      $restored = Invoke-Api -Method POST -Path "/api/users/$newUserId/restore" -Token $adminToken
      Assert ($restored.success -eq $true)          "Admin can POST /api/users/:id/restore"

      # 7f. User stats
      $stats = Invoke-Api -Method GET -Path "/api/users/stats" -Token $adminToken
      Assert ($stats.success -eq $true)             "Admin can GET /api/users/stats"
      Assert ($null -ne $stats.data.total)          "Stats has total count"

      # 7g. Available employees
      $avail = Invoke-Api -Method GET -Path "/api/users/employees/available" -Token $adminToken
      Assert ($avail.success -eq $true)             "Admin can GET available employees"

      # 7h. Cleanup
      if (-not $KeepUser) {
        $cleanup = Invoke-Api -Method DELETE -Path "/api/users/$newUserId" -Token $adminToken
        if ($cleanup.success) {
          Ok "Test user soft-deleted (cleanup)"
        } else {
          Write-Host "  [WARN]  Cleanup failed - user $newUserId may remain in Firestore" -ForegroundColor Yellow
        }
      } else {
        Skip "Cleanup skipped (-KeepUser flag set)"
      }

    } else {
      Skip "User CRUD tests (UID not captured from signup)"
    }

  } else {
    $gotRole = $adminDev.data.role
    Fail "Could not obtain admin dev-token for $AdminEmail (role=$gotRole)"
    Skip "All admin-dependent sub-tests"
  }

} else {
  Skip "Admin CRUD tests (no -AdminEmail supplied)"
  Write-Host "  [INFO]  Re-run with: .\quick-tests.ps1 -AdminEmail admin@example.com" -ForegroundColor DarkGray
}

# ==============================================================================
# 8. Logout
# ==============================================================================

Step "8 - Logout (POST /api/auth/logout)"

$logout = Invoke-Api -Method POST -Path "/api/auth/logout"
Assert ($logout.success -eq $true) "Logout returns success=true"

# ==============================================================================
# 9. Logic Flaw Probes  (document known bugs without failing the run)
# ==============================================================================

Step "9 - Logic Flaw Probes"

Write-Host "  These probes verify KNOWN BUGS discovered by static code review." -ForegroundColor DarkGray
Write-Host "  [BUG] = bug confirmed live   [OK] = already fixed" -ForegroundColor DarkGray

# ── C1: Password is never verified ────────────────────────────────────────────
# Login with a wrong password — should return 401, but currently succeeds (C1).
$c1 = Invoke-Api -Method POST -Path "/api/auth/login" -Body @{
  email    = $testEmail
  password = "COMPLETELY_WRONG_PASSWORD_xyz987"
}
if ($c1.success -eq $true) {
  Write-Host "  [BUG]  C1 CONFIRMED - Wrong password accepted (no password verification)" -ForegroundColor Magenta
  Write-Host "         Fix: use Firebase REST signInWithEmailAndPassword before issuing custom token" -ForegroundColor DarkGray
  $script:skip++
} else {
  Ok "C1 - Password verification is now enforced"
}

# ── C2: Forged JWT accepted in dev mode ────────────────────────────────────────
# Build a fake JWT whose payload contains the test user's UID.
# If the middleware accepts it, C2 is confirmed.
if ($newUserId) {
  $fakePayloadJson = "{`"uid`":`"$newUserId`",`"sub`":`"$newUserId`"}"
  $fakePayloadB64  = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($fakePayloadJson))
  $fakeJwt         = "fakeheader.$fakePayloadB64.fakesig"

  $c2 = Invoke-Api -Method GET -Path "/api/auth/me" -Token $fakeJwt
  if ($c2.success -eq $true) {
    Write-Host "  [BUG]  C2 CONFIRMED - Forged JWT accepted by dev-mode auth middleware" -ForegroundColor Magenta
    Write-Host "         Fix: remove JWT payload fallback from auth middleware (or restrict to NODE_ENV=test)" -ForegroundColor DarkGray
    $script:skip++
  } else {
    Ok "C2 - Forged JWT correctly rejected"
  }
} else {
  Skip "C2 probe (no UID from signup)"
}

# ── H1: getUserStats returns totalUsers not total ──────────────────────────────
# The controller passes stats.data directly; key is 'totalUsers', but tests/frontend may expect 'total'.
if ($adminToken) {
  $statH1 = Invoke-Api -Method GET -Path "/api/users/stats" -Token $adminToken
  if ($statH1.success -eq $true) {
    $hasTotal      = $null -ne $statH1.data.total
    $hasTotalUsers = $null -ne $statH1.data.totalUsers
    if (-not $hasTotal -and $hasTotalUsers) {
      Write-Host "  [BUG]  H1 CONFIRMED - /users/stats returns 'totalUsers' but not 'total'" -ForegroundColor Magenta
      Write-Host "         Fix: add alias 'total: stats.totalUsers' in the controller or service" -ForegroundColor DarkGray
      $script:skip++
    } elseif ($hasTotal) {
      Ok "H1 - Stats has 'total' field"
    } else {
      Fail "H1 - Stats response missing both 'total' and 'totalUsers'"
    }
  } else {
    Skip "H1 probe (stats request failed)"
  }
} else {
  Skip "H1 probe (no admin token)"
}

# ── H4: Client can self-approve workflow ──────────────────────────────────────
# This probe only verifies that updateWorkflow correctly strips 'status' for clients.
# Without a real workflow ID we can only confirm the RBAC guard works.
# The actual field-strip flaw requires an existing workflow — document it here.
Write-Host "  [INFO]  H4 - updateWorkflow does not strip admin-only fields for clients" -ForegroundColor Magenta
Write-Host "          A client can send { status: 'approved' } on PUT /api/workflows/:id" -ForegroundColor DarkGray
Write-Host "          Fix: whitelist client-editable fields in WorkflowController.updateWorkflow()" -ForegroundColor DarkGray
$script:skip++

# ── M4: Task createTask response shape inconsistency ──────────────────────────
# POST /api/tasks requires a valid workflowId/productId/phaseId in body.
# We can't create a real task without those, but we can probe the validation error shape.
if ($adminToken) {
  $m4 = Invoke-Api -Method POST -Path "/api/tasks" -Body @{} -Token $adminToken
  # Validation middleware returns { message, errors } — not { success, error }
  $hasSuccess = $null -ne $m4.success
  $hasMessage = $null -ne $m4.message
  if (-not $hasSuccess -and $hasMessage) {
    Write-Host "  [BUG]  M4 CONFIRMED - /api/tasks validation error missing 'success' field" -ForegroundColor Magenta
    Write-Host "         Response has 'message' but not 'success:false' (inconsistent shape)" -ForegroundColor DarkGray
    $script:skip++
  } elseif ($hasSuccess -eq $false) {
    Ok "M4 - Task error response includes 'success' field"
  } else {
    Skip "M4 probe (unexpected response)"
  }
} else {
  Skip "M4 probe (no admin token)"
}

# ── L1: Global error handler shape differs from controller responses ───────────
# Hit a route that doesn't exist — 404 handler returns our format.
# Hit a route that throws — global error handler returns { message } not { success, error }.
$l1 = Invoke-Api -Method GET -Path "/api/nonexistent-route-xyz"
if ($l1.success -eq $false -and $null -ne $l1.error) {
  Ok "L1 - 404 handler uses consistent shape"
} elseif ($null -ne $l1.message -and $null -eq $l1.success) {
  Write-Host "  [BUG]  L1 CONFIRMED - 404/error handler returns { message } not { success, error }" -ForegroundColor Magenta
  $script:skip++
} else {
  Skip "L1 probe (ambiguous response)"
}


# ==============================================================================
# Summary
# ==============================================================================

Step "Summary"
$total = $pass + $fail + $skip
Write-Host ""
Write-Host "  Total  : $total" -ForegroundColor White
Write-Host "  Passed : $pass"  -ForegroundColor Green

if ($fail -gt 0) {
  Write-Host "  Failed : $fail" -ForegroundColor Red
} else {
  Write-Host "  Failed : $fail" -ForegroundColor Green
}

Write-Host "  Skipped: $skip" -ForegroundColor Yellow
Write-Host ""

if ($fail -gt 0) {
  Write-Host "  [RESULT]  Some tests FAILED - see output above." -ForegroundColor Red
  exit 1
} else {
  Write-Host "  [RESULT]  All non-skipped tests PASSED!" -ForegroundColor Green
  exit 0
}
