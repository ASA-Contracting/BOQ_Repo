@echo off
cd /d "%~dp0"

echo === Deploy BOQ to Vercel ===
echo.

call npm run build
if errorlevel 1 goto fail

call npm run vercel:env:sync
if errorlevel 1 goto fail

call npm run db:migrate
if errorlevel 1 goto fail

call npx vercel --prod
if errorlevel 1 goto fail

echo.
echo DONE - open the URL above in your browser.
pause
exit /b 0

:fail
echo.
echo FAILED - read the error above.
pause
exit /b 1
