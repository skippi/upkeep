import produce, { Draft } from "immer";

export interface AppState {
  completions: { [id: number]: Completion };
  sessions: { [id: number]: Session };
  tasks: { [id: number]: Task };
  touched: Date;
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

export type Action =
  | CloseTaskAction
  | CreateTaskAction
  | EditTaskAction
  | ToggleClockTaskAction
  | DeleteTaskAction
  | EditCompletionNotesAction
  | RefreshAction;

interface CloseTaskAction {
  type: "closeTask";
  id: number;
}

interface DeleteTaskAction {
  type: "deleteTask";
  id: number;
}

interface CreateTaskAction {
  type: "createTask";
  props: {
    completions: number[];
    estimate: number;
    name: string;
    notes: string;
    scheduleDate?: Date | null;
    sessions: number[];
  };
}

interface EditTaskAction {
  type: "editTask";
  id: number;
  props: {
    completions?: number[];
    estimate?: number;
    name?: string;
    notes?: string;
    scheduleDate?: Date | null;
    sessions?: number[];
  };
}

interface ToggleClockTaskAction {
  type: "toggleClockTask";
  id: number;
}

interface EditCompletionNotesAction {
  type: "editCompletionNotes";
  id: number;
  value: string;
}

interface RefreshAction {
  type: "refresh";
}

export const initialState: AppState = {
  completions: {},
  sessions: {},
  tasks: {},
  touched: new Date(),
};

export const appReducer = produce((draft: Draft<AppState>, action: Action) => {
  if (action.type === "closeTask") {
    const completion = {
      id: generateId(),
      date: new Date(),
      notes: "",
    };
    draft.completions[completion.id] = completion;
    draft.tasks[action.id].completions.push(completion.id);
    clockOutTask(draft, action.id);
  } else if (action.type === "createTask") {
    const id = generateId();
    const scheduleDate = action.props.scheduleDate ?? null;
    draft.tasks[id] = {
      ...action.props,
      id: id,
      scheduleDate: scheduleDate,
    };
  } else if (action.type === "editTask") {
    draft.tasks[action.id] = {
      ...draft.tasks[action.id],
      ...action.props,
    };
  } else if (action.type === "toggleClockTask") {
    if (isClockedInTask(draft, action.id)) {
      return clockOutTask(draft, action.id);
    }
    Object.keys(draft.tasks)
      .map(Number)
      .forEach((tid) => clockOutTask(draft, tid));
    const session = { id: generateId(), start: new Date(), end: null };
    draft.tasks[action.id].sessions.push(session.id);
    draft.sessions[session.id] = session;
  } else if (action.type === "deleteTask") {
    draft.tasks[action.id].completions.forEach(
      (cid) => delete draft.completions[cid]
    );
    draft.tasks[action.id].sessions.forEach(
      (sid) => delete draft.completions[sid]
    );
    delete draft.tasks[action.id];
  } else if (action.type === "editCompletionNotes") {
    draft.completions[action.id].notes = action.value;
  } else if (action.type === "refresh") {
    draft.touched = new Date();
  }
});

let nextId = 0;
function generateId() {
  return nextId++;
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

export function averageTimeMATask(app: AppState, id: number) {
  const dateDividers = app.tasks[id].completions
    .map((cid) => app.completions[cid])
    .slice(-5)
    .map((c) => c.date);
  if (dateDividers.length === 0) return 0;
  dateDividers.unshift(new Date(0));
  dateDividers.push(new Date());
  let average = 0;
  for (var i = 0; i < dateDividers.length - 1; ++i) {
    const first = dateDividers[i];
    const last = dateDividers[i + 1];
    const timeTaken = app.tasks[id].sessions
      .map((sid) => app.sessions[sid])
      .filter((session) => first <= session.start && session.start < last)
      .reduce((total, session) => total + elapsedTimeSession(session), 0);
    average += timeTaken / (dateDividers.length - 2);
  }
  return average;
}
