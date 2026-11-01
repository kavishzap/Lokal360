import { create } from "zustand";
import { DEMO_CREDENTIALS, DEMO_USER, SESSION_KEY } from "@/lib/constants";
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
    if (
      email.trim().toLowerCase() !== DEMO_CREDENTIALS.email ||
      password !== DEMO_CREDENTIALS.password
    ) {
      return "Invalid email or password. Use the demo credentials shown below.";
    }

    const session: SessionUser = {
      email: DEMO_CREDENTIALS.email,
      name: DEMO_USER.name,
      role: DEMO_USER.role,
      rememberMe,
      loggedInAt: new Date().toISOString(),
    };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    set({ session });
    return null;
  },
  logout: () => {
    window.localStorage.removeItem(SESSION_KEY);
    set({ session: null });
  },
}));
