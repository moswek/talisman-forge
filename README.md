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
- CI build workflows + tag-based release workflow (Linux/Windows/macOS matrix)
- Crash log telemetry endpoint wiring (`TF_CRASH_ENDPOINT`) + manual test action

### Remaining before full production
1. Signed installers + notarization credentials

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

## Optional crash telemetry
Set an endpoint before launching to receive JSON crash/test events:

```bash
export TF_CRASH_ENDPOINT="https://your-endpoint.example.com/talisman-forge/crash"
npm run dev
```

In app: use **Send telemetry test** to verify delivery.
