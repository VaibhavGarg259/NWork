// import { useState } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { axiosInstance } from "../lib/axios";
import { UserRound, ImagePlus, Send } from "lucide-react";

const CreatePostPage = () => {
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!text.trim() && !file) {
      alert("Please enter text or select an image.");
      return;
    }

    const formData = new FormData();
    formData.append("text", text.trim());

    if (file) {
      formData.append("file", file);
    }

    try {
      setLoading(true);

      const response = await axiosInstance.post("/post/create", formData);

      console.log("Created post:", response.data);

      alert("Post created successfully!");

      setText("");
      setFile(null);

      navigate("/");
    } catch (error) {
      console.error(
        "Error creating post:",
        error.response?.data || error.message,
      );

      alert(
        error.response?.data?.message ||
          "Failed to create post. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled) setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      {/* Existing form */}
      <form
        onSubmit={handleCreatePost}
        className="w-full max-w-2xl mx-auto overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-base-300 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold">Create a post</h2>
            <p className="text-sm text-base-content/60">
              Share your thoughts with your friends
            </p>
          </div>
        </div>

        {/* Text area */}
        <div className="p-5">
          <textarea
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-xl border border-base-300 bg-base-200/40 p-4 text-base outline-none transition placeholder:text-base-content/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          {/* Image preview */}
          {file && (
            <div className="relative mt-4 overflow-hidden rounded-xl border border-base-300">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Selected post"
                  className="max-h-96 w-full bg-base-200 object-contain"
                />
              )}
              <div className="flex items-center justify-between gap-3 p-3">
                <p className="truncate text-sm text-base-content/70">
                  {file.name}
                </p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="btn btn-sm btn-ghost text-error"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Upload image */}
          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-base-300 p-4 transition hover:border-primary hover:bg-primary/5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
              <ImagePlus className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold">Add a photo</p>
              <p className="text-xs text-base-content/60">
                JPG, PNG or other supported image formats
              </p>
            </div>

            <span className="btn btn-sm btn-outline">Browse</span>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-base-300 bg-base-200/30 p-4">
          <p className="text-xs text-base-content/50">
            Share something meaningful ✨
          </p>

          <button
            type="submit"
            disabled={loading || (!text.trim() && !file)}
            className="btn btn-primary min-w-32 rounded-xl px-5 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Uploading...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Publish Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostPage;
