"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

const colomboDivisions = [
  "Colombo City",
  "Dehiwala",
  "Ratmalana",
  "Kaduwela",
  "Kotte",
  "Kesbewa",
  "Maharagama",
  "Moratuwa",
  "Boralesgamuwa",
  "Kolonnawa",
  "Hanwella",
  "Homagama",
  "Padukka",
] as const;

interface FormState {
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
}

const AuthComponent: React.FC = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMsg("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    const endpoint = isLogin ? "login" : "register";
    const payload = isLogin
      ? { email: form.email, password: form.password }
      : form;

    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(
          isLogin
            ? "Access Granted. Redirecting..."
            : "Account Created. Redirecting..."
        );
        setTimeout(() => router.push("/prediction"), 1500);
      } else {
        setErrorMsg(
          data.error || data.message || "Authentication failed"
        );
      }
    } catch {
      setErrorMsg("Connection error. Check backend status.");
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center font-sans">
      {/* Full Screen Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/heat.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/75" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row h-auto md:h-150 shadow-2xl">
        {/* Left Section */}
        <div className="md:w-2/5 backdrop-blur-xl bg-blue-900/30 p-10 text-white flex flex-col justify-center border-r border-white/10">
          <h2 className="text-3xl font-black mb-6 uppercase tracking-widest text-orange-400">
            {isLogin ? "Welcome" : "Connect"}
          </h2>
          <p className="text-gray-200 text-sm leading-relaxed mb-8">
            {isLogin
              ? "Sign in to monitor thermal conditions and access predictive heat island analytics."
              : "Register to receive localized SMS alerts for the Colombo district risk zones."}
          </p>

          <div className="space-y-4 mb-10">
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-gray-300">
              <CheckCircle size={16} className="text-orange-500" /> Real-time
              Data
            </div>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-gray-300">
              <CheckCircle size={16} className="text-orange-500" /> Colombo
              Division Alerts
            </div>
          </div>

          <button
            onClick={() => setIsLogin((prev) => !prev)}
            className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 font-bold transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
          >
            {isLogin ? "Register Account" : "I have an account"}{" "}
            <ArrowRight size={16} />
          </button>
          <Link
            href="/"
            className="mt-4 text-center text-white/70 hover:text-white text-xs font-semibold underline"
          >
            <button>
              <p>Back to home</p>
            </button>
          </Link>
        </div>

        {/* Right Section */}
        <div className="md:w-3/5 p-10 md:p-12 backdrop-blur-2xl bg-white/10 flex flex-col justify-center overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
              {isLogin ? "Authentication" : "User Registration"}
            </h2>
            <div className="h-1 w-12 bg-orange-500 mt-2" />
          </div>

          {successMsg && (
            <div className="mb-4 p-3 bg-green-500/20 text-green-400 border border-green-500/50 text-xs font-bold">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/20 text-red-400 border border-red-500/50 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User
                  className="absolute left-3 top-3 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 transition-all text-sm"
                />
              </div>
            )}

            <div className="relative">
              <Mail
                className="absolute left-3 top-3 text-gray-400"
                size={16}
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 transition-all text-sm"
              />
            </div>

            <div className="relative">
              <Lock
                className="absolute left-3 top-3 text-gray-400"
                size={16}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 transition-all text-sm"
              />
            </div>

            {!isLogin && (
              <>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-3 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone Number"
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-3 text-gray-400"
                    size={16}
                  />
                  <select
                    name="location"
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-white outline-none focus:border-orange-500 transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option
                      value=""
                      className="bg-slate-900 text-gray-500"
                    >
                      Select Colombo Division
                    </option>
                    {colomboDivisions.map((div) => (
                      <option
                        key={div}
                        value={div}
                        className="bg-slate-900 text-white"
                      >
                        {div}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 mt-4 transition-all uppercase tracking-widest text-xs shadow-xl shadow-orange-900/20"
            >
              {isLogin ? "Sign In" : "Complete Registration"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthComponent;

