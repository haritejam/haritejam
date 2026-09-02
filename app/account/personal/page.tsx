"use client";

import { FormEvent, useEffect, useState } from "react";
import { readPersonalInfo, writePersonalInfo } from "@/lib/profile";
import { readSession } from "@/lib/session";

export default function PersonalInfoPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const session = readSession() ?? "";
    const info = readPersonalInfo(session);
    setDisplayName(info.displayName);
    setEmail(info.email);
    setPhone(info.phone);
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    writePersonalInfo({ displayName: displayName.trim(), email: email.trim(), phone: phone.trim() });
    setSaved(true);
  }

  const fieldClass =
    "mt-1.5 w-full rounded-[6px] border border-line bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent";

  return (
    <form onSubmit={onSubmit} className="site-card max-w-md space-y-4 p-6">
      <label className="block text-sm text-muted">
        Name
        <input className={fieldClass} value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
      </label>
      <label className="block text-sm text-muted">
        Email
        <input type="email" className={fieldClass} value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="block text-sm text-muted">
        Phone
        <input type="tel" className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} />
      </label>
      <button type="submit" className="site-btn">
        Save personal info
      </button>
      {saved ? <p className="text-sm text-muted">Saved on this device.</p> : null}
    </form>
  );
}
