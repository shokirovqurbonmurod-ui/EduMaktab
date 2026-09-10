"use client";

import * as React from "react";
import { ArrowLeft, Paperclip, Phone, Send, Smile, Video, MoreVertical } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDataStore } from "@/stores/useDataStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePageData } from "@/lib/api";
import { PageSkeleton } from "@/components/shared/states";
import { formatTimeUZ, relativeDayUZ, uid, useDebouncedSafe } from "@/lib/utils-safe";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

type Thread = {
  id: string; // channelId
  channel: Message["channel"];
  name: string;
  hue?: number;
  msgs: Message[];
  last: Message;
};

const CHANNEL_NAMES: Partial<Record<Message["channel"], string>> = {
  director: "Direktorat",
  teachers: "O‘qituvchilar",
};

const REPLIES = [
  "Rahmat, qabul qilindi ✅",
  "Albatta, shartemizda kelishamiz.",
  "Tushunarli, ko‘rib chiqaman.",
  "Bugungi dars haqida ma'lumot beramiz.",
  "Bo‘ldi, eslatib qo‘ydik 🙌",
];

export default function MessagesPage() {
  const { messages, classes, parents } = useDataStore();
  const addMessage = useDataStore((s) => s.addMessage);
  const me = useAuthStore((s) => s.session?.user) ?? null;
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const dq = useDebouncedSafe(q);
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const replySeq = React.useRef(0);
  const { loading } = usePageData(() => messages, []);

  const threads: Thread[] = React.useMemo(() => {
    const map = new Map<string, { channel: Message["channel"]; msgs: Message[] }>();
    for (const m of messages) {
      const t = map.get(m.channelId) ?? { channel: m.channel, msgs: [] };
      t.msgs.push(m);
      map.set(m.channelId, t);
    }
    return Array.from(map.entries())
      .map(([id, t]) => {
        const sorted = [...t.msgs].sort((a, b) => a.sentAt.localeCompare(b.sentAt));
        const parent = t.channel === "parents" ? parents.find((p) => p.id === id) : null;
        const cls = t.channel === "groups" ? classes.find((c) => c.id === id) : null;
        const name =
          parent?.name ??
          cls?.name ??
          CHANNEL_NAMES[t.channel] ??
          sorted[0]?.senderName ??
          id;
        return { id, channel: t.channel, name, hue: parent?.hue ?? cls?.hue, msgs: sorted, last: sorted[sorted.length - 1]! };
      })
      .filter(
        (t) =>
          !dq ||
          t.name.toLowerCase().includes(dq.toLowerCase()) ||
          t.last.text.toLowerCase().includes(dq.toLowerCase()),
      )
      .sort((a, b) => b.last.sentAt.localeCompare(a.last.sentAt));
  }, [messages, classes, parents, dq]);

  const active = threads.find((t) => t.id === activeId) ?? null;

  const isMine = React.useCallback(
    (m: Message) => {
      if (me && m.senderId === me.id) return true;
      return (me?.role === "DIRECTOR" || me?.role === "ADMIN") && m.channel === "parents" && m.senderRole === "TEACHER";
    },
    [me],
  );

  const replyFrom = (t: Thread): { id: string; name: string; role: Message["senderRole"] } => {
    if (t.channel === "parents") {
      const parent = parents.find((p) => p.id === t.id);
      return { id: t.id, name: parent?.name ?? t.name, role: "PARENT" };
    }
    const other = [...t.msgs].reverse().find((m) => !isMine(m));
    return other
      ? { id: other.senderId, name: other.senderName, role: other.senderRole }
      : { id: "usr_accountant", name: "Gulnora Saidova", role: "ACCOUNTANT" };
  };

  const send = () => {
    const text = draft.trim();
    if (!text || !active) return;
    setDraft("");
    const mine: Message = {
      id: uid("msg"),
      channel: active.channel,
      channelId: active.id,
      senderId: me?.id ?? "usr_director",
      senderName: me?.name ?? "Direktor",
      senderRole: me?.role ?? "DIRECTOR",
      text,
      sentAt: new Date().toISOString(),
    };
    addMessage(mine);
    setTyping(true);
    const t = active;
    const seq = replySeq.current++;
    setTimeout(() => {
      setTyping(false);
      const from = replyFrom(t);
      const reply: Message = {
        id: uid("msg"),
        channel: t.channel,
        channelId: t.id,
        senderId: from.id,
        senderName: from.name,
        senderRole: from.role,
        text: REPLIES[seq % REPLIES.length]!,
        sentAt: new Date().toISOString(),
      };
      addMessage(reply);
    }, 1200 + ((seq * 173) % 900));
  };

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.last.id, typing]);

  if (loading) return <PageSkeleton withCards={false} rows={8} />;

  return (
    <>
      <PageHeader title="Xabarlar" subtitle={`${threads.length} ta suhbat`} />

      <div className="mt-6 grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* Thread list */}
        <Card className={cn("self-start lg:sticky lg:top-20", active && "hidden lg:block")}>
          <CardContent className="p-4">
            <SearchBar value={q} onChange={setQ} placeholder="Suhbat qidirish…" className="mb-3" />
            <ScrollArea className="h-[58dvh] pr-3">
              <div className="space-y-1">
                {threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      activeId === t.id ? "bg-primary/10" : "hover:bg-accent/50",
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar name={t.name} hue={t.hue} size="md" />
                      <span className="ring-background absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 bg-success" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{t.name}</p>
                        <span className="num shrink-0 text-[10px] text-muted-foreground">
                          {formatTimeUZ(t.last.sentAt)}
                        </span>
                      </div>
                      <p className="text-muted-foreground truncate text-xs">{t.last.text}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat window */}
        <Card className={cn(!active && "hidden lg:block")}>
          {active ? (
            <div className="flex h-[72dvh] flex-col">
              <div className="glass flex items-center gap-3 border-b px-4 py-3">
                <Button variant="ghost" size="icon" className="size-9 lg:hidden" onClick={() => setActiveId(null)} aria-label="Orqaga">
                  <ArrowLeft className="size-5" />
                </Button>
                <Avatar name={active.name} hue={active.hue} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{active.name}</p>
                  <p className="text-success text-xs">
                    {typing ? "yozmoqda…" : active.channel === "parents" ? "ota-ona" : "onlayn"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="size-9" aria-label="Qo‘ng‘iroq">
                  <Phone className="size-4.5" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden size-9 sm:flex" aria-label="Video qo‘ng‘iroq">
                  <Video className="size-4.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-9" aria-label="Boshqalar">
                  <MoreVertical className="size-4.5" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-1 p-4">
                  {active.msgs.map((m, i) => {
                    const mine = isMine(m);
                    const prev = active.msgs[i - 1];
                    const newDay = !prev || prev.sentAt.slice(0, 10) !== m.sentAt.slice(0, 10);
                    return (
                      <React.Fragment key={m.id}>
                        {newDay ? (
                          <div className="flex justify-center py-2">
                            <Badge variant="muted" className="text-[10px]">
                              {relativeDayUZ(m.sentAt.slice(0, 10))}
                            </Badge>
                          </div>
                        ) : null}
                        <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[78%] rounded-3xl px-4 py-2.5 text-sm leading-snug",
                              mine ? "bg-primary text-primary-foreground rounded-br-lg" : "bg-muted rounded-bl-lg",
                            )}
                          >
                            {!mine && active.msgs.filter((x) => !isMine(x)).length > 1 ? (
                              <p className={cn("mb-0.5 text-[10px] font-semibold", mine ? "" : "text-primary")}>{m.senderName}</p>
                            ) : null}
                            <p>{m.text}</p>
                            <p className={cn("num mt-0.5 text-right text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                              {formatTimeUZ(m.sentAt)}
                            </p>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  {typing ? (
                    <div className="flex justify-start">
                      <div className="bg-muted flex items-center gap-1 rounded-3xl rounded-bl-lg px-4 py-3">
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:120ms]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:240ms]" />
                      </div>
                    </div>
                  ) : null}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              <div className="border-t p-3">
                <div className="bg-muted flex items-center gap-2 rounded-full p-1.5">
                  <Button variant="ghost" size="icon" className="size-9 shrink-0" aria-label="Emojini tanlash">
                    <Smile className="size-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hidden size-9 shrink-0 sm:flex" aria-label="Ilova qo‘shish">
                    <Paperclip className="size-5" />
                  </Button>
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Xabar yozing…"
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                  <Button size="icon" className="size-9 shrink-0 rounded-full" onClick={send} disabled={!draft.trim()} aria-label="Yuborish">
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="bg-primary/10 flex size-16 items-center justify-center rounded-3xl">
                <Send className="text-primary size-7" />
              </div>
              <p className="mt-4 font-semibold">Suhbatni tanlang</p>
              <p className="text-muted-foreground mt-1 max-w-xs text-sm">
                Ro‘yhatdagi suhbatlarni tanlab, xabar almashishni boshlang.
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
