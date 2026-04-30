# Talisman Forge

A fluid, practical, cross-platform desktop app for Digital Talisman growth operations.

## What it does (MVP)
- **Dashboard**: pipeline KPIs and daily focus
- **Leads**: capture and track opportunities
- **Outreach**: generate concise first-touch messages (A/B variants)
- **Follow-ups**: enforce 2-follow-up lifecycle and auto close-lost behavior
- **Content Engine**: daily LinkedIn, Reddit, TikTok output blocks

## Platform targets
- macOS 12+
- Windows
- Linux

## Tech
- Electron
- Vanilla HTML/CSS/JS (fast and lightweight)
- localStorage for MVP persistence

## Run locally
```bash
cd /home/ubuntu/talisman-forge
npm install
npm run dev
```

## Build installers
```bash
npm run build
```

## Repo push (if auth missing)
If push fails due credentials, authenticate then run:
```bash
cd /home/ubuntu/talisman-forge
git push -u origin main
```

## Next phase
- Google Sheets live CRM sync
- Twilio/Resend send actions from app
- Timezone-aware scheduling assistant
- Analytics history charts
