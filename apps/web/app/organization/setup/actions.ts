"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  activateMyOrganizationSubscription,
  saveMyOrganizationSetupDraft
} from "@/lib/db/organizations";

const organizationSetupSchema = z.object({
  organizationName: z.string().min(3).max(120),
  planCode: z.enum(["essencial", "equipe", "enterprise"]).default("equipe")
});

export async function saveOrganizationSetupDraftAction(rawInput: unknown) {
  const input = organizationSetupSchema.parse(rawInput);
  const draft = await saveMyOrganizationSetupDraft(input);

  revalidatePath("/organization/setup");
  revalidatePath("/organization/setup/plan");
  return draft;
}

export async function activateOrganizationSetupAction(rawInput: unknown) {
  const input = organizationSetupSchema.parse(rawInput);
  const result = await activateMyOrganizationSubscription(input);

  revalidatePath("/organization/setup");
  revalidatePath("/organization/setup/plan");
  revalidatePath("/", "layout");
  return result;
}
