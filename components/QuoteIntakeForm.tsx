"use client";

import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

const serviceOptions = [
  "Construction Monitoring",
  "LiDAR Mapping / Survey",
  "Thermal Inspection",
  "Infrastructure / Utility",
  "Solar Farm Inspection",
  "Agriculture Drone Services",
  "Real Estate / Media",
  "Emergency Response Support",
];

export default function QuoteIntakeForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("Routing your request into the PPD quote-to-job pipeline...");

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      company_name: String(form.get("company_name") || ""),
      service_type: String(form.get("service_type") || "Commercial Drone Services"),
      project_location: String(form.get("project_location") || ""),
      project_summary: String(form.get("project_summary") || ""),
      requested_date: String(form.get("requested_date") || ""),
      budget_range: String(form.get("budget_range") || ""),
      source: "website_contact_v21",
    };

    try {
      if (!isSupabaseConfigured()) throw new Error("Supabase public environment variables are not configured.");
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase client is unavailable.");
      const { data, error } = await supabase.rpc("ppd_submit_quote_intake", { p_payload: payload });
      if (error) throw error;
      setStatus("success");
      setMessage(`Quote intake received. Estimated starting range: $${data?.estimated_price || "pending review"}. Risk gate: ${data?.risk_level || "review"}.`);
      event.currentTarget.reset();
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Unable to submit quote request right now.");
    }
  }

  return (
    <form className="ppd-launch-form panel-card" onSubmit={handleSubmit}>
      <div className="ppd-form-head">
        <span className="section-kicker">Live Quote Intake</span>
        <h2>Request a mission quote</h2>
        <p>Your request is routed into the controlled quote-to-job pipeline and owner approval queue.</p>
      </div>

      <div className="ppd-form-grid">
        <label>Name<input name="name" required placeholder="Your name" /></label>
        <label>Email<input name="email" type="email" required placeholder="you@example.com" /></label>
        <label>Phone<input name="phone" placeholder="Phone number" /></label>
        <label>Company<input name="company_name" placeholder="Company / project owner" /></label>
        <label>Service Type<select name="service_type" required>{serviceOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label>Requested Date<input name="requested_date" type="date" /></label>
        <label className="full-span">Project Location<input name="project_location" required placeholder="Address, city, site name, or coordinates" /></label>
        <label className="full-span">Project Summary<textarea name="project_summary" required rows={5} placeholder="Tell us what needs to be captured, inspected, mapped, documented, or delivered." /></label>
        <label className="full-span">Budget / Timing Notes<input name="budget_range" placeholder="Budget range, urgency, or special instructions" /></label>
      </div>

      <button className="primary-btn ppd-submit-btn" disabled={status === "sending"} type="submit">
        {status === "sending" ? "Submitting..." : "Submit Quote Request"}
      </button>
      {message && <p className={`ppd-form-message ${status}`}>{message}</p>}
    </form>
  );
}
