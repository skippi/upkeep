export interface AppState {
  completions: { [id: number]: Completion };
  sessions: { [id: number]: Session };
  tasks: { [id: number]: Task };
}

export interface Task {
  id: number;
  completions: number[];
  estimate: number;
  name: string;
  notes: string;
  scheduleDate: Date | null;
  sessions: number[];
}

export interface Session {
  id: number;
  start: Date;
  end: Date | null;
}

export interface Completion {
  id: number;
  date: Date;
  notes: string;
}

let nextId = 0;
function generateId() {
  return nextId++;
}

export function closeTask(app: AppState, id: number) {
  const completion = {
    id: generateId(),
    date: new Date(),
    notes: "",
  };
  app.completions[completion.id] = completion;
  app.tasks[id].completions.push(completion.id);
  clockOutTask(app, id);
}

export function createTask(
  app: AppState,
  props: {
    completions: number[];
    estimate: number;
    name: string;
    notes: string;
    scheduleDate?: Date | null;
    sessions: number[];
  }
) {
  const id = generateId();
  const scheduleDate = props.scheduleDate ?? null;
  app.tasks[id] = {
    ...props,
    id: id,
    scheduleDate: scheduleDate,
  };
}


function closeSession(session: Session) {
  if (session.end) return;
  session.end = new Date();
}

function clockOutTask(app: AppState, id: number) {
  app.tasks[id].sessions
    .slice(-1)
    .map((sid) => app.sessions[sid])
    .forEach(closeSession);
}

export function toggleClockTask(app: AppState, id: number) {
  if (isClockedInTask(app, id)) {
    return clockOutTask(app, id);
  }
  Object.keys(app.tasks)
    .map(Number)
    .forEach((tid) => clockOutTask(app, tid));
  const session = { id: generateId(), start: new Date(), end: null };
  app.tasks[id].sessions.push(session.id);
  app.sessions[session.id] = session;
}

export function isClockedInTask(app: AppState, id: number) {
  return app.tasks[id].sessions
    .slice(-1)
    .map((sid) => app.sessions[sid])
    .some((s) => !s.end);
}

export function elapsedTimeTask(app: AppState, id: number) {
  const task = app.tasks[id];
  return task.sessions
    .map((sid) => app.sessions[sid])
    .filter((session) => {
      var lastCompletionDate =
        task.completions.slice(-1).map((cid) => app.completions[cid].date)[0] ??
        new Date(0);
      return session.start >= lastCompletionDate;
    })
    .reduce((total, session) => total + elapsedTimeSession(session), 0);
}

export function elapsedTimeSession(session: Session) {
  const endTime = session.end ?? new Date();
  return endTime.getTime() - session.start.getTime();
}

export function totalTimeTask(app: AppState, id: number) {
  return app.tasks[id].sessions
    .map((sid) => app.sessions[sid])
    .reduce((total, session) => total + elapsedTimeSession(session), 0);
}
