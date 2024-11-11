"use client";

import { Divider, Pagination, ScrollShadow, Spinner } from "@nextui-org/react";
import Navbar from "../components/navigation";
import PostCard from "../components/post";
import { Post } from "@goaltime/shared/models";
import { PaginationResponse } from "@goaltime/shared";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function Index() {
  const [posts, setPosts] = useState<PaginationResponse<Post> | null>(null);
  const [page, setPage] = useState(1);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`/api/posts?page=${page}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, [page]);
  return (
    <div className="w-full flex flex-col">
      <Navbar user={undefined} />
      {posts ? (
        <div className="flex flex-col items-center justify-center gap-10">
          <ScrollShadow hideScrollBar className="w-full md:px-[10%] lg:px-[15%] xl:px-[20%]">
            {posts?.data.map((post, index) => (
              <div key={post.id}>
                <PostCard data={post} />
                {index !== posts.data.length - 1 && theme === "dark" && <Divider className="my-0" />}
              </div>
            ))}
          </ScrollShadow>
          <Pagination loop showControls color="warning" className="mb-5" total={posts.total} initialPage={1} onChange={setPage} />
        </div>
      ) : (
        <Spinner color="warning" className="mt-10" />
      )}
    </div>
  );
}
