"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send, ShieldAlert } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { ReportButton } from "./ReportButton";

type Msg = { id: string; body: string; mine: boolean; at: string };

export function ChatThread({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const countRef = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      /* offline */
    }
  }, [conversationId]);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const id = setInterval(refresh, 3000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [refresh]);

  useEffect(() => {
    if (messages.length !== countRef.current) {
      countRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError("");
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "تعذّر الإرسال");
      return;
    }
    setText("");
    refresh();
  }

  return (
    <div className="card flex flex-col h-[60vh] min-h-96">
      <div className="px-4 py-2.5 border-b border-neutral-100 bg-amber-50/60 flex items-start gap-2 text-xs text-amber-800 leading-relaxed">
        <ShieldAlert className="size-4 shrink-0 mt-0.5" />
        لأمانك: لا تشارك بياناتك البنكية أو أي أكواد تحقق، وقابل الطرف الآخر في
        مكان عام، وألغِ الصفقة فوراً عند أي طلب مريب.
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-neutral-400 py-8">
            ابدأ المحادثة — اسأل عن التفاصيل قبل الشراء
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.mine ? "justify-start flex-row-reverse" : "")}>
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed group",
                m.mine
                  ? "bg-primary-500 text-white rounded-bl-sm"
                  : "bg-neutral-100 text-neutral-800 rounded-br-sm"
              )}
            >
              <p className="whitespace-pre-line break-words">{m.body}</p>
              <div className={cn("flex items-center gap-2 mt-1 text-[10px]", m.mine ? "text-primary-100" : "text-neutral-400")}>
                <span suppressHydrationWarning>{timeAgo(m.at)}</span>
                {!m.mine && <ReportButton targetType="MESSAGE" targetId={m.id} compact />}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mx-4 mb-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
          {error}
        </p>
      )}

      <form onSubmit={send} className="p-3 border-t border-neutral-100 flex gap-2">
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب رسالتك..."
          maxLength={2000}
        />
        <button className="btn-primary px-4 shrink-0" disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 -scale-x-100" />}
        </button>
      </form>
    </div>
  );
}
