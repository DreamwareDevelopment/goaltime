import { NextRequest, NextResponse } from "next/server";
import { dummyPostData } from "./mock";
import { Post } from "@dribble/shared/models";
import { PaginationResponse } from "@dribble/shared";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedPosts = dummyPostData.slice(start, end);
  const response: PaginationResponse<Post> = {
    page,
    pageSize,
    total: Math.ceil(dummyPostData.length / pageSize),
    data: paginatedPosts,
  };

  return NextResponse.json(response);
}
