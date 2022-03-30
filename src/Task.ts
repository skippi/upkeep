import * as Sessions from "./Session";
import { close as closeSession, Session } from "./Session";

export interface Task {
  completions: Completion[];
  estimate: number;
  name: string;
  notes: string;
  sessions: Session[];
}

interface Completion {
  date: Date;
  notes: string;
}

export function isClockedIn(task: Task) {
  return task.sessions.length > 0 && !task.sessions.slice(-1)[0].end;
}

export function close(task: Task) {
  task.completions.push({ date: new Date(), notes: "" });
  task.sessions.slice(-1).forEach(closeSession);
}

export function clockOut(task: Task) {
  task.sessions.slice(-1).forEach(closeSession);
}

export function elapsedTime(task: Task) {
  return task.sessions
    .filter((s) => s.start >= (task.completions.slice(-1)[0].date ?? new Date(0)))
    .reduce((total, session) => total + Sessions.elapsedTime(session), 0);
}

export function totalTime(task: Task) {
  return task.sessions.reduce(
    (total, session) => total + Sessions.elapsedTime(session),
    0
  );
}
