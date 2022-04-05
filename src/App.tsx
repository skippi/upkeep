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
  appReducer,
  elapsedTimeSession,
  elapsedTimeTask,
  initialState,
  isClockedInTask,
  totalTimeTask,
} from "./AppState";

function msToHHMMSS(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(milliseconds / 60 / 1000);
  const hours = Math.floor(milliseconds / 3600 / 1000);
  const padZeroes = (v: number) => v.toString().padStart(2, "0");
  return `${padZeroes(hours)}:${padZeroes(minutes)}:${padZeroes(seconds)}`;
}

function App() {
  const [name, setName] = useState<string>("");
  const [app, dispatch] = useReducer(appReducer, initialState);
  const [taskInfoVisible, setTaskInfoVisible] = useState<number[]>([]);
  const [notesVisible, setNotesVisible] = useState<number[]>([]);
  const [historyVisible, setHistoryVisible] = useState<number[]>([]);
  const [completionsVisible, setCompletionsVisible] = useState<number[]>([]);
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
            <ListItem
              secondaryAction={
                <Box>
                  <IconButton
                    onClick={() =>
                      dispatch({ type: "toggleClockTask", id: task.id })
                    }
                  >
                    {!isClockedInTask(app, task.id) && <PlayArrowIcon />}
                    {isClockedInTask(app, task.id) && <PauseIcon />}
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      if (taskInfoVisible.includes(task.id)) {
                        setTaskInfoVisible(
                          taskInfoVisible.filter((i) => i !== task.id)
                        );
                        return;
                      }
                      setTaskInfoVisible([...taskInfoVisible, task.id]);
                    }}
                  >
                    {!taskInfoVisible.includes(task.id) ? (
                      <ArrowDropDownIcon />
                    ) : (
                      <ArrowDropUpIcon />
                    )}
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                sx={{
                  color: isClockedInTask(app, task.id) ? "green" : undefined,
                }}
              >
                {task.name}
              </ListItemText>
            </ListItem>
            {taskInfoVisible.includes(task.id) && (
              <Box component="li">
                <Box>
                  Scheduled: {task.scheduleDate?.toISOString()}
                  <IconButton
                    onClick={() =>
                      dispatch({ type: "rescheduleTask", id: task.id })
                    }
                  >
                    <CalendarMonthIcon />
                  </IconButton>
                </Box>
                <Box>
                  Time Taken:&nbsp;
                  <Typography
                    component="span"
                    style={{
                      color:
                        elapsedTimeTask(app, task.id) > task.estimate
                          ? "red"
                          : undefined,
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
                <button
                  onClick={() => {
                    if (notesVisible.includes(task.id)) {
                      setNotesVisible(
                        notesVisible.filter((i) => i !== task.id)
                      );
                      return;
                    }
                    setNotesVisible([...notesVisible, task.id]);
                  }}
                >
                  N
                </button>
                <button
                  onClick={() => dispatch({ type: "closeTask", id: task.id })}
                >
                  C
                </button>
                <button
                  onClick={() => {
                    if (historyVisible.includes(task.id)) {
                      setHistoryVisible(
                        historyVisible.filter((i) => i !== task.id)
                      );
                      return;
                    }
                    setHistoryVisible([...historyVisible, task.id]);
                  }}
                >
                  History
                </button>
                <button
                  onClick={() => {
                    dispatch({ type: "deleteTask", id: task.id });
                    setNotesVisible(notesVisible.filter((i) => i !== task.id));
                  }}
                >
                  X
                </button>
                {notesVisible.includes(task.id) && (
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
                {historyVisible.includes(task.id) && (
                  <div key={task.id}>
                    <div>
                      Total Time: {msToHHMMSS(totalTimeTask(app, task.id))}
                    </div>
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
                                if (
                                  completionsVisible.includes(completion.id)
                                ) {
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
                        ))}
                    </div>
                    <div>
                      <div>Sessions</div>
                      {task.sessions
                        .map((sid) => app.sessions[sid])
                        .map((session) => (
                          <div
                            key={JSON.stringify([
                              "session",
                              task.id,
                              session.id,
                            ])}
                          >
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

export default App;
