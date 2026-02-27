# Conduit

A cross-platform desktop app for organizing, running, and scheduling shell scripts from one place.

Built with **Tauri v2**, **React 19**, **TypeScript**, and **Rust**.

## Features

- **Script Management** — Add, edit, and organize scripts into color-coded categories
- **Live Terminal Output** — Run scripts and stream stdout/stderr in real time with virtualized scrolling
- **Run History** — Track exit codes, duration, and output for every execution
- **Scheduling** — Schedule scripts to run daily, weekly, or at fixed intervals via launchd (macOS), Task Scheduler (Windows), or systemd timers (Linux)
- **Search & Filter** — Quickly find scripts by name, description, or category
- **Keyboard Shortcuts** — `Cmd/Ctrl+N` (add), `Cmd/Ctrl+R` (run), `Cmd/Ctrl+F` (search), `Esc` (back)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Tauri v2 |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v3 |
| State | Zustand v5 |
| Backend | Rust, rusqlite (SQLite) |
| Scheduling | launchd (macOS) / Task Scheduler (Windows) / systemd timers (Linux) |
| Package Manager | pnpm |

## Prerequisites

- **macOS**, **Windows 10+**, or **Linux** (systemd-based distro)
- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- [Rust](https://rustup.rs/)

## Getting Started

```bash
# Install dependencies
pnpm install

# Run in development
pnpm tauri dev

# Build for production
pnpm tauri build
```

The app stores its database at `~/.conduit/conduit.db` and scheduled run logs at `~/.conduit/logs/`.

## Project Structure

```
src/                    # React frontend
├── components/
│   ├── Layout/         # Sidebar, TopBar, MainContent, EmptyState
│   ├── Runner/         # ScriptDetailView, TerminalOutput, RunHistoryItem
│   ├── Schedule/       # SchedulePanel, ScheduleDialog, ScheduleIndicator
│   ├── Scripts/        # ScriptCard, ScriptList, AddScriptDialog, EditScriptDialog
│   └── UI/             # Button, ColorPicker, ConfirmDialog, Toast, ErrorBoundary
├── hooks/              # useScriptRunner, useKeyboardShortcuts, useToast
├── stores/             # Zustand stores (scripts, categories, runner, schedules)
├── lib/tauri.ts        # Typed invoke wrappers
└── types/index.ts      # Shared TypeScript interfaces

src-tauri/              # Rust backend
├── src/
│   ├── commands/       # Tauri commands (scripts, categories, runner, scheduler, history)
│   ├── db/             # SQLite database, schema, queries
│   ├── models.rs       # Serde structs
│   └── lib.rs          # Plugin registration and state management
└── tauri.conf.json     # Tauri configuration
```
