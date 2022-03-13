import logo from "./logo.svg";
import "./App.css";

import { Task, elapsedTime } from "./Task";
import { useState, useEffect } from "react";

function App() {
  const [name, setName] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
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
        onClick={() => setTasks([...tasks, { name: name, sessions: [] }])}
      >
        Enter
      </button>
      {tasks.map((task, idx) => (
        <div key={idx}>
          <span
            style={{
              color:
                task.sessions.length > 0 && !task.sessions.slice(-1)[0].end
                  ? "red"
                  : undefined,
            }}
          >
            {task.name} | {Math.round(elapsedTime(task) / 1000)}
          </span>
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
              setTasks(tasks.filter((_, i) => i !== idx));
            }}
          >
            X
          </button>
        </div>
      ))}
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
