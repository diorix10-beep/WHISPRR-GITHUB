export type DeviceActivityApp = 'imessage' | 'whatsapp';

export interface DeviceActivityMessage {
  id: string;
  app: DeviceActivityApp;
  contact: string;
  body: string;
  time: string;
  direction: 'incoming' | 'outgoing';
  deleted?: boolean;
  edited?: boolean;
  replyToId?: string | null;
  createdAt: string;
}

export interface DeviceActivityParseResult {
  messages: DeviceActivityMessage[];
  textWithoutDeviceActivity: string;
}

export const DEVICE_SCENE_EVENT_PREFIX = '[CHIMERA_DEVICE_EVENT]';

const messageHeaderPattern = /^\s*\[(?:📱\s*)?(?:(IMESSAGE|WHATSAPP)(?:\s+MESSAGE)?|MESSAGE)\s+[—-]\s+(.+?)(?:\s*\|\s*([^\]]+))?\]\s*$/i;
const sceneTimestampPattern = /\[\s*(?:📅\s*)?TIMESTAMP\s*:\s*([^\]|]+)(?:\|\s*([^\]]+))?\]/i;

function normalizeMessageBody(line: string): string {
  return line
    .trim()
    .replace(/^["“”]+/, '')
    .replace(/["“”]+$/, '')
    .trim();
}

function getSceneFallbackTime(text: string): string {
  const match = text.match(sceneTimestampPattern);
  const timePart = match?.[2]?.trim();
  if (timePart) return timePart;
  return 'Now';
}

function makeDeviceMessageId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return `device-${Math.abs(hash).toString(36)}`;
}

export function parseDeviceActivityFromText(text: string | null | undefined): DeviceActivityParseResult {
  const source = text || '';
  const fallbackTime = getSceneFallbackTime(source);
  const lines = source.split(/\r?\n/);
  const messages: DeviceActivityMessage[] = [];
  const keepLines: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const headerMatch = line.match(messageHeaderPattern);

    if (/^\s*\[(?:📱\s*)?DEVICE ACTIVITY\]\s*$/i.test(line)) {
      continue;
    }

    if (!headerMatch) {
      keepLines.push(line);
      continue;
    }

    const app: DeviceActivityApp = (headerMatch[1] || '').toLowerCase().includes('whatsapp') ? 'whatsapp' : 'imessage';
    const contact = headerMatch[2].trim();
    const time = headerMatch[3]?.trim() || fallbackTime;
    let body = '';
    let consumedBodyLine = false;

    for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
      const nextLine = lines[nextIndex];
      if (!nextLine.trim()) {
        continue;
      }
      if (/^\s*\[.*\]\s*$/.test(nextLine)) {
        break;
      }

      body = normalizeMessageBody(nextLine);
      index = nextIndex;
      consumedBodyLine = true;
      break;
    }

    if (!body) {
      body = 'New message';
    }

    const id = makeDeviceMessageId(`${app}|${contact}|${time}|${body}|${messages.length}`);
    messages.push({
      id,
      app,
      contact,
      time,
      body,
      direction: 'incoming',
      deleted: false,
      edited: false,
      replyToId: null,
      createdAt: new Date(0).toISOString(),
    });

    if (!consumedBodyLine) {
      continue;
    }
  }

  return {
    messages,
    textWithoutDeviceActivity: keepLines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  };
}

export function createDeviceSceneEventContent(params: {
  actorName: string;
  contact: string;
  replyBody: string;
  repliedToBody?: string | null;
  time: string;
}): string {
  const lines = [
    DEVICE_SCENE_EVENT_PREFIX,
    `${params.actorName} replied to ${params.contact} on their phone at ${params.time}.`,
  ];

  if (params.repliedToBody) {
    lines.push(`Replying to: "${params.repliedToBody}"`);
  }

  lines.push(`Message: "${params.replyBody}"`);
  return lines.join('\n');
}

export function parseDeviceSceneEvent(content: string | null | undefined): {
  title: string;
  body: string;
  detail?: string;
} | null {
  if (!content?.startsWith(DEVICE_SCENE_EVENT_PREFIX)) return null;

  const lines = content.split(/\r?\n/).slice(1).map((line) => line.trim()).filter(Boolean);
  const title = lines[0] || 'Phone activity';
  const messageLine = lines.find((line) => line.startsWith('Message:'));
  const body = messageLine?.replace(/^Message:\s*/i, '').replace(/^"|"$/g, '') || lines[lines.length - 1] || '';
  const detail = lines.find((line) => line.startsWith('Replying to:'))?.replace(/^Replying to:\s*/i, '');

  return { title, body, detail };
}
