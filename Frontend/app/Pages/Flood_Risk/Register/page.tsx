"use client";

import { FormEvent, useState } from "react";
import Header from "@/app/Header/page";
import Navbar from "../NavBar/Navbar";

// Rules for checking user input.
const PHONE_REGEX = /^947\d{8}$/;
const API_BASE = "http://localhost:5000/api/alert-users";
const OTP_REGEX = /^\d{6}$/;
const NAME_REGEX = /^[A-Za-z ]+$/;
type ActiveTab = "subscribe" | "unsubscribe";

export default function RegisterForAlertsPage() {
  // Controls which tab is shown on the page.
  const [activeTab, setActiveTab] = useState<ActiveTab>("subscribe");

  // Values used in the Subscribe tab.
  const [name, setName] = useState("");
  const [nameValidationError, setNameValidationError] = useState("");
  const [subscribePhoneNumber, setSubscribePhoneNumber] = useState("");
  const [subscribePhoneValidationError, setSubscribePhoneValidationError] = useState("");
  const [subscribeOtp, setSubscribeOtp] = useState("");
  const [subscribeOtpRequested, setSubscribeOtpRequested] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [subscribeSuccess, setSubscribeSuccess] = useState("");

  // Values used in the Unsubscribe tab.
  const [unsubscribePhoneNumber, setUnsubscribePhoneNumber] = useState("");
  const [unsubscribePhoneValidationError, setUnsubscribePhoneValidationError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [requestOtpLoading, setRequestOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [unsubscribeError, setUnsubscribeError] = useState("");
  const [unsubscribeSuccess, setUnsubscribeSuccess] = useState("");

  // Check the name while the user is typing.
  const handleNameChange = (value: string) => {
    setName(value);
    const trimmedValue = value.trim();

    // If input is empty, do not show error yet.
    if (!trimmedValue) {
      setNameValidationError("");
      return;
    }

    // Allow only letters and spaces.
    if (!NAME_REGEX.test(value)) {
      setNameValidationError("Name can contain only letters and spaces.");
      return;
    }

    // Input is valid, so clear the error.
    setNameValidationError("");
  };

  // Check subscribe phone number while typing.
  const handleSubscribePhoneChange = (value: string) => {
    setSubscribePhoneNumber(value);
    const trimmedValue = value.trim();

    // If input is empty, do not show error yet.
    if (!trimmedValue) {
      setSubscribePhoneValidationError("");
      return;
    }

    // Accept only Sri Lanka format: 947XXXXXXXX.
    if (!PHONE_REGEX.test(trimmedValue)) {
      setSubscribePhoneValidationError("Phone number must be in format 947XXXXXXXX.");
      return;
    }

    // Input is valid, so clear the error.
    setSubscribePhoneValidationError("");
  };

  // Check unsubscribe phone number while typing.
  const handleUnsubscribePhoneChange = (value: string) => {
    setUnsubscribePhoneNumber(value);
    const trimmedValue = value.trim();

    // If input is empty, do not show error yet.
    if (!trimmedValue) {
      setUnsubscribePhoneValidationError("");
      return;
    }

    // Accept only Sri Lanka format: 947XXXXXXXX.
    if (!PHONE_REGEX.test(trimmedValue)) {
      setUnsubscribePhoneValidationError("Phone number must be in format 947XXXXXXXX.");
      return;
    }

    // Input is valid, so clear the error.
    setUnsubscribePhoneValidationError("");
  };

  // Handles both steps of subscribe:
  // 1) send OTP
  // 2) verify OTP and complete subscribe
  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Clear old messages before starting a new submit.
    setSubscribeError("");
    setSubscribeSuccess("");

    const trimmedName = name.trim();
    const trimmedPhone = subscribePhoneNumber.trim();

    // Name is required.
    if (!trimmedName) {
      setSubscribeError("Name is required.");
      return;
    }

    // Name must have only letters and spaces.
    if (!NAME_REGEX.test(trimmedName)) {
      setSubscribeError("Name can contain only letters and spaces.");
      return;
    }

    if (nameValidationError) {
      setSubscribeError(nameValidationError);
      return;
    }

    // Phone number must match 947XXXXXXXX.
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setSubscribeError("Phone number must be in format 947XXXXXXXX.");
      return;
    }

    if (subscribePhoneValidationError) {
      setSubscribeError(subscribePhoneValidationError);
      return;
    }

    // When OTP box is visible, OTP must be 6 digits.
    if (subscribeOtpRequested && !OTP_REGEX.test(subscribeOtp.trim())) {
      setSubscribeError("OTP must be a 6-digit number.");
      return;
    }

    // Step 1: send OTP. Step 2: verify OTP and complete subscribe.
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
      // Show backend error message when request fails.
      if (!response.ok) {
        setSubscribeError(data.message || "Failed to subscribe. Please try again.");
        return;
      }

      // First submit success means OTP sent.
      if (!subscribeOtpRequested) {
        setSubscribeOtpRequested(true);
        setSubscribeOtp("");
        setSubscribeSuccess("OTP sent to your phone number.");
      } else {
        // Second submit success means subscription completed.
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

  // Sends OTP for unsubscribe flow.
  const requestUnsubscribeOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Clear old messages before starting a new submit.
    setUnsubscribeError("");
    setUnsubscribeSuccess("");

    const trimmedPhone = unsubscribePhoneNumber.trim();
    // Phone number must match 947XXXXXXXX.
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setUnsubscribeError("Phone number must be in format 947XXXXXXXX.");
      return;
    }

    if (unsubscribePhoneValidationError) {
      setUnsubscribeError(unsubscribePhoneValidationError);
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
      // Show backend error message when request fails.
      if (!response.ok) {
        setUnsubscribeError((data as { message?: string }).message || "Failed to send OTP.");
        return;
      }

      // If OTP request is successful, show OTP input.
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

  // Verifies unsubscribe OTP and completes unsubscribe.
  const verifyUnsubscribeOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Clear old messages before starting a new submit.
    setUnsubscribeError("");
    setUnsubscribeSuccess("");

    const trimmedPhone = unsubscribePhoneNumber.trim();
    const trimmedOtp = otp.trim();

    // Phone number must match 947XXXXXXXX.
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setUnsubscribeError("Phone number must be in format 947XXXXXXXX.");
      return;
    }

    if (unsubscribePhoneValidationError) {
      setUnsubscribeError(unsubscribePhoneValidationError);
      return;
    }

    // OTP must be 6 digits.
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
      // Show backend error message when request fails.
      if (!response.ok) {
        setUnsubscribeError((data as { message?: string }).message || "Failed to unsubscribe.");
        return;
      }

      // Clear unsubscribe inputs after success.
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

          {/* Buttons to switch between Subscribe and Unsubscribe tabs. */}
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

          {/* Subscribe form */}
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
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  autoComplete="name"
                  disabled={subscribeLoading}
                />
                {nameValidationError ? (
                  <p className="mt-2 text-xs font-medium text-red-600">{nameValidationError}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="subscribe-phone-number" className="mb-2 block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>
                <input
                  id="subscribe-phone-number"
                  type="tel"
                  value={subscribePhoneNumber}
                  onChange={(e) => handleSubscribePhoneChange(e.target.value)}
                  placeholder="947XXXXXXXX"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  autoComplete="tel"
                  disabled={subscribeLoading}
                />
                <p className="mt-2 text-xs text-gray-500">Format: 947XXXXXXXX</p>
                {subscribePhoneValidationError ? (
                  <p className="mt-2 text-xs font-medium text-red-600">{subscribePhoneValidationError}</p>
                ) : null}
              </div>

              {/* Show OTP input only after OTP is sent. */}
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
            // Unsubscribe form
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
                    onChange={(e) => handleUnsubscribePhoneChange(e.target.value)}
                    placeholder="947XXXXXXXX"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    autoComplete="tel"
                    disabled={requestOtpLoading || verifyOtpLoading}
                  />
                  <p className="mt-2 text-xs text-gray-500">Format: 947XXXXXXXX</p>
                  {unsubscribePhoneValidationError ? (
                    <p className="mt-2 text-xs font-medium text-red-600">{unsubscribePhoneValidationError}</p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={requestOtpLoading || verifyOtpLoading}
                  className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {requestOtpLoading ? "Sending OTP..." : "Request OTP"}
                </button>
              </form>

              {/* Show OTP input only after OTP is sent. */}
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
