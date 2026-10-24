import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CameraIcon,
  LoaderIcon,
  MapPinIcon,
  ShipWheelIcon,
} from "lucide-react";

import toast from "react-hot-toast";

import useAuthUser from "../hooks/useAuthUser";
import { completeOnboarding } from "../lib/api";
import { LANGUAGES, professional } from "../constants";

const createFormState = (user) => ({
  FullName: user?.FullName || "",
  bio: user?.bio || "",
  nativeLanguage: user?.nativeLanguage || "",
  learningLanguage: user?.learningLanguage || "",
  location: user?.location || "",
  profilepic: user?.profilepic || "",
});

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formstate, setFormState] = useState(() => createFormState(authUser));

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (authUser && !initialized) {
      setFormState(createFormState(authUser));
      setInitialized(true);
    }
  }, [authUser, initialized]);

  const updateField = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,

    onSuccess: async () => {
      toast.success("Profile updated successfully!");

      // Refresh cached user/profile data.
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      await queryClient.invalidateQueries({ queryKey: ["friends"] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });

      navigate("/profile/" + authUser?._id);
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "Could not update profile. Please try again.",
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const fullName = formstate.FullName.trim();
    if (!fullName) {
      toast.error("Please enter your full name.");
      return;
    }

    const data = new FormData();
    data.append("FullName", fullName);
    data.append("bio", formstate.bio);
    data.append("nativeLanguage", formstate.nativeLanguage);
    data.append("learningLanguage", formstate.learningLanguage);
    data.append("location", formstate.location);

    if (profileFile) {
      data.append("profilepic", profileFile); // nayi file
    } else {
      data.append("profilepicUrl", formstate.profilepic); // purani URL
    }

    onboardingMutation(data);
  };

  // const handleRandomAvatar = () => {
  //   setProfileFile(null);
  //   setPhotoError("");

  //   const seed = encodeURIComponent(formstate.FullName.trim() || "User");

  //   updateField(
  //     "profilepic",
  //     `https://api.dicebear.com/9.x/initials/png?seed=${seed}`,
  //   );
  //   toast.success("Minimal avatar generated!");
  // };

  const [profileFile, setProfileFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select JPG, PNG or WebP");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      e.target.value = "";
      return;
    }

    setProfileFile(file);
  };

  useEffect(() => {
    if (!profileFile) {
      setPreviewUrl("");
      return;
    }

    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled) setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(profileFile);

    return () => {
      cancelled = true;
    };
  }, [profileFile]);
  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-blue-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Edit Your Profile
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile picture */}
            <div className="flex flex-col items-center gap-3">
              <label
                htmlFor="profilepic-upload"
                className="relative size-32 cursor-pointer"
              >
                <div className="size-full overflow-hidden rounded-full border-2 border-base-content/10 bg-base-300">
                  {previewUrl || formstate.profilepic ? (
                    <img
                      src={previewUrl || formstate.profilepic}
                      alt="Profile preview"
                      className="size-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/default-avatar.png";
                      }}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <CameraIcon className="size-12 opacity-40" />
                    </div>
                  )}
                </div>

                {/* Camera icon at bottom */}
                <span className="absolute bottom-1 right-1 flex size-9 items-center justify-center rounded-full bg-primary text-primary-content shadow-md">
                  <CameraIcon className="size-5" />
                </span>
              </label>

              <input
                type="file"
                id="profilepic-upload"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleProfilePhotoChange}
              />

              <p className="text-xs text-base-content/60">
                Upload a clear photo (JPG, PNG or WebP)
              </p>
            </div>

            {/* Full name */}
            <div className="form-control">
              <label className="label" htmlFor="FullName">
                <span className="label-text">Full Name</span>
              </label>

              <input
                id="FullName"
                type="text"
                name="FullName"
                value={formstate.FullName}
                onChange={(e) => updateField("FullName", e.target.value)}
                className="input input-bordered w-full"
                placeholder="Your full name"
                required
              />
            </div>

            {/* Bio */}
            <div className="form-control">
              <label className="label" htmlFor="bio">
                <span className="label-text">Bio</span>
              </label>

              <textarea
                id="bio"
                name="bio"
                value={formstate.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                className="textarea textarea-bordered h-24"
                placeholder="Tell others about yourself"
              />
            </div>

            {/* Languages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label" htmlFor="nativeLanguage">
                  <span className="label-text">Native Language</span>
                </label>

                <select
                  id="nativeLanguage"
                  name="nativeLanguage"
                  value={formstate.nativeLanguage}
                  onChange={(e) =>
                    updateField("nativeLanguage", e.target.value)
                  }
                  className="select select-bordered w-full"
                >
                  <option value="">Select your native language</option>

                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              {/* professional  */}
              <div className="">
                <div className="form-control">
                  <label className="label" htmlFor="learningLanguage">
                    <span className="label-text">Professional</span>
                  </label>

                  <select
                    id="learningLanguage"
                    name="learningLanguage"
                    value={formstate.learningLanguage}
                    onChange={(e) =>
                      updateField("learningLanguage", e.target.value)
                    }
                    className="select select-bordered w-full"
                  >
                    <option value="">Select a language to learn</option>

                    {professional.map((lang) => (
                      <option key={lang} value={lang.toLowerCase()}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="form-control">
              <label className="label" htmlFor="location">
                <span className="label-text">Location</span>
              </label>

              <div className="relative">
                <MapPinIcon className="absolute top-1/2 -translate-y-1/2 left-3 size-5 text-base-content opacity-70" />

                <input
                  id="location"
                  type="text"
                  name="location"
                  value={formstate.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  className="input input-bordered w-full pl-10"
                  placeholder="City, Country"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              className="btn btn-primary w-full"
              disabled={isPending}
              type="submit"
            >
              {isPending ? (
                <>
                  <LoaderIcon className="size-5 animate-spin" />
                  Saving profile...
                </>
              ) : (
                <>
                  <ShipWheelIcon className="size-5" />
                  Save Profile
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
