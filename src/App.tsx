import produce from "immer";
import { useEffect, useState } from "react";
import "./App.css";
import {
  AppState,
  closeTask,
  createTask,
  elapsedTimeSession,
  elapsedTimeTask,
  isClockedInTask,
  toggleClockTask,
  totalTimeTask,
} from "./AppState";
import logo from "./logo.svg";

function msToHHMMSS(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(milliseconds / 60 / 1000);
  const hours = Math.floor(milliseconds / 3600 / 1000);
  const padZeroes = (v: number) => v.toString().padStart(2, "0");
  return `${padZeroes(hours)}:${padZeroes(minutes)}:${padZeroes(seconds)}`;
}

function App() {
  const [name, setName] = useState<string>("");
  const [app, setApp] = useState<AppState>({
    completions: {},
    sessions: {},
    tasks: {},
  });
  const [notesVisible, setNotesVisible] = useState<number[]>([]);
  const [historyVisible, setHistoryVisible] = useState<number[]>([]);
  const [completionsVisible, setCompletionsVisible] = useState<number[]>([]);
  useEffect(() => {
    const interval = setInterval(() => setApp({ ...app }), 1000);
    return () => clearInterval(interval);
  }, [app]);
  return (
    <div className="App">
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button
        onClick={() =>
          setApp(
            produce(app, (draft) =>
              createTask(draft, {
                completions: [],
                estimate: 0,
                name: name,
                notes: "",
                sessions: [],
              })
            )
          )
        }
      >
        Enter
      </button>
      {Object.values(app.tasks).map((task) => (
        <div key={task.id}>
          <span
            style={{
              color: isClockedInTask(app, task.id) ? "green" : undefined,
            }}
          >
            {task.name} |
          </span>
          &nbsp;
          <span
            style={{
              color:
                elapsedTimeTask(app, task.id) > task.estimate
                  ? "red"
                  : undefined,
            }}
          >
            {msToHHMMSS(elapsedTimeTask(app, task.id))}
          </span>
          &nbsp;|&nbsp;
          <input
            value={msToHHMMSS(task.estimate)}
            onChange={(e) => {
              let parsed = parseInt(e.target.value);
              if (isNaN(parsed)) {
                parsed = 0;
              }
              setApp(
                produce(app, (draft) => {
                  draft.tasks[task.id].estimate = parsed * 1000;
                })
              );
            }}
          />
          <button
            onClick={() =>
              setApp(produce(app, (draft) => toggleClockTask(draft, task.id)))
            }
          >
            T
          </button>
          <button
            onClick={() => {
              if (notesVisible.includes(task.id)) {
                setNotesVisible(notesVisible.filter((i) => i !== task.id));
                return;
              }
              setNotesVisible([...notesVisible, task.id]);
            }}
          >
            N
          </button>
          <button
            onClick={() =>
              setApp(produce(app, (draft) => closeTask(draft, task.id)))
            }
          >
            C
          </button>
          <button
            onClick={() => {
              if (historyVisible.includes(task.id)) {
                setHistoryVisible(historyVisible.filter((i) => i !== task.id));
                return;
              }
              setHistoryVisible([...historyVisible, task.id]);
            }}
          >
            History
          </button>
          <button
            onClick={() => {
              setApp(
                produce(app, (draft) => {
                  draft.tasks[task.id].completions.forEach(
                    (cid) => delete app.completions[cid]
                  );
                  draft.tasks[task.id].sessions.forEach(
                    (sid) => delete app.completions[sid]
                  );
                  delete draft.tasks[task.id];
                })
              );
              setNotesVisible(notesVisible.filter((i) => i !== task.id));
            }}
          >
            X
          </button>
          {notesVisible.includes(task.id) && (
            <div>
              <textarea
                onChange={(e) =>
                  setApp(
                    produce(app, (draft) => {
                      draft.tasks[task.id].notes = e.target.value;
                    })
                  )
                }
                value={task.notes}
              />
            </div>
          )}
          {historyVisible.includes(task.id) && (
            <div key={task.id}>
              <div>Total Time: {msToHHMMSS(totalTimeTask(app, task.id))}</div>
              <div>
                <div>Completions</div>
                {task.completions
                  .map((cid) => app.completions[cid])
                  .map((completion) => (
                    <div
                      key={JSON.stringify([
                        "completion",
                        task.id,
                        completion.id,
                      ])}
                    >
                      {completion.date.toISOString()}
                      <button
                        onClick={() => {
                          if (completionsVisible.includes(completion.id)) {
                            setCompletionsVisible(
                              completionsVisible.filter(
                                (a) => a !== completion.id
                              )
                            );
                            return;
                          }
                          setCompletionsVisible([
                            ...completionsVisible,
                            completion.id,
                          ]);
                        }}
                      >
                        Notes
                      </button>
                      {completionsVisible.includes(completion.id) && (
                        <div>
                          <textarea
                            onChange={(e) =>
                              setApp(
                                produce(app, (draft) => {
                                  draft.completions[completion.id].notes =
                                    e.target.value;
                                })
                              )
                            }
                            value={completion.notes}
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
              <div>
                <div>Sessions</div>
                {task.sessions
                  .map((sid) => app.sessions[sid])
                  .map((session) => (
                    <div key={JSON.stringify(["session", task.id, session.id])}>
                      {session.start.toISOString()} -{" "}
                      {session.end?.toISOString() ?? ""} |{" "}
                      {msToHHMMSS(elapsedTimeSession(session))}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ))}
      <div
        style={{
          color:
            Object.values(app.tasks)
              .map((t) => t.estimate)
              .reduce((a, b) => a + b, 0) >
            16 * 3600 * 1000
              ? "red"
              : undefined,
        }}
      >
        {new Date(
          Object.values(app.tasks)
            .map((t) => t.estimate)
            .reduce((a, b) => a + b, 0)
        )
          .toISOString()
          .substring(11, 19)}
      </div>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
