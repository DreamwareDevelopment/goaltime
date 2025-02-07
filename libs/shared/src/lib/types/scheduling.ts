import { dayjs } from '../utils';

export interface Interval<T = Date> {
  start: T;
  end: T;
}

export interface IntervalWithScore<T> extends Interval<T> {
  score: number;
}

export interface TypedIntervalWithScore<T> extends IntervalWithScore<T> {
  type: 'work' | 'free';
}

export interface WakeUpOrSleepEvent<T> {
  type: 'wakeUp' | 'sleep';
  start: T;
}

// TODO: Add duration everywhere it's needed.
export interface ExternalEvent<T> extends Interval<T> {
  id: string;
  title: string;
  duration?: number;
  subtitle?: string;
  description?: string;
  location?: string;
  allDay?: T;
}

export interface GoalEvent<T> {
  goalId: string;
  title: string;
  start: T;
  end: T;
}

export type ScheduleEvent<T> = ExternalEvent<T> | TypedIntervalWithScore<T> | WakeUpOrSleepEvent<T> | GoalEvent<T>;

export function isExternalEvent<T>(event: ScheduleEvent<T>): event is ExternalEvent<T> {
  return 'id' in event;
}

export function isWakeUpOrSleepEvent<T>(event: ScheduleEvent<T>): event is WakeUpOrSleepEvent<T> {
  return 'type' in event && (event.type === 'wakeUp' || event.type === 'sleep');
}

export function isGoalEvent<T>(event: ScheduleEvent<T>): event is GoalEvent<T> {
  return 'goalId' in event;
}

export function serializeEvent(event: ExternalEvent<string>): ExternalEvent<dayjs.Dayjs> {
  return {
    ...event,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    start: dayjs(event.start!),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    end: dayjs(event.end!),
    allDay: event.allDay ? dayjs(event.allDay) : undefined,
  }
}
