import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { getGuest, guestId, guestKeys, useGuestStore } from "../features/guest";

export const Route = createFileRoute("/_guest")({
  beforeLoad: async ({ context }) => {
    const storedGuestId = guestId.get();

    if (!storedGuestId) {
      throw redirect({ to: "/" });
    }

    try {
      await context.queryClient.ensureQueryData({
        queryKey: guestKeys.detail(storedGuestId),
        queryFn: () => getGuest(storedGuestId),
      });
    } catch {
      useGuestStore.getState().clearGuestId();
      throw redirect({ to: "/" });
    }

    return {
      guestId: storedGuestId,
    };
  },
  component: GuestLayout,
});

function GuestLayout() {
  return <Outlet />;
}
