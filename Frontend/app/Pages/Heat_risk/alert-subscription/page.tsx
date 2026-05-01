"use client";

import React, { useState } from "react";
import Navigation from "../components/Navigation";

type ApiResponse = {
  message?: string;
  error?: string;
};

const API_BASE = "http://localhost:5000/api";

export default function AlertSubscriptionPage() {
  const [subscribeForm, setSubscribeForm] = useState({
    full_name: "",
    phone_number: "",
    otp_code: "",
  });
  const [unsubscribeForm, setUnsubscribeForm] = useState({
    phone_number: "",
    otp_code: "",
  });

  const [subscribeOtpSent, setSubscribeOtpSent] = useState(false);
  const [unsubscribeOtpSent, setUnsubscribeOtpSent] = useState(false);
  const [busyAction, setBusyAction] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const postJson = async (url: string, payload: Record<string, string>) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ApiResponse;
    if (!response.ok) {
      throw new Error(data?.error || "Request failed");
    }

    return data;
  };

  const sendSubscribeOtp = async () => {
    setBusyAction("subscribe-send");
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const data = await postJson(`${API_BASE}/subscribe/send-otp`, {
        full_name: subscribeForm.full_name,
        phone_number: subscribeForm.phone_number,
      });
      setSubscribeOtpSent(true);
      setSuccessMessage(data.message || "OTP sent successfully.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send OTP");
    } finally {
      setBusyAction("");
    }
  };

  const confirmSubscribe = async () => {
    setBusyAction("subscribe-confirm");
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const data = await postJson(`${API_BASE}/subscribe/confirm`, {
        full_name: subscribeForm.full_name,
        phone_number: subscribeForm.phone_number,
        otp_code: subscribeForm.otp_code,
      });
      setSuccessMessage(data.message || "Subscribed successfully.");
      setSubscribeForm({ full_name: "", phone_number: "", otp_code: "" });
      setSubscribeOtpSent(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to confirm subscription");
    } finally {
      setBusyAction("");
    }
  };

  const sendUnsubscribeOtp = async () => {
    setBusyAction("unsubscribe-send");
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const data = await postJson(`${API_BASE}/unsubscribe/send-otp`, {
        phone_number: unsubscribeForm.phone_number,
      });
      setUnsubscribeOtpSent(true);
      setSuccessMessage(data.message || "OTP sent successfully.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send OTP");
    } finally {
      setBusyAction("");
    }
  };

  const confirmUnsubscribe = async () => {
    setBusyAction("unsubscribe-confirm");
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const data = await postJson(`${API_BASE}/unsubscribe/confirm`, {
        phone_number: unsubscribeForm.phone_number,
        otp_code: unsubscribeForm.otp_code,
      });
      setSuccessMessage(data.message || "Unsubscribed successfully.");
      setUnsubscribeForm({ phone_number: "", otp_code: "" });
      setUnsubscribeOtpSent(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to confirm unsubscription");
    } finally {
      setBusyAction("");
    }
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: 18,
    border: "1.5px solid #e2e8f0",
    boxShadow: "0 2px 10px rgba(15,23,42,0.06)",
    padding: 24,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 10,
    border: "1.5px solid #cbd5e1",
    background: "#f8fafc",
    padding: "12px 14px",
    fontSize: 14,
    color: "#0f172a",
  };

  const buttonStyle: React.CSSProperties = {
    borderRadius: 10,
    border: "none",
    background: "#ea580c",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 700,
    padding: "12px 16px",
    cursor: "pointer",
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navigation />

      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900">Alert Subscription</h1>
          <p className="text-sm text-slate-600 mt-2">
            Subscribe or unsubscribe from EcoGuard SMS heat alerts using OTP verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <section style={cardStyle}>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Subscribe</h2>
            <p className="text-sm text-slate-600 mb-4">Enter your details and request an OTP.</p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full name"
                value={subscribeForm.full_name}
                onChange={(event) =>
                  setSubscribeForm((prev) => ({ ...prev, full_name: event.target.value }))
                }
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Phone number (e.g. 0771234567)"
                value={subscribeForm.phone_number}
                onChange={(event) =>
                  setSubscribeForm((prev) => ({ ...prev, phone_number: event.target.value }))
                }
                style={inputStyle}
              />

              <button
                type="button"
                onClick={sendSubscribeOtp}
                disabled={busyAction === "subscribe-send"}
                style={{ ...buttonStyle, opacity: busyAction === "subscribe-send" ? 0.7 : 1 }}
              >
                {busyAction === "subscribe-send" ? "Sending..." : "Send OTP"}
              </button>

              {subscribeOtpSent && (
                <>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={subscribeForm.otp_code}
                    onChange={(event) =>
                      setSubscribeForm((prev) => ({ ...prev, otp_code: event.target.value }))
                    }
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={confirmSubscribe}
                    disabled={busyAction === "subscribe-confirm"}
                    style={{ ...buttonStyle, opacity: busyAction === "subscribe-confirm" ? 0.7 : 1 }}
                  >
                    {busyAction === "subscribe-confirm" ? "Confirming..." : "Confirm Subscribe"}
                  </button>
                </>
              )}
            </div>
          </section>

          <section style={cardStyle}>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Unsubscribe</h2>
            <p className="text-sm text-slate-600 mb-4">Request OTP to stop SMS heat alerts.</p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Phone number"
                value={unsubscribeForm.phone_number}
                onChange={(event) =>
                  setUnsubscribeForm((prev) => ({ ...prev, phone_number: event.target.value }))
                }
                style={inputStyle}
              />

              <button
                type="button"
                onClick={sendUnsubscribeOtp}
                disabled={busyAction === "unsubscribe-send"}
                style={{ ...buttonStyle, opacity: busyAction === "unsubscribe-send" ? 0.7 : 1 }}
              >
                {busyAction === "unsubscribe-send" ? "Sending..." : "Send OTP"}
              </button>

              {unsubscribeOtpSent && (
                <>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={unsubscribeForm.otp_code}
                    onChange={(event) =>
                      setUnsubscribeForm((prev) => ({ ...prev, otp_code: event.target.value }))
                    }
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={confirmUnsubscribe}
                    disabled={busyAction === "unsubscribe-confirm"}
                    style={{ ...buttonStyle, opacity: busyAction === "unsubscribe-confirm" ? 0.7 : 1 }}
                  >
                    {busyAction === "unsubscribe-confirm" ? "Confirming..." : "Confirm Unsubscribe"}
                  </button>
                </>
              )}
            </div>
          </section>
        </div>

        {successMessage && (
          <div className="mt-5 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 font-semibold">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 font-semibold">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
