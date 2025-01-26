"use client";

import PricingSection from "./Landing/PricingSection";
import { useValtio } from "./data/valtio";
import { Plan } from "@prisma/client";
import { useSnapshot } from "valtio";
import { cn } from "@/ui-components/utils";

export function Paywall() {
  const { userStore } = useValtio();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const profile = useSnapshot(userStore.profile!);
  const open = profile.plan === Plan.None;

  return open ? (
    <div
      className={cn(
        "fixed top-0 left-0 w-full h-full z-50 bg-background overflow-auto"
      )}
    >
      <PricingSection userEmail={profile.email} />
    </div>
  ) : null;
}
