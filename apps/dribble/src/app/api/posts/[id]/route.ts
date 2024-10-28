import { NextRequest, NextResponse } from "next/server";
import { dummyPostLookup } from "../mock";

export function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const post = dummyPostLookup[parseInt(id)];
  return NextResponse.json(post);
}
