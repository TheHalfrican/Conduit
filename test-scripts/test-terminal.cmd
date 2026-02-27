@echo off
REM ============================================================
REM Conduit Terminal Test Script (.cmd — Windows Command Prompt)
REM Tests PTY features: colors, input, cursor control, etc.
REM ============================================================
setlocal EnableDelayedExpansion
chcp 65001 >nul

cls

REM --- Section 1: Header ---
echo [1;36m╔══════════════════════════════════════════╗[0m
echo [1;36m║     CONDUIT TEST — CMD (.cmd)             ║[0m
echo [1;36m╚══════════════════════════════════════════╝[0m
echo.

REM --- Section 2: ANSI Colors ---
echo [1m[1/7] ANSI Color Test[0m
echo   [31m■ Red[0m  [32m■ Green[0m  [33m■ Yellow[0m  [34m■ Blue[0m  [35m■ Magenta[0m  [36m■ Cyan[0m  [37m■ White[0m
echo   [1;31m■ Bold Red[0m  [1;32m■ Bold Green[0m  [1;33m■ Bold Yellow[0m  [1;34m■ Bold Blue[0m
echo   [41;37m BG Red [0m [42;37m BG Green [0m [43m BG Yellow [0m [44;37m BG Blue [0m
echo.

REM --- Section 3: Text Styles ---
echo [1m[2/7] Text Styles[0m
echo   [1mBold text[0m
echo   [2mDim text[0m
echo   [3mItalic text[0m
echo   [4mUnderlined text[0m
echo   [7mReversed text[0m
echo   [1;4;32mCombined: bold + underline + green[0m
echo.

REM --- Section 4: Progress Bar ---
echo [1m[3/7] Progress Bar[0m
set "bar="
set "width=40"
for /L %%i in (1,1,%width%) do (
    set "bar=!bar!█"
    set /a "percent=%%i * 100 / %width%"
    <nul set /p "=  [32m!bar![0m !percent!%%"
    echo.
)
echo   [32m✓ Complete[0m
echo.

REM --- Section 5: Interactive Input ---
echo [1m[4/7] Interactive Input Test[0m
echo   [33mType your name and press Enter (q to quit):[0m
set /p "USERNAME=  > "
if /i "%USERNAME%"=="q" goto :done
echo   [32mHello, [1m%USERNAME%[0;32m![0m
echo.

echo   [33mPick a color [r/g/b] (q to quit):[0m
set /p "COLORPICK=  > "
if /i "%COLORPICK%"=="q" goto :done
if /i "%COLORPICK%"=="r" (
    echo   [31mYou picked red![0m
) else if /i "%COLORPICK%"=="g" (
    echo   [32mYou picked green![0m
) else if /i "%COLORPICK%"=="b" (
    echo   [34mYou picked blue![0m
) else (
    echo   [35mUnknown choice, but that's OK![0m
)
echo.

REM --- Section 6: Formatted Table ---
echo [1m[5/7] Formatted Table[0m
echo   [2m┌──────────────┬────────┬───────────┐[0m
echo   [2m│[0m [1mProcess[0m      [2m│[0m [1mPID[0m    [2m│[0m [1mStatus[0m    [2m│[0m
echo   [2m├──────────────┼────────┼───────────┤[0m
echo   [2m│[0m conduit      [2m│[0m 1024   [2m│[0m [32mrunning[0m   [2m│[0m
echo   [2m│[0m backup.cmd   [2m│[0m 2048   [2m│[0m [33mpending[0m   [2m│[0m
echo   [2m│[0m cleanup.cmd  [2m│[0m 3072   [2m│[0m [31mfailed[0m    [2m│[0m
echo   [2m│[0m deploy.cmd   [2m│[0m 4096   [2m│[0m [32mrunning[0m   [2m│[0m
echo   [2m└──────────────┴────────┴───────────┘[0m
echo.

REM --- Section 7: System Info ---
echo [1m[6/7] System Info[0m
echo   [2mOS:[0m        %OS%
echo   [2mProcessor:[0m %PROCESSOR_ARCHITECTURE%
echo   [2mComSpec:[0m   %COMSPEC%
echo   [2mTERM:[0m      %TERM%
echo.

REM --- Summary ---
echo [1;36m══════════════════════════════════════════[0m
echo [1;32m  All tests passed! (.cmd on Windows)[0m
echo [1;36m══════════════════════════════════════════[0m

:done
endlocal
