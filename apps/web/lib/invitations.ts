import { createHash, randomBytes } from "crypto";
import { getAppBaseUrl } from "@/lib/env";

export const INVITATION_RESEND_COOLDOWN_MS = 60 * 1000;
export const INVITATION_EXPIRY_DAYS = 7;

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function invitationExpiresAt(from = new Date()): string {
  const expiresAt = new Date(from);
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);
  return expiresAt.toISOString();
}

export function buildInvitationAcceptPath(token: string): string {
  return `/invite/accept?token=${encodeURIComponent(token)}`;
}

export function buildInvitationAcceptUrl(token: string): string {
  return `${getAppBaseUrl()}${buildInvitationAcceptPath(token)}`;
}

export function isInvitationExpired(expiresAt: string, now = Date.now()): boolean {
  return new Date(expiresAt).getTime() < now;
}

export function invitationCooldownRemainingMs(lastSentAt: string, now = Date.now()): number {
  const elapsed = now - new Date(lastSentAt).getTime();
  return Math.max(0, INVITATION_RESEND_COOLDOWN_MS - elapsed);
}
