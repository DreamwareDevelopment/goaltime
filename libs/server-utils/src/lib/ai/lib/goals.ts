import { Goal } from "@prisma/client";

export function formatGoal(goal: Goal): string {
  return `{
    "id": "${goal.id}",
    "title": "${goal.title}",
    "description": "${goal.description}",
    "deadline": "${goal.deadline}",
    "commitment": "${goal.commitment ? `${goal.commitment} hrs/wk` : null}",
    "preferredTimes": "${goal.preferredTimes}",
    "minimumDuration": "${goal.minimumDuration} mins",
    "maximumDuration": "${goal.maximumDuration} mins",
  }`
}

export function formatGoals(goals: Goal[]): string {
  return JSON.stringify(goals.map(formatGoal), null, 2)
}
