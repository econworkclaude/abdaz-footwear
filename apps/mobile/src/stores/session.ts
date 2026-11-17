import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { IS_LIVE } from '@/config';
import { live, sb } from '@/services/live';
import { safeStorage } from '@/services/storage';
import type { Session } from '@/types';

export const DEMO_OTP = '123456';
export const DEMO_ADMIN_PIN = '2468';

interface SessionState {
  session: Session | null;
  ready: boolean;
  init: () => Promise<void>;
  /** demo-mode sign in (no server) */
  demoSignIn: (s: Session) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  setName: (n: string) => Promise<void>;
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      session: null,
      ready: false,
      init: async () => {
        if (!useSession.persist.hasHydrated())
          await new Promise<void>((r) => {
            const u = useSession.persist.onFinishHydration(() => {
              u();
              r();
            });
            setTimeout(r, 2000);
          });
        if (IS_LIVE) {
          try {
            set({ session: await live.session() });
          } catch {
            set({ session: null });
          }
          sb().auth.onAuthStateChange(() => {
            setTimeout(() => void get().refresh(), 0);
          });
        }
        set({ ready: true });
      },
      demoSignIn: (s) => set({ session: s }),
      refresh: async () => {
        if (IS_LIVE) set({ session: await live.session().catch(() => null) });
      },
      signOut: async () => {
        if (IS_LIVE) await live.signOut();
        set({ session: null });
      },
      setName: async (name) => {
        const s = get().session;
        if (!s) return;
        if (IS_LIVE) await live.updateName(s.userId, name);
        set({ session: { ...s, name } });
      },
    }),
    {
      name: 'abdaz-session-v1',
      storage: createJSONStorage(() => safeStorage),
      // live sessions are stored by Supabase itself
      partialize: (s) => (IS_LIVE ? {} : { session: s.session }),
    },
  ),
);
