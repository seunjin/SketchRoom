import { useShallow } from "zustand/react/shallow";
import { useGuestStore } from "./guest.store";

export function useGuestSession() {
  return useGuestStore(
    useShallow((state) => ({
      guestId: state.guestId,
      setGuestId: state.setGuestId,
      clearGuestId: state.clearGuestId,
      hasGuest: Boolean(state.guestId),
    })),
  );
}
