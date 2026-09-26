import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useAndroidSecureFlag } from "@/lib/native-privacy";
import { Search, SquarePen, MessageSquare, X, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveThreadPeer, dmThreadId } from "@/lib/social-data";
import { cacheGet, cacheSet } from "@/lib/local-cache";
import { deleteDirectThreads, hiddenThreadIds } from "@/lib/chat-delete";
import { useChatNames } from "@/lib/chat-names";
import { useSecretChats } from "@/lib/secret-chats";
import { ProfileAvatar } from "@/components/yw/ProfileAvatar";
import { ProtectedCanvasText } from "@/components/yw/ProtectedCanvasContent";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatListPage,
});

interface ChatThread {
  id: string;
  name: string;
  peerId?: string | null;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  avatar_url?: string | null;
}

interface DiscoverProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url?: string | null;
  profile_pic?: string | null;
  profile_image?: string | null;
}

function formatChatListTime(iso: string) {
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) return "Just now";

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return "Just now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;

  const elapsedDays = Math.floor(elapsedSeconds / 86400);
  if (elapsedDays === 1) return "Yesterday";
  if (elapsedDays <= 6) return `${elapsedDays}d ago`;

  const elapsedWeeks = Math.floor(elapsedDays / 7);
  if (elapsedWeeks <= 4) return `${elapsedWeeks}w ago`;

  const elapsedMonths = Math.floor(elapsedDays / 30);
  if (elapsedMonths < 12) return `${Math.max(1, elapsedMonths)}mo ago`;

  return `${Math.max(1, Math.floor(elapsedDays / 365))}y ago`;
}

function ChatListPage() {
  return <NativeChatListPage />;
}

function NativeChatListPage() {
  useAndroidSecureFlag(true);
  // Paint the cached list immediately, then refresh from the network.
  const [threads, setThreads] = useState<ChatThread[]>(
    () => cacheGet<ChatThread[]>("chat-threads") ?? [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [people, setPeople] = useState<DiscoverProfile[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const navigate = useNavigate();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>(() => hiddenThreadIds());
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const { nameFor } = useChatNames();
  const { isHidden, ready: secretChatsReady } = useSecretChats(searchQuery);

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const exitSelect = () => {
    setSelecting(false);
    setSelected([]);
  };


  useEffect(() => {
    let requestGeneration = 0;

    async function loadThreads() {
      const generation = ++requestGeneration;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const me = sessionData.session?.user.id ?? null;
        if (generation !== requestGeneration) return;
        setMe(me);

        if (!me) {
          setThreads([]);
          setLoadError("Sign in to view your chats.");
          return;
        }
        // public.messages is the conversation source of truth. Canonical route
        // ids are derived from the authenticated user and the other endpoint.
        const { data, error } = await supabase
          .from("messages" as never)
          .select("id,sender_id,receiver_id,content,media_url,voice_note_url,is_read,created_at" as never)
          .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
          .order("created_at", { ascending: false })
          .limit(50);

        if (generation !== requestGeneration) return;
        if (!error && data) {
          const map = new Map<string, ChatThread>();
          (data as unknown as Array<{ sender_id: string; receiver_id: string; content: string; media_url: string | null; voice_note_url: string | null; is_read: boolean; created_at: string }>).forEach((msg) => {
            const peerId = msg.sender_id === me ? msg.receiver_id : msg.sender_id;
            const id = dmThreadId(me, peerId);
            const existing = map.get(id);
            const unread =
              (existing?.unreadCount ?? 0) + (!msg.is_read && msg.sender_id !== me ? 1 : 0);
            if (!existing) {
              map.set(id, {
                id,
                name: "Loading…",
                peerId,
                lastMessage: msg.content || (msg.voice_note_url ? "Voice note" : msg.media_url ? "Media file" : "Message"),
                time: formatChatListTime(msg.created_at),
                unreadCount: unread,
              });
              setLoadError(null);
            } else {
              existing.unreadCount = unread;
            }
          });
          const base = Array.from(map.values());
          // Keep already-resolved names from the cache instead of flashing "Loading…".
          setThreads((prev) =>
            base.map((t) => {
              const known = prev.find((p) => p.id === t.id);
              return known ? { ...t, name: known.name, peerId: known.peerId, avatar_url: known.avatar_url } : t;
            }),
          );

          const resolved = await Promise.all(
            base.map(async (t) => {
              const peer = await resolveThreadPeer(t.id, me);
              return {
                ...t,
                name: peer.peerName,
                peerId: peer.peerId,
                avatar_url: peer.avatarUrl ?? null,
              };
            }),
          );
          if (generation !== requestGeneration) return;
          setThreads(resolved);
          cacheSet("chat-threads", resolved.slice(0, 30));
        } else if (error) {
          setLoadError(error.message);
        }
      } catch (cause) {
        if (generation !== requestGeneration) return;
        setThreads([]);
        setLoadError(cause instanceof Error ? cause.message : "Couldn't load your chats.");
      }
    }

    void loadThreads();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let retry: number | null = null;
    let alive = true;
    const subscribe = () => {
      if (!alive) return;
      channel = supabase
        .channel(`chat-list-${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
           { event: "*", schema: "public", table: "messages" },
          () => void loadThreads(),
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            void loadThreads();
            return;
          }
          if (status !== "CHANNEL_ERROR" && status !== "TIMED_OUT" && status !== "CLOSED") return;
          const failed = channel;
          channel = null;
          if (failed && status !== "CLOSED") window.setTimeout(() => void supabase.removeChannel(failed), 0);
          if (alive && !retry) {
            retry = window.setTimeout(() => {
              retry = null;
              subscribe();
            }, 1500);
          }
        });
    };
    subscribe();
    const resyncOnVisible = () => {
      if (document.visibilityState === "visible") void loadThreads();
    };
    const resyncOnOnline = () => void loadThreads();
    document.addEventListener("visibilitychange", resyncOnVisible);
    window.addEventListener("online", resyncOnOnline);
    return () => {
      alive = false;
      if (retry) window.clearTimeout(retry);
      document.removeEventListener("visibilitychange", resyncOnVisible);
      window.removeEventListener("online", resyncOnOnline);
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  // Load real registered accounts for the "new chat" picker.
  useEffect(() => {
    if (!newChatOpen) return;
    let alive = true;
    setPeopleLoading(true);
    setPeopleError(null);
    const t = setTimeout(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user.id ?? null;
        if (alive) setMe(uid);

        const term = peopleQuery.trim();
        const { data, error } = await supabase.rpc("search_profiles", { search: term });
        if (!alive) return;
        if (error) throw error;
        setPeople(((data ?? []) as DiscoverProfile[]).filter((p) => p.id !== uid));
      } catch (cause) {
        if (!alive) return;
        setPeople([]);
        setPeopleError(cause instanceof Error ? cause.message : "Couldn't search accounts.");
      } finally {
        if (alive) setPeopleLoading(false);
      }
    }, 220);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [newChatOpen, peopleQuery]);

  const pinQuery = /^\d{4,8}$/.test(searchQuery.trim());
  const filteredThreads = secretChatsReady && me
    ? threads.filter(
        (t) =>
          !hidden.includes(t.id) &&
          !isHidden(t.peerId) &&
          (pinQuery ? true :
          (t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))),
      )
    : [];

  const allSelected = filteredThreads.length > 0 && selected.length === filteredThreads.length;

  const removeSelected = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    setDeleting(true);
    setHidden((prev) => [...prev, ...ids]);
    setThreads((prev) => prev.filter((t) => !ids.includes(t.id)));
    await deleteDirectThreads(ids);
    setDeleting(false);
    exitSelect();
  };

  const startPress = (id: string) => {
    longPressed.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      setSelecting(true);
      setSelected([id]);
    }, 400);
  };
  const cancelPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  return (
    <div className="flex h-screen flex-col bg-black text-white p-4">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        {selecting ? (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={exitSelect}
                aria-label="Cancel selection"
                className="rounded-full p-2 hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-bold">{selected.length} selected</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setSelected(allSelected ? [] : filteredThreads.map((t) => t.id))
                }
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800"
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
              <button
                onClick={() => void removeSelected()}
                disabled={!selected.length || deleting}
                aria-label="Delete selected chats"
                className="rounded-full bg-red-600 p-2 disabled:opacity-40"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Chats</h1>
            <div className="flex items-center gap-1">
              {filteredThreads.length > 0 ? (
                <button
                  onClick={() => setSelecting(true)}
                  className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800"
                >
                  Select
                </button>
              ) : null}
              <button
                onClick={() => setNewChatOpen(true)}
                aria-label="Start a new chat"
                className="p-2 hover:bg-zinc-800 rounded-full"
              >
                <SquarePen className="h-6 w-6" />
              </button>
            </div>
          </>
        )}
      </div>


      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search messages"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-zinc-700"
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto space-y-2">
         {loadError ? <p role="alert" className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-xs text-red-300">{loadError}</p> : null}
        {!secretChatsReady || !me ? (
          <p className="py-6 text-center text-sm text-gray-500">Loading chats…</p>
        ) : filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">No chats found. Click top icon to start!</p>
          </div>
        ) : (
          filteredThreads.map((chat) => {
            const isSel = selected.includes(chat.id);
            const body = (
              <>
                <div className="flex items-center gap-3">
                  {selecting ? (
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        isSel ? "border-pink-500 bg-pink-600" : "border-zinc-600"
                      }`}
                    >
                      {isSel ? <Check className="h-3 w-3" /> : null}
                    </span>
                  ) : null}
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg">
                    <ProfileAvatar user={{ full_name: chat.name, avatar_url: chat.avatar_url }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{nameFor(chat.peerId, chat.name)}</h4>
                    <p className="text-xs text-gray-400 line-clamp-1">
                      <ProtectedCanvasText text={chat.lastMessage} maxLines={1} />
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-gray-500">{chat.time}</span>
                  {chat.unreadCount && chat.unreadCount > 0 ? (
                    <span className="bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {chat.unreadCount}
                    </span>
                  ) : null}
                </div>
              </>
            );

            if (selecting) {
              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => toggleSelect(chat.id)}
                  aria-pressed={isSel}
                  className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors ${
                    isSel ? "bg-zinc-800" : "hover:bg-zinc-900"
                  }`}
                >
                  {body}
                </button>
              );
            }

            return (
              <Link
                key={chat.id}
                to="/chat/$threadId"
                params={{ threadId: chat.id }}
                onPointerDown={() => startPress(chat.id)}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onClick={(e) => {
                  if (longPressed.current) {
                    e.preventDefault();
                    longPressed.current = false;
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSelecting(true);
                  setSelected([chat.id]);
                }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900 transition-colors"
              >
                {body}
              </Link>
            );
          })
        )}
      </div>

      {newChatOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">New chat</h2>
            <button
              onClick={() => setNewChatOpen(false)}
              aria-label="Close"
              className="rounded-full p-2 hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              autoFocus
              value={peopleQuery}
              onChange={(e) => setPeopleQuery(e.target.value)}
              placeholder="Search people by name or username"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-4 text-sm focus:border-zinc-700 focus:outline-none"
            />
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto">
            {peopleLoading ? (
              <p className="py-6 text-center text-sm text-gray-500">Searching…</p>
            ) : peopleError ? (
              <p className="py-6 text-center text-sm text-red-300">{peopleError}</p>
            ) : people.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No accounts found.</p>
            ) : (
              people.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={async () => {
                    const uid =
                      me ?? (await supabase.auth.getSession()).data.session?.user.id ?? null;
                    if (!uid) return;
                    setNewChatOpen(false);
                    void navigate({
                      to: "/chat/$threadId",
                      params: { threadId: dmThreadId(uid, p.id) },
                    });
                  }}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-zinc-900"
                >
                  <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500">
                    <ProfileAvatar
                      user={{
                        full_name: p.display_name,
                        username: p.username,
                        avatar_url: p.avatar_url,
                        profile_pic: p.profile_pic,
                        profile_image: p.profile_image,
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {nameFor(p.id, p.display_name || p.username || `User ${p.id.slice(0, 6)}`)}
                    </p>
                    {p.username ? (
                      <p className="truncate text-xs text-gray-400">@{p.username}</p>
                    ) : null}
                  </div>
                </button>

              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
