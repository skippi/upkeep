import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import AssistantOutlinedIcon from "@mui/icons-material/AssistantOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import HistoryIcon from "@mui/icons-material/History";
import MenuIcon from "@mui/icons-material/Menu";
import NotesIcon from "@mui/icons-material/Notes";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RepeatIcon from "@mui/icons-material/Repeat";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TimerIcon from "@mui/icons-material/Timer";
import ViewAgendaOutlinedIcon from "@mui/icons-material/ViewAgendaOutlined";
import { DatePicker, MobileDateTimePicker } from "@mui/lab";
import {
  AppBar,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Dialog,
  Divider,
  Drawer,
  Fab,
  Icon,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popover,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { byStartAsc, Fzf } from "fzf";
import moment from "moment";
import React, { useEffect, useReducer, useState } from "react";
import {
  Route,
  Routes,
  useLocation,
  useMatch,
  useNavigate,
  useParams,
} from "react-router-dom";
import "./App.css";
import {
  Action,
  appReducer,
  AppState,
  averageTimeMATask,
  elapsedTimeSession,
  elapsedTimeTask,
  initialState,
  isClockedInTask,
  RepeatDuration,
  Session,
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

function TaskListPage(props: {
  app: AppState;
  dispatch: (action: Action) => void;
}) {
  const navigate = useNavigate();
  const { app, dispatch } = props;
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: "refresh" }), 1000);
    return () => clearInterval(interval);
  }, [app, dispatch]);
  const [sortedIds, setSortedIds] = useState<number[]>([]);
  const tasks: Task[] = [];
  if (sortedIds.length === 0) {
    tasks.push(...Object.values(app.tasks));
    tasks.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    tasks.push(...sortedIds.map((tid) => app.tasks[tid]));
  }
  return (
    <Box>
      <MainNavBar title="Tasks" />
      <Box>
        <InputBase
          placeholder="Search..."
          onChange={(e) => {
            const query = e.target.value.trim();
            if (query.length === 0) {
              setSortedIds([]);
              return;
            }
            const fzf = new Fzf(tasks, {
              limit: 50,
              selector: (item) => `${item.name} ${item.notes}`,
              tiebreakers: [byStartAsc],
            });
            setSortedIds(fzf.find(query).map((result) => result.item.id));
          }}
        />
      </Box>
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
        {tasks.map((task, i) => (
          <Box key={task.id}>
            {i !== 0 && <Divider component="li" />}
            <TaskViewItem id={task.id} app={app} dispatch={dispatch} />
          </Box>
        ))}
      </List>
    </Box>
  );
}

function TaskCompletionListPage(props: { app: AppState }) {
  function CompletionListItem(props: { id: number }) {
    const [showDetails, setShowDetails] = useState<boolean>(false);
    const { id } = props;
    const completion = app.completions[id];
    return (
      <React.Fragment>
        <ListItem
          secondaryAction={
            <IconButton
              disabled={!completion.notes}
              onClick={() => setShowDetails(!showDetails)}
            >
              {!showDetails ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />}
            </IconButton>
          }
        >
          <ListItemText
            primary={moment(completion.date).format("MM-DD-YYYY HH:mm")}
          />
        </ListItem>
        {showDetails && <Box>{completion.notes}</Box>}
      </React.Fragment>
    );
  }
  const navigate = useNavigate();
  const { app } = props;
  const { id } = useParams<"id">();
  const [task, setTask] = useState<Task | null>(null);
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
    } catch {
      setTask(null);
    }
  }, [id, app.tasks]);
  const compList = task?.completions.map((tid) => app.completions[tid]) ?? [];
  compList.sort((a, b) => b.date.getTime() - a.date.getTime());
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
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>
      <List>
        {compList.map((completion, i) => (
          <React.Fragment key={completion.id}>
            {i !== 0 && <Divider component="li" />}
            <CompletionListItem id={completion.id} />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
}

function TimelinePage(props: { app: AppState }) {
  const [date, setDate] = useState<Date>(new Date());
  const [openDate, setOpenDate] = useState<boolean>(false);
  const { app } = props;
  const viewSessions = Object.values(app.tasks)
    .flatMap((task) =>
      task.sessions.map((sid): [Session, Task] => [app.sessions[sid], task])
    )
    .filter(
      ([s, _]) =>
        moment(s.start).isSameOrAfter(date, "day") &&
        moment(s.start).isBefore(moment(date).add(1, "days"), "day")
    );
  viewSessions.sort(
    ([a, _aTask], [b, _bTask]) => a.start.getTime() - b.start.getTime()
  );
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
          </React.Fragment>
        }
      />
      {Object.values(viewSessions).map(([session, task]) => (
        <Box key={JSON.stringify(["session", task.id, session.id])}>
          {moment(session.start).format("HH:mm")}-
          {moment(session.end ?? new Date()).format("HH:mm")} (
          {msToHHMMSS(elapsedTimeSession(session))}) {task.name}
        </Box>
      ))}
      <AgendaBottomNavigation />
    </React.Fragment>
  );
}

function AgendaBottomNavigation() {
  const navigate = useNavigate();
  return (
    <Paper
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        onChange={(_event, value) => navigate(value)}
      >
        <BottomNavigationAction
          value="/"
          label="Agenda"
          icon={<ViewAgendaOutlinedIcon />}
        />
        <BottomNavigationAction
          value="/timeline"
          label="Timeline"
          icon={<FormatListBulletedIcon />}
        />
      </BottomNavigation>
    </Paper>
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
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: "refresh" }), 1000);
    return () => clearInterval(interval);
  }, [app, dispatch]);
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
          bottom: 16 + 56,
          right: 16,
        }}
        onClick={() => navigate("/tasks/create")}
      >
        <AddIcon />
      </Fab>
      <AgendaBottomNavigation />
    </React.Fragment>
  );
}

function CreateTask(props: { dispatch: (action: Action) => void }) {
  const [name, setName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [repeat, setRepeat] = useState<RepeatDuration>([0, "days"]);
  const [repeatOpen, setRepeatOpen] = useState<boolean>(false);
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
                  notes: notes,
                  repeat: repeat,
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
        <ListItemButton onClick={() => setRepeatOpen(true)}>
          <ListItemIcon>
            <RepeatIcon />
          </ListItemIcon>
          <ListItemText
            primary={
              repeat[0] ? `Every ${repeat[0]} ${repeat[1]}` : `Does not repeat`
            }
          />
        </ListItemButton>
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
      <TaskRepeatDialog
        open={repeatOpen}
        value={repeat}
        onClose={() => setRepeatOpen(false)}
        onSelect={(value) => {
          setRepeat(value);
          setRepeatOpen(false);
        }}
      />
    </Box>
  );
}

function TaskDetailPage(props: { app: AppState }) {
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
    } catch {
      setTask(null);
    }
  }, [id, app.tasks]);
  const navigate = useNavigate();
  if (task == null) return <Box />;
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
            <ArrowBackIcon />
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
          <ListItemText sx={{ flexGrow: 1 }}>
            <Typography variant="h5">{task.name}</Typography>
          </ListItemText>
        </ListItem>
        <Divider component="li" />
        {task.notes && (
          <ListItem>
            <ListItemIcon>
              <NotesIcon />
            </ListItemIcon>
            <ListItemText primary={task.notes} sx={{ flexGrow: 1 }} />
          </ListItem>
        )}
        {task.scheduleDate && (
          <ListItem>
            <ListItemIcon>
              <ScheduleIcon />
            </ListItemIcon>
            <ListItemText
              primary={task.scheduleDate?.toISOString()}
              sx={{ flexGrow: 1 }}
            />
          </ListItem>
        )}
        <ListItem>
          <ListItemIcon>
            <RepeatIcon />
          </ListItemIcon>
          <ListItemText
            primary={
              task.repeat[0]
                ? `Every ${task.repeat[0]} ${task.repeat[1]}`
                : `Does not repeat`
            }
          />
        </ListItem>
        {task.estimate !== null && (
          <ListItem>
            <ListItemIcon>
              <TimerIcon />
            </ListItemIcon>
            <ListItemText
              primary="Estimate"
              secondary={task && msToHHMMSS(task.estimate)}
            />
          </ListItem>
        )}
        <ListItem>
          <ListItemIcon>
            <HistoryIcon />
          </ListItemIcon>
          <ListItemText
            primary="Calculated Estimate"
            secondary={task && `${msToHHMMSS(averageTimeMATask(app, task.id))}`}
          />
        </ListItem>
        <ListItemButton
          onClick={() => navigate(`/tasks/${task.id}/completions`)}
        >
          <ListItemIcon>
            <AssignmentTurnedInOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Completions" />
        </ListItemButton>
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
  const [repeat, setRepeat] = useState<RepeatDuration>([0, "days"]);
  const [repeatOpen, setRepeatOpen] = useState<boolean>(false);
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
      setRepeat(task.repeat);
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
                  repeat: repeat,
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
        <ListItemButton onClick={() => setRepeatOpen(true)}>
          <ListItemIcon>
            <RepeatIcon />
          </ListItemIcon>
          <ListItemText
            primary={
              repeat[0] ? `Every ${repeat[0]} ${repeat[1]}` : `Does not repeat`
            }
          />
        </ListItemButton>
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
      <TaskRepeatDialog
        open={repeatOpen}
        value={repeat}
        onClose={() => setRepeatOpen(false)}
        onSelect={(value) => {
          setRepeat(value);
          setRepeatOpen(false);
        }}
      />
    </Box>
  );
}

function TaskRepeatDialog(props: {
  onClose: () => void;
  onSelect: (value: RepeatDuration) => void;
  open: boolean;
  value: RepeatDuration;
}) {
  const { onClose, onSelect, open, value } = props;
  return (
    <Dialog open={open} onClose={onClose}>
      <List>
        <ListItemButton
          onClick={() => onSelect([0, "days"])}
          selected={!value[0]}
        >
          <ListItemText primary="Does not exist" />
        </ListItemButton>
        <ListItemButton
          onClick={() => onSelect([1, "days"])}
          selected={value?.toString() === [1, "days"].toString()}
        >
          <ListItemText primary="Every day" />
        </ListItemButton>
        <ListItemButton
          onClick={() => onSelect([1, "weeks"])}
          selected={value?.toString() === [1, "weeks"].toString()}
        >
          <ListItemText primary="Every week" />
        </ListItemButton>
        <ListItemButton
          onClick={() => onSelect([1, "months"])}
          selected={value?.toString() === [1, "months"].toString()}
        >
          <ListItemText primary="Every month" />
        </ListItemButton>
      </List>
    </Dialog>
  );
}

function loadLocalState(): AppState | null {
  const data = localStorage.getItem("app");
  if (!data) return null;
  try {
    const app = JSON.parse(data) as AppState;
    app.touched = new Date(app.touched);
    for (const task of Object.values(app.tasks)) {
      if (task.scheduleDate != null) {
        task.scheduleDate = new Date(task.scheduleDate);
      }
    }
    for (const session of Object.values(app.sessions)) {
      session.start = new Date(session.start);
      if (session.end != null) {
        session.end = new Date(session.end);
      }
    }
    for (const comp of Object.values(app.completions)) {
      comp.date = new Date(comp.date);
    }
    return app;
  } catch (SyntaxError) {
    return null;
  }
}

function App() {
  const [app, dispatch] = useReducer(
    appReducer,
    loadLocalState() ?? initialState
  );
  const location = useLocation();
  useEffect(() => {
    localStorage.setItem("app", JSON.stringify(app));
  }, [app, location]);
  return (
    <Paper sx={{ minHeight: "100vh" }}>
      <Routes>
        <Route path="/" element={<Agenda app={app} dispatch={dispatch} />} />
        <Route path="/timeline" element={<TimelinePage app={app} />} />
        <Route
          path="/tasks"
          element={<TaskListPage app={app} dispatch={dispatch} />}
        />
        <Route
          path="/tasks/create"
          element={<CreateTask dispatch={dispatch} />}
        />
        <Route path="/tasks/:id/" element={<TaskDetailPage app={app} />} />
        <Route
          path="/tasks/:id/completions"
          element={<TaskCompletionListPage app={app} />}
        />
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
          onClick={() => navigate(`/tasks/${task.id}`)}
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
          <button onClick={() => dispatch({ type: "closeTask", id: task.id })}>
            C
          </button>
          <button onClick={() => setHistoryVisible(!historyVisible)}>
            History
          </button>
          <button onClick={() => dispatch({ type: "deleteTask", id: task.id })}>
            X
          </button>
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
            </div>
          )}
        </Box>
      )}
    </Box>
  );
}

export default App;
