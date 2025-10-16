"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiUpload, FiX } from "react-icons/fi";

import Navbar from "@/app/_components/Navbar";

// Define allowed values
const TOPIC_OPTIONS = [
  { value: "lecture-2", label: "Lecture 2" },
  { value: "lecture-3", label: "Lecture 3" },
  { value: "lab-3", label: "Lab 3" },
  { value: "lab-4", label: "Lab 4" },
  { value: "lab-5", label: "Lab 5" },
];

const FOLDER_PATH_OPTIONS = [
  { value: "lecture/lecture-two", label: "lecture/lecture-two" },
  { value: "lecture/lecture-three", label: "lecture/lecture-three" },
  { value: "lab/lab-three", label: "lab/lab-three" },
  { value: "lab/lab-four", label: "lab/lab-four" },
  { value: "lab/lab-five", label: "lab/lab-five" },
];

export default function CreateFlashCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [topic, setTopic] = useState("");
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null);
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null);
  const [frontImageFolder, setFrontImageFolder] = useState("");
  const [backImageFolder, setBackImageFolder] = useState("");

  // Handle image selection
  const handleFrontImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontImageFile(file);
      setFrontImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBackImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackImageFile(file);
      setBackImagePreview(URL.createObjectURL(file));
    }
  };

  // Remove images
  const removeFrontImage = () => {
    setFrontImageFile(null);
    setFrontImagePreview(null);
  };

  const removeBackImage = () => {
    setBackImageFile(null);
    setBackImagePreview(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("topic", topic);
      formData.append("frontText", frontText);
      formData.append("backText", backText);

      if (frontImageFile) {
        formData.append("frontImage", frontImageFile);
        formData.append("frontImageFolder", frontImageFolder);
      }

      if (backImageFile) {
        formData.append("backImage", backImageFile);
        formData.append("backImageFolder", backImageFolder);
      }

      // Call server action
      const response = await fetch("/api/flash-cards", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to create flash card");
        setLoading(false);
        return;
      }

      // Success - redirect to CMS page
      router.push("/cms/flash-cards");
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to create flash card");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-white">
      <Navbar />

      <section className="pt-32 px-6 max-w-3xl mx-auto pb-12">
        <h1 className="text-4xl font-bold mb-8">Create Flash Card</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic - Required */}
          <div>
            <label htmlFor="topic" className="block text-sm font-semibold mb-2">
              Topic <span className="text-red-500">*</span>
            </label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              required
            >
              <option value="">Select a topic...</option>
              {TOPIC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Front Text - Optional */}
          <div>
            <label htmlFor="frontText" className="block text-sm font-semibold mb-2">
              Front Text (Optional)
            </label>
            <textarea
              id="frontText"
              value={frontText}
              onChange={(e) => setFrontText(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Text to display on the front of the card"
            />
          </div>

          {/* Front Image - Optional */}
          <div>
            <label className="block text-sm font-semibold mb-2">Front Image (Optional)</label>

            {frontImagePreview ? (
              <div className="relative w-full h-64 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-600">
                <Image src={frontImagePreview} alt="Front preview" fill className="object-contain" />
                <button type="button" onClick={removeFrontImage} className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors cursor-pointer">
                  <FiX className="text-white" />
                </button>
              </div>
            ) : (
              <div className="w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-600 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
                  <FiUpload className="text-3xl text-zinc-400 mb-2" />
                  <span className="text-sm text-zinc-400">Click to upload front image</span>
                  <input type="file" accept="image/*" onChange={handleFrontImageChange} className="hidden" />
                </label>
              </div>
            )}

            {frontImageFile && (
              <div className="mt-3">
                <label htmlFor="frontImageFolder" className="block text-xs font-semibold mb-1 text-zinc-400">
                  Folder Path <span className="text-red-500">*</span>
                </label>
                <select
                  id="frontImageFolder"
                  value={frontImageFolder}
                  onChange={(e) => setFrontImageFolder(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  required
                >
                  <option value="">Select a folder path...</option>
                  {FOLDER_PATH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Back Text - Optional */}
          <div>
            <label htmlFor="backText" className="block text-sm font-semibold mb-2">
              Back Text (Optional)
            </label>
            <textarea
              id="backText"
              value={backText}
              onChange={(e) => setBackText(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Text to display on the back of the card"
            />
          </div>

          {/* Back Image - Optional */}
          <div>
            <label className="block text-sm font-semibold mb-2">Back Image (Optional)</label>

            {backImagePreview ? (
              <div className="relative w-full h-64 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-600">
                <Image src={backImagePreview} alt="Back preview" fill className="object-contain" />
                <button type="button" onClick={removeBackImage} className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors">
                  <FiX className="text-white" />
                </button>
              </div>
            ) : (
              <div className="w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-600 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
                  <FiUpload className="text-3xl text-zinc-400 mb-2" />
                  <span className="text-sm text-zinc-400">Click to upload back image</span>
                  <input type="file" accept="image/*" onChange={handleBackImageChange} className="hidden" />
                </label>
              </div>
            )}

            {backImageFile && (
              <div className="mt-3">
                <label htmlFor="backImageFolder" className="block text-xs font-semibold mb-1 text-zinc-400">
                  Folder Path <span className="text-red-500">*</span>
                </label>
                <select
                  id="backImageFolder"
                  value={backImageFolder}
                  onChange={(e) => setBackImageFolder(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  required
                >
                  <option value="">Select a folder path...</option>
                  {FOLDER_PATH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors cursor-pointer"
            >
              {loading ? "Creating..." : "Create Flash Card"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => router.push("/cms/flash-cards")}
              className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 rounded-lg font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
