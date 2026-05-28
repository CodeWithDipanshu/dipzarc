import { create } from 'zustand'
import type { AppState, Profile, TimerState } from '@/types'

export const useAppStore = create<AppState>((set) => ({
  profile:     null,
  activeTimer: null,

  setProfile: (profile) => set({ profile }),

  setActiveTimer: (activeTimer) => set({ activeTimer }),

  updateTimerElapsed: (seconds, aura) =>
    set((state) => ({
      activeTimer: state.activeTimer
        ? { ...state.activeTimer, elapsedSeconds: seconds, auraEarned: aura }
        : null,
    })),
}))
