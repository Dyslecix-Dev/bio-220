"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiUpload, FiX } from "react-icons/fi";

import Navbar from "@/app/_components/Navbar";
import ShuffleLoader from "@/app/_components/ShuffleLoader";
import StackedNotification from "@/app/_components/StackedNotification";

const TYPE_OPTIONS = [
  { value: "lecture", label: "Lecture" },
  { value: "lab", label: "Lab" },
];

const CHAPTER_OPTIONS: Record<string, { value: string; label: string }[]> = {
  lecture: Array.from({ length: 13 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Chapter ${i + 1}`,
  })),
  lab: Array.from({ length: 14 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Week ${i + 1}`,
  })),
};

export default function CreateFlashCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");

  // Form fields
  const [topicType, setTopicType] = useState("");
  const [topicChapter, setTopicChapter] = useState("");
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null);
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null);

  // Handle type change and reset chapter
  const handleTypeChange = (type: string) => {
    setTopicType(type);
    setTopicChapter("");
  };

  // Get available chapter/week options based on selected type
  const availableChapterOptions = topicType ? CHAPTER_OPTIONS[topicType] || [] : [];

  // Combine type and chapter to create topic value
  const topic = topicType && topicChapter ? `${topicType}-${topicChapter}` : "";

  // Auto-generate folder path based on topic
  const folderPath = topic ? `${topicType}/${topicType}-${topicChapter}` : "";

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

  // Show notification helper
  const showNotification = (message: string) => {
    setNotifMessage(message);
    setIsNotifOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Comprehensive validation
      if (!topic) {
        showNotification("Please select both type and chapter/week");
        setLoading(false);
        return;
      }

      // Ensure at least some content exists
      if (!frontText && !frontImageFile && !backText && !backImageFile) {
        showNotification("Please add at least some content (text or image) to the flash card");
        setLoading(false);
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append("topic", topic);
      formData.append("frontText", frontText.trim());
      formData.append("backText", backText.trim());

      if (frontImageFile) {
        formData.append("frontImage", frontImageFile);
        formData.append("frontImageFolder", folderPath);
      }

      if (backImageFile) {
        formData.append("backImage", backImageFile);
        formData.append("backImageFolder", folderPath);
      }

      // Call server action
      const response = await fetch("/api/flash-cards", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        showNotification(result.error || "Failed to create flash card");
        setLoading(false);
        return;
      }

      // Success - redirect to CMS page
      router.push("/cms/flash-cards");
    } catch (err) {
      console.error("Error:", err);
      showNotification(err instanceof Error ? err.message : "Failed to create flash card");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen overflow-hidden bg-zinc-950 flex items-center justify-center">
        <ShuffleLoader />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-white">
      <Navbar />

      <StackedNotification isNotifOpen={isNotifOpen} setIsNotifOpen={setIsNotifOpen} message={notifMessage} />

      <section className="pt-32 px-6 max-w-3xl mx-auto pb-12">
        <h1 className="text-4xl font-bold mb-8">Create Flash Card</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic Type - Required */}
          <div>
            <label htmlFor="topicType" className="block text-sm font-semibold mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              id="topicType"
              value={topicType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              required
            >
              <option value="">Select type...</option>
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter/Week - Required */}
          <div>
            <label htmlFor="topicChapter" className="block text-sm font-semibold mb-2">
              {topicType === "lecture" ? "Chapter" : topicType === "lab" ? "Week" : "Chapter/Week"} <span className="text-red-500">*</span>
            </label>
            <select
              id="topicChapter"
              value={topicChapter}
              onChange={(e) => setTopicChapter(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={!topicType}
            >
              <option value="">{topicType ? `Select ${topicType === "lecture" ? "chapter" : "week"}...` : "Select type first..."}</option>
              {availableChapterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {topic && (
              <p className="mt-1 text-xs text-zinc-400">
                Topic: <span className="font-mono text-indigo-400">{topic}</span>
                {folderPath && (
                  <span className="ml-3">
                    Folder: <span className="font-mono text-green-400">{folderPath}</span>
                  </span>
                )}
              </p>
            )}
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

            {frontImagePreview && folderPath && (
              <div className="mt-3 p-3 bg-zinc-800/50 border border-zinc-700 rounded">
                <p className="text-xs text-zinc-400">
                  Image will be saved to: <span className="font-mono text-green-400">{folderPath}</span>
                </p>
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
                <button type="button" onClick={removeBackImage} className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors cursor-pointer">
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

            {backImagePreview && folderPath && (
              <div className="mt-3 p-3 bg-zinc-800/50 border border-zinc-700 rounded">
                <p className="text-xs text-zinc-400">
                  Image will be saved to: <span className="font-mono text-green-400">{folderPath}</span>
                </p>
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
