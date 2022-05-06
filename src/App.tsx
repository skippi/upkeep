import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArticleIcon from "@mui/icons-material/Article";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import AssistantOutlinedIcon from "@mui/icons-material/AssistantOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
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
import TodayIcon from "@mui/icons-material/Today";
import ViewAgendaOutlinedIcon from "@mui/icons-material/ViewAgendaOutlined";
import { DatePicker, MobileDateTimePicker } from "@mui/lab";
import {
  AppBar,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  CssBaseline,
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
  Snackbar,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { byStartAsc, Fzf } from "fzf";
import moment from "moment";
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  Route,
  Routes,
  useLocation,
  useMatch,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useEffectOnce, useEventListener, useInterval } from "usehooks-ts";
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

function MainNavBar(props: { title?: string; children?: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const { title, children } = props;
  return (
    <React.Fragment>
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
          {children}
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <Toolbar>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1 }}
              onClick={() => navigate("/")}
            >
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
    </React.Fragment>
  );
}

function TaskListPage(props: {
  app: AppState;
  dispatch: (action: Action) => void;
}) {
  const navigate = useNavigate();
  const { app, dispatch } = props;
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  useInterval(forceUpdate, 1000);
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
          position: "fixed",
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

function TimelinePage(props: {
  app: AppState;
  dispatch: (action: Action) => void;
}) {
  const [openDate, setOpenDate] = useState<boolean>(false);
  const { app, dispatch } = props;
  const date = app.ui.agendaDate;
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
      <MainNavBar title={moment(date).format("MMM DD")}>
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
          onChange={(newDate) =>
            dispatch({
              type: "selectAgendaDate",
              date: newDate ?? new Date(),
            })
          }
          onClose={() => setOpenDate(false)}
          renderInput={() => <div></div>}
        />
      </MainNavBar>
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
  const location = useLocation();
  return (
    <Paper
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={location.pathname}
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
        <BottomNavigationAction
          value="/analytics"
          label="Analytics"
          icon={<AssessmentOutlinedIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
}

function AgendaPage(props: {
  app: AppState;
  dispatch: (action: Action) => void;
}) {
  const [openDate, setOpenDate] = useState<boolean>(false);
  const [assistItems, setAssistItems] = useState<string[]>([]);
  const [assistAnchor, setAssistAnchor] = useState<HTMLButtonElement | null>(
    null
  );
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [deletedTasks, setDeletedTasks] = useState<number[]>([]);
  const bind = useDrag(({ swipe: [sx, _sy] }) => {
    if (sx < 0) {
      dispatch({
        type: "selectAgendaDate",
        date: moment(date).add(1, "days").toDate(),
      });
    } else if (sx > 0) {
      dispatch({
        type: "selectAgendaDate",
        date: moment(date).subtract(1, "days").toDate(),
      });
    }
  });
  const navigate = useNavigate();
  const { app, dispatch } = props;
  const date = app.ui.agendaDate;
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
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  useInterval(forceUpdate, 1000);
  const tasks = Object.values(app.tasks)
    .filter((task) => !task.deleted && task.scheduleDate)
    .filter((task) => {
      let iterDate = moment(task.scheduleDate);
      if (task.repeat[0]) {
        while (iterDate.isBefore(moment(date), "day")) {
          iterDate = iterDate.add(...task.repeat);
        }
      }
      if (iterDate.isSame(date, "day")) {
        return true;
      }
      return (
        moment(app.ui.agendaDate).isSame(moment(), "date") &&
        moment(task.scheduleDate).isBefore(moment(date), "date")
      );
    });
  if (mode === "edit") {
    return (
      <AgendaBulkEditView
        app={app}
        dispatch={dispatch}
        taskIds={tasks.map((t) => t.id)}
        onExit={() => setMode("view")}
        onBulkDelete={(deletedIds) => {
          setDeletedTasks(deletedIds);
          setMode("view");
        }}
      />
    );
  }
  return (
    <React.Fragment>
      <MainNavBar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, touchAction: "pan-y", userSelect: "none" }}
          {...bind()}
        >
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
            onChange={(newDate) =>
              dispatch({
                type: "selectAgendaDate",
                date: newDate ?? new Date(),
              })
            }
            onClose={() => setOpenDate(false)}
            renderInput={() => <div></div>}
          />
        </Typography>
        <IconButton
          color="inherit"
          disabled={moment(date).isSame(moment(), "days")}
          onClick={() =>
            dispatch({
              type: "selectAgendaDate",
              date: new Date(),
            })
          }
        >
          <TodayIcon />
        </IconButton>
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
      </MainNavBar>
      <List>
        {tasks.map((task, i) => (
          <React.Fragment key={task.id}>
            {i !== 0 && <Divider component="li" />}
            <TaskViewItem
              id={task.id}
              app={app}
              dispatch={dispatch}
              onLongPress={() => setMode("edit")}
              onSwipeLeft={() => {
                dispatch({ type: "softDeleteTask", id: task.id });
                setDeletedTasks([task.id]);
              }}
            />
          </React.Fragment>
        ))}
      </List>
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: 16 + 56,
          right: 16,
        }}
        onClick={() =>
          navigate(
            `/tasks/create?scheduleDate=${moment(date)
              .startOf("day")
              .toISOString()}`
          )
        }
      >
        <AddIcon />
      </Fab>
      <Snackbar
        open={deletedTasks.length !== 0}
        autoHideDuration={6000}
        message={`${deletedTasks.length} tasks deleted`}
        onClose={() => setDeletedTasks([])}
        action={
          <Button
            color="inherit"
            size="small"
            onTouchEnd={() => {
              for (const tid of deletedTasks) {
                dispatch({ type: "restoreTask", id: tid });
              }
              setDeletedTasks([]);
            }}
          >
            Undo
          </Button>
        }
        sx={{ bottom: { xs: 140, sm: 0 } }}
      />
      <AgendaBottomNavigation />
    </React.Fragment>
  );
}

function AgendaAnalyticsPage(props: {
  app: AppState;
  dispatch: (action: Action) => void;
}) {
  const [openDate, setOpenDate] = useState<boolean>(false);
  const { app, dispatch } = props;
  const date = app.ui.agendaDate;
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  useInterval(forceUpdate, 1000);
  const viewItems = Object.values(app.tasks)
    .filter((task) => task.sessions.length)
    .map((task) => {
      const timeSpent: number = task.sessions
        .map((sid) => app.sessions[sid])
        .filter(
          (s) =>
            moment(s.start).isSameOrAfter(date, "day") &&
            moment(s.start).isBefore(moment(date).add(1, "days"), "day")
        )
        .map(elapsedTimeSession)
        .reduce((acc, time) => acc + time, 0);
      return {
        name: task.name,
        timeSpent: timeSpent,
      };
    });
  viewItems.sort((a, b) => b.timeSpent - a.timeSpent);
  return (
    <React.Fragment>
      <MainNavBar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
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
            onChange={(newDate) =>
              dispatch({
                type: "selectAgendaDate",
                date: newDate ?? new Date(),
              })
            }
            onClose={() => setOpenDate(false)}
            renderInput={() => <div></div>}
          />
        </Typography>
      </MainNavBar>
      {viewItems.map((item, i) => (
        <Box key={i}>
          {item.name} {moment.utc(item.timeSpent).format("HH:mm:ss")}{" "}
          {(
            (item.timeSpent / moment.duration(1, "days").as("milliseconds")) *
            100
          ).toFixed(2)}
          %
        </Box>
      ))}
      <AgendaBottomNavigation />
    </React.Fragment>
  );
}

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function CreateTask(props: { dispatch: (action: Action) => void }) {
  const query = useQuery();
  const [name, setName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [repeat, setRepeat] = useState<RepeatDuration>([0, "days"]);
  const [repeatOpen, setRepeatOpen] = useState<boolean>(false);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(
    (() => {
      const param = query.get("scheduleDate");
      if (!param) {
        return null;
      }
      return new Date(param);
    })()
  );
  const { dispatch } = props;
  const navigate = useNavigate();
  const saveForm = () => {
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
  };
  useEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape") navigate(-1);
    if (event.ctrlKey && event.key === "s") {
      event.preventDefault();
      saveForm();
    }
  });
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
          <Button type="submit" onClick={saveForm}>
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
  useEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape") navigate(-1);
  });
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
  const saveForm = () => {
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
  };
  useEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape") navigate(-1);
    if (event.ctrlKey && event.key === "s") {
      event.preventDefault();
      saveForm();
    }
  });
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
          <Button onClick={saveForm}>Save</Button>
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
  useEffectOnce(() => {
    if (moment().diff(moment(app.touched), "hours") >= 4) {
      dispatch({ type: "selectAgendaDate", date: new Date() });
    }
  });
  useEventListener("storage", () => {
    const storedApp = loadLocalState();
    if (storedApp === null) return;
    if (!moment(storedApp.touched).isAfter(moment(app.touched))) return;
    dispatch({ type: "setApp", app: storedApp });
  });
  useEventListener("contextmenu", (event) => event.preventDefault());
  return (
    <Paper sx={{ minHeight: "100vh" }}>
      <CssBaseline />
      <Routes>
        <Route
          path="/"
          element={<AgendaPage app={app} dispatch={dispatch} />}
        />
        <Route
          path="/timeline"
          element={<TimelinePage app={app} dispatch={dispatch} />}
        />
        <Route
          path="/analytics"
          element={<AgendaAnalyticsPage app={app} dispatch={dispatch} />}
        />
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

function AgendaBulkEditView(props: {
  app: AppState;
  dispatch: (action: Action) => void;
  taskIds: number[];
  onBulkDelete: (deletedIds: number[]) => any;
  onExit: () => any;
}) {
  const BulkEditListItem = (props: {
    task: Task;
    selected: boolean;
    onToggle: (taskId: number, selected: boolean) => void;
  }) => {
    const { task, selected, onToggle } = props;
    return (
      <ListItem
        selected={selected}
        onClick={(_) => {
          onToggle(task.id, !selected);
        }}
      >
        <ListItemIcon>
          {selected ? <CheckIcon /> : <ArticleIcon />}
        </ListItemIcon>
        <ListItemText primary={task.name} sx={{ userSelect: "none" }} />
      </ListItem>
    );
  };
  const { app, dispatch, taskIds, onBulkDelete, onExit } = props;
  const [selection, setSelection] = useState<number[]>([]);
  const tasks = taskIds.map((tid) => app.tasks[tid]);
  return (
    <Box>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            sx={{ mr: 1 }}
            onClick={onExit}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            disabled={selection.length === 0}
            onClick={() => {
              for (const tid of selection) {
                dispatch({ type: "softDeleteTask", id: tid });
              }
              onBulkDelete(selection);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <List>
        {tasks.map((task, i) => (
          <BulkEditListItem
            key={i}
            task={task}
            selected={selection.includes(task.id)}
            onToggle={(tid, selected) => {
              const newSelection = selection.filter((t) => t !== tid);
              if (selected) {
                newSelection.push(tid);
              }
              setSelection(newSelection);
            }}
          />
        ))}
      </List>
    </Box>
  );
}

function TaskViewItem(props: {
  id: number;
  app: AppState;
  dispatch: (action: Action) => void;
  onLongPress?: () => any;
  onSwipeLeft?: () => any;
}) {
  const { id, app, dispatch, onLongPress, onSwipeLeft } = props;
  const [infoVisible, setInfoVisible] = useState<Boolean>(false);
  const [historyVisible, setHistoryVisible] = useState<Boolean>(false);
  const [style, api] = useSpring(() => ({ x: 0 }));
  const timerId = useRef<NodeJS.Timeout | null>(null);
  const bind = useDrag(
    ({
      first,
      last,
      active,
      distance: [dx, dy],
      movement: [mx, _my],
      swipe: [sx, _sy],
    }) => {
      if (first && onLongPress) {
        timerId.current = setTimeout(onLongPress, 650);
      }
      if (last && timerId.current) {
        clearTimeout(timerId.current);
        timerId.current = null;
      }
      if (dx + dy > 10 && timerId.current) {
        clearTimeout(timerId.current);
        timerId.current = null;
      }
      if (sx) {
        if (timerId.current) {
          clearTimeout(timerId.current);
          timerId.current = null;
        }
        if (sx < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
      api.start({
        x: active ? Math.min(Math.max(mx, -65), 65) : 0,
        immediate: active,
      });
    }
  );
  const task = app.tasks[id];
  const clockedIn = isClockedInTask(app, id);
  const overdue = elapsedTimeTask(app, id) > task.estimate;
  const navigate = useNavigate();
  const AnimatedListItem = animated(ListItem);
  const secondaryString = (() => {
    const timeSpent = totalTimeTask(app, task.id);
    let result = moment.utc(timeSpent).format("m:ss");
    if (task.estimate) {
      result += `/${moment.utc(task.estimate).format("m:ss")}`;
    }
    const daysOverdue = moment(app.ui.agendaDate).diff(
      moment(task.scheduleDate),
      "days"
    );
    if (moment().isSame(app.ui.agendaDate, "days") && daysOverdue > 0) {
      result += ` [ -${daysOverdue} days ]`;
    }
    return result;
  })();
  return (
    <Box>
      <AnimatedListItem
        style={style}
        secondaryAction={
          <React.Fragment>
            <IconButton
              onClick={() => dispatch({ type: "toggleClockTask", id: task.id })}
            >
              {!clockedIn && <PlayArrowIcon />}
              {clockedIn && <PauseIcon />}
            </IconButton>
            <IconButton onClick={() => setInfoVisible(!infoVisible)}>
              {!infoVisible ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />}
            </IconButton>
          </React.Fragment>
        }
      >
        <ListItemText
          onClick={() => navigate(`/tasks/${task.id}`)}
          {...bind()}
          primary={task.name}
          secondary={secondaryString}
          sx={{
            color: clockedIn ? "green" : undefined,
            touchAction: "pan-y",
            userSelect: "none",
          }}
        />
      </AnimatedListItem>
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
