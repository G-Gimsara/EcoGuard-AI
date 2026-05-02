"use client";

import { useState } from "react";
import axios from "axios";

type User = {
  name: string;
  phone: string;
  alert_frequency: "daily"  | "off";
};

type PlanType = "daily"  | "off";

const PLANS = [
  {
    id: "daily",
    label: "Daily",
    desc: "Alert every day",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
 
  {
    id: "off",
    label: "Unsubscribe",
    desc: "Stop all alerts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
] as const;

const PLAN_STYLES: Record<PlanType, any> = {
  daily: {
    badge: "bg-blue-100 text-blue-800 border border-blue-200",
    btn: "border-2 border-blue-300 bg-blue-50 text-blue-700",
    icon: "text-blue-500",
    current: "text-blue-600",
  },
 
  off: {
    badge: "bg-red-100 text-red-800 border border-red-200",
    btn: "border-2 border-red-300 bg-red-50 text-red-700",
    icon: "text-red-400",
    current: "text-red-500",
  },
};

function getInitials(name: string = ""): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function Spinner({ color = "border-t-white" }: { color?: string }) {
  return (
    <span className={`inline-block w-4 h-4 rounded-full border-2 border-white/30 ${color} animate-spin`} />
  );
}

export default function ManageSubscription() {
  const [phone, setPhone] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<PlanType | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [error, setError] = useState<string>("");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCheck = async () => {
    if (!phone.trim()) return;
    try {
      setLoading(true);
      setError("");
      setUser(null);

      const res = await axios.post("http://localhost:5000/api/air/check", {
        phone: "94" + phone,
      });

      setUser(res.data);
    } catch {
      setError("No subscriber found for this number.");
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (plan: PlanType) => {
    try {
      setUpdating(plan);

      await axios.post("http://localhost:5000/api/air/update", {
        phone: "94" + phone,
        alert_frequency: plan,
      });

      setUser((prev) => prev ? { ...prev, alert_frequency: plan } : prev);

      showToast(plan === "off" ? "Unsubscribed successfully" : `Switched to ${plan} alerts`);
    } catch {
      showToast("Failed to update plan.", "error");
    } finally {
      setUpdating(null);
    }
  };

  const currentPlan: PlanType = user?.alert_frequency || "daily";
  const planStyle = PLAN_STYLES[currentPlan];

  return (

    <div>
   
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-2">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-[#123985] px-6 py-5 flex items-start gap-3">
          <div className="mt-0.5 bg-white/20 rounded-xl p-2 shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">Manage Subscription</h1>
            <p className="text-blue-200 text-xs mt-0.5">Look up and update a subscriber's alert plan</p>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-4">

          {/* Phone input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-800 uppercase tracking-widest mb-2">
              Phone Number
            </label>
            <div className="flex gap-2">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-medium text-slate-500 shrink-0">
                +94
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                placeholder="7X XXX XXXX"
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Lookup button */}
          <button
            onClick={handleCheck}
            disabled={loading || !phone.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#123985] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl py-2.5 transition-all duration-150"
          >
            {loading ? (
              <>
                <Spinner />
                Checking…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                Look up subscriber
              </>
            )}
          </button>

          {/* ── User card ── */}
          {user && (
            <div className="space-y-3 pt-1">

              {/* Profile */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-800">+{user.phone}</p>
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${planStyle.badge}`}>
                  {currentPlan}
                </span>
              </div>

              {/* Current plan label */}
              <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
                <span className="text-xs text-slate-800">Current plan</span>
                <span className={`text-xs font-semibold capitalize ${planStyle.current}`}>
                  {currentPlan}
                </span>
              </div>

              {/* Plan selector */}
              <div>
                <p className="text-[11px] font-semibold text-slate-800 uppercase tracking-widest mb-2">
                  Change Plan
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PLANS.map((plan) => {
                    const active = currentPlan === plan.id;
                    const s = PLAN_STYLES[plan.id];
                    return (
                      <button
                        key={plan.id}
                        onClick={() => updatePlan(plan.id)}
                        disabled={updating === plan.id}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 text-center transition-all duration-150 active:scale-95 disabled:opacity-60
                          ${active
                            ? s.btn
                            : "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                      >
                        <span className={active ? s.icon : "text-slate-800"}>
                          {updating === plan.id
                            ? <Spinner color={active ? "border-t-current" : "border-t-slate-400"} />
                            : plan.icon}
                        </span>
                        <span className="text-[12px] font-semibold leading-tight">{plan.label}</span>
                        <span className="text-[10px] text-slate-800 leading-tight">{plan.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium
              ${toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              {toast.type === "error" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {toast.msg}
            </div>
          )}

        </div>
      </div>
    </div>
    </div>
  );
}
