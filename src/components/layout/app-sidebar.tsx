"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslate } from "@/i18n/use-translate";
import { companyInitials } from "@/lib/company";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { NAV_SECTIONS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

function isActivePath(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const logout = useAuthStore((state) => state.logout);
  const session = useAuthStore((state) => state.session);
  const company = useAppStore((state) => state.company);
  const brand = company?.name?.trim() || APP_NAME;
  const { t } = useTranslate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const handleLogout = () => {
    logout();
    onNavigate?.();
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col bg-[#0F172A] text-slate-200">
      <div className={cn("flex items-center gap-3 border-b border-white/10 px-4 py-4", collapsed && "justify-center px-2")}>
        <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-600 text-xs font-semibold text-white">
          {company?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logo} alt="" className="size-full object-cover" />
          ) : (
            companyInitials(brand)
          )}
        </div>
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{brand}</p>
            <p className="truncate text-xs text-slate-400">{t(APP_TAGLINE)}</p>
          </div>
        ) : null}
        <Button
          variant="ghost"
          size="icon-sm"
          className="hidden text-slate-300 hover:bg-white/10 hover:text-white lg:inline-flex"
          onClick={toggleSidebar}
        >
          <PanelLeft />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-1">
          {NAV_SECTIONS.map((section) => {
            if (!section.children) {
              const active = section.href ? isActivePath(pathname, section.href, section.exact) : false;
              return (
                <Link
                  key={section.id}
                  href={section.href ?? "#"}
                  title={collapsed ? t(section.label) : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                    collapsed && "justify-center px-2",
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <section.icon className="size-4 shrink-0" />
                  {!collapsed ? <span>{t(section.label)}</span> : null}
                </Link>
              );
            }

            if (collapsed) {
              return (
                <div key={section.id} className="space-y-1">
                  {section.children.map((child) => {
                    const active = isActivePath(pathname, child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        title={t(child.label)}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center justify-center rounded-lg px-2 py-2 text-sm",
                          active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10"
                        )}
                      >
                        <child.icon className="size-4" />
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const open = openSections[section.id] ?? false;

            return (
              <Collapsible
                key={section.id}
                open={open}
                onOpenChange={(next) => setOpenSections((current) => ({ ...current, [section.id]: next }))}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">
                  <span className="flex items-center gap-3">
                    <section.icon className="size-4" />
                    {t(section.label)}
                  </span>
                  <ChevronDown className={cn("size-4 transition", open && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-1 ml-4 space-y-1 border-l border-white/10 pl-3">
                    {section.children.map((child) => {
                      const active = isActivePath(pathname, child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                            active
                              ? "bg-blue-600 text-white"
                              : "text-slate-400 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <child.icon className="size-4" />
                          {t(child.label)}
                        </Link>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-white/10 p-3">
        {!collapsed && session ? (
          <div className="mb-3 rounded-lg bg-white/5 px-3 py-2">
            <p className="truncate text-sm font-medium text-white">{session.name}</p>
            <p className="truncate text-xs text-slate-400">{t(session.role)}</p>
          </div>
        ) : null}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-slate-300 hover:bg-white/10 hover:text-white",
            collapsed && "justify-center px-0"
          )}
          onClick={handleLogout}
        >
          <LogOut />
          {!collapsed ? t("Logout") : null}
        </Button>
      </div>
    </div>
  );
}
