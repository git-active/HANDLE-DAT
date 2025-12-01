export enum TimerMode {
  FOCUS = 'FOCUS',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK',
  CUSTOM = 'CUSTOM'
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  isAiGenerated?: boolean;
  reminderTime?: number; // Epoch timestamp for when the alarm should fire
  reminderFormat?: 'time' | 'duration'; // For display purposes
}

export interface TimerSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  autoStartFocus: false,
};