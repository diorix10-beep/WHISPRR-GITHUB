import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GitBranch, Pencil, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { branchNote, formatWhen, loadScenes, sceneName, type SceneListItem } from '../../../lib/sceneList';
import { SCENE_LIMITS, deleteScene, renameScene } from '../../../lib/sceneSettings';
import { ConfirmDialog } from '../MessageMenu';

/**
 * Every chat the player has with this character: open one, start a new one, rename or delete. A chat made with "Start new
 * chat from here" is marked as a branch of the one it came from and is otherwise independent. Deleting asks first and only
 * works on chats the player created (the database decides); chats branched from a deleted one are kept.
 */
export function HistorySection({ userId, botUserId, botName, currentId, reloadKey, onNewChat, onRenamedCurrent, onOpen }: {
  userId: string;
  botUserId: string;
  botName: string;
  currentId: string;
  /** Changes when the panel should read the list again. */
  reloadKey: number;
  onNewChat: () => void;
  onRenamedCurrent: (title: string | null) => void;
  /** Called when the player opens another chat, so the panel can close on a phone. */
  onOpen: () => void;
}) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [scenes, setScenes] = useState<SceneListItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; text: string; busy: boolean } | null>(null);
  const [removing, setRemoving] = useState<{ id: string; busy: boolean } | null>(null);

  useEffect(() => {
    let active = true;
    setFailed(false);
    loadScenes(userId, { characterUserId: botUserId }).then(
      (list) => active && setScenes(list),
      () => active && setFailed(true),
    );
    return () => {
      active = false;
    };
  }, [userId, botUserId, reloadKey]);

  const saveName = async () => {
    if (!renaming || renaming.busy) return;
    setRenaming({ ...renaming, busy: true });
    try {
      const title = await renameScene(renaming.id, renaming.text);
      setScenes((list) => list?.map((s) => (s.id === renaming.id ? { ...s, title } : s)) ?? list);
      if (renaming.id === currentId) onRenamedCurrent(title);
      setRenaming(null);
    } catch {
      showToast('We could not rename this chat. Please try again.', 'error');
      setRenaming((state) => (state ? { ...state, busy: false } : state));
    }
  };

  const remove = async () => {
    if (!removing || removing.busy) return;
    setRemoving({ ...removing, busy: true });
    try {
      await deleteScene(removing.id);
      showToast('Chat deleted.', 'success');
      if (removing.id === currentId) {
        navigate('/chats');
        return;
      }
      setScenes((list) => list?.filter((s) => s.id !== removing.id) ?? list);
      setRemoving(null);
    } catch {
      showToast('We could not delete this chat. Only chats you started can be deleted. Nothing was changed.', 'error');
      setRemoving(null);
    }
  };

  const target = scenes?.find((s) => s.id === removing?.id);

  return (
    <div className="space-y-4">
      <button type="button" onClick={onNewChat} className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] hover:brightness-110">
        <Plus size={18} aria-hidden="true" /> Start a new chat with {botName}
      </button>

      {failed ? (
        <p role="note" className="text-sm text-amber-200">We could not load your chats right now. Please try again in a moment.</p>
      ) : scenes === null ? (
        <p className="text-sm text-chimera-mute" role="status">Loading…</p>
      ) : scenes.length === 0 ? (
        <p className="text-sm text-chimera-mute">No chats yet.</p>
      ) : (
        <ul className="space-y-2" aria-label={`Your chats with ${botName}`}>
          {scenes.map((scene) => {
            const current = scene.id === currentId;
            const note = branchNote(scene, scenes);
            return (
              <li key={scene.id} className={`rounded-xl border p-2 ${current ? 'border-chimera-gold bg-chimera-gold/10' : 'border-chimera-gold/20 bg-chimera-bg'}`}>
                {renaming?.id === scene.id ? (
                  <div className="space-y-2 p-1">
                    <label htmlFor={`rename-${scene.id}`} className="block text-xs font-bold text-chimera-gold">Name this chat</label>
                    <input
                      id={`rename-${scene.id}`}
                      value={renaming.text}
                      onChange={(e) => setRenaming({ ...renaming, text: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void saveName();
                        }
                      }}
                      maxLength={SCENE_LIMITS.title}
                      placeholder={scene.characterName}
                      autoFocus
                      className="min-h-[44px] w-full rounded-xl border border-chimera-gold/25 bg-chimera-panel px-3 text-base text-chimera-ink outline-none focus:border-chimera-gold"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => void saveName()} disabled={renaming.busy} className="min-h-[44px] rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] disabled:opacity-50">{renaming.busy ? 'Saving…' : 'Save'}</button>
                      <button type="button" onClick={() => setRenaming(null)} disabled={renaming.busy} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-1">
                    <Link to={`/chats/${scene.id}`} onClick={() => !current && onOpen()} aria-current={current ? 'page' : undefined} className="min-h-[44px] min-w-0 flex-1 rounded-lg p-2 outline-none focus-visible:ring-2 focus-visible:ring-chimera-gold">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-bold">{sceneName(scene)}</span>
                        {current && <span className="shrink-0 rounded-full bg-chimera-gold px-2 py-0.5 text-[11px] font-bold text-[#1a1208]">This chat</span>}
                      </span>
                      {note && <span className="mt-0.5 flex items-center gap-1 text-xs text-chimera-gold/90"><GitBranch size={12} aria-hidden="true" />{note}</span>}
                      <span className="mt-0.5 block truncate text-sm text-chimera-mute">{scene.preview || 'No messages yet'}</span>
                      <span className="block text-xs text-chimera-mute">{formatWhen(scene.lastAt)}</span>
                    </Link>
                    <button type="button" onClick={() => setRenaming({ id: scene.id, text: scene.title ?? '', busy: false })} aria-label={`Rename ${sceneName(scene)}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-chimera-mute hover:text-chimera-gold"><Pencil size={16} aria-hidden="true" /></button>
                    <button type="button" onClick={() => setRemoving({ id: scene.id, busy: false })} aria-label={`Delete ${sceneName(scene)}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-chimera-mute hover:text-chimera-rose"><Trash2 size={16} aria-hidden="true" /></button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {removing && (
        <ConfirmDialog
          title="Delete this chat?"
          body={`“${target ? sceneName(target) : 'This chat'}” and every message in it will be gone for good. Other chats, including any made from it, are kept. This cannot be undone.`}
          confirmLabel="Delete for good"
          busyLabel="Deleting…"
          busy={removing.busy}
          onConfirm={() => void remove()}
          onCancel={() => setRemoving(null)}
        />
      )}
    </div>
  );
}
