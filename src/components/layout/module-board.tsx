"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useTranslate } from "@/i18n/use-translate";
import { NAV_SECTIONS, type NavChild } from "@/lib/nav";

const FOLDERS = [
  "bg-[#5B9BFF]",
  "bg-[#FF8B7B]",
  "bg-[#5DCFB0]",
  "bg-[#FFB15E]",
  "bg-[#9B8CFF]",
  "bg-[#4CC3D9]",
  "bg-[#F27AA6]",
  "bg-[#7BC67E]",
];

const SPAN: Record<string, string> = {
  restaurant: "lg:col-span-2 lg:row-span-2",
  accounting: "lg:col-span-4",
  payroll: "lg:col-span-4",
};

const GROW: Record<string, string> = {
  restaurant: "flex-[1_1_calc(50%-0.75rem)]",
  accounting:
    "flex-[1_1_calc(50%-0.75rem)] sm:flex-[1_1_calc(33.333%-0.75rem)] xl:flex-[1_1_calc(25%-0.75rem)]",
  payroll: "flex-[1_1_calc(50%-0.75rem)] sm:flex-[1_1_calc(25%-0.75rem)]",
};

function FolderTile({
  child,
  color,
  label,
  grow,
}: {
  child: NavChild;
  color: string;
  label: string;
  grow: string;
}) {
  const shape = `relative mt-2 flex min-h-[112px] flex-col justify-end self-stretch rounded-2xl px-4 py-3 ${grow}`;

  if (child.locked) {
    return (
      <button
        type="button"
        aria-disabled="true"
        onClick={(event) => event.preventDefault()}
        className={`${shape} cursor-not-allowed bg-slate-200 text-left text-slate-500`}
      >
        <span className="absolute -top-2 left-4 h-3 w-12 rounded-t-md bg-slate-200" />
        <Lock className="mb-3 size-8" aria-hidden />
        <span className="text-sm font-semibold">{label}</span>
      </button>
    );
  }

  return (
    <Link href={child.href} className={`folder-tile ${shape} text-white ${color}`}>
      <span className={`folder-tab absolute -top-2 left-4 h-3 w-12 rounded-t-md ${color}`} />
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <span className="folder-sheen" />
      </span>
      <child.icon className="folder-icon relative mb-3 size-8" strokeWidth={2.25} aria-hidden />
      <span className="relative text-sm font-semibold leading-tight">{label}</span>
    </Link>
  );
}

export function ModuleBoard() {
  const { t } = useTranslate();
  const sections = NAV_SECTIONS.filter((section) => section.children?.length);

  return (
    <div>
      <style>{`
        .folder-tile {
          transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 240ms ease;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
        }
        .folder-row:hover .folder-tile {
          transform: translateY(2px) scale(0.985);
        }
        .folder-row:hover .folder-tile:hover {
          transform: translateY(-8px) scale(1.045);
          box-shadow: 0 18px 30px rgba(15, 23, 42, 0.18);
          z-index: 2;
        }
        .folder-row:hover .folder-tile:active {
          transform: translateY(-2px) scale(1.01);
        }
        .folder-tab,
        .folder-icon {
          transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .folder-tile:hover .folder-tab {
          transform: translateY(-5px);
        }
        .folder-tile:hover .folder-icon {
          transform: translateY(-2px) scale(1.12);
        }
        .folder-sheen {
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, transparent 32%, rgba(255, 255, 255, 0.38) 50%, transparent 68%);
          transform: translateX(-130%);
        }
        .folder-tile:hover .folder-sheen {
          transform: translateX(130%);
          transition: transform 560ms ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .folder-tile,
          .folder-row:hover .folder-tile,
          .folder-row:hover .folder-tile:hover,
          .folder-row:hover .folder-tile:active,
          .folder-tile:hover .folder-tab,
          .folder-tile:hover .folder-icon,
          .folder-tile:hover .folder-sheen {
            transition: none;
            transform: none;
          }
        }
      `}</style>
      <div className="grid items-start gap-4 lg:grid-cols-6">
        {sections.map((section) => (
          <section
            key={section.id}
            aria-label={t(section.label)}
            className={`module-card flex h-full flex-col rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${SPAN[section.id] ?? "lg:col-span-3"}`}
          >
            <div className="mb-3 flex items-center gap-2">
              <section.icon className="size-4 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-800">{t(section.label)}</h2>
            </div>
            <div className="folder-row flex flex-1 flex-wrap content-stretch gap-3 pt-2">
              {section.children?.map((child, index) => (
                <FolderTile
                  key={child.href}
                  child={child}
                  color={FOLDERS[index % FOLDERS.length]}
                  label={t(child.label)}
                  grow={GROW[section.id] ?? "flex-[1_1_calc(33.333%-0.75rem)]"}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Link href="/dashboard/settings" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          {t("Settings")}
        </Link>
      </div>
    </div>
  );
}
