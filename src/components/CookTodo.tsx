import React, { useState, useEffect, useRef } from "react";
import { Meal } from "../types";
import { Play, Pause, RotateCcw, CheckSquare, Square, ChefHat, BellRing, Trophy, Clock } from "lucide-react";

interface CookTodoProps {
  meal: Meal | null;
}

export default function CookTodo({ meal }: CookTodoProps) {
  // Checklist checked states: Record<step_num, boolean>
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  
  // Timer active state values
  const [activeTimerStep, setActiveTimerStep] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const originalDurationRef = useRef<number>(0);

  // When meal changes, reset checked list and stop any running timers
  useEffect(() => {
    setCheckedSteps({});
    stopTimer();
    setActiveTimerStep(null);
    setTimeRemaining(0);
  }, [meal]);

  // Handle countdown interval tick
  useEffect(() => {
    if (timerRunning && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            triggerAlarmFeedback();
            stopTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      stopInterval();
    }

    return () => stopInterval();
  }, [timerRunning, timeRemaining]);

  const stopInterval = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const stopTimer = () => {
    setTimerRunning(false);
    stopInterval();
  };

  // Synthesizes a high-frequency culinary alarm chime using standard Web Audio API
  const triggerAlarmFeedback = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch notification peak A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("Alarm sound played visually instead of audio due to user interaction blocks.", e);
    }
  };

  if (!meal) {
    return (
      <div
        id="cook-todo-empty"
        className="rounded-2xl p-6 flex flex-col items-center justify-center text-center py-10 gap-3 glass-panel"
      >
        <ChefHat className="w-10 h-10 text-slate-505 animate-bounce" />
        <span className="text-slate-300 font-bold text-sm">Interactive Kitchen Workspace</span>
        <span className="text-xs text-slate-500 max-w-xs">
          Select or formulate any daily meal menu item to load the cooking checklist and step timer modules.
        </span>
      </div>
    );
  }

  const handleToggleCheck = (stepNum: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  const startTimer = (stepNum: number, duration: number) => {
    setActiveTimerStep(stepNum);
    setTimeRemaining(duration);
    originalDurationRef.current = duration;
    setTimerRunning(true);
  };

  const togglePauseResume = () => {
    setTimerRunning((prev) => !prev);
  };

  const resetActiveTimer = () => {
    setTimeRemaining(originalDurationRef.current);
    setTimerRunning(false);
  };

  const formatTimerString = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const allCompleted = meal.instructions.length > 0 && 
    meal.instructions.every((item) => checkedSteps[item.step]);

  return (
    <div
      id="cook-todo-active"
      className="rounded-2xl p-6 flex flex-col gap-5 glass-panel"
    >
      {/* Title block */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
            <ChefHat className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-white tracking-tight">
              Cooking Checklist
            </h3>
            <span className="text-[10px] text-violet-400 font-mono uppercase tracking-widest font-bold">
              Active: {meal.recipeName}
            </span>
          </div>
        </div>
        {allCompleted && (
          <div className="flex items-center gap-1 text-[11px] font-mono whitespace-nowrap bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-bold shadow-md animate-pulse">
            <Trophy className="w-3.5 h-3.5" /> Ready!
          </div>
        )}
      </div>

      {/* Floating active cooking step timer box if running */}
      {activeTimerStep !== null && (
        <div id="active-step-timer" className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/30 flex justify-between items-center gap-4 animate-fade-in shadow-md shadow-violet-500/5">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${timeRemaining === 0 ? "bg-emerald-500/20 border-emerald-500/40 animate-ping" : "bg-violet-500/20 border-violet-500/40"}`}>
              {timeRemaining === 0 ? (
                <BellRing className="w-4 h-4 text-emerald-400" />
              ) : (
                <Clock className="w-4 h-4 text-violet-400 animate-spin" style={{ animationDuration: "5s" }} />
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-violet-300 block">
                Timer: Step {activeTimerStep}
              </span>
              <span className="text-2xl font-extrabold font-mono text-white tracking-widest">
                {timeRemaining === 0 ? "DONE!" : formatTimerString(timeRemaining)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {timeRemaining > 0 && (
              <button
                id="timer-pause-btn"
                onClick={togglePauseResume}
                aria-label={timerRunning ? "Pause timer" : "Resume timer"}
                className="p-2 rounded-lg bg-slate-900 border border-white/5 text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer"
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            )}
            <button
              id="timer-reset-btn"
              onClick={resetActiveTimer}
              aria-label="Reset timer to original duration"
              className="p-2 rounded-lg bg-slate-900 border border-white/5 text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="timer-close-btn"
              onClick={() => {
                stopTimer();
                setActiveTimerStep(null);
              }}
              aria-label="Dismiss timer"
              className="px-2 py-1 text-[11px] font-bold rounded-lg border border-rose-500/20 text-rose-400 bg-rose-500/5 hover:bg-rose-500/15 transition-colors focus:outline-none focus:ring-1 focus:ring-rose-500/50 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Checklist Steps list */}
      <div className="flex flex-col gap-3">
        {meal.instructions.map((item) => {
          const isChecked = !!checkedSteps[item.step];
          const hasTimer = item.durationSeconds > 0;
          const isTimerRunningOnThisStep = activeTimerStep === item.step;

          return (
            <div
              key={item.step}
              id={`instruction-step-${item.step}`}
              className={`p-4 rounded-xl border transition-all ${
                isChecked
                  ? "bg-slate-950/20 border-white/5 opacity-50 animate-fade-in"
                  : "bg-slate-950/40 border-white/10 animate-fade-in"
              } flex flex-col gap-2`}
            >
              <div className="flex gap-3 items-start">
                <button
                  id={`step-check-btn-${item.step}`}
                  type="button"
                  onClick={() => handleToggleCheck(item.step)}
                  aria-label={`Toggle check status for step ${item.step}`}
                  className="mt-0.5 text-slate-400 hover:text-violet-400 transition-colors focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer"
                >
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] uppercase font-mono tracking-wider font-bold block ${isChecked ? "text-slate-505" : "text-violet-400"}`}>
                    Step {item.step}
                  </span>
                  <p className={`text-xs text-slate-200 mt-1 leading-relaxed ${isChecked ? "line-through text-slate-500" : ""}`}>
                    {item.instruction}
                  </p>
                </div>

                {hasTimer && !isChecked && (
                  <button
                    id={`start-step-timer-btn-${item.step}`}
                    type="button"
                    onClick={() => startTimer(item.step, item.durationSeconds)}
                    aria-label={`Start timer of ${formatTimerString(item.durationSeconds)} for step ${item.step}`}
                    className={`ml-3 shrink-0 py-1.5 px-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono border flex items-center gap-1 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer ${
                      isTimerRunningOnThisStep
                        ? "bg-violet-600 text-white border-violet-500"
                        : "bg-slate-900 text-slate-300 border-white/5 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimerString(item.durationSeconds)}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
