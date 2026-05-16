export const guestKeys = {
  all: ["guest"] as const,
  details: () => [...guestKeys.all, "detail"] as const,
  detail: (guestId: string) => [...guestKeys.details(), guestId] as const,
};
