// web/app/portal/properties/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, clearToken } from "../../../lib/api";

interface Property {
  id: number;
  mls_id?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  is_archived: boolean;
}

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<Property[]>("/properties");
        setProperties(data);
      } catch (err: any) {
        setError("Failed to load properties. Are you logged in?");
        if (err.message.includes("401")) {
          clearToken();
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function createNew() {
    router.push("/portal/properties/new");
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Properties</h1>
        <button
          onClick={createNew}
          className="px-4 py-2 text-sm bg-black text-white rounded-md"
        >
          Add Property
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-3">
        {properties.map((p) => (
          <div
            key={p.id}
            className="border rounded-lg p-4 flex items-center justify-between text-sm"
          >
            <div>
              <div className="font-medium">
                {p.address}, {p.city}, {p.state} {p.zip_code}
              </div>
              <div className="text-xs text-gray-600">
                {p.beds} bd · {p.baths} ba · {p.sqft} sqft
              </div>
            </div>
            <div className="text-right">
              {p.price && (
                <div className="font-semibold">
                  ${p.price.toLocaleString()}
                </div>
              )}
              <button
                onClick={() =>
                  router.push(`/portal/properties/${p.id}/edit`)
                }
                className="mt-1 text-xs underline"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
        {properties.length === 0 && !loading && (
          <p className="text-sm text-gray-500">No properties yet.</p>
        )}
      </div>
    </div>
  );
}
