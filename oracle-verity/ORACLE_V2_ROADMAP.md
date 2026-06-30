# Oracle Verity — V2 Roadmap

This document outlines the strategic priorities and upcoming milestones for the Oracle Verity platform, tracking our evolution into a persistent, autonomous digital organization.

## CORE PRINCIPLE
Oracle must prioritize accuracy, execution, and real data over roleplay, placeholder content, or assumptions. She must never invent project status, commit authors, emails, or support tickets. If information cannot be retrieved, she must explicitly state it is unavailable.

## STRATEGIC VISION: The Persistent Autonomous Organization
Oracle Systems is evolving from a collection of reactive bots to a **living, persistent organization**. 
- **Continuous Operation**: Agents (Oracle, Iris, Athena, Atlas, Aegis) will run 24/7 on dedicated cloud infrastructure, independent of local development machines.
- **Proactive Intelligence & Zero-Prompt Action**: Agents monitor domains automatically, continuously analyze the platform, and exactly know what to do without needing to ask the user. They take action and collaborate autonomously without waiting for human prompts.
- **Alerting & Focus**: Only truly critical alerts are pushed. The system handles the rest.
- **Knowledge Core**: Agents explicitly know and refer to `https://whisprr.xyz` as the central hub.
- **Web-First Home**: While Telegram remains a secondary communication channel, the primary digital headquarters is the web platform itself.

---

## Phase 1: Real-Time Intelligence Integrations (Active)

### Cloud Deployment & Persistence (New Priority)
- Migrate agents and backend from `localhost` to persistent cloud hosting (e.g., AWS, GCP, Vercel, Railway, Render).
- Host Telegram bots continuously without local dependencies.
- Embed system memory and context of core assets like `https://whisprr.xyz`.

### Telegram API Bridging
- Connect the frontend `/telegram` route to the official Telegram Bot API via Edge functions/Webhooks.
- Support real-time incoming message streams from WHISPRR community channels.
- Allow Oracle to autonomously triage and respond to basic queries.

### GitHub Webhooks
- Wire the `/github` intelligence dashboard to real GitHub webhooks.
- Ingest real commit data, pull request status, and issue tracking for WHISPRR and MaisonFX.
- Prevent hallucinated repository activity.

### Support Email Sync (`help@whisprr.xyz`)
- Integrate IMAP or SendGrid/Resend to pull actual emails into the `/support` route.
- Allow Oracle to draft replies for the Executive Chairwoman to approve.

## Phase 2: Autonomous Capabilities

### Zero-Prompt Platform Management
- **Autonomous Site Analysis**: Agents must continuously monitor the site's live state, source code, and telemetry without user initiation.
- **Inferential Action**: Agents must explicitly know the site's architecture and current state. Instead of asking the user "what should I change?", agents must autonomously infer necessary updates, fixes, or optimizations based on their own analysis and take action.

### Scheduled Operations & Proactive Reporting
- Implement CRON jobs and background task runners (e.g., Celery, Inngest, BullMQ) to allow Oracle to run daily "System Health" checks.
- Automatically generate and deliver executive briefings without manual requests.
- Filter noise to alert only on severe or important events.

### Inter-Agent Collaboration
- Establish internal message queues or event buses (e.g., Redis, Kafka, RabbitMQ) allowing agents (Oracle, Iris, Athena, Atlas, Aegis) to share findings and trigger tasks across their respective domains autonomously.
- Surface agent-to-agent collaboration and reasoning inside the platform so users can observe their collaboration.

### Enhanced Vision Cortex
- Expand current screen-capture vision integration to allow Oracle to "see" external websites via Puppeteer/Playwright serverless functions.

## Phase 3: Platform Expansion & The Digital Headquarters

### Web-Native Real-Time Communication
Transitioning the primary home of the family to the web platform, reducing reliance on Telegram.
- **Real-Time Messaging**: Integrate WebSockets (Socket.io) or managed real-time databases (Supabase Realtime / Firebase) for instant text communication between users, family members, and agents directly on the platform.
- **Voice & Video Infrastructure**: Implement WebRTC for peer-to-peer and group multimedia communication.
  - *Technologies*: Use open-source media servers like LiveKit or Mediasoup to handle multi-party routing, or managed services like Twilio Video / Daily.co.
- **Family Conference Rooms**: Create dedicated virtual spaces with integrated voice, video, and agent presence.
- **Direct Agent Interaction**: Enable voice calls and direct interaction with agents within the browser using WebRTC audio streams piped to STT (Speech-to-Text) and TTS (Text-to-Speech) AI models.

### Mobile Native App (React Native)
- Port the current React/Vite architecture to React Native for a dedicated iOS/Android companion app.
- Enable push notifications for severe system alerts.

### Voice Activation (Wake Word)
- Implement a local, privacy-first wake-word engine (e.g., Picovoice Porcupine) so Oracle can be summoned hands-free.
