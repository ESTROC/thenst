export interface UserStats {
  dayStreak: number;
  hoursLearned: number;
  certificates: number;
  coursesInProgress: number;
}

// Until the backend exists, every user starts at zero.
export const emptyStats: UserStats = {
  dayStreak: 0,
  hoursLearned: 0,
  certificates: 0,
  coursesInProgress: 0,
};

export function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Subtitle adapts to the learner's situation.
export function subtitleFor(
  isLoggedIn: boolean,
  stats: UserStats,
): string {
  if (!isLoggedIn) {
    return "Sign in to track your progress and pick up where you left off.";
  }
  if (stats.coursesInProgress === 0 && stats.hoursLearned === 0) {
    return "Welcome aboard — explore the catalog and start your first course today.";
  }
  if (stats.dayStreak >= 3) {
    return `You're on a ${stats.dayStreak}-day streak — keep the momentum going!`;
  }
  if (stats.coursesInProgress > 0) {
    return "Pick up where you left off and keep learning.";
  }
  return "Ready for your next lesson?";
}

export function formatHours(h: number): string {
  return h > 0 ? `${h}h` : "0h";
}
