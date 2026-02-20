"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("researcher"); // default role
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/coral-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/Pages/Coral_reef/Dashboard");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form
        onSubmit={handleLogin}
        className="bg-gray-50 p-10 rounded-2xl shadow-xl w-96 flex flex-col items-center"
      >
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Coral Reef AI Login</h1>
        
        <input
          type="email"
          placeholder="Email"
          className="border border-gray-300 rounded-lg p-3 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="border border-gray-300 rounded-lg p-3 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border border-gray-300 rounded-lg p-3 mb-6 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        >
          <option value="researcher">Researcher</option>
          <option value="tourism_guide">Tourism Guide</option>
          <option value="marine_authority">Marine Authority</option>
        </select>

        <button
          type="submit"
          className="bg-blue-500 text-white font-semibold p-3 rounded-lg w-full hover:bg-blue-600 transition transform shadow-md"
        >
          Login
        </button>

        <p className="mt-4 text-gray-500 text-sm">© 2026 Coral Reef AI System</p>
      </form>
    </div>
  );
};

export default LoginPage;
