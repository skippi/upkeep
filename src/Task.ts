import { Session } from "./Session";

export interface Task {
  estimate: number;
  name: string;
  sessions: Session[];
}

export function elapsedTime(task: Task) {
  return task.sessions.reduce((total, session) => {
    const endTime = session.end ?? new Date();
    const elapsedMs = endTime.getTime() - session.start.getTime();
    return total + elapsedMs;
  }, 0);
}
