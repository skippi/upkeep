import logo from "./logo.svg";
import "./App.css";

import { useState } from "react";

function App() {
  const [name, setName] = useState<string>("");
  const [tasks, setTasks] = useState<string[]>([]);
  return (
    <div className="App">
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => setTasks([...tasks, name])}>Enter</button>
      {tasks.map((task, idx) => (
        <div>
          <span key={idx}>{task}</span>
          <button onClick={() => setTasks(tasks.filter((_, i) => i !== idx))}>X</button>
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
