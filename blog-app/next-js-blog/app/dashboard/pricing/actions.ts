"use server";

import { toApiRequestError } from "@/lib/api-error";
import { purchaseCurrentUserPlan } from "@/lib/api/plans";
import { getSession, setAuthCookies } from "@/lib/auth";
import type { ApiResponse, AuthTokens } from "@/types/api";
import { UserPlan } from "@/types/entities";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";

const API_BASE = process.env.API_BASE_URL || "http://localhost:4000";

export type PlanPurchaseActionState = {
  error?: string;
  success?: string;
  activePlan?: UserPlan;
};

/**
 * Server action backing the "Buy plan" buttons.
 * It executes a mock purchase and then refreshes auth cookies so
 * JWT-based plan gates reflect the new tier immediately.
 */
export async function purchasePlanAction(
  _prevState: PlanPurchaseActionState,
  formData: FormData,
): Promise<PlanPurchaseActionState> {
  const session = await getSession();
  if (!session) {
    return { error: "You are not authenticated" };
  }

  const planRaw = formData.get("plan");
  if (typeof planRaw !== "string") {
    return { error: "Plan is required" };
  }

  if (!Object.values(UserPlan).includes(planRaw as UserPlan)) {
    return { error: "Invalid plan" };
  }

  const targetPlan = planRaw as UserPlan;
  if (targetPlan === UserPlan.FREE) {
    return { error: "Free plan cannot be purchased" };
  }

  try {
    const result = await purchaseCurrentUserPlan(targetPlan);
    await refreshSessionTokens();
    updateTag("current-user-plan");

    return {
      success: result.message,
      activePlan: result.plan,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Failed to buy plan" };
  }
}

/**
 * Best-effort token refresh after plan change.
 * Without this, UI may continue using stale JWT claim values until re-login.
 */
async function refreshSessionTokens(): Promise<void> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!accessToken || !refreshToken) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    console.log("Token refresh response:", response);

    if (!response.ok) {
      throw await toApiRequestError(response, "Failed to refresh auth session");
    }

    const json: ApiResponse<AuthTokens> = await response.json();
    await setAuthCookies(json.data.accessToken, json.data.refreshToken);
  } catch {
    // Token refresh is best-effort after plan purchase.
  }
}
