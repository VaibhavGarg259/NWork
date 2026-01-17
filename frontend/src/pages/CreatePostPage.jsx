// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import axios from "axios";
import { useState } from "react";
// import { createPost } from "../lib/api";
import { axiosInstance } from "../lib/axios";

const CreatePostPage = () => {
  const [text, setText] = useState("");
  const [file, setfile] = useState(null);
  // const [loading, setLoading] = useState(false);

  // const queryClient = useQueryClient();

  // const { mutate, isPending } = useMutation({
  //   mutationFn: createPost,
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["posts"] });
  //     setText("");
  //     setImage(null);
  //     alert("Post created successfully!");
  //   },
  //   onError: () => {
  //     alert("Failed to create post");
  //   },
  // });

  const handleTextchange = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("text", text);
    if (file) formData.append("file", file);

    try {
      await axiosInstance.post("/post/create", formData, {
        headers: { "content-Type": "multipart/form-data" },
      });
      alert("post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };
  return (
    <form onSubmit={handleTextchange} className="p-4 border rounded">
      <textarea
        placeholder="what's on your mind? "
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-2 border"
      />

      <input
        type="file"
        onChange={(e) => setfile(e.target.files[0])}
        className="mt-2"
      />

      <button type="submit" className="mt-2 bg-blue-500 text-white px-4 py-2">
        {/* {isPending ? "Posting..." : "Post"} */}
        Upload
      </button>
    </form>
  );
};

export default CreatePostPage;
