import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

export type StorageMode = "local" | "cloud";

export type CloudSessionInfo = {
  configured: boolean;
  email: string | null;
  userId: string | null;
};

const LOCAL_STATE_KEY = "l3d-calculadora-precos-v1";
const STORAGE_MODE_KEY = "l3d-calculadora-precos-storage-mode";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

function parseLocalJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function sessionToInfo(session: Session | null): CloudSessionInfo {
  return {
    configured: Boolean(supabaseClient),
    email: session?.user.email ?? null,
    userId: session?.user.id ?? null,
  };
}

async function getCloudSession(): Promise<Session | null> {
  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    throw error;
  }

  return data.session;
}

export function isCloudConfigured(): boolean {
  return Boolean(supabaseClient);
}

export function getSavedStorageMode(): StorageMode {
  const saved = localStorage.getItem(STORAGE_MODE_KEY);
  return saved === "cloud" ? "cloud" : "local";
}

export function saveStorageMode(mode: StorageMode): void {
  localStorage.setItem(STORAGE_MODE_KEY, mode);
}

export function loadLocalSnapshot<T>(fallback: T): T {
  return parseLocalJson<T>(localStorage.getItem(LOCAL_STATE_KEY), fallback);
}

export function saveLocalSnapshot<T>(data: T): void {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(data));
}

export async function getCloudSessionInfo(): Promise<CloudSessionInfo> {
  if (!supabaseClient) {
    return { configured: false, email: null, userId: null };
  }

  const session = await getCloudSession();
  return sessionToInfo(session);
}

export function subscribeToCloudAuth(
  callback: (info: CloudSessionInfo) => void,
): () => void {
  if (!supabaseClient) {
    callback({ configured: false, email: null, userId: null });
    return () => undefined;
  }

  const {
    data: { subscription },
  } = supabaseClient.auth.onAuthStateChange((_event, session) => {
    callback(sessionToInfo(session));
  });

  return () => {
    subscription.unsubscribe();
  };
}

export async function signInCloud(email: string): Promise<void> {
  if (!supabaseClient) {
    throw new Error("Supabase nao configurado.");
  }

  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).toString(),
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOutCloud(): Promise<void> {
  if (!supabaseClient) {
    return;
  }

  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function pullCloudSnapshot<T>(): Promise<T | null> {
  if (!supabaseClient) {
    throw new Error("Supabase nao configurado.");
  }

  const session = await getCloudSession();
  const userId = session?.user.id;

  if (!userId) {
    throw new Error("Usuario nao autenticado na nuvem.");
  }

  const { data, error } = await supabaseClient
    .from("app_states")
    .select("payload")
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.payload as T | undefined) ?? null;
}

export async function pushCloudSnapshot<T>(payload: T): Promise<void> {
  if (!supabaseClient) {
    throw new Error("Supabase nao configurado.");
  }

  const session = await getCloudSession();
  const userId = session?.user.id;

  if (!userId) {
    throw new Error("Usuario nao autenticado na nuvem.");
  }

  const { error } = await supabaseClient.from("app_states").upsert(
    {
      owner_id: userId,
      payload,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "owner_id",
    },
  );

  if (error) {
    throw error;
  }
}
