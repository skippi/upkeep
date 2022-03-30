export interface Session {
  start: Date;
  end: Date | null;
}

export function close(session: Session) {
  if (session.end) return;
  session.end = new Date();
}

export function elapsedTime(session: Session) {
  const endTime = session.end ?? new Date();
  return endTime.getTime() - session.start.getTime();
}
