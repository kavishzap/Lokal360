import {
  Armchair,
  BookOpen,
  BookText,
  Banknote,
  Boxes,
  Calculator,
  CalendarDays,
  Car,
  ClipboardList,
  Clock,
  FileBarChart,
  Landmark,
  LayoutDashboard,
  Leaf,
  MapPinned,
  NotebookPen,
  Receipt,
  ScrollText,
  Ruler,
  Scale,
  Settings,
  ShoppingBasket,
  Sparkles,
  Tags,
  TrendingUp,
  Truck,
  Users,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavChild {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  exact?: boolean;
  children?: NavChild[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    exact: true,
  },
  {
    id: "restaurant",
    label: "Restaurant Management",
    icon: UtensilsCrossed,
    children: [
      { href: "/dashboard/zones", label: "Zones", icon: MapPinned },
      { href: "/dashboard/tables", label: "Tables", icon: Armchair },
      { href: "/dashboard/categories", label: "Categories", icon: Tags },
      { href: "/dashboard/units", label: "Units", icon: Ruler },
      { href: "/dashboard/ingredients", label: "Ingredients", icon: Leaf },
      { href: "/dashboard/menu-items", label: "Menu Items", icon: ShoppingBasket },
      { href: "/dashboard/orders", label: "Orders", icon: ClipboardList },
      { href: "/dashboard/inventory", label: "Inventory", icon: Boxes },
      { href: "/dashboard/balance-inventory", label: "Balance Inventory", icon: Scale },
    ],
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: Landmark,
    children: [
      { href: "/dashboard/purchases", label: "Purchases", icon: Truck },
      { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
      { href: "/dashboard/assets", label: "Assets", icon: Car },
      { href: "/dashboard/chart-of-accounts", label: "Chart of Accounts", icon: BookOpen },
      { href: "/dashboard/journal", label: "Journal Book", icon: NotebookPen },
      { href: "/dashboard/ledger", label: "Ledger", icon: BookText },
      { href: "/dashboard/cashbook", label: "Cashbook", icon: Wallet },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileBarChart,
    children: [
      { href: "/dashboard/reports/expenses", label: "Expense report", icon: Receipt },
      { href: "/dashboard/reports/sales", label: "Sales report", icon: TrendingUp },
      { href: "/dashboard/reports/pnl", label: "P&L", icon: Calculator },
    ],
  },
  {
    id: "ai-analytics",
    label: "AI Analytics",
    icon: Sparkles,
    href: "/dashboard/ai-analytics",
  },
  {
    id: "payroll",
    label: "Payroll",
    icon: Users,
    children: [
      { href: "/dashboard/payroll/employees", label: "Employees", icon: Users },
      { href: "/dashboard/payroll/leave", label: "Leave", icon: CalendarDays },
      { href: "/dashboard/payroll/attendance", label: "Attendance", icon: Clock },
      { href: "/dashboard/payroll/payslips", label: "Payslips", icon: Banknote },
      { href: "/dashboard/payroll/run", label: "Pay and file", icon: Landmark },
      { href: "/dashboard/payroll/policies", label: "Policies", icon: ScrollText },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export const PAGE_META: Record<string, { title: string; crumbs: { label: string; href?: string }[] }> =
  {
    "/dashboard": {
      title: "Dashboard",
      crumbs: [{ label: "Dashboard" }],
    },
    "/dashboard/zones": {
      title: "Zones",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Restaurant" },
        { label: "Zones" },
      ],
    },
    "/dashboard/tables": {
      title: "Tables",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Restaurant" },
        { label: "Tables" },
      ],
    },
    "/dashboard/categories": {
      title: "Categories",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Restaurant" },
        { label: "Categories" },
      ],
    },
    "/dashboard/units": {
      title: "Units of measurement",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Restaurant" },
        { label: "Units" },
      ],
    },
    "/dashboard/ingredients": {
      title: "Ingredients",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Restaurant" },
        { label: "Ingredients" },
      ],
    },
    "/dashboard/menu-items": {
      title: "Menu Items",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Restaurant" },
        { label: "Menu Items" },
      ],
    },
    "/dashboard/orders": {
      title: "Orders",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Restaurant" },
        { label: "Orders" },
      ],
    },
    "/dashboard/inventory": {
      title: "Inventory",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Restaurant" },
        { label: "Inventory" },
      ],
    },
    "/dashboard/balance-inventory": {
      title: "Balance inventory",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Restaurant" },
        { label: "Balance inventory" },
      ],
    },
    "/dashboard/purchases": {
      title: "Purchases",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Accounting" },
        { label: "Purchases" },
      ],
    },
    "/dashboard/expenses": {
      title: "Expenses",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Accounting" },
        { label: "Expenses" },
      ],
    },
    "/dashboard/assets": {
      title: "Assets",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Accounting" },
        { label: "Assets" },
      ],
    },
    "/dashboard/chart-of-accounts": {
      title: "Chart of Accounts",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Accounting" },
        { label: "Chart of Accounts" },
      ],
    },
    "/dashboard/journal": {
      title: "Journal Book",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Accounting" },
        { label: "Journal Book" },
      ],
    },
    "/dashboard/ledger": {
      title: "Ledger",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Accounting" },
        { label: "Ledger" },
      ],
    },
    "/dashboard/cashbook": {
      title: "Cashbook",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Accounting" },
        { label: "Cashbook" },
      ],
    },
    "/dashboard/reports/expenses": {
      title: "Expense report",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Reports" },
        { label: "Expense report" },
      ],
    },
    "/dashboard/reports/sales": {
      title: "Sales report",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Reports" },
        { label: "Sales report" },
      ],
    },
    "/dashboard/reports/pnl": {
      title: "Profit and loss",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Reports" },
        { label: "P&L" },
      ],
    },
    "/dashboard/ai-analytics": {
      title: "AI Analytics",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "AI Analytics" },
      ],
    },
    "/dashboard/payroll/employees": {
      title: "Employees",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll" },
        { label: "Employees" },
      ],
    },
    "/dashboard/payroll/employees/new": {
      title: "Add employee",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll" },
        { label: "Employees", href: "/dashboard/payroll/employees" },
        { label: "Add employee" },
      ],
    },
    "/dashboard/payroll/leave": {
      title: "Leave",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll" },
        { label: "Leave" },
      ],
    },
    "/dashboard/payroll/attendance": {
      title: "Attendance",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll" },
        { label: "Attendance" },
      ],
    },
    "/dashboard/payroll/payslips": {
      title: "Payslips",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll" },
        { label: "Payslips" },
      ],
    },
    "/dashboard/payroll/run": {
      title: "Pay and file",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll" },
        { label: "Pay and file" },
      ],
    },
    "/dashboard/payroll/policies": {
      title: "Payroll policies",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll" },
        { label: "Policies" },
      ],
    },
    "/dashboard/me": {
      title: "My pay",
      crumbs: [{ label: "My pay" }],
    },
    "/dashboard/settings": {
      title: "Settings",
      crumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }],
    },
  };

export function pageMeta(pathname: string) {
  const known = PAGE_META[pathname];
  if (known) return known;
  if (/^\/dashboard\/payroll\/employees\/[^/]+$/.test(pathname)) {
    return {
      title: "Edit employee",
      crumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll" },
        { label: "Employees", href: "/dashboard/payroll/employees" },
        { label: "Edit employee" },
      ],
    };
  }
  return { title: "Back Office", crumbs: [{ label: "Dashboard" }] };
}
