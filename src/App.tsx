import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MenuIcon from "@mui/icons-material/Menu";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  AppBar,
  Box,
  Divider,
  Fab,
  IconButton,
  Input,
  List,
  ListItem,
  ListItemText,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useReducer, useState } from "react";
import "./App.css";
import {
  Action,
  AppState,
  appReducer,
  elapsedTimeSession,
  elapsedTimeTask,
  initialState,
  isClockedInTask,
  totalTimeTask,
} from "./AppState";

function msToHHMMSS(milliseconds: number) {
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / 60 / 1000) % 60);
  const hours = Math.floor((milliseconds / 3600 / 1000) % 24);
  const padZeroes = (v: number) => v.toString().padStart(2, "0");
  return `${padZeroes(hours)}:${padZeroes(minutes)}:${padZeroes(seconds)}`;
}

function App() {
  const [name, setName] = useState<string>("");
  const [app, dispatch] = useReducer(appReducer, initialState);
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: "refresh" }), 1000);
    return () => clearInterval(interval);
  }, [app]);
  return (
    <Paper sx={{ minHeight: "100vh" }}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="sticky">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Agenda
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "absolute",
          bottom: 16,
          right: 16,
        }}
      >
        <AddIcon />
      </Fab>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button
        onClick={() =>
          dispatch({
            type: "createTask",
            props: {
              completions: [],
              estimate: 0,
              name: name,
              notes: "",
              sessions: [],
            },
          })
        }
      >
        Enter
      </button>
      <List>
        {Object.values(app.tasks).map((task, i) => (
          <Box key={task.id}>
            {i !== 0 && <Divider component="li" />}
            <TaskViewItem id={task.id} app={app} dispatch={dispatch} />
          </Box>
        ))}
      </List>
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
    </Paper>
  );
}

function CompletionViewItem(props: {
  id: number;
  app: AppState;
  dispatch: (action: Action) => void;
}) {
  const { id, app, dispatch } = props;
  const [notesVisible, setNotesVisible] = useState<Boolean>(false);
  const completion = app.completions[id];
  return (
    <div>
      {completion.date.toISOString()}
      <button onClick={() => setNotesVisible(!notesVisible)}>Notes</button>
      {notesVisible && (
        <div>
          <textarea
            onChange={(e) =>
              dispatch({
                type: "editCompletionNotes",
                id: completion.id,
                value: e.target.value,
              })
            }
            value={completion.notes}
          />
        </div>
      )}
    </div>
  );
}

function TaskViewItem(props: {
  id: number;
  app: AppState;
  dispatch: (action: Action) => void;
}) {
  const { id, app, dispatch } = props;
  const [infoVisible, setInfoVisible] = useState<Boolean>(false);
  const [notesVisible, setNotesVisible] = useState<Boolean>(false);
  const [historyVisible, setHistoryVisible] = useState<Boolean>(false);
  const task = app.tasks[id];
  const clockedIn = isClockedInTask(app, id);
  const overdue = elapsedTimeTask(app, id) > task.estimate;
  return (
    <Box>
      <ListItem
        secondaryAction={
          <Box>
            <IconButton
              onClick={() => dispatch({ type: "toggleClockTask", id: task.id })}
            >
              {!clockedIn && <PlayArrowIcon />}
              {clockedIn && <PauseIcon />}
            </IconButton>
            <IconButton onClick={() => setInfoVisible(!infoVisible)}>
              {!infoVisible ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />}
            </IconButton>
          </Box>
        }
      >
        <ListItemText
          sx={{
            color: clockedIn ? "green" : undefined,
          }}
        >
          {task.name}
        </ListItemText>
      </ListItem>
      {infoVisible && (
        <Box component="li">
          <Box>
            Scheduled: {task.scheduleDate?.toISOString()}
            <IconButton
              onClick={() => dispatch({ type: "rescheduleTask", id: task.id })}
            >
              <CalendarMonthIcon />
            </IconButton>
          </Box>
          <Box>
            Time Taken:&nbsp;
            <Typography
              component="span"
              style={{
                color: overdue ? "red" : undefined,
              }}
            >
              {msToHHMMSS(elapsedTimeTask(app, task.id))}
            </Typography>
          </Box>
          <Box>
            Estimate:&nbsp;
            <Input
              value={msToHHMMSS(task.estimate)}
              onChange={(e) => {
                let parsed = parseInt(e.target.value);
                if (isNaN(parsed)) {
                  parsed = 0;
                }
                dispatch({
                  type: "estimateTask",
                  id: task.id,
                  length: parsed * 1000,
                });
              }}
            />
          </Box>
          <button onClick={() => setNotesVisible(!notesVisible)}>N</button>
          <button onClick={() => dispatch({ type: "closeTask", id: task.id })}>
            C
          </button>
          <button onClick={() => setHistoryVisible(!historyVisible)}>
            History
          </button>
          <button onClick={() => dispatch({ type: "deleteTask", id: task.id })}>
            X
          </button>
          {notesVisible && (
            <div>
              <textarea
                onChange={(e) =>
                  dispatch({
                    type: "editTaskNotes",
                    id: task.id,
                    value: e.target.value,
                  })
                }
              />
            </div>
          )}
          {historyVisible && (
            <div key={task.id}>
              <div>Total Time: {msToHHMMSS(totalTimeTask(app, task.id))}</div>
              <div>
                <div>Completions</div>
                {task.completions
                  .map((cid) => app.completions[cid])
                  .map((completion) => (
                    <CompletionViewItem
                      key={JSON.stringify([
                        "completion",
                        task.id,
                        completion.id,
                      ])}
                      id={completion.id}
                      app={app}
                      dispatch={dispatch}
                    />
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
        </Box>
      )}
    </Box>
  );
}

export default App;
