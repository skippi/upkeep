export interface Session {
  start: Date;
  end: Date | null;
}

export function close(session: Session) {
  if (session.end) return;
  session.end = new Date();
}
