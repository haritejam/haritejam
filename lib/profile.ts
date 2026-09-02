export interface PersonalInfo {
  displayName: string;
  email: string;
  phone: string;
}

const PROFILE_KEY = "flexidine-profile";

export function readPersonalInfo(username: string): PersonalInfo {
  if (typeof window === "undefined") {
    return { displayName: username, email: "", phone: "" };
  }
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      return { displayName: username, email: "", phone: "" };
    }
    const parsed = JSON.parse(raw) as PersonalInfo;
    return {
      displayName: parsed.displayName || username,
      email: parsed.email ?? "",
      phone: parsed.phone ?? "",
    };
  } catch {
    return { displayName: username, email: "", phone: "" };
  }
}

export function writePersonalInfo(info: PersonalInfo) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(info));
  window.dispatchEvent(new Event("flexidine-auth"));
}
