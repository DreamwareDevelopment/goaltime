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
    "preferredSleepTime": "${user.preferredSleepTime}",
    "preferredWakeUpTime": "${user.preferredWakeUpTime}",
    "unemployed": "${user.unemployed}",
  }`
    // TODO: These are good ideas, but we need to get the user to set them
    // "preferredMealTime": "${user.preferredMealTime}",
    // "preferredExerciseTime": "${user.preferredExerciseTime}",
    // "preferredSocialTime": "${user.preferredSocialTime}",
    // "preferredRelaxTime": "${user.preferredRelaxTime}",
}
