"use client";

import Navbar from "../components/navigation";
import PostCard from "../components/post";
import { Post } from "@dribble/shared/models";

export default function Index() {
  const dummyPostData: Post = {
    id: 1,
    createdAt: new Date(),
    avatarUrl: "https://media.licdn.com/dms/image/v2/C5603AQFczepDbPjvPw/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1563913652177?e=1735776000&v=beta&t=NJw8gSxe-5x1pyhRy0i4Ani9z8YDKoalAN1k7AbCz5M",
    username: "zander_pyle",
    authorId: 12345,
    content: "This is a sample post content for testing purposes.",
    likeCount: 42
  };
  return (
    <div className="w-full flex flex-col">
      <Navbar user={undefined} />
      <div className="w-full md:px-[10%] lg:px-[15%] xl:px-[20%]">
        <PostCard data={dummyPostData} />
      </div>
    </div>
  );
}
