import React from "react";
import { LANGUAGE_TO_FLAG } from "../constants";
import { Link } from "react-router";

const FriendCard = ({ friends }) => {
  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO  */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar size-12">
            <img src={friends.profilepic} alt={friends.FullName} />
          </div>
          <h3 className="font-semibold truncate">{friends.FullName}</h3>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            {getLanguageFlag(friends.nativaLanguage)}
            Native: {friends.nativaLanguage}
          </span>

          <span className="badge badge-outline text-xs">
            {getLanguageFlag(friends.learningLanguage)}
            Learning: {friends.learningLanguage}
          </span>
        </div>
        <Link to={`/chat/${friends._id}`} className="btn btn-outline w-full">
          Message
        </Link>
      </div>
    </div>
  );
};

export default FriendCard;

export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
  const countrycode = LANGUAGE_TO_FLAG[langLower];

  if (countrycode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countrycode}.png`}
        alt={`${langLower} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }
  return null;
}
