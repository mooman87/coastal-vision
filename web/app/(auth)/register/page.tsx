"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "../../../lib/api";

type Role = "broker" | "agent";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("broker");
  const [brokerId, setBrokerId] = useState<string>(""); 
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const body: any = {
        email,
        password,
        role,
      };

      // Only send broker_id if it's a number and role is agent
      if (role === "agent" && brokerId.trim() !== "") {
        body.broker_id = Number(brokerId);
      }


      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Registration failed");
      }

      
      const loginBody = new URLSearchParams();
      loginBody.append("username", email);
      loginBody.append("password", password);

      const loginRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: loginBody,
        }
      );

      if (!loginRes.ok) {
        throw new Error("Registered, but login failed. Try logging in.");
      }

      const loginData = await loginRes.json();
      setToken(loginData.access_token);

      
      router.push("/portal/properties");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 border rounded-xl p-6"
      >
        <h1 className="text-2xl font-semibold">Create an Account</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Role</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="broker">Broker</option>
            <option value="agent">Agent</option>
          </select>
        </div>

        {role === "agent" && (
          <div>
            <label className="block text-sm mb-1">
              Broker ID (optional for now)
            </label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2 text-sm"
              value={brokerId}
              onChange={(e) => setBrokerId(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Later, you might look this up instead of entering manually.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-md text-sm"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="text-xs text-gray-600 text-center">
          Already have an account?{" "}
          <a href="/login" className="underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
