import { NextRequest, NextResponse } from "next/server";
import { generateDummyComments } from "./mock";
import { PaginationResponse } from "@dribble/shared";
import { Comment } from "@dribble/shared/models";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const comments = generateDummyComments(parseInt(id));
  const page = request.nextUrl.searchParams.get("page") || "1";
  const pageSize = request.nextUrl.searchParams.get("pageSize") || "10";
  const startIndex = (parseInt(page) - 1) * parseInt(pageSize);
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedComments = comments.slice(startIndex, endIndex);
  const response: PaginationResponse<Comment> = {
    data: paginatedComments,
    total: Math.ceil(comments.length / parseInt(pageSize)),
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  };
  return NextResponse.json(response);
}
