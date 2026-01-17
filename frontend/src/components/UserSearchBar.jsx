import axios from "axios";
import React, { useEffect, useState } from "react";

const UserSearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSearchResults = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5001/api/users/search?q=${searchQuery}`,
        { withCredentials: true } //include cookie for auth
      );
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSearchResults(query);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);
  return (
    <div className="h-auto w-80  my-5 mx-auto">
      <input
        type="text"
        placeholder="Search users..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-3 rounded-[8px] border border-gray-300"
      />

      {loading && <p className="mt-2.5">Searching...</p>}

      {results.length > 0 && (
        <ul className="list-none mt-2.5 mx-0 p-0 border border-solid border-gray-300 rounded-lg max-h-48 overflow-auto bg-white">
          {results.map((user) => (
            <li
              key={user._id}
              className="p-2.5 border-b border-gray-200 border-solid flex items-center cursor-pointer"
              onClick={() => window.location.assign(`/profile/${user._id}`)}
            >
              <img
                src={user.profilepic || "https://via.placeholder.com/40"}
                alt={user.FullName}
                className="w-10 h-10 rounded-full mr-2.5 "
              />
              <div>
                <strong>{user.FullName}</strong>
                <p className="m-0 text-xs text-gray-600">{user.email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && query && results.length === 0 && (
        <p className="mt-2.5  text-gray-500">No user found</p>
      )}
    </div>
  );
};

export default UserSearchBar;
