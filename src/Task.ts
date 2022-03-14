import { Session, close as closeSession } from "./Session";

export interface Task {
  completions: Date[];
  estimate: number;
  name: string;
  notes: string;
  sessions: Session[];
}

export function close(task: Task) {
  task.completions.push(new Date());
  task.sessions.slice(-1).forEach(closeSession);
}

export function elapsedTime(task: Task) {
  return task.sessions
    .filter((s) => s.start >= (task.completions.slice(-1)[0] ?? new Date(0)))
    .reduce((total, session) => {
      const endTime = session.end ?? new Date();
      const elapsedMs = endTime.getTime() - session.start.getTime();
      return total + elapsedMs;
    }, 0);
}
