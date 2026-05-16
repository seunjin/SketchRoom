const GUEST_ID_STORAGE_KEY = "sketch-room:guest-id";

export const guestId = {
  get() {
    return window.localStorage.getItem(GUEST_ID_STORAGE_KEY);
  },
  set(value: string) {
    window.localStorage.setItem(GUEST_ID_STORAGE_KEY, value);
  },
  clear() {
    window.localStorage.removeItem(GUEST_ID_STORAGE_KEY);
  },
};
