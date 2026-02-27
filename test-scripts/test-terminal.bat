@echo off
REM ============================================================
REM Conduit Terminal Test Script (.bat — Windows Batch)
REM Tests PTY features: colors, input, timing, etc.
REM ============================================================
setlocal EnableDelayedExpansion
chcp 65001 >nul

cls

REM --- Header ---
echo [1;36m╔══════════════════════════════════════════╗[0m
echo [1;36m║     CONDUIT TEST — Batch (.bat)           ║[0m
echo [1;36m╚══════════════════════════════════════════╝[0m
echo.

REM --- Section 1: ANSI Colors ---
echo [1m[1/6] ANSI Color Test[0m
echo   [31m■ Red[0m  [32m■ Green[0m  [33m■ Yellow[0m  [34m■ Blue[0m  [35m■ Magenta[0m  [36m■ Cyan[0m  [37m■ White[0m
echo   [1;31m■ Bold Red[0m  [1;32m■ Bold Green[0m  [1;33m■ Bold Yellow[0m  [1;34m■ Bold Blue[0m
echo   [41;37m BG Red [0m [42;37m BG Green [0m [43m BG Yellow [0m [44;37m BG Blue [0m
echo.

REM --- Section 2: Text Styles ---
echo [1m[2/6] Text Styles[0m
echo   [1mBold text[0m
echo   [2mDim text[0m
echo   [4mUnderlined text[0m
echo   [7mReversed text[0m
echo   [1;4;32mCombined: bold + underline + green[0m
echo.

REM --- Section 3: Countdown Timer ---
echo [1m[3/6] Countdown Timer[0m
for /L %%i in (5,-1,1) do (
    <nul set /p "=  [33m%%i...[0m "
    timeout /t 1 /nobreak >nul
)
echo.
echo   [32m✓ Liftoff![0m
echo.

REM --- Section 4: Interactive Input ---
echo [1m[4/6] Interactive Input Test[0m
echo   [33mType your name and press Enter (q to quit):[0m
set /p "USERNAME=  > "
if /i "%USERNAME%"=="q" goto :done
echo   [32mHello, [1m%USERNAME%[0;32m![0m
echo.

echo   [33mContinue? [y/n] (q to quit):[0m
set /p "CONT=  > "
if /i "%CONT%"=="q" goto :done
if /i "%CONT%"=="y" (
    echo   [32mGreat, continuing![0m
) else (
    echo   [33mOkay, but we'll continue anyway for testing.[0m
)
echo.

REM --- Section 5: Directory Listing ---
echo [1m[5/6] Directory Listing (first 10 items)[0m
set "count=0"
for /f "delims=" %%F in ('dir /b "%USERPROFILE%" 2^>nul') do (
    set /a count+=1
    if !count! leq 10 (
        echo   [2m├──[0m %%F
    )
)
echo   [2m└── ... and more[0m
echo.

REM --- Section 6: Formatted Table ---
echo [1m[6/6] Formatted Table[0m
echo   [2m┌──────────────┬────────┬───────────┐[0m
echo   [2m│[0m [1mScript[0m       [2m│[0m [1mType[0m   [2m│[0m [1mStatus[0m    [2m│[0m
echo   [2m├──────────────┼────────┼───────────┤[0m
echo   [2m│[0m deploy       [2m│[0m .bat   [2m│[0m [32mrunning[0m   [2m│[0m
echo   [2m│[0m backup       [2m│[0m .cmd   [2m│[0m [33mpending[0m   [2m│[0m
echo   [2m│[0m cleanup      [2m│[0m .ps1   [2m│[0m [31mfailed[0m    [2m│[0m
echo   [2m│[0m test         [2m│[0m .sh    [2m│[0m [32mrunning[0m   [2m│[0m
echo   [2m└──────────────┴────────┴───────────┘[0m
echo.

REM --- Summary ---
echo [1;36m══════════════════════════════════════════[0m
echo [1;32m  All tests passed! (.bat on Windows)[0m
echo [2m  Date: %DATE% Time: %TIME%[0m
echo [1;36m══════════════════════════════════════════[0m

:done
endlocal
