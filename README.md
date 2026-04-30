# Talisman Forge

Talisman Forge is a side-project desktop app inspired by modern agent workspaces.

## Scope (isolated from agency ops)
This project is intentionally independent from Digital Talisman CRM/outreach automation.
It focuses on a general-purpose build workspace for:
- multi-room coordination
- task tracking
- terminal session queueing
- agent swarm orchestration
- context stack + review workflow

## Platform targets
- macOS 12+
- Windows
- Linux

## Current status
Polished MVP shell with interactive workspace mechanics and local persistence.

## Run
```bash
cd /home/ubuntu/talisman-forge
npm install
npm run dev
```

## Build installers
```bash
npm run build
```

## Next phase
- Native terminal pane embedding (pty)
- Multi-agent run timelines
- Project/repo binding
- Prompt/context templates
- Session replay and export
