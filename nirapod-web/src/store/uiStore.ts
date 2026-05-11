import { create } from "zustand";

interface UiState {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  filterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;

  unreadNotificationCount: number;
  setUnreadNotificationCount: (count: number) => void;
  incrementUnread: () => void;
  resetUnread: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  filterPanelOpen: false,
  setFilterPanelOpen: (open) => set({ filterPanelOpen: open }),

  unreadNotificationCount: 0,
  setUnreadNotificationCount: (count) => set({ unreadNotificationCount: count }),
  incrementUnread: () => set((s) => ({ unreadNotificationCount: s.unreadNotificationCount + 1 })),
  resetUnread: () => set({ unreadNotificationCount: 0 }),
}));
