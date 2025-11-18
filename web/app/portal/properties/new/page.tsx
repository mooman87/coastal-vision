// web/app/portal/properties/new/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../../lib/api";

type ImageForm = {
  url: string;
  caption: string;
  order_index: string; 
  uploading?: boolean;
  error?: string | null;
};

async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/image`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }

  const data = await res.json();
  return data.url as string;
}

export default function NewPropertyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    mls_id: "",
    address: "",
    city: "",
    state: "SC",
    zip_code: "",
    price: "",
    beds: "",
    baths: "",
    sqft: "",
  });

  const [images, setImages] = useState<ImageForm[]>([
    // start with a single empty row, or [] if you prefer
    { url: "", caption: "", order_index: "" },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleImageChange(
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;
    setImages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [name]: value };
      return copy;
    });
  }

  async function handleImageFileChange(
  index: number,
  e: React.ChangeEvent<HTMLInputElement>
) {
  const file = e.target.files?.[0];
  if (!file) return;

  setImages((prev) => {
    const copy = [...prev];
    copy[index] = { ...copy[index], uploading: true, error: null };
    return copy;
  });

  try {
    const url = await uploadImageFile(file);

    setImages((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        url,
        uploading: false,
        error: null,
      };
      return copy;
    });
  } catch (err: any) {
    console.error(err);
    setImages((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        uploading: false,
        error: "Upload failed",
      };
      return copy;
    });
  }
}


  function addImageRow() {
    setImages((prev) => [...prev, { url: "", caption: "", order_index: "" }]);
  }

  function removeImageRow(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Only send images that actually have a URL
      const imagesPayload = images
        .filter((img) => img.url.trim() !== "")
        .map((img) => ({
          url: img.url.trim(),
          caption: img.caption.trim() || undefined,
          order_index: img.order_index
            ? Number(img.order_index)
            : undefined,
        }));

      await apiFetch("/properties", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          price: form.price ? Number(form.price) : undefined,
          beds: form.beds ? Number(form.beds) : undefined,
          baths: form.baths ? Number(form.baths) : undefined,
          sqft: form.sqft ? Number(form.sqft) : undefined,
          images: imagesPayload.length > 0 ? imagesPayload : undefined,
        }),
      });

      router.push("/portal/properties");
    } catch (err: any) {
      console.error(err);
      setError("Failed to create property");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold mb-4">Add New Property</h1>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6 text-sm">
        {/* Basic property fields */}
        <div className="space-y-3">
          <div>
            <label className="block mb-1">MLS ID (optional)</label>
            <input
              name="mls_id"
              value={form.mls_id}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block mb-1">Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1">City</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block mb-1">State</label>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                maxLength={2}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1">Zip Code</label>
            <input
              name="zip_code"
              value={form.zip_code}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block mb-1">Price</label>
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block mb-1">Beds</label>
              <input
                name="beds"
                value={form.beds}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block mb-1">Baths</label>
              <input
                name="baths"
                value={form.baths}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1">Square Footage</label>
            <input
              name="sqft"
              value={form.sqft}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Images section */}
        <div className="border rounded-lg p-4 space-y-3">
  <div className="flex items-center justify-between">
    <h2 className="font-medium text-sm">Property Images (optional)</h2>
    <button
      type="button"
      onClick={addImageRow}
      className="text-xs px-2 py-1 border rounded-md"
    >
      + Add Image
    </button>
  </div>

  <p className="text-xs text-gray-500">
    Upload image files here. We’ll store them and use the generated URL when
    saving the property. You can set an order to control how they appear.
  </p>

  <div className="space-y-3">
    {images.map((img, index) => (
      <div
        key={index}
        className="border rounded-md p-3 space-y-2 bg-gray-50"
      >
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium">Image #{index + 1}</span>
          {images.length > 1 && (
            <button
              type="button"
              onClick={() => removeImageRow(index)}
              className="text-xs text-red-600"
            >
              Remove
            </button>
          )}
        </div>

        {/* File upload */}
        <div>
          <label className="block mb-1 text-xs">Image File</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageFileChange(index, e)}
            className="w-full text-xs"
          />

          {img.uploading && (
            <p className="text-xs text-slate-500 mt-1">Uploading...</p>
          )}

          {img.url && !img.uploading && !img.error && (
            <p className="text-xs text-green-600 mt-1">
              Uploaded ✓ (URL: {img.url})
            </p>
          )}

          {img.error && (
            <p className="text-xs text-red-600 mt-1">{img.error}</p>
          )}
        </div>

        {/* (Optional) show the URL in a read-only input */}
        {img.url && (
          <div>
            <label className="block mb-1 text-xs">Image URL (generated)</label>
            <input
              name="url"
              value={img.url}
              readOnly
              className="w-full border rounded px-3 py-2 text-xs bg-gray-100"
            />
          </div>
        )}

        <div>
          <label className="block mb-1 text-xs">
            Caption (optional)
          </label>
          <input
            name="caption"
            value={img.caption}
            onChange={(e) => handleImageChange(index, e)}
            className="w-full border rounded px-3 py-2 text-xs"
          />
        </div>

        <div>
          <label className="block mb-1 text-xs">
            Display Order (optional)
          </label>
          <input
            name="order_index"
            value={img.order_index}
            onChange={(e) => handleImageChange(index, e)}
            placeholder="1, 2, 3..."
            className="w-full border rounded px-3 py-2 text-xs"
          />
        </div>
      </div>
    ))}
  </div>
</div>


        <button
          type="submit"
          disabled={loading}
          className="mt-2 px-4 py-2 bg-black text-white rounded-md"
        >
          {loading ? "Saving..." : "Save Property"}
        </button>
      </form>
    </div>
  );
}
