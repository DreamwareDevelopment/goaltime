import { Comment } from "@dribble/shared/models";

export const generateDummyComments = (postId: number, count = 50): Comment[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    createdAt: new Date(),
    content: `This is a sample comment content for comment number ${index + 1} on post ${postId}.`,
    postId: postId,
    authorId: index + 2000,
    avatarUrl: "https://media.licdn.com/dms/image/v2/C5603AQFczepDbPjvPw/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1563913652177?e=1735776000&v=beta&t=NJw8gSxe-5x1pyhRy0i4Ani9z8YDKoalAN1k7AbCz5M",
    username: `commenter_${index + 1}`,
    likeCount: Math.floor(Math.random() * 20),
  }));
};
