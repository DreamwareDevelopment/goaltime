"use client";

import { Divider, Pagination, ScrollShadow, Spinner } from "@nextui-org/react";
import Navbar from "../../../components/navigation";
import PostCard from "../../../components/post";
import { Post, Comment } from "@dribble/shared/models";
import { PaginationResponse } from "@dribble/shared";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PostDetails() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PaginationResponse<Comment> | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${id}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setPost(data);
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/posts/${id}/comments?page=${page}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    if (id) {
      fetchPost();
      fetchComments();
    } else {
      console.error("No post id provided");
      router.push("/");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page]);

  return (
    <div className="w-full flex flex-col">
      <Navbar user={undefined} />
      {post ? (
        <div className="flex flex-col items-center justify-center gap-10">
          <PostCard data={post} />
          <ScrollShadow hideScrollBar className="w-full md:px-[10%] lg:px-[15%] xl:px-[20%]">
            {comments?.data.map((comment, index) => (
              <div key={comment.id}>
                <div className="p-4">
                  <h3>{comment.username}</h3>
                  <p>{comment.content}</p>
                </div>
                {index !== comments.data.length - 1 && <Divider className="my-0" />}
              </div>
            ))}
          </ScrollShadow>
          <Pagination loop showControls color="warning" className="mb-5" total={comments?.total || 0} initialPage={1} onChange={setPage} />
        </div>
      ) : (
        <Spinner color="warning" className="mt-10" />
      )}
    </div>
  );
}
