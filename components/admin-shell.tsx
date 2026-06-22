"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  BellRing,
  Briefcase,
  Building2,
  Cog,
  FileSpreadsheet,
  FileStack,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  PieChart,
  Repeat,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/services/auth";
import { useAuthStore } from "@/lib/stores/auth-store";

type NavStatus = "available" | "soon";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  status: NavStatus;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    label: "Visao Geral",
    items: [
      { label: "Dashboard CVM", href: "/cvm", icon: LayoutDashboard, status: "available" },
      { label: "Alertas", href: "/cvm/alerts", icon: AlertTriangle, status: "available" },
    ],
  },
  {
    label: "Empresas",
    items: [
      { label: "Lista", href: "/cvm/companies", icon: Building2, status: "available" },
      { label: "Snapshots cadastrais", href: "/cvm/snapshots", icon: History, status: "available" },
      { label: "Setores", href: "/cvm/sector-mapping", icon: Network, status: "available" },
    ],
  },
  {
    label: "Documentos & Eventos",
    items: [
      { label: "IPE", href: "/cvm/ipe", icon: BellRing, status: "available" },
      { label: "ITR/DFP", href: "/cvm/itr-dfp", icon: FileStack, status: "available" },
      { label: "FRE", href: "/cvm/fre", icon: FileText, status: "available" },
      { label: "FCA", href: "/cvm/fca", icon: FileSpreadsheet, status: "available" },
    ],
  },
  {
    label: "Mercado & Capital",
    items: [
      { label: "Recompras", href: "/cvm/buybacks", icon: Repeat, status: "available" },
      { label: "VLMO", href: "/cvm/vlmo", icon: TrendingUp, status: "available" },
      { label: "Composicao de capital", href: "/cvm/capital-composition", icon: PieChart, status: "available" },
    ],
  },
  {
    label: "Governanca",
    items: [{ label: "ICBGC", href: "/cvm/icbgc", icon: ShieldCheck, status: "available" }],
  },
  {
    label: "Cadastros de Mercado",
    items: [
      { label: "Auditores", href: "/cvm/participantes/auditores", icon: UserCheck, status: "available" },
      { label: "Intermediarios", href: "/cvm/participantes/intermediarios", icon: Briefcase, status: "available" },
      { label: "Adm de carteira", href: "/cvm/participantes/adm-carteira", icon: Wallet, status: "available" },
    ],
  },
  {
    label: "Operacao",
    items: [{ label: "Jobs / Sync", href: "/cvm/jobs", icon: Cog, status: "available" }],
  },
];

function isItemActive(pathname: string, item: NavItem) {
  if (pathname === item.href) {
    return true;
  }

  // Don't treat the dashboard as active for every /cvm/* sub-route.
  if (item.href === "/cvm") {
    return false;
  }

  return pathname.startsWith(`${item.href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      toast.error("Nao foi possivel encerrar a sessao no backend.");
    } finally {
      clearAuth();
      router.replace("/login");
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex h-11 items-center gap-2 border-b border-border px-4">
          <div className="flex size-5 items-center justify-center rounded bg-accent-dim border border-primary/20 font-mono text-[9px] font-bold text-primary">
            T
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
            Talous Admin
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto size-6 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-3.5" />
            <span className="sr-only">Fechar menu</span>
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {navigation.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                {group.label}
              </p>
              <div className="flex flex-col gap-px">
                {group.items.map((item) => {
                  const active = isItemActive(pathname, item);
                  const isSoon = item.status === "soon";

                  if (isSoon) {
                    return (
                      <span
                        key={item.href}
                        aria-disabled="true"
                        title="Em breve"
                        className="flex items-center gap-2 rounded px-2 py-1.5 text-[11px] text-muted-foreground/50"
                      >
                        <item.icon className="size-3.5 opacity-40" />
                        {item.label}
                        <span className="ml-auto rounded border border-border/60 bg-background px-1 py-px font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50">
                          em breve
                        </span>
                      </span>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded px-2 py-1.5 text-[11px] font-medium transition",
                        active
                          ? "bg-accent-dim text-foreground"
                          : "text-muted-foreground hover:bg-card-raised hover:text-foreground",
                      )}
                    >
                      <item.icon className={cn("size-3.5", active ? "text-primary" : "opacity-50")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-11 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-3.5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
            <div className="font-mono text-[11px] text-muted-foreground">
              admin/<span className="text-foreground">cvm</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-card-raised hover:text-foreground transition">
                <span className="size-5 rounded-full bg-card-raised border border-border grid place-items-center font-mono text-[9px] font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
                </span>
                <span className="hidden sm:inline">{user?.name ?? user?.email ?? "Admin"}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[11px]">Conta administrativa</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1 font-mono text-[10px] text-muted-foreground">
                {user?.email ?? "Sem e-mail carregado"}
              </div>
              <DropdownMenuItem onClick={handleLogout} className="text-[11px]">
                <LogOut className="mr-2 size-3.5" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  );
}
