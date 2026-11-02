"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Settings, User } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslate } from "@/i18n/use-translate";
import { pageMeta } from "@/lib/nav";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);
  const { t } = useTranslate();
  const meta = pageMeta(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {session?.role === "Staff" ? null : (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">{t(meta.title)}</h1>
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList>
                {meta.crumbs.map((crumb, index) => (
                  <span key={`${crumb.label}-${index}`} className="contents">
                    <BreadcrumbItem>
                      {crumb.href ? (
                        <BreadcrumbLink render={<Link href={crumb.href} />}>
                          {t(crumb.label)}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{t(crumb.label)}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < meta.crumbs.length - 1 ? <BreadcrumbSeparator /> : null}
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" className="h-9 gap-2 px-2">
                  <Avatar size="sm">
                    <AvatarFallback>
                      {session?.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("") ?? "AM"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-left md:block">
                    <span className="block text-sm font-medium text-slate-900">{session?.name}</span>
                    <span className="block text-xs text-slate-500">{session?.role ? t(session.role) : ""}</span>
                  </span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t("Account")}</DropdownMenuLabel>
                {session?.role === "Staff" ? null : (
                  <>
                    <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                      <User /> {t("Profile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                      <Settings /> {t("Settings")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                >
                  <LogOut /> {t("Logout")}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
