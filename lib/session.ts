export const SESSION_KEY = "flexidine-user";
export const AUTH_EVENT = "flexidine-auth";

export function readSession(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(SESSION_KEY);
}

export function writeSession(username: string) {
  window.localStorage.setItem(SESSION_KEY, username.trim());
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}
