import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import AssistantOutlinedIcon from "@mui/icons-material/AssistantOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import MenuIcon from "@mui/icons-material/Menu";
import NotesIcon from "@mui/icons-material/Notes";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TimerIcon from "@mui/icons-material/Timer";
import ViewAgendaOutlinedIcon from "@mui/icons-material/ViewAgendaOutlined";
import { DatePicker, MobileDateTimePicker } from "@mui/lab";
import {
  AppBar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  Fab,
  Icon,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Popover,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import moment from "moment";
import React, { useEffect, useReducer, useState } from "react";
import {
  Route,
  Routes,
  useMatch,
  useNavigate,
  useParams,
} from "react-router-dom";
import "./App.css";
import {
  Action,
  appReducer,
  AppState,
  elapsedTimeSession,
  elapsedTimeTask,
  initialState,
  isClockedInTask,
  Task,
  totalTimeTask,
} from "./AppState";

function msToHHMMSS(milliseconds: number) {
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / 60 / 1000) % 60);
  const hours = Math.floor((milliseconds / 3600 / 1000) % 24);
  const padZeroes = (v: number) => v.toString().padStart(2, "0");
  return `${padZeroes(hours)}:${padZeroes(minutes)}:${padZeroes(seconds)}`;
}

function MainNavBar(props: { title?: string; titleNode?: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const { title, titleNode } = props;
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
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          {title && (
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
          )}
          {titleNode}
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(!drawerOpen)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => setDrawerOpen(false)}
          onKeyDown={() => setDrawerOpen(false)}
        >
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              time-app
            </Typography>
          </Toolbar>
          <Divider />
          <List>
            <ListItem
              button
              onClick={() => navigate("/")}
              selected={!!useMatch("/")}
            >
              <ListItemIcon>
                <ViewAgendaOutlinedIcon />
              </ListItemIcon>
              <ListItemText>Agenda</ListItemText>
            </ListItem>
            <ListItem
              button
              onClick={() => navigate("/tasks")}
              selected={!!useMatch("/tasks")}
            >
              <ListItemIcon>
                <FormatListBulletedIcon />
              </ListItemIcon>
              <ListItemText>Tasks</ListItemText>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}

function TaskList(props: {
  app: AppState;
  dispatch: (action: Action) => void;
}) {
  const navigate = useNavigate();
  const { app, dispatch } = props;
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: "refresh" }), 1000);
    return () => clearInterval(interval);
  }, [app, dispatch]);
  return (
    <Box>
      <MainNavBar title="Tasks" />
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "absolute",
          bottom: 16,
          right: 16,
        }}
        onClick={() => navigate("/tasks/create")}
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
    </Box>
  );
}

function Agenda(props: { app: AppState; dispatch: (action: Action) => void }) {
  const [date, setDate] = useState<Date>(new Date());
  const [openDate, setOpenDate] = useState<boolean>(false);
  const [assistItems, setAssistItems] = useState<string[]>([]);
  const [assistAnchor, setAssistAnchor] = useState<HTMLButtonElement | null>(
    null
  );
  const navigate = useNavigate();
  const { app, dispatch } = props;
  useEffect(() => {
    const items = [];
    const agendaTotalTime = Object.values(app.tasks)
      .filter((task) => moment(task.scheduleDate).isSame(moment(date), "date"))
      .map((task) => task.estimate)
      .reduce((a, b) => a + b, 0);
    if (agendaTotalTime > 16 * 3600 * 1000) {
      items.push(
        `Agenda estimation exceeds 24 hours. (${moment
          .duration(agendaTotalTime)
          .humanize()})`
      );
    }
    setAssistItems(items);
  }, [date, app.tasks]);
  return (
    <React.Fragment>
      <MainNavBar
        titleNode={
          <React.Fragment>
            <Typography sx={{ flexGrow: 1 }} variant="h6" component="span">
              {moment(date).format("MMM DD")}
              <IconButton
                edge="start"
                sx={{ padding: 0, marginLeft: 0 }}
                onClick={() => setOpenDate(!openDate)}
              >
                <ArrowDropDownIcon />
              </IconButton>
              <DatePicker
                value={date}
                open={openDate}
                onChange={(newDate) => setDate(newDate ?? new Date())}
                onClose={() => setOpenDate(false)}
                renderInput={() => <div></div>}
              />
            </Typography>
            <IconButton
              color="inherit"
              onClick={(e) => {
                if (assistItems.length === 0) return;
                setAssistAnchor(e.currentTarget);
              }}
            >
              <Badge color="secondary" badgeContent={assistItems.length}>
                <AssistantOutlinedIcon />
              </Badge>
            </IconButton>
            <Popover
              open={!!assistAnchor}
              anchorEl={assistAnchor}
              onClose={() => setAssistAnchor(null)}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <List>
                <ListItem>
                  {assistItems.map((item, i) => (
                    <ListItemText key={i}>{item}</ListItemText>
                  ))}
                </ListItem>
              </List>
            </Popover>
          </React.Fragment>
        }
      />
      <List>
        {Object.values(app.tasks)
          .filter((task) =>
            moment(task.scheduleDate).isSame(moment(date), "date")
          )
          .map((task, i) => (
            <Box key={task.id}>
              {i !== 0 && <Divider component="li" />}
              <TaskViewItem id={task.id} app={app} dispatch={dispatch} />
            </Box>
          ))}
      </List>
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "absolute",
          bottom: 16,
          right: 16,
        }}
        onClick={() => navigate("/tasks/create")}
      >
        <AddIcon />
      </Fab>
    </React.Fragment>
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
            onClick={() => navigate(-1)}
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
              navigate(-1);
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

function ViewTask(props: { app: AppState }) {
  const [error, setError] = useState<Boolean>(false);
  const [task, setTask] = useState<Task | null>(null);
  const { id } = useParams<"id">();
  const { app } = props;
  useEffect(() => {
    try {
      if (!id) {
        throw new Error("missing id parameter");
      }
      const parsed = parseInt(id, 10);
      if (isNaN(parsed)) {
        throw new Error("id is not a number");
      }
      setTask(app.tasks[parseInt(id, 10)]);
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
            onClick={() => navigate(-1)}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            onClick={() => navigate(`/tasks/${id}/edit`)}
          >
            <EditIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <List>
        <ListItem>
          <Typography sx={{ flexGrow: 1 }}>{task?.name}</Typography>
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <Icon sx={{ paddingRight: "16px" }}>
            <NotesIcon />
          </Icon>
          <Typography sx={{ flexGrow: 1 }}>{task?.notes}</Typography>
        </ListItem>
        <ListItem>
          <Icon sx={{ paddingRight: "16px" }}>
            <ScheduleIcon />
          </Icon>
          <Typography sx={{ flexGrow: 1 }}>
            {task?.scheduleDate?.toISOString()}
          </Typography>
        </ListItem>
        <ListItem>
          <Icon sx={{ paddingRight: "16px" }}>
            <TimerIcon />
          </Icon>
          <Typography sx={{ flexGrow: 1 }}>
            {(task?.estimate ?? 0) / 1000}
          </Typography>
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
            onClick={() => navigate(-1)}
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
              navigate(-1);
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
          path="/tasks"
          element={<TaskList app={app} dispatch={dispatch} />}
        />
        <Route
          path="/tasks/create"
          element={<CreateTask dispatch={dispatch} />}
        />
        <Route path="/tasks/:id/" element={<ViewTask app={app} />} />
        <Route
          path="/tasks/:id/edit"
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
        onClick={() => navigate(`/tasks/${task.id}`)}
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
