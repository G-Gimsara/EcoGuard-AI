"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "@/app/Header/page";
import Navbar from "../NavBar/Navbar";

const PHONE_REGEX = /^947\d{8}$/;
const API_BASE = "http://localhost:5000/api/alert-users";

interface AlertUserRow {
  id: number;
  name: string;
  phoneNumber: string;
  isSubscribed: boolean;
  createdAt: string;
}

export default function RegisterForAlertsPage() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [users, setUsers] = useState<AlertUserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [manageError, setManageError] = useState("");

  const loadUsers = async () => {
    setLoadingUsers(true);
    setManageError("");
    try {
      const response = await fetch(API_BASE);
      const data = (await response.json()) as AlertUserRow[];
      if (!response.ok) {
        setManageError("Failed to load registered users.");
        return;
      }
      setUsers(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error("Load alert users error:", loadError);
      setManageError("Failed to load registered users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (!PHONE_REGEX.test(trimmedPhone)) {
      setError("Phone number must be in format 947XXXXXXXX.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/alert-users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          phoneNumber: trimmedPhone,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || "Failed to register. Please try again.");
        return;
      }

      setSuccess("You will receive flood alerts.");
      setName("");
      setPhoneNumber("");
      await loadUsers();
    } catch (submitError) {
      console.error("Register alert user error:", submitError);
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSubscription = async (user: AlertUserRow) => {
    setActionBusyId(user.id);
    setManageError("");
    try {
      const response = await fetch(`${API_BASE}/${user.id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSubscribed: !user.isSubscribed }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setManageError((data as { message?: string }).message || "Failed to update subscription.");
        return;
      }
      await loadUsers();
    } catch (toggleError) {
      console.error("Update subscription error:", toggleError);
      setManageError("Failed to update subscription.");
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white font-sans antialiased">
      <Header />
      <Navbar />

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-blue-900 md:text-4xl">
            Register for Flood Alerts
          </h1>
          <p className="mt-2 text-gray-600">
            Enter your details to receive SMS flood alerts during Major and Critical conditions.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="mb-2 block text-sm font-semibold text-gray-700">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="947XXXXXXXX"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                autoComplete="tel"
                disabled={isSubmitting}
              />
              <p className="mt-2 text-xs text-gray-500">Format: 947XXXXXXXX</p>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-blue-900">Registered Alert Users</h2>
          <p className="mt-2 text-gray-600">
            Toggle subscription for each registered number. SMS alerts are sent only to subscribed users.
          </p>

          {manageError ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {manageError}
            </div>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Phone Number</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-gray-500">
                      No users registered yet.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100">
                      <td className="px-3 py-3 text-gray-800">{user.name}</td>
                      <td className="px-3 py-3 text-gray-800">{user.phoneNumber}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.isSubscribed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.isSubscribed ? "Subscribed" : "Unsubscribed"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => void toggleSubscription(user)}
                          disabled={actionBusyId === user.id}
                          className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {actionBusyId === user.id
                            ? "Updating..."
                            : user.isSubscribed
                            ? "Unsubscribe"
                            : "Subscribe"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
