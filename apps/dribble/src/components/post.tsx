import { Post } from "@dribble/shared/models";
import { Card, CardHeader, CardBody, CardFooter, Avatar } from "@nextui-org/react";
import { CommentIcon, HeartFilledIcon } from "./icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type PostCardProps = {
  data: Post;
}

export default function PostCard({ data }: PostCardProps) {
  const router = useRouter();
  const avatarName = data.avatarUrl || data.username;
  const [likeCount, setLikeCount] = useState(data.likeCount);
  const [isLiked, setIsLiked] = useState(false); // TODO: need to determine if the user has liked the post
  const [isRequestInFlight, setIsRequestInFlight] = useState(false);

  if (!avatarName) {
    return null;
  }

  const onPress = () => {
    router.push(`/posts/${data.id}`);
  }

  const onLike = async (ev: React.MouseEvent<SVGSVGElement>) => {
    ev.stopPropagation();
    ev.preventDefault();

    if (isRequestInFlight) return;
    setIsRequestInFlight(true);

    const likeButton = ev.currentTarget;
    console.log(likeButton);
    let increment = 1;

    if (likeButton) {
      if (isLiked) {
        increment = -1;
      }
    }

    try {
      await fetch(`/api/posts/${data.id}/like`, {
        method: "POST",
        body: JSON.stringify({ increment }),
      });
    } finally {
      setIsLiked(!isLiked); // TODO: Figure out how to update the color via NextUI
      setLikeCount(likeCount + increment);
      setIsRequestInFlight(false);
    }
  }

  return <Card className="w-full p-4 rounded-none" isPressable={true} onPress={onPress}>
    <CardHeader>
      <Avatar src={avatarName} />
      <div className="ml-2">
        <h2>{data.username || data.authorId}</h2>
      </div>
    </CardHeader>
    <CardBody>
      <p>{data.content}</p>
    </CardBody>
    <CardFooter>
      <p className="flex items-center">
        {likeCount}
        <HeartFilledIcon size={25} className="ml-3 mb-[1px] mr-4" onClick={onLike} />
        {data.commentCount}
        <CommentIcon size={22} className="ml-3" />
      </p>
    </CardFooter>
  </Card>
}