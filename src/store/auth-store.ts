import { create } from "zustand";
import { DEMO_CREDENTIALS, DEMO_USER, SESSION_KEY } from "@/lib/constants";
import { employeeName } from "@/lib/payroll";
import { useAppStore } from "@/store/app-store";
import type { SessionUser } from "@/types";

interface AuthState {
  hydrated: boolean;
  session: SessionUser | null;
  hydrate: () => void;
  login: (email: string, password: string, rememberMe: boolean) => string | null;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  session: null,
  hydrate: () => {
    if (typeof window === "undefined") {
      set({ hydrated: true, session: null });
      return;
    }
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      set({
        hydrated: true,
        session: raw ? (JSON.parse(raw) as SessionUser) : null,
      });
    } catch {
      set({ hydrated: true, session: null });
    }
  },
  login: (email, password, rememberMe) => {
    const normalised = email.trim().toLowerCase();
    const staff = useAppStore
      .getState()
      .employees.find(
        (employee) =>
          employee.isActive &&
          employee.email.trim().toLowerCase() === normalised &&
          employee.portalPassword.length > 0 &&
          employee.portalPassword === password
      );
    const session: SessionUser | null =
      normalised === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password
        ? {
            email: DEMO_CREDENTIALS.email,
            name: DEMO_USER.name,
            role: DEMO_USER.role,
            employeeId: null,
            rememberMe,
            loggedInAt: new Date().toISOString(),
          }
        : staff
          ? {
              email: staff.email,
              name: employeeName(staff),
              role: "Staff",
              employeeId: staff.id,
              rememberMe,
              loggedInAt: new Date().toISOString(),
            }
          : null;
    if (!session) return "Invalid email or password. Use the demo credentials shown below.";
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    set({ session });
    return null;
  },
  logout: () => {
    window.localStorage.removeItem(SESSION_KEY);
    set({ session: null });
  },
}));
