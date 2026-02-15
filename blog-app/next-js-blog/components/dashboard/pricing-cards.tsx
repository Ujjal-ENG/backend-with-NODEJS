"use client";

import { useActionState } from "react";
import {
  purchasePlanAction,
  type PlanPurchaseActionState,
} from "@/app/dashboard/pricing/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CurrentUserPlan } from "@/types/api";
import { UserPlan } from "@/types/entities";

type PlanCardConfig = {
  plan: UserPlan;
  label: string;
  price: string;
  description: string;
  postsPerDay: string;
  editablePosts: string;
  burstLimit: string;
  purchasable: boolean;
};

/**
 * Display-only pricing metadata.
 * Backend remains the source of truth for actual enforcement.
 */
const PLAN_CARDS: PlanCardConfig[] = [
  {
    plan: UserPlan.FREE,
    label: "Free",
    price: "$0",
    description: "Basic plan for testing and reading content",
    postsPerDay: "5 posts/day",
    editablePosts: "Read-only for existing posts",
    burstLimit: "5 create requests per burst window",
    purchasable: false,
  },
  {
    plan: UserPlan.PRO,
    label: "Pro",
    price: "$9 / month",
    description: "For active creators who publish frequently",
    postsPerDay: "50 posts/day",
    editablePosts: "Edit and delete your own posts",
    burstLimit: "20 create requests per burst window",
    purchasable: true,
  },
  {
    plan: UserPlan.BUSINESS,
    label: "Business",
    price: "$29 / month",
    description: "High-capacity plan for heavy testing",
    postsPerDay: "500 posts/day",
    editablePosts: "Full editing for your own posts",
    burstLimit: "50 create requests per burst window",
    purchasable: true,
  },
];

interface PricingCardsProps {
  currentPlan: CurrentUserPlan;
}

export function PricingCards({ currentPlan }: PricingCardsProps) {
  const [state, formAction, isPending] = useActionState<
    PlanPurchaseActionState,
    FormData
  >(purchasePlanAction, {});

  const activePlan = state.activePlan ?? currentPlan.plan;

  return (
    <div className="space-y-4">
      {state.error ? (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="rounded-md bg-green-100 p-3 text-sm text-green-700">
          {state.success}
        </div>
      ) : null}

      <form action={formAction} className="grid gap-4 lg:grid-cols-3">
        {PLAN_CARDS.map((card) => {
          // Prefer optimistic state result after purchase, fallback to server value.
          const isCurrentPlan = activePlan === card.plan;

          return (
            <Card key={card.plan} className={isCurrentPlan ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{card.label}</CardTitle>
                  {isCurrentPlan ? <Badge>Current</Badge> : null}
                </div>
                <CardDescription>{card.description}</CardDescription>
                <p className="text-2xl font-bold">{card.price}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{card.postsPerDay}</p>
                <p>{card.editablePosts}</p>
                <p>{card.burstLimit}</p>

                <Button
                  type="submit"
                  name="plan"
                  value={card.plan}
                  className="mt-3 w-full"
                  disabled={isPending || isCurrentPlan || !card.purchasable}
                  variant={isCurrentPlan ? "secondary" : "default"}
                >
                  {isCurrentPlan
                    ? "Current Plan"
                    : isPending
                      ? "Buying..."
                      : card.purchasable
                        ? `Buy ${card.label}`
                        : "Included"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </form>
    </div>
  );
}
