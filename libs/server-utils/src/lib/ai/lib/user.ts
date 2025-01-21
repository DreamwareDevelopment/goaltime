import { UserProfile } from "@prisma/client";
import { Jsonify } from "inngest/helpers/jsonify";

export function formatUser(user: UserProfile | Jsonify<UserProfile>): string {
  return `{
    "id": "${user.id}",
    "name": "${user.name}",
    "phone": "${user.phone}",
    "birthday": "${user.birthday}",
    "occupation": "${user.occupation}",
    "unemployed": "${user.unemployed}",
    "startsWorkAt": "${user.startsWorkAt}",
    "endsWorkAt": "${user.endsWorkAt}",
    "workDays": "${user.workDays}",
    "routine": "${user.routine}",
    "unemployed": "${user.unemployed}",
  }`
}
