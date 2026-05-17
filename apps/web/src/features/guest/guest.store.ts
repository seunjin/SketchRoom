import { create } from "zustand";
import { guestId } from "./guest.storage";

interface GuestStore {
  guestId: string | null;
  setGuestId: (value: string) => void;
  clearGuestId: () => void;
}

export const useGuestStore = create<GuestStore>((set) => ({
  guestId: guestId.get(),
  setGuestId: (value) => {
    guestId.set(value);
    set({ guestId: value });
  },
  clearGuestId: () => {
    guestId.clear();
    set({ guestId: null });
  },
}));
