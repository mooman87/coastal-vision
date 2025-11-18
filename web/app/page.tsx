"use client";

import { useState, useEffect } from "react";
import Card from "../components/Card";
import Chatbot from "../components/Chatbot";
import Link from "next/link";
// If you want to use your apiFetch helper instead of raw fetch,
// you can import it here and swap it in.
import { apiFetch } from "../lib/api"; // adjust path if needed

type Listing = {
  id: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  images?: { url: string; caption?: string | null }[];
};

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        setError(null);

        // OPTION A: use your apiFetch helper (recommended)
        const data = await apiFetch<Listing[]>("/public/properties", {
          method: "GET",
        });

        setListings(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load listings");
      }
    }

    fetchListings();
  }, []); // 👈 run once on mount

  return (
    <>
      <section className="container grid items-start gap-8 py-10 md:grid-cols-2">
        <div className="space-y-5">
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Find your next coastal home with{" "}
            <span className="text-brand-600">confidence</span>.
          </h1>
          <p className="text-lg text-slate-600">
            Beautiful, mobile-first listings and a helpful assistant to guide
            you through neighborhoods, tours, and closing.
          </p>
          <div className="flex gap-3">
            <Link className="btn-primary" href="/listings">
              Browse Listings
            </Link>
            <Link className="btn-ghost" href="/contact">
              Book a Call
            </Link>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {listings.length === 0 && !error && (
            <p className="text-sm text-slate-500">
              No listings yet. Once you add properties in the portal, they’ll show up here.
            </p>
          )}

          {listings.map((listing) => {
            const mainImage = listing.images?.[0]?.url;
            const subtitleParts: string[] = [];

            if (listing.price) {
              subtitleParts.push(`$${Math.round(listing.price).toLocaleString()}`);
            }
            if (listing.beds != null || listing.baths != null) {
              subtitleParts.push(
                `${listing.beds ?? "–"}bd ${listing.baths ?? "–"}ba`
              );
            }
            subtitleParts.push(
              `${listing.city}, ${listing.state} ${listing.zip_code}`
            );

            return (
              <Card
                key={listing.id}
                title={listing.address}
                subtitle={subtitleParts.join(" • ")}
                imageUrl={mainImage}
              />
            );
          })}
        </div>
      </section>
      <Chatbot />
    </>
  );
}
