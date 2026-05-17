export const roomParticipantKeys = {
  all: ["room-participants"] as const,
  lists: () => [...roomParticipantKeys.all, "list"] as const,
  list: (roomId: string) => [...roomParticipantKeys.lists(), roomId] as const,
};
