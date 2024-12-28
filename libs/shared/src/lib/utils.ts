// Dayjs
import dayjs from 'dayjs'

import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
dayjs.extend(timezone)
dayjs.extend(utc)

export { dayjs }

export const getTime = (time: string, timezone: string) => {
  return dayjs.tz(`1970-01-01T${time}:00`, timezone)
}

export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
};

export function isValidHexColor(color: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
}

export function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)([smhd])/);
  if (!match) throw new Error("Invalid duration format");

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: throw new Error("Invalid duration unit");
  }
}

const DEFAULT_DEBOUNCE_DELAY = 300;

export function debounce(func: () => Promise<void>, delay: number = DEFAULT_DEBOUNCE_DELAY) {
  const handler = setTimeout(async () => {
    await func()
  }, delay)

  const clear = () => {
    if (handler) {
      clearTimeout(handler);
    }
  };

  return clear;
}
