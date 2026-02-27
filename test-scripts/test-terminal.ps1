# ============================================================
# Conduit Terminal Test Script (.ps1 — Windows PowerShell)
# Tests PTY features: colors, input, cursor control, etc.
# ============================================================

$ESC = [char]27

function Write-Color {
    param([string]$Text, [string]$Code)
    Write-Host -NoNewline "$ESC[$($Code)m$Text$ESC[0m"
}

Clear-Host

# --- Section 1: Header ---
Write-Host "$ESC[1;36m╔══════════════════════════════════════════╗$ESC[0m"
Write-Host "$ESC[1;36m║     CONDUIT TEST — PowerShell (.ps1)     ║$ESC[0m"
Write-Host "$ESC[1;36m╚══════════════════════════════════════════╝$ESC[0m"
Write-Host ""

# --- Section 2: ANSI Colors ---
Write-Host "$ESC[1m[1/7] ANSI Color Test$ESC[0m"
Write-Host "  $ESC[31m■ Red$ESC[0m  $ESC[32m■ Green$ESC[0m  $ESC[33m■ Yellow$ESC[0m  $ESC[34m■ Blue$ESC[0m  $ESC[35m■ Magenta$ESC[0m  $ESC[36m■ Cyan$ESC[0m  $ESC[37m■ White$ESC[0m"
Write-Host "  $ESC[1;31m■ Bold Red$ESC[0m  $ESC[1;32m■ Bold Green$ESC[0m  $ESC[1;33m■ Bold Yellow$ESC[0m  $ESC[1;34m■ Bold Blue$ESC[0m"
Write-Host "  $ESC[41;37m BG Red $ESC[0m $ESC[42;37m BG Green $ESC[0m $ESC[43m BG Yellow $ESC[0m $ESC[44;37m BG Blue $ESC[0m"
Write-Host ""

# --- Section 3: 256-Color Palette ---
Write-Host "$ESC[1m[2/7] 256-Color Palette$ESC[0m"
$line = ""
for ($i = 0; $i -le 15; $i++) {
    $line += "$ESC[48;5;${i}m  "
}
Write-Host "$line$ESC[0m"
$line = ""
for ($i = 16; $i -le 231; $i += 6) {
    for ($j = 0; $j -le 5; $j++) {
        $c = $i + $j
        $line += "$ESC[48;5;${c}m  "
    }
}
Write-Host "$line$ESC[0m"
Write-Host ""

# --- Section 4: Text Styles ---
Write-Host "$ESC[1m[3/7] Text Styles$ESC[0m"
Write-Host "  $ESC[1mBold text$ESC[0m"
Write-Host "  $ESC[2mDim text$ESC[0m"
Write-Host "  $ESC[3mItalic text$ESC[0m"
Write-Host "  $ESC[4mUnderlined text$ESC[0m"
Write-Host "  $ESC[7mReversed text$ESC[0m"
Write-Host "  $ESC[1;4;32mCombined: bold + underline + green$ESC[0m"
Write-Host ""

# --- Section 5: Progress Bar ---
Write-Host "$ESC[1m[4/7] Progress Bar (cursor control)$ESC[0m"
$width = 40
for ($i = 1; $i -le $width; $i++) {
    $percent = [math]::Floor($i * 100 / $width)
    $filled = "█" * $i
    $empty = "░" * ($width - $i)
    Write-Host -NoNewline "`r  $ESC[32m$filled$ESC[2m$empty$ESC[0m $($percent.ToString().PadLeft(3))%"
    Start-Sleep -Milliseconds 50
}
Write-Host ""
Write-Host "  $ESC[32m✓ Complete$ESC[0m"
Write-Host ""

# --- Section 6: Spinner ---
Write-Host "$ESC[1m[5/7] Spinner Animation$ESC[0m"
$frames = @("⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏")
for ($cycle = 1; $cycle -le 3; $cycle++) {
    foreach ($frame in $frames) {
        Write-Host -NoNewline "`r  $ESC[36m$frame$ESC[0m Processing cycle $cycle/3..."
        Start-Sleep -Milliseconds 80
    }
}
Write-Host "`r  $ESC[32m✓$ESC[0m Processing complete!    "
Write-Host ""

# --- Section 7: Interactive Input ---
Write-Host "$ESC[1m[6/7] Interactive Input Test$ESC[0m"
Write-Host "  $ESC[33mType your name and press Enter:$ESC[0m"
Write-Host -NoNewline "  > "
$username = Read-Host
Write-Host "  $ESC[32mHello, $ESC[1m$username$ESC[0;32m!$ESC[0m"
Write-Host ""

Write-Host "  $ESC[33mPick a color [r/g/b]:$ESC[0m"
Write-Host -NoNewline "  > "
$colorPick = Read-Host
switch ($colorPick.ToLower()) {
    "r" { Write-Host "  $ESC[31mYou picked red!$ESC[0m" }
    "g" { Write-Host "  $ESC[32mYou picked green!$ESC[0m" }
    "b" { Write-Host "  $ESC[34mYou picked blue!$ESC[0m" }
    default { Write-Host "  $ESC[35mUnknown choice, but that's OK!$ESC[0m" }
}
Write-Host ""

# --- Section 8: Formatted Table ---
Write-Host "$ESC[1m[7/7] Formatted Table$ESC[0m"
Write-Host "  $ESC[2m┌──────────────┬────────┬───────────┐$ESC[0m"
Write-Host "  $ESC[2m│$ESC[0m $ESC[1mProcess$ESC[0m      $ESC[2m│$ESC[0m $ESC[1mPID$ESC[0m    $ESC[2m│$ESC[0m $ESC[1mStatus$ESC[0m    $ESC[2m│$ESC[0m"
Write-Host "  $ESC[2m├──────────────┼────────┼───────────┤$ESC[0m"
Write-Host "  $ESC[2m│$ESC[0m conduit      $ESC[2m│$ESC[0m 1024   $ESC[2m│$ESC[0m $ESC[32mrunning$ESC[0m   $ESC[2m│$ESC[0m"
Write-Host "  $ESC[2m│$ESC[0m backup.ps1   $ESC[2m│$ESC[0m 2048   $ESC[2m│$ESC[0m $ESC[33mpending$ESC[0m   $ESC[2m│$ESC[0m"
Write-Host "  $ESC[2m│$ESC[0m cleanup.ps1  $ESC[2m│$ESC[0m 3072   $ESC[2m│$ESC[0m $ESC[31mfailed$ESC[0m    $ESC[2m│$ESC[0m"
Write-Host "  $ESC[2m│$ESC[0m deploy.ps1   $ESC[2m│$ESC[0m 4096   $ESC[2m│$ESC[0m $ESC[32mrunning$ESC[0m   $ESC[2m│$ESC[0m"
Write-Host "  $ESC[2m└──────────────┴────────┴───────────┘$ESC[0m"
Write-Host ""

# --- Summary ---
$cols = $Host.UI.RawUI.WindowSize.Width
$rows = $Host.UI.RawUI.WindowSize.Height
Write-Host "$ESC[1;36m══════════════════════════════════════════$ESC[0m"
Write-Host "$ESC[1;32m  All tests passed! (.ps1 on $($PSVersionTable.OS ?? 'Windows'))$ESC[0m"
Write-Host "$ESC[2m  TERM=$env:TERM | PowerShell $($PSVersionTable.PSVersion) | ${cols}x${rows}$ESC[0m"
Write-Host "$ESC[1;36m══════════════════════════════════════════$ESC[0m"
