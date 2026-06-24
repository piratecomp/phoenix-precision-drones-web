"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Loader2, LockKeyhole, UserPlus } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function PortalSignupClient() {
  const configured = isSupabaseConfigured();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Customer account creation is not configured yet.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.join(" ") || "Customer";

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            first_name: firstName || "Customer",
            last_name: lastName,
            phone,
            requested_role: "customer",
          },
        },
      });
      if (error) throw error;
      setMessage("Customer account created. Check your email if confirmation is required, then log in.");
    } catch (err: any) {
      setMessage(err?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-hero section-pad login-page-v15 login-gui-page login-game-page">
      <div className="login-game-shell container signup-game-shell">
        <div className="login-game-card panel-card signup-game-card">
          <div className="login-topo-ridge" aria-hidden="true" />
          <div className="login-game-header signup-header">
            <div className="login-emblem-wrap small-emblem">
              <Image src="/images/logo-emblem-clean.png" alt="Phoenix Precision Drones logo" width={1026} height={1028} className="login-emblem-only" priority />
            </div>
            <div className="login-header-copy">
              <span className="section-kicker">Customer Access</span>
              <h1>Create Account</h1>
            </div>
          </div>

          <form className="login-form-preview login-gui-form login-game-form signup-game-form" onSubmit={handleSubmit}>
            <label>
              Full Name
              <input type="text" placeholder="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} disabled={!configured || loading} required />
            </label>
            <label>
              Email
              <input type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} disabled={!configured || loading} required />
            </label>
            <label>
              Phone
              <input type="tel" placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={!configured || loading} />
            </label>
            <label>
              Password
              <input type="password" placeholder="Create password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={!configured || loading} required minLength={8} />
            </label>
            <button className="primary-btn full-width-btn login-submit-gui" type="submit" disabled={!configured || loading}>
              {loading ? <Loader2 className="portal-spin" size={18} /> : <UserPlus size={18} />}
              Create Customer Account
              {!loading ? <ArrowRight size={18} /> : null}
            </button>
          </form>

          {message && <p className="portal-error-note">{message}</p>}
          {!configured && <p className="login-note">Customer account creation is waiting for live Supabase environment variables.</p>}

          <div className="login-gui-actions login-game-actions single-action">
            <Link className="ghost-btn" href="/login"><LockKeyhole size={18} /> Back to Login</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
