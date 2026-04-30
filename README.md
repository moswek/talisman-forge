# Talisman Forge

Talisman Forge is a standalone, cross-platform agent workspace desktop app.

## Product direction
BridgeSpace-style environment with stronger execution control:
- task board with status flow
- native terminal run sessions (live stdout/stderr)
- agent swarm tracking lanes
- context stack + timeline + review notes
- import/export project snapshots

## Platform targets
- macOS 12+
- Windows
- Linux

## Status
Phase 1 complete (functional desktop MVP).

### Implemented
- Room-based workspace architecture
- Live terminal execution via Electron IPC + child processes
- Agent/task/context lifecycle
- Timeline and review workflow
- Local persistence + JSON export/import

### Next for production readiness
1. Embedded PTY interactive terminal (stdin + resize)
2. Workspace tabs and pane docking
3. Command templates and keyboard shortcuts
4. Crash reporting and diagnostics
5. Auto-update channel + signed release pipeline

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
