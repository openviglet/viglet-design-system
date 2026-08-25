@echo off
setlocal enabledelayedexpansion

REM ============================================================================
REM publish-ds.cmd - Build and publish @viglet/viglet-design-system to npm
REM DIRECTLY from your machine, without the GitHub Actions workflow.
REM
REM This file is IDENTICAL in the 2026.2 and 2026.3 worktrees. It adapts itself
REM rather than being forked per line, so there is one thing to fix next time:
REM
REM   * Package manager is detected from the lockfile. 2026.3 tracks
REM     pnpm-lock.yaml, 2026.2 tracks package-lock.json.
REM
REM   * Publish gates are whichever of lint / typecheck / test the line actually
REM     declares. 2026.3 has all three, 2026.2 has only lint, and neither needs
REM     a per-line edit here.
REM
REM   * --tag is DERIVED from the version, never left to default. `npm publish`
REM     with no --tag means --tag latest, and npm moves `latest` to whatever you
REM     just published EVEN WHEN IT IS OLDER. Publishing 2026.2.x untagged would
REM     drag `latest` off the 2026.3 line, and every `npm add` with no version
REM     would start resolving to legacy. So every publish goes out under its own
REM     line tag (2026.2 / 2026.3) and `latest` is moved afterwards ONLY when the
REM     new version really is the highest. Legacy publishes leave it alone; the
REM     current line still advances it.
REM
REM Auth (registry.npmjs.org):
REM   Either be `npm login`-ed already, OR set a token:
REM     set NPM_TOKEN=npm_xxxxxxxxxxxxxxxxxxxx
REM   When NPM_TOKEN is set, a temporary .npmrc carrying the auth line is used
REM   for the publish and deleted at the end. Same mechanism as turing's
REM   publish-js.cmd, which this was adapted from.
REM
REM Usage:
REM   publish-ds.cmd                Bump to next free patch, gate, build, publish.
REM   publish-ds.cmd --dry-run      Everything except the publish and the tag move.
REM   publish-ds.cmd --no-bump      Publish the current version as-is.
REM   publish-ds.cmd --skip-gates   Skip lint/typecheck/test (e.g. no Chromium).
REM ============================================================================

set "ROOT=%~dp0"
set "ROOTJS=%ROOT:\=/%"
set "PKG=@viglet/viglet-design-system"

set "DO_BUMP=1"
set "DRY_RUN=0"
set "SKIP_GATES=0"

:parse
if "%~1"=="" goto after_parse
if /i "%~1"=="--no-bump"    ( set "DO_BUMP=0"    & shift & goto parse )
if /i "%~1"=="--dry-run"    ( set "DRY_RUN=1"    & shift & goto parse )
if /i "%~1"=="--skip-gates" ( set "SKIP_GATES=1" & shift & goto parse )
echo [ERROR] Unknown argument: %~1
echo         Valid flags: --no-bump ^| --dry-run ^| --skip-gates
exit /b 1
:after_parse

REM --- Detect the package manager from the lockfile ---------------------------
if exist "%ROOT%pnpm-lock.yaml" (
    set "PM=pnpm"
    REM pnpm refuses to publish from a dirty tree; the version bump dirties it.
    set "PUBFLAGS=--access public --no-git-checks"
) else (
    set "PM=npm"
    set "PUBFLAGS=--access public"
)

pushd "%ROOT%"

REM --- Bump only while the current version is already taken -------------------
REM     publish.yml bumps unconditionally, which is why 2026.2.56 does not
REM     exist: a dispatch that bumped but failed later still burned the number.
REM     Here the registry decides instead. If package.json already sits on a
REM     free version we publish THAT, so a re-run after a failed attempt (or
REM     after a --dry-run) lands on the same number instead of skipping ahead.
if "%DO_BUMP%"=="0" goto read_version
:bumploop
for /f "delims=" %%V in ('node -p "require('%ROOTJS%package.json').version"') do set "VERSION=%%V"
call npm view %PKG%@!VERSION! version >nul 2>&1
if errorlevel 1 goto read_version
echo [INFO] !VERSION! already on npm, bumping ...
call npm version patch --no-git-tag-version >nul
if errorlevel 1 goto fail_bump
goto bumploop

:read_version
for /f "delims=" %%V in ('node -p "require('%ROOTJS%package.json').version"') do set "VERSION=%%V"
REM     The `line-` prefix is required, not cosmetic: npm rejects a dist-tag
REM     that is a valid SemVer range, and a bare "2026.2" parses as one (it
REM     means 2026.2.x). `line-2026.2` does not parse, so npm accepts it.
for /f "tokens=1,2 delims=." %%a in ("!VERSION!") do set "DISTTAG=line-%%a.%%b"

echo ============================================================
echo  Publishing %PKG%
echo  version   : %VERSION%
echo  dist-tag  : %DISTTAG%
echo  manager   : %PM%
echo  dry-run   : %DRY_RUN%   ^(1=yes^)
echo ============================================================

REM --- Auth -------------------------------------------------------------------
set "NPMRC_TMP="
if "%NPM_TOKEN%"=="" goto no_token
set "NPMRC_TMP=%TEMP%\vds-publish-%RANDOM%%RANDOM%.npmrc"
>  "!NPMRC_TMP!" echo registry=https://registry.npmjs.org/
>> "!NPMRC_TMP!" echo //registry.npmjs.org/:_authToken=%NPM_TOKEN%
>> "!NPMRC_TMP!" echo @viglet:registry=https://registry.npmjs.org/
echo [INFO] Using NPM_TOKEN for npm authentication ^(temp .npmrc^).
goto install
:no_token
echo [INFO] NPM_TOKEN not set - assuming an existing `npm login`.

REM --- Install ----------------------------------------------------------------
REM     Runs BEFORE the temp .npmrc is wired in, so it still uses the real
REM     ~/.npmrc for any privately-scoped dependency.
:install
echo [INFO] Installing deps with %PM% ...
if "%PM%"=="pnpm" (
    call pnpm install --frozen-lockfile=false
) else (
    call npm install --no-audit --no-fund
)
if errorlevel 1 goto fail_install

REM --- Gates: only the ones this line declares --------------------------------
if "%SKIP_GATES%"=="1" ( echo [INFO] Gates skipped by flag. & goto build )
call :gate lint
if errorlevel 1 goto fail_gate
call :gate typecheck
if errorlevel 1 goto fail_gate
call :gate test
if errorlevel 1 goto fail_gate

:build
echo [INFO] Building ...
call %PM% run build
if errorlevel 1 goto fail_build

REM Point npm/pnpm at the token-only config for the publish step alone.
if not "%NPMRC_TMP%"=="" set "npm_config_userconfig=%NPMRC_TMP%"

if "%DRY_RUN%"=="1" (
    echo [INFO] Dry run - showing what WOULD be published ...
    call %PM% publish %PUBFLAGS% --tag %DISTTAG% --dry-run
) else (
    echo [INFO] Publishing %VERSION% under tag %DISTTAG% ...
    call %PM% publish %PUBFLAGS% --tag %DISTTAG%
)
if errorlevel 1 goto fail_publish

REM --- Move `latest` only when this really is the highest version -------------
REM     A legacy publish must not drag it backwards; the current line must still
REM     advance it. Comparing against the registry is what tells them apart.
if "%DRY_RUN%"=="1" goto done
for /f "delims=" %%L in ('npm view %PKG% dist-tags.latest 2^>nul') do set "CURLATEST=%%L"
if "!CURLATEST!"=="" goto move_latest
node -e "const[a,b]=process.argv.slice(1).map(v=>v.split('.').map(Number));for(let i=0;i<3;i++){if((a[i]||0)>(b[i]||0))process.exit(0);if((a[i]||0)<(b[i]||0))process.exit(1)}process.exit(1)" %VERSION% !CURLATEST!
if errorlevel 1 goto keep_latest
:move_latest
echo [INFO] %VERSION% is the highest - moving `latest` ...
call npm dist-tag add %PKG%@%VERSION% latest
goto done
:keep_latest
echo [INFO] `latest` stays at !CURLATEST! - %VERSION% is not the highest.

:done
popd
call :cleanup
echo.
if "%DRY_RUN%"=="1" (
    echo [OK] Dry run complete - nothing was published.
) else (
    echo [OK] Published %VERSION% under tag %DISTTAG%.
    echo      Verify:  npm dist-tag ls %PKG%
)
endlocal
exit /b 0

REM ---------------------------------------------------------------------------
REM Run a gate only if BOTH the script exists AND this line's publish.yml runs
REM it. Script presence alone is not the contract: 2026.2 declares a `lint`
REM script but ships no eslint.config.js and its workflow never lints, so
REM gating on presence would fail a publish on a check the line never had.
:gate
for /f "delims=" %%H in ('node -p "Boolean((require('%ROOTJS%package.json').scripts||{})['%~1'])"') do set "HAS=%%H"
if /i not "!HAS!"=="true" ( echo [INFO] No `%~1` script on this line - skipping. & exit /b 0 )
if not exist "%ROOT%.github\workflows\publish.yml" ( echo [INFO] No publish.yml - skipping `%~1`. & exit /b 0 )
findstr /I /R /C:"run:.*%~1" "%ROOT%.github\workflows\publish.yml" >nul 2>&1
if errorlevel 1 ( echo [INFO] publish.yml does not run `%~1` - skipping. & exit /b 0 )
echo [INFO] Publish gate: %~1 ...
call %PM% run %~1
exit /b %errorlevel%

REM ---------------------------------------------------------------------------
:cleanup
if not "%NPMRC_TMP%"=="" if exist "%NPMRC_TMP%" del /q "%NPMRC_TMP%"
exit /b 0

:fail_bump
popd & echo [ERROR] npm version patch failed. & exit /b 1
:fail_install
popd & call :cleanup & echo [ERROR] install failed. & exit /b 1
:fail_gate
popd & call :cleanup & echo [ERROR] publish gate failed. & exit /b 1
:fail_build
popd & call :cleanup & echo [ERROR] build failed. & exit /b 1
:fail_publish
popd & call :cleanup & echo [ERROR] publish failed. & exit /b 1
