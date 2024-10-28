import { Post } from "@dribble/shared/models";

export const dummyPostData: Post[] = Array.from({ length: 100 }, (_, index) => ({
  id: index + 1,
  createdAt: new Date(),
  avatarUrl: "https://media.licdn.com/dms/image/v2/C5603AQFczepDbPjvPw/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1563913652177?e=1735776000&v=beta&t=NJw8gSxe-5x1pyhRy0i4Ani9z8YDKoalAN1k7AbCz5M",
  username: `user_${index + 1}`,
  authorId: index + 1000,
  content: `This is sample post content for post number ${index + 1}. `.repeat(index % 5 + 1),
  likeCount: Math.floor(Math.random() * 100),
  commentCount: Math.floor(Math.random() * 50),
}));
