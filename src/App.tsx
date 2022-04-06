import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import NotesIcon from "@mui/icons-material/Notes";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TimerIcon from "@mui/icons-material/Timer";
import { MobileDateTimePicker } from "@mui/lab";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Fab,
  Icon,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useReducer, useState } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import "./App.css";
import {
  Action,
  appReducer,
  AppState,
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

function Agenda(props: { app: AppState; dispatch: (action: Action) => void }) {
  const navigate = useNavigate();
  const { app, dispatch } = props;
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: "refresh" }), 1000);
    return () => clearInterval(interval);
  }, [app, dispatch]);
  return (
    <Box>
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
        onClick={() => navigate("/task/create")}
      >
        <AddIcon />
      </Fab>
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
    </Box>
  );
}

function CreateTask(props: { dispatch: (action: Action) => void }) {
  const [name, setName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const { dispatch } = props;
  const navigate = useNavigate();
  return (
    <Box>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            sx={{ mr: 1 }}
            onClick={() => navigate("/")}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            onClick={() => {
              dispatch({
                type: "createTask",
                props: {
                  completions: [],
                  estimate: estimate ?? 0,
                  name: name,
                  notes: "",
                  scheduleDate: scheduleDate,
                  sessions: [],
                },
              });
              navigate("/");
            }}
          >
            Save
          </Button>
        </Toolbar>
      </AppBar>
      <List>
        <ListItem>
          <TextField
            placeholder="Name"
            value={name}
            sx={{ flexGrow: 1 }}
            onChange={(e) => setName(e.target.value)}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <Icon sx={{ paddingRight: "16px" }}>
            <NotesIcon />
          </Icon>
          <TextField
            multiline
            placeholder="Notes"
            value={notes}
            sx={{ flexGrow: 1 }}
            onChange={(e) => setNotes(e.target.value)}
          />
        </ListItem>
        <ListItem>
          <Icon sx={{ paddingRight: "16px" }}>
            <ScheduleIcon />
          </Icon>
          <MobileDateTimePicker
            clearable={true}
            value={scheduleDate}
            onChange={setScheduleDate}
            renderInput={(params) => (
              <TextField {...params} sx={{ flexGrow: 1 }} placeholder="Date" />
            )}
          />
        </ListItem>
        <ListItem>
          <Icon sx={{ paddingRight: "16px" }}>
            <TimerIcon />
          </Icon>
          <TextField
            placeholder="Estimate"
            value={(estimate ?? 0) / 1000}
            sx={{ flexGrow: 1 }}
            onChange={(e) => {
              let parsed = parseInt(e.target.value);
              if (isNaN(parsed)) {
                parsed = 0;
              }
              setEstimate(parsed * 1000);
            }}
          />
        </ListItem>
      </List>
    </Box>
  );
}

function EditTask(props: {
  app: AppState;
  dispatch: (action: Action) => void;
}) {
  const [name, setName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [error, setError] = useState<Boolean>(false);
  const { app, dispatch } = props;
  const { id } = useParams<"id">();
  useEffect(() => {
    try {
      if (!id) {
        throw new Error("missing id parameter");
      }
      const parsed = parseInt(id, 10);
      if (isNaN(parsed)) {
        throw new Error("id is not a number");
      }
      const task = app.tasks[parseInt(id, 10)];
      setName(task.name);
      setNotes(task.notes);
      setEstimate(task.estimate);
      setScheduleDate(task.scheduleDate);
      setError(false);
    } catch {
      setError(true);
    }
  }, [id, app.tasks]);
  const navigate = useNavigate();
  if (error) {
    return <Box></Box>;
  }
  return (
    <Box>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            sx={{ mr: 1 }}
            onClick={() => navigate("..")}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            onClick={() => {
              dispatch({
                type: "editTask",
                id: parseInt(id!, 10),
                props: {
                  completions: [],
                  estimate: estimate ?? 0,
                  name: name,
                  notes: notes,
                  scheduleDate: scheduleDate,
                  sessions: [],
                },
              });
              navigate("..");
            }}
          >
            Save
          </Button>
        </Toolbar>
      </AppBar>
      <List>
        <ListItem>
          <TextField
            placeholder="Name"
            value={name}
            sx={{ flexGrow: 1 }}
            onChange={(e) => setName(e.target.value)}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <Icon sx={{ paddingRight: "16px" }}>
            <NotesIcon />
          </Icon>
          <TextField
            multiline
            placeholder="Notes"
            value={notes}
            sx={{ flexGrow: 1 }}
            onChange={(e) => setNotes(e.target.value)}
          />
        </ListItem>
        <ListItem>
          <Icon sx={{ paddingRight: "16px" }}>
            <ScheduleIcon />
          </Icon>
          <MobileDateTimePicker
            clearable={true}
            value={scheduleDate}
            onChange={setScheduleDate}
            renderInput={(params) => (
              <TextField {...params} sx={{ flexGrow: 1 }} placeholder="Date" />
            )}
          />
        </ListItem>
        <ListItem>
          <Icon sx={{ paddingRight: "16px" }}>
            <TimerIcon />
          </Icon>
          <TextField
            placeholder="Estimate"
            value={(estimate ?? 0) / 1000}
            sx={{ flexGrow: 1 }}
            onChange={(e) => {
              let parsed = parseInt(e.target.value);
              if (isNaN(parsed)) {
                parsed = 0;
              }
              setEstimate(parsed * 1000);
            }}
          />
        </ListItem>
      </List>
    </Box>
  );
}

function App() {
  const [app, dispatch] = useReducer(appReducer, initialState);
  return (
    <Paper sx={{ minHeight: "100vh" }}>
      <Routes>
        <Route path="/" element={<Agenda app={app} dispatch={dispatch} />} />
        <Route
          path="/task/create"
          element={<CreateTask dispatch={dispatch} />}
        />
        <Route
          path="/task/edit/:id"
          element={<EditTask app={app} dispatch={dispatch} />}
        />
      </Routes>
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
  const [historyVisible, setHistoryVisible] = useState<Boolean>(false);
  const task = app.tasks[id];
  const clockedIn = isClockedInTask(app, id);
  const overdue = elapsedTimeTask(app, id) > task.estimate;
  const navigate = useNavigate();
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
          <Box>Scheduled: {task.scheduleDate?.toISOString()}</Box>
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
          <Box>Estimate:&nbsp;{task.estimate / 1000}</Box>
          <button onClick={() => dispatch({ type: "closeTask", id: task.id })}>
            C
          </button>
          <button onClick={() => setHistoryVisible(!historyVisible)}>
            History
          </button>
          <button onClick={() => dispatch({ type: "deleteTask", id: task.id })}>
            X
          </button>
          <button onClick={() => navigate(`/task/edit/${task.id}`)}>
            Edit
          </button>
          <div>Notes:&nbsp;{task.notes}</div>
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
