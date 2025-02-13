import React, { useEffect, useState, useRef } from "react";
import { IoSearchOutline, IoClose } from "react-icons/io5";
import Loading from "./Loading";
import UserSearchCard from "./UserSearchCard";
import toast from "react-hot-toast";
import axios from "axios";
import debounce from "lodash.debounce";

const SearchUser = ({ onClose }) => {
  const [searchUser, setSearchUser] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const debouncedSearch = useRef(
    debounce(async (query) => {
      const URL = `${process.env.REACT_APP_BACKEND_URL}/api/search-user`;
      try {
        setLoading(true);
        const response = await axios.post(URL, { search: query });
        setSearchUser(response.data.data);
      } catch (error) {
        toast.error(error?.response?.data?.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }, 500)
  ).current;

  useEffect(() => {
    if (search.trim()) {
      debouncedSearch(search);
    } else {
      setSearchUser([]);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [search, debouncedSearch]);

  const shouldShowNoResults =
    search.trim() !== "" && !loading && searchUser.length === 0;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && shouldShowNoResults) {
      toast.error("No results found!");
    }
  };

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 bg-slate-700 bg-opacity-40 p-2 z-10">
      <div className="w-full max-w-lg mx-auto mt-10">
        <div className="bg-white rounded h-14 overflow-hidden flex">
          <input
            type="text"
            placeholder="Search user by name, email...."
            className="w-full outline-none py-1 h-full px-4"
            onChange={(e) => setSearch(e.target.value)}
            value={search}
            onKeyDown={handleKeyDown}
            aria-label="Search users"
          />
          <div className="h-14 w-14 flex justify-center items-center">
            <IoSearchOutline size={25} />
          </div>
        </div>

        <div className="bg-white mt-2 w-full p-4 rounded">
          {loading && (
            <div className="text-center">
              <Loading />
            </div>
          )}{" "}
          {shouldShowNoResults && (
            <p className="text-center text-slate-500">No user found!</p>
          )}
          {searchUser.length > 0 &&
            !loading &&
            searchUser.map((user) => (
              <UserSearchCard key={user._id} user={user} onClose={onClose} />
            ))}
        </div>
      </div>

      <div
        className="absolute top-0 right-0 text-2xl p-2 lg:text-4xl hover:text-white"
        onClick={onClose}
        aria-label="Close search"
      >
        <button>
          <IoClose />
        </button>
      </div>
    </div>
  );
};

export default SearchUser;