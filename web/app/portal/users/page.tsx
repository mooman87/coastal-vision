// web/app/portal/users/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";

type Role = "broker" | "agent";

interface User {
  id: number;
  email: string;
  role: Role;
  broker_id: number | null;
  is_active: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "agent" as Role,
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiFetch<User[]>("/users");
      setUsers(data);
    } catch (err: any) {
      setError("Failed to load users. Broker login required.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ email: "", password: "", role: "agent" });
      await load();
    } catch (err: any) {
      setError("Failed to create user");
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Team (Broker / Agents)</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="max-w-md space-y-2 text-sm border rounded-lg p-4">
        <h2 className="font-medium mb-1">Add User</h2>
        <div>
          <label className="block mb-1">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block mb-1">Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block mb-1">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="agent">Agent</option>
            <option value="broker">Broker</option>
          </select>
        </div>
        <button className="mt-2 px-4 py-2 bg-black text-white rounded-md">
          Create User
        </button>
      </form>

      <div className="border rounded-lg p-4 text-sm">
        <h2 className="font-medium mb-2">Existing Users</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between border rounded px-3 py-2">
              <div>
                <div className="font-medium">{u.email}</div>
                <div className="text-xs text-gray-600">
                  Role: {u.role} · Active: {u.is_active ? "Yes" : "No"}
                </div>
              </div>
              {/* You can add edit / deactivate controls here using PUT / DELETE */}
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-xs text-gray-500">No users yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
