import { NextRequest } from "next/server";
import { dummyPostLookup } from "../../mock";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { increment } = await request.json();
  const post = dummyPostLookup[parseInt(id)];
  post.likeCount += increment;
  return new Response(null, { status: 200 });
}
