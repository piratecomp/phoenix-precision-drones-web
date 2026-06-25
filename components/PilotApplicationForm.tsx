"use client";

import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function PilotApplicationForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("Submitting pilot application into the verification queue...");

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      service_area: String(form.get("service_area") || ""),
      pilot_type: String(form.get("pilot_type") || "contractor"),
      part107_number: String(form.get("part107_number") || ""),
      drone_models: String(form.get("drone_models") || ""),
      insurance_status: String(form.get("insurance_status") || "unknown"),
      has_thermal: form.get("has_thermal") === "on",
      has_lidar: form.get("has_lidar") === "on",
      has_mapping: form.get("has_mapping") === "on",
      has_dji_sdk: form.get("has_dji_sdk") === "on",
      source: "pilot_application_v21",
    };

    try {
      if (!isSupabaseConfigured()) throw new Error("Supabase public environment variables are not configured.");
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase client is unavailable.");
      const { data, error } = await supabase.rpc("ppd_submit_pilot_application", { p_payload: payload });
      if (error) throw error;
      setStatus("success");
      setMessage(`Application received. Verification queue ID: ${data?.application_id || "created"}.`);
      event.currentTarget.reset();
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Unable to submit pilot application right now.");
    }
  }

  return (
    <form className="ppd-launch-form panel-card" onSubmit={handleSubmit}>
      <div className="ppd-form-head">
        <span className="section-kicker">Pilot Network V1</span>
        <h2>Apply to fly with PPD</h2>
        <p>Applications are routed into the controlled pilot verification workflow before any job assignment.</p>
      </div>

      <div className="ppd-form-grid">
        <label>Name<input name="name" required placeholder="Pilot name" /></label>
        <label>Email<input name="email" required type="email" placeholder="pilot@example.com" /></label>
        <label>Phone<input name="phone" placeholder="Phone number" /></label>
        <label>Pilot Type<select name="pilot_type"><option value="contractor">1099 Contractor</option><option value="w2">W2 Pilot</option><option value="observer">Observer</option></select></label>
        <label>Part 107 Number<input name="part107_number" placeholder="FAA certificate number" /></label>
        <label>Insurance Status<select name="insurance_status"><option value="unknown">Unknown / need to verify</option><option value="active">Active</option><option value="pending">Pending</option><option value="none">None yet</option></select></label>
        <label className="full-span">Service Area<input name="service_area" required placeholder="Phoenix metro, statewide, travel radius, etc." /></label>
        <label className="full-span">Drone Models / Payloads<textarea name="drone_models" rows={4} placeholder="List drones, cameras, thermal payloads, mapping tools, LiDAR, etc." /></label>
      </div>

      <div className="ppd-capability-grid">
        <label><input name="has_thermal" type="checkbox" /> Thermal</label>
        <label><input name="has_lidar" type="checkbox" /> LiDAR</label>
        <label><input name="has_mapping" type="checkbox" /> Mapping</label>
        <label><input name="has_dji_sdk" type="checkbox" /> DJI SDK capable</label>
      </div>

      <button className="primary-btn ppd-submit-btn" disabled={status === "sending"} type="submit">
        {status === "sending" ? "Submitting..." : "Submit Pilot Application"}
      </button>
      {message && <p className={`ppd-form-message ${status}`}>{message}</p>}
    </form>
  );
}
