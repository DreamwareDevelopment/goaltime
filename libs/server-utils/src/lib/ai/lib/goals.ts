import { Goal } from "@prisma/client";
import { Jsonify } from "inngest/helpers/jsonify";

export function formatGoal(goal: Goal | Jsonify<Goal>) {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    deadline: goal.deadline,
    commitment: goal.commitment ? `${goal.commitment} hrs/wk` : null,
    preferredTimes: goal.preferredTimes,
    minimumDuration: `${goal.minimumDuration} mins`,
    maximumDuration: `${goal.maximumDuration} mins`,
  };
}

export function formatGoals(goals: Goal[]) {
  return goals.map(formatGoal);
}
