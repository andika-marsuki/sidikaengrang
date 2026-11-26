@echo off
echo === STEP 1: Install neon globally ===
"C:\Program Files\nodejs\npm.cmd" install -g neon@latest
echo NEON_INSTALL_EXIT=%ERRORLEVEL%
echo.
echo === STEP 2: Check neon location ===
"C:\Program Files\nodejs\npm.cmd" root -g
echo.
"C:\Program Files\nodejs\npm.cmd" list -g --depth=0
echo DONE
