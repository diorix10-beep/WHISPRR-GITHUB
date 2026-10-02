import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
export function CollaborationInvitations({
  onChanged,
}: {
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const userId = user?.id;
  const { showToast } = useToast();
  const [invites, setInvites] = useState<
    Array<{
      id: string;
      project_type: string;
      project_id: string;
      role: string;
      project_title: string;
      inviter_name: string;
    }>
  >([]);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!userId) {
      setInvites([]);
      return;
    }
    supabase.rpc("get_my_chimera_project_invitations").then(({ data }) => {
      if (active) setInvites(Array.isArray(data) ? data : []);
    });
    return () => {
      active = false;
    };
  }, [userId]);
  const respond = async (id: string, accept: boolean) => {
    if (busy) return;
    setBusy(id);
    try {
      const { error } = await supabase.rpc("respond_chimera_collaboration", {
        p_id: id,
        p_accept: accept,
      });
      if (error) throw error;
      setInvites((old) => old.filter((i) => i.id !== id));
      onChanged();
      showToast(
        accept ? "Collaboration accepted." : "Invitation declined.",
        "success",
      );
    } catch {
      showToast("The invitation could not be updated.", "error");
    } finally {
      setBusy(null);
    }
  };
  if (!invites.length) return null;
  return (
    <section
      aria-label="Project collaboration invitations"
      className="border rounded-xl p-4 space-y-3"
    >
      <h2 className="font-semibold">Collaboration invitations</h2>
      <p className="text-sm">
        Accepting grants{" "}
        {invites.some((i) => i.role === "editor")
          ? "the stated read/edit"
          : "read"}{" "}
        access to private drafts. Creators retain ownership and publication
        control.
      </p>
      {invites.map((i) => (
        <div key={i.id} className="flex flex-wrap items-center gap-3">
          <span>
            {i.project_type}: {i.project_title} · {i.role} · invited by{" "}
            {i.inviter_name}
          </span>
          <button
            disabled={!!busy}
            className="btn-primary"
            onClick={() => void respond(i.id, true)}
          >
            Accept
          </button>
          <button
            disabled={!!busy}
            className="btn-secondary"
            onClick={() => void respond(i.id, false)}
          >
            Decline
          </button>
        </div>
      ))}
    </section>
  );
}
