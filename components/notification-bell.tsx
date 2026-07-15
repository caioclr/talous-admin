"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/formatters";
import {
  ADMIN_NOTIFICATION_TYPE_LABELS,
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/lib/services/admin/notifications";

const FEED_KEY = ["admin", "notifications", "feed"];

/** Sino de notificacoes do operador no topbar do admin. Polling a cada 60s. */
export function NotificationBell() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: FEED_KEY,
    queryFn: () => getAdminNotifications({ limit: 15 }),
    refetchInterval: 60_000,
  });

  const items = data?.items ?? [];
  const unread = data?.unread_count ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: FEED_KEY });
  const readOne = useMutation({
    mutationFn: markAdminNotificationRead,
    onSuccess: invalidate,
  });
  const readAll = useMutation({
    mutationFn: markAllAdminNotificationsRead,
    onSuccess: invalidate,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notificações"
          className="relative flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-card-raised hover:text-foreground"
        >
          <Bell className="size-3.5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-[14px] place-items-center rounded-full bg-red-500 px-1 text-[8px] font-medium leading-[14px] text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[11px] font-medium">Notificações</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => readAll.mutate()}
              disabled={readAll.isPending}
              className="flex items-center gap-1 text-[10px] text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            >
              <CheckCheck className="size-3" /> Marcar todas
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            items.map((n) => (
              <button
                type="button"
                key={n.id}
                onClick={() => !n.is_read && readOne.mutate(n.id)}
                className={`block w-full border-b border-border px-3 py-2 text-left transition last:border-b-0 hover:bg-card-raised ${
                  n.is_read ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-medium">{n.title}</span>
                  {!n.is_read && (
                    <span className="size-1.5 shrink-0 rounded-full bg-red-500" />
                  )}
                </div>
                {n.body && (
                  <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
                    {n.body}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-2 font-mono text-[9px] text-muted-foreground">
                  <span>{ADMIN_NOTIFICATION_TYPE_LABELS[n.type] ?? n.type}</span>
                  <span>·</span>
                  <span>{formatDateTime(n.created_at)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
