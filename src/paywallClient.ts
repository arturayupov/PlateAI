// Frontend helpers for the PlateAI one-time download unlock.
// No accounts: a random projectId + a signed entitlement token in localStorage.

const PROJECT_KEY = "plateai_project_id";
const TOKEN_KEY = "plateai_entitlement";

export function getProjectId(): string {
  let id = localStorage.getItem(PROJECT_KEY);
  if (!id) {
    id = "proj_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(PROJECT_KEY, id);
  }
  return id;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export interface PaywallStatus {
  paymentsEnabled: boolean;
  freeLimit: number;
  remaining: number;
  priceUsd: number;
}

export async function fetchPaywallStatus(): Promise<PaywallStatus | null> {
  try {
    const r = await fetch("/api/paywall/status");
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

// Redirects the browser to Stripe Checkout.
export async function startCheckout(): Promise<void> {
  const projectId = getProjectId();
  const r = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  const data = await r.json();
  if (!r.ok || !data.url) {
    throw new Error(data.error || "Could not start checkout.");
  }
  window.location.href = data.url;
}

export async function confirmPayment(sessionId: string): Promise<{ paid: boolean; token?: string; projectId?: string }> {
  const r = await fetch(`/api/payment/confirm?session_id=${encodeURIComponent(sessionId)}`);
  const data = await r.json();
  if (!r.ok) return { paid: false };
  return data;
}

// Returns a map of imageId -> clean data URL (or null if expired/missing).
export async function unlockImages(token: string, projectId: string, imageIds: string[]): Promise<Record<string, string | null>> {
  const r = await fetch("/api/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, projectId, imageIds }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Unlock failed.");
  return data.images || {};
}
