import { User } from "@supabase/supabase-js";
import { UserProfile } from "../../type_gen/.prisma/client/index";

export interface PaginationResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  data: T[];
}
