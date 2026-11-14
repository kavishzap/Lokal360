"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings, User } from "lucide-react";
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
import { companyInitials } from "@/lib/company";
import { APP_NAME } from "@/lib/constants";
import { pageMeta } from "@/lib/nav";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";

export const officeBarClass =
  "sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-md";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const company = useAppStore((state) => state.company);
  const { t } = useTranslate();
  const meta = pageMeta(pathname);
  const brand = company?.name?.trim() || APP_NAME;

  return (
    <header className={officeBarClass}>
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-4">
          {session?.role === "Staff" ? (
            <span className="truncate text-sm font-semibold text-slate-900">{t(meta.title)}</span>
          ) : (
            <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
              <span className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-blue-600 text-[11px] font-semibold text-white">
                {company?.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={company.logo} alt="" className="size-full object-cover" />
                ) : (
                  companyInitials(brand)
                )}
              </span>
              <span className="hidden text-sm font-semibold text-slate-900 sm:block">{brand}</span>
            </Link>
          )}
          {meta.crumbs.length > 1 ? (
            <Breadcrumb className="hidden min-w-0 md:block">
              <BreadcrumbList className="flex-nowrap text-xs">
                {meta.crumbs.map((crumb, index) => (
                  <span key={`${crumb.label}-${index}`} className="contents">
                    <BreadcrumbItem>
                      {crumb.href ? (
                        <BreadcrumbLink render={<Link href={crumb.href} />}>
                          {t(crumb.label)}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage className="truncate font-medium text-slate-700">
                          {t(crumb.label)}
                        </BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < meta.crumbs.length - 1 ? <BreadcrumbSeparator /> : null}
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" className="h-9 gap-2 px-2">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-blue-600 text-white">
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
