import { DATE_TIME_FORMAT } from "@/shared/utils";
import { formatRoutine } from "@/shared/zod";
import { UserProfile } from "@prisma/client";
import dayjs from "dayjs";
import { Jsonify } from "inngest/helpers/jsonify";

export function formatUser(user: UserProfile | Jsonify<UserProfile>) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    birthday: user.birthday,
    occupation: user.occupation,
    unemployed: user.unemployed,
    startsWorkAt: dayjs(user.startsWorkAt).tz(user.timezone).format(DATE_TIME_FORMAT),
    endsWorkAt: dayjs(user.endsWorkAt).tz(user.timezone).format(DATE_TIME_FORMAT),
    workDays: user.workDays,
    routine: formatRoutine(user),
  };
}
