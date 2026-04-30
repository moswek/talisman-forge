# Talisman Forge

Talisman Forge is a standalone, cross-platform agent workspace desktop app.

## Product direction
A high-speed desktop workspace for solo builders and small teams:
- task board with status flow
- native terminal run sessions (PTY first, spawn fallback)
- agent swarm tracking lanes
- context stack + timeline + review notes
- import/export project snapshots

## Platform targets
- macOS 12+
- Windows
- Linux

## Status
Release candidate track (v0.5.0).

### Implemented
- Room-based workspace architecture
- Resizable side panes
- Live terminal execution via Electron IPC + node-pty (spawn fallback when unavailable)
- Terminal input + resize channel for interactive command flows
- Command templates + keyboard shortcuts (`Ctrl/Cmd+K`, `Ctrl/Cmd+S`, `Ctrl/Cmd+O`)
- Agent/task/context lifecycle
- Timeline + filtering
- Local persistence + JSON export/import
- Update-check scaffold via electron-updater
- CI build workflows + tag-based release workflow

### Remaining before full production
1. Signed installers + notarization credentials
2. Crash telemetry endpoint wiring

## Run
```bash
cd /home/ubuntu/talisman-forge
npm install
npm run dev
```

## Build
```bash
npm run build
```
