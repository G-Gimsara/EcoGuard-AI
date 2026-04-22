"use client";

import { FormEvent, useState } from "react";
import Header from "@/app/Header/page";
import Navbar from "../NavBar/Navbar";

const PHONE_REGEX = /^947\d{8}$/;
const API_BASE = "http://localhost:5000/api/alert-users";
const OTP_REGEX = /^\d{6}$/;
type ActiveTab = "subscribe" | "unsubscribe";

export default function RegisterForAlertsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("subscribe");

  const [name, setName] = useState("");
  const [subscribePhoneNumber, setSubscribePhoneNumber] = useState("");
  const [subscribeOtp, setSubscribeOtp] = useState("");
  const [subscribeOtpRequested, setSubscribeOtpRequested] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [subscribeSuccess, setSubscribeSuccess] = useState("");

  const [unsubscribePhoneNumber, setUnsubscribePhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [requestOtpLoading, setRequestOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [unsubscribeError, setUnsubscribeError] = useState("");
  const [unsubscribeSuccess, setUnsubscribeSuccess] = useState("");

  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubscribeError("");
    setSubscribeSuccess("");

    const trimmedName = name.trim();
    const trimmedPhone = subscribePhoneNumber.trim();

    if (!trimmedName) {
      setSubscribeError("Name is required.");
      return;
    }

    if (!PHONE_REGEX.test(trimmedPhone)) {
      setSubscribeError("Phone number must be in format 947XXXXXXXX.");
      return;
    }

    if (subscribeOtpRequested && !OTP_REGEX.test(subscribeOtp.trim())) {
      setSubscribeError("OTP must be a 6-digit number.");
      return;
    }

    setSubscribeLoading(true);
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          phoneNumber: trimmedPhone,
          ...(subscribeOtpRequested ? { otp: subscribeOtp.trim() } : {}),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubscribeError(data.message || "Failed to subscribe. Please try again.");
        return;
      }

      if (!subscribeOtpRequested) {
        setSubscribeOtpRequested(true);
        setSubscribeOtp("");
        setSubscribeSuccess("OTP sent to your phone number.");
      } else {
        setSubscribeSuccess("Successfully subscribed to Flood Alert Service.");
        setName("");
        setSubscribePhoneNumber("");
        setSubscribeOtp("");
        setSubscribeOtpRequested(false);
      }
    } catch (submitError) {
      console.error("Register alert user error:", submitError);
      setSubscribeError("Network error. Please try again.");
    } finally {
      setSubscribeLoading(false);
    }
  };

  const requestUnsubscribeOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUnsubscribeError("");
    setUnsubscribeSuccess("");

    const trimmedPhone = unsubscribePhoneNumber.trim();
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setUnsubscribeError("Phone number must be in format 947XXXXXXXX.");
      return;
    }

    setRequestOtpLoading(true);
    try {
      const response = await fetch(`${API_BASE}/unsubscribe/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: trimmedPhone }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setUnsubscribeError((data as { message?: string }).message || "Failed to send OTP.");
        return;
      }

      setOtpRequested(true);
      setOtp("");
      setUnsubscribeSuccess("OTP sent to your phone number.");
    } catch (otpError) {
      console.error("Request unsubscribe OTP error:", otpError);
      setUnsubscribeError("Network error. Please try again.");
    } finally {
      setRequestOtpLoading(false);
    }
  };

  const verifyUnsubscribeOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUnsubscribeError("");
    setUnsubscribeSuccess("");

    const trimmedPhone = unsubscribePhoneNumber.trim();
    const trimmedOtp = otp.trim();

    if (!PHONE_REGEX.test(trimmedPhone)) {
      setUnsubscribeError("Phone number must be in format 947XXXXXXXX.");
      return;
    }

    if (!OTP_REGEX.test(trimmedOtp)) {
      setUnsubscribeError("OTP must be a 6-digit number.");
      return;
    }

    setVerifyOtpLoading(true);
    try {
      const response = await fetch(`${API_BASE}/unsubscribe/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: trimmedPhone,
          otp: trimmedOtp,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setUnsubscribeError((data as { message?: string }).message || "Failed to unsubscribe.");
        return;
      }

      setUnsubscribeSuccess("Successfully unsubscribed from Flood Alert Service.");
      setUnsubscribePhoneNumber("");
      setOtp("");
      setOtpRequested(false);
    } catch (verifyError) {
      console.error("Verify unsubscribe OTP error:", verifyError);
      setUnsubscribeError("Network error. Please try again.");
    } finally {
      setVerifyOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white font-sans antialiased">
      <Header />
      <Navbar />

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-blue-900 md:text-4xl">
            Alert Subscription
          </h1>
          <p className="mt-2 text-gray-600">
            Subscribe or unsubscribe your phone number for EcoGuard AI Flood Alert SMS updates.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("subscribe")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "subscribe"
                  ? "bg-blue-700 text-white"
                  : "border border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
              }`}
            >
              Subscribe Alert
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unsubscribe")}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "unsubscribe"
                  ? "bg-blue-700 text-white"
                  : "border border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
              }`}
            >
              Unsubscribe Alert
            </button>
          </div>

          {activeTab === "subscribe" ? (
            <form className="mt-8 space-y-6" onSubmit={handleSubscribe}>
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-700">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  autoComplete="name"
                  disabled={subscribeLoading}
                />
              </div>

              <div>
                <label htmlFor="subscribe-phone-number" className="mb-2 block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>
                <input
                  id="subscribe-phone-number"
                  type="tel"
                  value={subscribePhoneNumber}
                  onChange={(e) => setSubscribePhoneNumber(e.target.value)}
                  placeholder="947XXXXXXXX"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  autoComplete="tel"
                  disabled={subscribeLoading}
                />
                <p className="mt-2 text-xs text-gray-500">Format: 947XXXXXXXX</p>
              </div>

              {subscribeOtpRequested ? (
                <div>
                  <label htmlFor="subscribe-otp" className="mb-2 block text-sm font-semibold text-gray-700">
                    OTP
                  </label>
                  <input
                    id="subscribe-otp"
                    type="text"
                    inputMode="numeric"
                    value={subscribeOtp}
                    onChange={(e) => setSubscribeOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    disabled={subscribeLoading}
                  />
                </div>
              ) : null}

              {subscribeError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {subscribeError}
                </div>
              ) : null}

              {subscribeSuccess ? (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {subscribeSuccess}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={subscribeLoading}
                className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {subscribeLoading ? "Submitting..." : subscribeOtpRequested ? "Verify OTP" : "Subscribe Alert"}
              </button>
            </form>
          ) : (
            <div className="mt-8 space-y-6">
              <form className="space-y-6" onSubmit={requestUnsubscribeOtp}>
                <div>
                  <label htmlFor="unsubscribe-phone-number" className="mb-2 block text-sm font-semibold text-gray-700">
                    Phone Number
                  </label>
                  <input
                    id="unsubscribe-phone-number"
                    type="tel"
                    value={unsubscribePhoneNumber}
                    onChange={(e) => setUnsubscribePhoneNumber(e.target.value)}
                    placeholder="947XXXXXXXX"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    autoComplete="tel"
                    disabled={requestOtpLoading || verifyOtpLoading}
                  />
                  <p className="mt-2 text-xs text-gray-500">Format: 947XXXXXXXX</p>
                </div>

                <button
                  type="submit"
                  disabled={requestOtpLoading || verifyOtpLoading}
                  className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {requestOtpLoading ? "Sending OTP..." : "Request OTP"}
                </button>
              </form>

              {otpRequested ? (
                <form className="space-y-6" onSubmit={verifyUnsubscribeOtp}>
                  <div>
                    <label htmlFor="unsubscribe-otp" className="mb-2 block text-sm font-semibold text-gray-700">
                      OTP
                    </label>
                    <input
                      id="unsubscribe-otp"
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      disabled={verifyOtpLoading || requestOtpLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifyOtpLoading || requestOtpLoading}
                    className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {verifyOtpLoading ? "Verifying..." : "Confirm Unsubscribe"}
                  </button>
                </form>
              ) : null}

              {unsubscribeError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {unsubscribeError}
                </div>
              ) : null}

              {unsubscribeSuccess ? (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {unsubscribeSuccess}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
