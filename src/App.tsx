import logo from "./logo.svg";
import "./App.css";

import { Task, elapsedTime } from "./Task";
import { useState, useEffect } from "react";

function App() {
  const [name, setName] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notesVisible, setNotesVisible] = useState<number[]>([]);
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks([...tasks]);
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks]);
  return (
    <div className="App">
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button
        onClick={() =>
          setTasks([
            ...tasks,
            {
              estimate: 0,
              name: name,
              notes: "",
              sessions: [],
            },
          ])
        }
      >
        Enter
      </button>
      {tasks.map((task, idx) => (
        <div key={idx}>
          <span
            style={{
              color:
                task.sessions.length > 0 && !task.sessions.slice(-1)[0].end
                  ? "green"
                  : undefined,
            }}
          >
            {task.name} |
          </span>
          &nbsp;
          <span
            style={{
              color: elapsedTime(task) > task.estimate ? "red" : undefined,
            }}
          >
            {Math.floor(elapsedTime(task) / 1000)}
          </span>
          &nbsp;|&nbsp;
          <input
            value={task.estimate / 1000}
            onChange={(e) => {
              let parsed = parseInt(e.target.value);
              if (isNaN(parsed)) {
                parsed = 0;
              }
              const newTasks = [...tasks];
              newTasks[idx].estimate = parsed * 1000;
              setTasks(newTasks);
            }}
          />
          <button
            onClick={() => {
              const newTasks = [...tasks];
              const currSessions = newTasks[idx].sessions;
              if (currSessions.length !== 0 && !currSessions.slice(-1)[0].end) {
                currSessions.slice(-1)[0].end = new Date();
                setTasks(newTasks);
                return;
              }
              newTasks
                .flatMap((t) => t.sessions.slice(-1))
                .filter((s) => !s.end)
                .forEach((s) => (s.end = new Date()));
              newTasks[idx].sessions.push({ start: new Date(), end: null });
              setTasks(newTasks);
            }}
          >
            T
          </button>
          <button
            onClick={() => {
              if (notesVisible.includes(idx)) {
                setNotesVisible(notesVisible.filter((i) => i !== idx));
                return;
              }
              setNotesVisible([...notesVisible, idx]);
            }}
          >
            N
          </button>
          <button
            onClick={() => {
              setTasks(tasks.filter((_, i) => i !== idx));
              setNotesVisible(notesVisible.filter((i) => i !== idx));
            }}
          >
            X
          </button>
          {notesVisible.includes(idx) && (
            <div>
              <textarea
                onChange={(e) => {
                  const newTasks = [...tasks];
                  newTasks[idx].notes = e.target.value;
                  setTasks(newTasks);
                }}
              >
                {task.notes}
              </textarea>
            </div>
          )}
        </div>
      ))}
      <div
        style={{
          color:
            tasks.map((t) => t.estimate).reduce((a, b) => a + b, 0) >
            16 * 3600 * 1000
              ? "red"
              : undefined,
        }}
      >
        {new Date(tasks.map((t) => t.estimate).reduce((a, b) => a + b, 0))
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
