import { Link } from "react-router";
import { LANGUAGE_TO_FLAG } from "../constants";

export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (!countryCode) return null;

  return (
    <img
      src={`https://flagcdn.com/24x18/${countryCode}.png`}
      alt={`${langLower} flag`}
      className="mr-1 inline-block h-3"
    />
  );
}

const FriendCard = ({ friends }) => {
  const name = friends.FullName || "User";

  return (
    <div className="card bg-base-200 transition-shadow hover:shadow-md">
      <div className="card-body p-4">
        {/* User info */}
        <Link
          to={`/profile/${friends._id}`}
          className="group mb-3 flex items-center gap-3"
        >
          <div className="avatar shrink-0">
            <div className="size-12 rounded-full border-2 border-primary/30">
              <img
                src={friends.profilepic}
                alt={name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://ui-avatars.com/api/?name=" +
                    encodeURIComponent(name);
                }}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          <h3 className="truncate font-semibold group-hover:underline">
            {name}
          </h3>
        </Link>

        {/* Languages */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {friends.nativeLanguage && (
            <span className="badge badge-secondary text-xs">
              {getLanguageFlag(friends.nativeLanguage)}
              Native: {friends.nativeLanguage}
            </span>
          )}

          {friends.learningLanguage && (
            <span className="badge badge-outline text-xs">
              {getLanguageFlag(friends.learningLanguage)}
              Learning: {friends.learningLanguage}
            </span>
          )}
        </div>

        <Link to={`/chat/${friends._id}`} className="btn btn-outline w-full">
          Message
        </Link>
      </div>
    </div>
  );
};

export default FriendCard;
