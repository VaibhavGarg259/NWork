import React, { useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CameraIcon,
  LoaderIcon,
  MapPinIcon,
  ShipWheelIcon,
  ShuffleIcon,
} from "lucide-react";
import { completeOnboarding } from "../lib/api";
import { LANGUAGES } from "../constants";
import toast from "react-hot-toast";

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryclient = useQueryClient();

  const [formstate, setFromState] = useState({
    FullName: authUser?.FullName || "",
    bio: authUser?.bio || "",
    nativaLanguage: authUser?.nativaLanguage || "",
    learningLanguage: authUser?.learningLanguage || "",
    location: authUser?.location || "",
    profilepic: authUser?.profilepic || "",
  });

  const { mutate: onboardingMutation, ispending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile onboarbed successfully");
      queryclient.invalidateQueries({ queryKey: [authUser] });
    },

    onError: (error) => {
      toast.error(error.response.data.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onboardingMutation(formstate);
  };

  // Avatar generate
  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1; //1-100 included
    const RandomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    setFromState({ ...formstate, profilepic: RandomAvatar });
    toast.success("Random profile picture generated!");
  };
  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-blue-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Complete Your Profile
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* profile pic container */}

            <div className="flex flex-col items-center justify-center space-y-4">
              {/* image preview */}
              <div className="size-32 rounded-full bg-base-300 overflow-hidden">
                {formstate.profilepic ? (
                  <img
                    src={formstate.profilepic}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <CameraIcon className="size-12 text-base-content opacity-40" />
                  </div>
                )}
              </div>

              {/* Generate random avatar Btn */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRandomAvatar}
                  className="btn btn-accent"
                >
                  <ShuffleIcon className="size-4 mr-2" />
                  Generate Random Avatar
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formstate.FullName}
                onChange={(e) =>
                  setFromState({ ...formstate, FullName: e.target.value })
                }
                className="input input-bordered w-full"
                placeholder="Your full name"
              />
            </div>

            {/* Bio */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Bio</span>
              </label>
              <textarea
                name="bio"
                value={formstate.bio}
                onChange={(e) =>
                  setFromState({ ...formstate, bio: e.target.value })
                }
                className="textarea textarea-bordered h-24"
                placeholder="Tell others about yourself and your language learning goals"
              />
            </div>

            {/*Language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Native Language */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Native Language</span>
                </label>
                <select
                  name="nativeLanguage"
                  value={formstate.nativaLanguage}
                  onChange={(e) =>
                    setFromState({
                      ...formstate,
                      nativaLanguage: e.target.value,
                    })
                  }
                  className="select select-bordered w-full"
                >
                  <option value="">Select your native language</option>
                  {LANGUAGES.map((lang) => (
                    <option key={`native-${lang}`} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Learning Language */}
              <div className="form-control">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Learning Language</span>
                  </label>
                  <select
                    name="learning language"
                    value={formstate.learningLanguage}
                    onChange={(e) =>
                      setFromState({
                        ...formstate,
                        learningLanguage: e.target.value,
                      })
                    }
                    className="select select-bordered w-full"
                  >
                    <option value="">
                      Select language language you're learning{" "}
                    </option>
                    {LANGUAGES.map((lang) => (
                      <option
                        key={`learing-${lang}`}
                        value={lang.toLowerCase()}
                      >
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* location */}
            <div className="form-control">
              <label className="label">
                <span className="label-text"> Location</span>
              </label>
              <div className="relative">
                <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2 left-3 size-5 text-base-content opacity-70" />

                <input
                  type="text"
                  name="location"
                  value={formstate.location}
                  onChange={(e) =>
                    setFromState({ ...formstate, location: e.target.value })
                  }
                  className="input input-bordered w-full pl-10"
                  placeholder="City, Country"
                />
              </div>
            </div>

            {/* Submit button */}

            <button
              className="btn btn-primary w-full"
              disabled={ispending}
              type="submit"
            >
              {!ispending ? (
                <>
                  <ShipWheelIcon className="size-5 mr-2" />
                  Complete Onboarding
                </>
              ) : (
                <>
                  <LoaderIcon className="size-5 mr-2" />
                  onboarding...
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
