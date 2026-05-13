import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeliveryRun, StaffSession } from './types';

type AppState = {
  session: StaffSession | null;
  run: DeliveryRun | null;

  setSession: (session: StaffSession | null) => void;
  setRun: (run: DeliveryRun | null) => void;
  clearWorkState: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      session: null,
      run: null,

      setSession: (session) => set({ session }),
      setRun: (run) => set({ run }),
      clearWorkState: () => set({ run: null }),
    }),
    {
      name: 'laundry-delivery-web-state',
      partialize: (state) => ({
        session: state.session,
        run: state.run,
      }),
    },
  ),
);
