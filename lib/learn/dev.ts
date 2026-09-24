export const DEV_UIDS = ["id5cOJ1uTTgvgyzTJHHM1qtwjpU2"];

export function isDev(uid?: string): boolean {
  return !!uid && DEV_UIDS.includes(uid);
}