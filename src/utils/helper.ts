import { TTL_UNIT_TYPE } from "../types/types";

export const convertToMs = (value: number, unit: TTL_UNIT_TYPE): number => {
  switch (unit) {
    case "min":
      return value * 60000;
    case "hour":
      return value * 3600000;
    default:
      return 3600000; // 1 hour
  }
};

export const prevTime = (durationInMinutes: number): Date => {
  const MS_PER_MINUTE = 60000;
  const myEndDateTime = new Date();
  return new Date(myEndDateTime.getTime() - durationInMinutes * MS_PER_MINUTE);
};

export const nextTime = (durationInMinutes: number): Date => {
  const MS_PER_MINUTE = 60000;
  const myEndDateTime = new Date();
  return new Date(myEndDateTime.getTime() + durationInMinutes * MS_PER_MINUTE);
};