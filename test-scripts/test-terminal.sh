#!/bin/bash
# ============================================================
# Conduit Terminal Test Script (.sh — macOS / Linux)
# Tests PTY features: colors, input, cursor control, etc.
# ============================================================

BOLD="\033[1m"
DIM="\033[2m"
ITALIC="\033[3m"
UNDERLINE="\033[4m"
REVERSE="\033[7m"
RESET="\033[0m"

RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
MAGENTA="\033[35m"
CYAN="\033[36m"
WHITE="\033[37m"

BG_RED="\033[41m"
BG_GREEN="\033[42m"
BG_YELLOW="\033[43m"
BG_BLUE="\033[44m"

clear

# --- Section 1: Basic Colors ---
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║     CONDUIT TEST — Bash (.sh)            ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════╝${RESET}"
echo ""

echo -e "${BOLD}[1/7] ANSI Color Test${RESET}"
echo -e "  ${RED}■ Red${RESET}  ${GREEN}■ Green${RESET}  ${YELLOW}■ Yellow${RESET}  ${BLUE}■ Blue${RESET}  ${MAGENTA}■ Magenta${RESET}  ${CYAN}■ Cyan${RESET}  ${WHITE}■ White${RESET}"
echo -e "  ${BOLD}${RED}■ Bold Red${RESET}  ${BOLD}${GREEN}■ Bold Green${RESET}  ${BOLD}${YELLOW}■ Bold Yellow${RESET}  ${BOLD}${BLUE}■ Bold Blue${RESET}"
echo -e "  ${BG_RED}${WHITE} BG Red ${RESET} ${BG_GREEN}${WHITE} BG Green ${RESET} ${BG_YELLOW} BG Yellow ${RESET} ${BG_BLUE}${WHITE} BG Blue ${RESET}"
echo ""

# --- Section 2: 256 Colors ---
echo -e "${BOLD}[2/7] 256-Color Palette${RESET}"
for i in $(seq 0 15); do
    printf "\033[48;5;%dm  " "$i"
done
printf "${RESET}\n"
for i in $(seq 16 6 231); do
    for j in $(seq 0 5); do
        printf "\033[48;5;%dm  " $((i + j))
    done
done
printf "${RESET}\n"
echo ""

# --- Section 3: Text Styles ---
echo -e "${BOLD}[3/7] Text Styles${RESET}"
echo -e "  ${BOLD}Bold text${RESET}"
echo -e "  ${DIM}Dim text${RESET}"
echo -e "  ${ITALIC}Italic text${RESET}"
echo -e "  ${UNDERLINE}Underlined text${RESET}"
echo -e "  ${REVERSE}Reversed text${RESET}"
echo -e "  ${BOLD}${UNDERLINE}${GREEN}Combined: bold + underline + green${RESET}"
echo ""

# --- Section 4: Progress Bar ---
echo -e "${BOLD}[4/7] Progress Bar (cursor control)${RESET}"
WIDTH=40
for i in $(seq 1 $WIDTH); do
    PERCENT=$(( i * 100 / WIDTH ))
    FILLED=""
    EMPTY=""
    for j in $(seq 1 $i); do FILLED="${FILLED}█"; done
    for j in $(seq $((i + 1)) $WIDTH); do EMPTY="${EMPTY}░"; done
    printf "\r  ${GREEN}${FILLED}${DIM}${EMPTY}${RESET} %3d%%" "$PERCENT"
    sleep 0.05
done
echo ""
echo -e "  ${GREEN}✓ Complete${RESET}"
echo ""

# --- Section 5: Spinner ---
echo -e "${BOLD}[5/7] Spinner Animation${RESET}"
FRAMES=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
for cycle in $(seq 1 3); do
    for frame in "${FRAMES[@]}"; do
        printf "\r  ${CYAN}${frame}${RESET} Processing cycle ${cycle}/3..."
        sleep 0.08
    done
done
printf "\r  ${GREEN}✓${RESET} Processing complete!    \n"
echo ""

# --- Section 6: Interactive Input ---
echo -e "${BOLD}[6/7] Interactive Input Test${RESET}"
echo -e "  ${YELLOW}Type your name and press Enter:${RESET}"
printf "  > "
read -r USERNAME
echo -e "  ${GREEN}Hello, ${BOLD}${USERNAME}${RESET}${GREEN}!${RESET}"
echo ""

echo -e "  ${YELLOW}Pick a color [r/g/b]:${RESET}"
printf "  > "
read -r -n 1 COLOR_PICK
echo ""
case "$COLOR_PICK" in
    r|R) echo -e "  ${RED}You picked red!${RESET}" ;;
    g|G) echo -e "  ${GREEN}You picked green!${RESET}" ;;
    b|B) echo -e "  ${BLUE}You picked blue!${RESET}" ;;
    *)   echo -e "  ${MAGENTA}Unknown choice, but that's OK!${RESET}" ;;
esac
echo ""

# --- Section 7: Formatted Table ---
echo -e "${BOLD}[7/7] Formatted Table${RESET}"
echo -e "  ${DIM}┌──────────────┬────────┬───────────┐${RESET}"
echo -e "  ${DIM}│${RESET} ${BOLD}Process${RESET}      ${DIM}│${RESET} ${BOLD}PID${RESET}    ${DIM}│${RESET} ${BOLD}Status${RESET}    ${DIM}│${RESET}"
echo -e "  ${DIM}├──────────────┼────────┼───────────┤${RESET}"
echo -e "  ${DIM}│${RESET} conduit      ${DIM}│${RESET} 1024   ${DIM}│${RESET} ${GREEN}running${RESET}   ${DIM}│${RESET}"
echo -e "  ${DIM}│${RESET} backup.sh    ${DIM}│${RESET} 2048   ${DIM}│${RESET} ${YELLOW}pending${RESET}   ${DIM}│${RESET}"
echo -e "  ${DIM}│${RESET} cleanup.sh   ${DIM}│${RESET} 3072   ${DIM}│${RESET} ${RED}failed${RESET}    ${DIM}│${RESET}"
echo -e "  ${DIM}│${RESET} deploy.sh    ${DIM}│${RESET} 4096   ${DIM}│${RESET} ${GREEN}running${RESET}   ${DIM}│${RESET}"
echo -e "  ${DIM}└──────────────┴────────┴───────────┘${RESET}"
echo ""

# --- Summary ---
echo -e "${BOLD}${CYAN}══════════════════════════════════════════${RESET}"
echo -e "${BOLD}${GREEN}  All tests passed! (.sh on $(uname -s))${RESET}"
echo -e "${DIM}  TERM=$TERM | Shell=$SHELL | $(tput cols)x$(tput lines)${RESET}"
echo -e "${BOLD}${CYAN}══════════════════════════════════════════${RESET}"
