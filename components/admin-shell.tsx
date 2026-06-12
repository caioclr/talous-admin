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
      { label: "Alertas operacionais", href: "/cvm/alerts", icon: AlertTriangle, status: "available" },
    ],
  },
  {
    label: "Empresas",
    items: [
      { label: "Lista", href: "/cvm/companies", icon: Building2, status: "available" },
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
      { label: "Insider VLMO", href: "/cvm/vlmo", icon: TrendingUp, status: "available" },
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
      { label: "Admins de carteira", href: "/cvm/participantes/adm-carteira", icon: Wallet, status: "available" },
    ],
  },
  {
    label: "Operacao",
    items: [{ label: "Jobs / Sync", href: "/cvm/jobs", icon: Cog, status: "soon" }],
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
    <div className="min-h-screen bg-background px-4 py-4 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:gap-6">
        <aside
          className={cn(
            "panel-surface fixed inset-y-4 left-4 z-30 flex w-[280px] flex-col gap-6 p-5 transition-transform lg:static lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-[120%]",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Talous Admin
              </p>
              <h1 className="mt-2 text-xl font-semibold text-foreground">Operacoes CVM</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Bootstrap inicial do painel administrativo.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-4" />
              <span className="sr-only">Fechar menu</span>
            </Button>
          </div>

          <nav className="flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
            {navigation.map((group) => (
              <div key={group.label} className="flex flex-col gap-1.5">
                <p className="px-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {group.label}
                </p>

                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const active = isItemActive(pathname, item);
                    const isSoon = item.status === "soon";

                    if (isSoon) {
                      return (
                        <span
                          key={item.href}
                          aria-disabled="true"
                          title="Em breve"
                          className="flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-muted-foreground/70"
                        >
                          <span className="flex items-center gap-3">
                            <item.icon className="size-4" />
                            {item.label}
                          </span>
                          <span className="rounded-full border border-border/60 bg-background/50 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider">
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
                          "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition",
                          active
                            ? "border-primary/30 bg-primary text-primary-foreground shadow-soft"
                            : "border-transparent bg-card/70 text-foreground hover:border-border hover:bg-card",
                        )}
                      >
                        <item.icon className="size-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="panel-surface flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  Painel Administrativo
                </p>
                <p className="text-sm text-muted-foreground">
                  Dados internos consumidos a partir de `/api/v1/admin/cvm/*`.
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[160px] justify-between rounded-full">
                  <span className="truncate">{user?.name ?? user?.email ?? "Admin"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Conta administrativa</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  {user?.email ?? "Sem e-mail carregado"}
                </div>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
