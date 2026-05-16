export const roomKeys = {
  all: ["rooms"] as const,
  lists: () => [...roomKeys.all, "list"] as const,
  list: () => [...roomKeys.lists()] as const,
  details: () => [...roomKeys.all, "detail"] as const,
  detail: (roomId: string) => [...roomKeys.details(), roomId] as const,
};
