"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { NotificationBell } from "@/components/notification-bell";
import { LanguageSelector } from "@/components/language-selector";
import { logout } from "@/lib/services/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { CvmAcronym } from "@/components/cvm-acronym";
import { getCvmAcronym } from "@/lib/cvm-glossary";

/**
 * Enriquece o rotulo de navegacao com um tooltip quando ele e exatamente uma
 * sigla conhecida da CVM. Rotulos que nao sao sigla pura renderizam texto puro.
 * O conteudo textual do link permanece identico ao `item.label`.
 */
function NavLabel({ label }: { label: string }) {
  if (getCvmAcronym(label)) {
    return <CvmAcronym sigla={label} interactive={false} />;
  }
  return <>{label}</>;
}

type NavStatus = "available" | "soon";

interface NavItem {
  /** Chave i18n relativa ao namespace `admin.shell` (ex.: `nav.dashboard`). */
  labelKey: string;
  href: string;
  icon: LucideIcon;
  status: NavStatus;
}

interface NavGroup {
  /** Chave i18n relativa ao namespace `admin.shell` (ex.: `nav.groupOverview`). */
  labelKey: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    labelKey: "nav.groupOverview",
    items: [
      { labelKey: "nav.dashboard", href: "/cvm", icon: LayoutDashboard, status: "available" },
      { labelKey: "nav.alerts", href: "/cvm/alerts", icon: AlertTriangle, status: "available" },
    ],
  },
  {
    labelKey: "nav.groupCompanies",
    items: [
      { labelKey: "nav.companiesList", href: "/cvm/companies", icon: Building2, status: "available" },
      { labelKey: "nav.snapshots", href: "/cvm/snapshots", icon: History, status: "available" },
      { labelKey: "nav.sectors", href: "/cvm/sector-mapping", icon: Network, status: "available" },
    ],
  },
  {
    labelKey: "nav.groupDocuments",
    items: [
      { labelKey: "nav.ipe", href: "/cvm/ipe", icon: BellRing, status: "available" },
      { labelKey: "nav.itrDfp", href: "/cvm/itr-dfp", icon: FileStack, status: "available" },
      { labelKey: "nav.fre", href: "/cvm/fre", icon: FileText, status: "available" },
      { labelKey: "nav.fca", href: "/cvm/fca", icon: FileSpreadsheet, status: "available" },
    ],
  },
  {
    labelKey: "nav.groupMarket",
    items: [
      { labelKey: "nav.buybacks", href: "/cvm/buybacks", icon: Repeat, status: "available" },
      { labelKey: "nav.vlmo", href: "/cvm/vlmo", icon: TrendingUp, status: "available" },
      { labelKey: "nav.capitalComposition", href: "/cvm/capital-composition", icon: PieChart, status: "available" },
    ],
  },
  {
    labelKey: "nav.groupGovernance",
    items: [{ labelKey: "nav.icbgc", href: "/cvm/icbgc", icon: ShieldCheck, status: "available" }],
  },
  {
    labelKey: "nav.groupRegistries",
    items: [
      { labelKey: "nav.auditores", href: "/cvm/participantes/auditores", icon: UserCheck, status: "available" },
      { labelKey: "nav.intermediarios", href: "/cvm/participantes/intermediarios", icon: Briefcase, status: "available" },
      { labelKey: "nav.admCarteira", href: "/cvm/participantes/adm-carteira", icon: Wallet, status: "available" },
    ],
  },
  {
    labelKey: "nav.groupOps",
    items: [{ labelKey: "nav.jobs", href: "/cvm/jobs", icon: Cog, status: "available" }],
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
  const t = useTranslations("admin.shell");

  async function handleLogout() {
    try {
      await logout();
    } catch {
      toast.error(t("logoutError"));
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
            {t("brand")}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto size-6 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-3.5" />
            <span className="sr-only">{t("closeMenu")}</span>
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {navigation.map((group) => (
            <div key={group.labelKey} className="mb-3">
              <p className="px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                {t(group.labelKey)}
              </p>
              <div className="flex flex-col gap-px">
                {group.items.map((item) => {
                  const active = isItemActive(pathname, item);
                  const isSoon = item.status === "soon";
                  const label = t(item.labelKey);

                  if (isSoon) {
                    return (
                      <span
                        key={item.href}
                        aria-disabled="true"
                        title={t("soonTitle")}
                        className="flex items-center gap-2 rounded px-2 py-1.5 text-[13px] text-muted-foreground/50"
                      >
                        <item.icon className="size-3.5 opacity-40" />
                        <NavLabel label={label} />
                        <span className="ml-auto rounded border border-border/60 bg-background px-1 py-px font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50">
                          {t("soon")}
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
                        "flex items-center gap-2 rounded px-2 py-1.5 text-[13px] font-medium transition",
                        active
                          ? "bg-accent-dim text-foreground"
                          : "text-muted-foreground hover:bg-card-raised hover:text-foreground",
                      )}
                    >
                      <item.icon className={cn("size-3.5", active ? "text-primary" : "opacity-50")} />
                      <NavLabel label={label} />
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
              <span className="sr-only">{t("openMenu")}</span>
            </Button>
            {/* TODO i18n: breadcrumb decorativo de caminho (admin/cvm) — migracao progressiva. */}
            <div className="font-mono text-[11px] text-muted-foreground">
              admin/<span className="text-foreground">cvm</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
          <LanguageSelector />
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-card-raised hover:text-foreground transition">
                <span className="size-5 rounded-full bg-card-raised border border-border grid place-items-center font-mono text-[9px] font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
                </span>
                <span className="hidden sm:inline">{user?.name ?? user?.email ?? t("accountFallback")}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[11px]">{t("account")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1 font-mono text-[10px] text-muted-foreground">
                {user?.email ?? t("noEmail")}
              </div>
              <DropdownMenuItem onClick={handleLogout} className="text-[11px]">
                <LogOut className="mr-2 size-3.5" />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  );
}
