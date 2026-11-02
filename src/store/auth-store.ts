import { create } from "zustand";
import { DEMO_CREDENTIALS, DEMO_USER, SESSION_KEY } from "@/lib/constants";
import { employeeName } from "@/lib/payroll";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { noteActor, noteSignedOut } from "@/lib/supabase/sync";
import { useAppStore } from "@/store/app-store";
import type { SessionUser } from "@/types";

let authHydrateGeneration = 0;
let authHydrateInflight: Promise<void> | null = null;

interface AuthState {
  hydrated: boolean;
  session: SessionUser | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string, rememberMe: boolean) => string | null | Promise<string | null>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  session: null,
  hydrate: () => {
    if (typeof window === "undefined") {
      set({ hydrated: true, session: null });
      return Promise.resolve();
    }
    if (isSupabaseConfigured()) {
      if (authHydrateInflight) return authHydrateInflight;
      const generation = ++authHydrateGeneration;
      authHydrateInflight = (async () => {
        const { data } = await getSupabase().auth.getSession();
        if (generation !== authHydrateGeneration) return;
        const user = data.session?.user;
        if (!user) {
          noteSignedOut();
          set({ hydrated: true, session: null });
          return;
        }
        const { data: profile } = await getSupabase()
          .from("profiles")
          .select("full_name, role, employee_id")
          .eq("id", user.id)
          .single();
        if (generation !== authHydrateGeneration) return;
        if (!profile) {
          noteSignedOut();
          set({ hydrated: true, session: null });
          return;
        }
        noteActor(profile.role, profile.employee_id);
        set({
          hydrated: true,
          session: {
            email: user.email ?? "",
            name: profile.full_name,
            role: profile.role === "staff" ? "Staff" : "Administrator",
            employeeId: profile.employee_id,
            rememberMe: true,
            loggedInAt: new Date().toISOString(),
          },
        });
      })().finally(() => {
        authHydrateInflight = null;
      });
      return authHydrateInflight;
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
    return Promise.resolve();
  },
  login: (email, password, rememberMe) => {
    if (isSupabaseConfigured()) return loginWithSupabase(email, password, rememberMe, set);
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
    authHydrateGeneration += 1;
    authHydrateInflight = null;
    if (isSupabaseConfigured()) {
      noteSignedOut();
      useAppStore.getState().clearRemote();
      void getSupabase().auth.signOut();
    }
    window.localStorage.removeItem(SESSION_KEY);
    set({ session: null });
  },
}));

async function loginWithSupabase(
  email: string,
  password: string,
  rememberMe: boolean,
  set: (partial: Partial<AuthState>) => void
) {
  authHydrateGeneration += 1;
  authHydrateInflight = null;
  useAppStore.getState().clearRemote();
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user) return error?.message ?? "Invalid email or password.";
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, employee_id")
    .eq("id", data.user.id)
    .single();
  if (profileError || !profile) return "Signed in, but this account has no profile yet.";
  authHydrateGeneration += 1;
  noteActor(profile.role, profile.employee_id);
  set({
    hydrated: true,
    session: {
      email: data.user.email ?? email,
      name: profile.full_name,
      role: profile.role === "staff" ? "Staff" : "Administrator",
      employeeId: profile.employee_id,
      rememberMe,
      loggedInAt: new Date().toISOString(),
    },
  });
  await useAppStore.getState().hydrate();
  return null;
}
