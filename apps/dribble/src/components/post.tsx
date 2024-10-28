import { Post } from "@dribble/shared/models";
import { Card, CardHeader, CardBody, CardFooter, Avatar } from "@nextui-org/react";
import { HeartFilledIcon } from "./icons";
import { useRouter } from "next/navigation";

export type PostCardProps = {
  data: Post;
}

export default function PostCard({ data }: PostCardProps) {
  const router = useRouter();
  const avatarName = data.avatarUrl || data.username;
  if (!avatarName) {
    return null;
  }
  const onPress = () => {
    router.push(`/post/${data.id}`);
  }
  return <Card className="w-full p-4" isPressable={true} onPress={onPress} style={{ borderRadius: '0px' }}>
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
      <p style={{ display: 'flex', alignItems: 'center' }}>
        {data.likeCount}
        <HeartFilledIcon size={25} style={{ marginLeft: '6px' }} />
      </p>
    </CardFooter>
  </Card>
}