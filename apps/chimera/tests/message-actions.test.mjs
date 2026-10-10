import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the message menu offers copy, edit, pin, branch and delete; none of it is voice playback', async () => {
  const page = await read('src/pages/ConversationPage.tsx');
  for (const id of ['copy', 'edit', 'pin', 'branch', 'delete']) assert.match(page, new RegExp(`id: '${id}'`), id);
  assert.doesNotMatch(page + (await read('src/components/chat/MessageMenu.tsx')), /speechSynthesis|SpeechSynthesis|text-to-speech|textToSpeech/i);
  assert.match(page, /label: 'Start new chat from here'/);
});

test('branching uses the database function that copies the scene up to the message; nothing is copied by the page', async () => {
  const page = await read('src/pages/ConversationPage.tsx');
  assert.match(page, /rpc\('branch_chimera_conversation', \{\s*p_conversation_id: conversationId,\s*p_message_id: message\.id,\s*p_request_id: crypto\.randomUUID\(\)/);
  assert.match(page, /navigate\(`\/chats\/\$\{created\.conversation_id\}`\)/);
});

test('deleting hides the message (soft delete) and asks first; it never removes a row, and never the last message of a scene', async () => {
  const page = await read('src/pages/ConversationPage.tsx');
  assert.match(page, /update\(\{ deleted_at: new Date\(\)\.toISOString\(\) \}\)/);
  assert.doesNotMatch(page, /from\('messages'\)\s*\.delete\(\)/, 'no hard delete of messages');
  assert.match(page, /messages\.length <= 1/, 'the last message stays');
  assert.match(page, /<ConfirmDialog/);
  assert.match(page, /\.is\('deleted_at', null\)\s*\.select\('id'\)/, 'only a message that is still there can be deleted, and an empty result is an error');
});

test('editing saves the stored text of one message of this scene, refuses empty text, and reports a refusal instead of pretending', async () => {
  const page = await read('src/pages/ConversationPage.tsx');
  assert.match(page, /update\(\{ content: text \}\)\.eq\('id', original\.id\)\.eq\('conversation_id', conversationId!\)/);
  assert.match(page, /A message cannot be empty/);
  assert.match(page, /error \|\| !data\?\.length/);
  // Only the author edits; the owner of the scene may also edit the character's messages. The database enforces the same.
  assert.match(page, /const mayChange = \(message: ChatMessageRow\) => isMine\(message\) \|\| \(message\.sender_id === scene\.botUserId && scene\.createdByMe\)/);
});

test('messages are drawn with the safe renderer, the long press ignores the mouse, and touch screens do not select text under the finger', async () => {
  const row = await read('src/components/chat/MessageRow.tsx');
  assert.match(row, /<RichMessage text=\{content\} \/>/);
  const press = await read('src/hooks/useLongPress.ts');
  assert.match(press, /pointerType === 'mouse'\) return/, 'a mouse uses right click, not a timer');
  assert.match(press, /onContextMenu/);
  assert.match(press, /onPointerCancel: cancel/, 'a scroll cancels it');
  const css = await read('src/index.css');
  assert.match(css, /@media \(pointer: coarse\)[\s\S]*-webkit-touch-callout: none[\s\S]*user-select: none/);
  // The editor must stay typeable: the no-select rule is not applied while editing.
  assert.match(row, /edit \? 'w-full' : 'msg-bubble/);
});

test('the menu is accessible: a menu role, items with roles, keyboard focus loop, Escape, a labelled three-dot button', async () => {
  const menu = await read('src/components/chat/MessageMenu.tsx');
  assert.match(menu, /role="menuitem"/);
  assert.match(menu, /role=\{role\}/);
  assert.match(menu, /useDialogFocus/);
  assert.match(menu, /ArrowDown/);
  assert.match(menu, /motion-reduce:transition-none/, 'respects reduced motion');
  const row = await read('src/components/chat/MessageRow.tsx');
  assert.match(row, /aria-haspopup="menu"/);
  assert.match(row, /aria-label=\{`Actions for the message from/);
});

test('a scene whose last message is the player\'s can ask the character to reply, but not while a send is under way', async () => {
  const page = await read('src/pages/ConversationPage.tsx');
  assert.match(page, /awaitingReply && !busy && !replyPending && !replyError/);
  assert.match(page, /setReplyPending\(true\)/);
  assert.match(page, /finally \{\s*setReplyPending\(false\)/);
});
