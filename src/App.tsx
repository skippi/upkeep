import { useEffect, useState } from "react";
import "./App.css";
import logo from "./logo.svg";
import { clockOut, close, elapsedTime, isClockedIn, Task } from "./Task";


function toggleClock(tasks: Task[], idx: number) {
  if (isClockedIn(tasks[idx])) {
    clockOut(tasks[idx]);
    return;
  }
  tasks.forEach(clockOut);
  tasks[idx].sessions.push({ start: new Date(), end: null });
}

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
              completions: [],
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
              color: isClockedIn(task) ? "green" : undefined,
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
              toggleClock(newTasks, idx);
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
              const newTasks = [...tasks];
              close(newTasks[idx]);
              setTasks(newTasks);
            }}
          >
            C
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
