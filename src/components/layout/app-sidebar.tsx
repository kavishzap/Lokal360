"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";
import { ChevronDown, Lock, LogOut, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslate } from "@/i18n/use-translate";
import { companyInitials } from "@/lib/company";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { NAV_SECTIONS, type NavSection } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

function isActivePath(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function CollapsedGroup({
  section,
  pathname,
  label,
  onNavigate,
  t,
}: {
  section: NavSection;
  pathname: string;
  label: string;
  onNavigate?: () => void;
  t: (text: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const active = section.children?.some((child) => isActivePath(pathname, child.href)) ?? false;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={label}
        className={cn(
          "flex w-full items-center justify-center rounded-lg px-2 py-2 text-slate-300 hover:bg-white/10 hover:text-white",
          active && "bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
        )}
      >
        <section.icon className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={10}
        className="max-h-(--available-height) w-56 gap-0.5 overflow-y-auto bg-[#0F172A] p-2 text-slate-200 ring-white/10"
      >
        <p className="px-2 pt-1 pb-2 text-xs font-medium tracking-wide text-slate-400 uppercase">{label}</p>
        {section.children?.map((child) => {
          if (child.locked) {
            return (
              <button
                key={child.href}
                type="button"
                aria-disabled="true"
                onClick={(event) => event.preventDefault()}
                className="flex w-full cursor-not-allowed items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-slate-500"
              >
                <child.icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{t(child.label)}</span>
                <Lock className="size-3.5 shrink-0" />
              </button>
            );
          }
          const childActive = isActivePath(pathname, child.href);
          return (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-2 text-sm",
                childActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <child.icon className="size-4 shrink-0" />
              {t(child.label)}
            </Link>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

function SidebarTip({
  label,
  show,
  children,
}: {
  label: string;
  show: boolean;
  children: ReactElement;
}) {
  if (!show) return children;
  return (
    <Tooltip>
      <TooltipTrigger delay={200} render={children} />
      <TooltipContent side="right" sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
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
      <div
        className={cn(
          "flex items-center gap-3 border-b border-white/10 px-4 py-4",
          collapsed && "flex-col justify-center gap-3 px-2 py-3"
        )}
      >
        <SidebarTip label={brand} show={collapsed}>
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-600 text-xs font-semibold text-white">
            {company?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo} alt="" className="size-full object-cover" />
            ) : (
              companyInitials(brand)
            )}
          </div>
        </SidebarTip>
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{brand}</p>
            <p className="truncate text-xs text-slate-400">{t(APP_TAGLINE)}</p>
          </div>
        ) : null}
        <SidebarTip label={t(collapsed ? "Expand sidebar" : "Collapse sidebar")} show>
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              "hidden text-slate-300 hover:bg-white/10 hover:text-white lg:inline-flex",
              collapsed && "mx-auto"
            )}
            aria-label={t(collapsed ? "Expand sidebar" : "Collapse sidebar")}
            onClick={toggleSidebar}
          >
            <PanelLeft />
          </Button>
        </SidebarTip>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-1">
          {NAV_SECTIONS.map((section) => {
            if (!section.children) {
              const active = section.href ? isActivePath(pathname, section.href, section.exact) : false;
              if (section.locked) {
                return (
                  <SidebarTip key={section.id} label={`${t(section.label)}. ${t("Not available yet")}`} show>
                    <button
                      type="button"
                      aria-disabled="true"
                      aria-label={t(section.label)}
                      onClick={(event) => event.preventDefault()}
                      className={cn(
                        "flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <span className="relative shrink-0">
                        <section.icon className="size-4" />
                        {collapsed ? <Lock className="absolute -right-2 -bottom-1.5 size-2.5" /> : null}
                      </span>
                      {!collapsed ? <span className="flex-1 truncate text-left">{t(section.label)}</span> : null}
                      {!collapsed ? <Lock className="size-3.5 shrink-0" /> : null}
                    </button>
                  </SidebarTip>
                );
              }
              return (
                <SidebarTip key={section.id} label={t(section.label)} show={collapsed}>
                  <Link
                    href={section.href ?? "#"}
                    aria-label={collapsed ? t(section.label) : undefined}
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
                </SidebarTip>
              );
            }

            if (collapsed) {
              return (
                <CollapsedGroup
                  key={section.id}
                  section={section}
                  pathname={pathname}
                  label={t(section.label)}
                  onNavigate={onNavigate}
                  t={t}
                />
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
                      if (child.locked) {
                        return (
                          <SidebarTip key={child.href} label={`${t(child.label)}. ${t("Not available yet")}`} show>
                            <button
                              type="button"
                              aria-disabled="true"
                              onClick={(event) => event.preventDefault()}
                              className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-500"
                            >
                              <child.icon className="size-4 shrink-0" />
                              <span className="flex-1 truncate">{t(child.label)}</span>
                              <Lock className="size-3.5 shrink-0" />
                            </button>
                          </SidebarTip>
                        );
                      }
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
        <SidebarTip label={t("Logout")} show={collapsed}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-slate-300 hover:bg-white/10 hover:text-white",
              collapsed && "justify-center px-0"
            )}
            aria-label={collapsed ? t("Logout") : undefined}
            onClick={handleLogout}
          >
            <LogOut />
            {!collapsed ? t("Logout") : null}
          </Button>
        </SidebarTip>
      </div>
    </div>
  );
}
