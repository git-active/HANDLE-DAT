import React from 'react';
import { TimerMode } from '../types';

interface TimerDisplayProps {
  timeLeft: number;
  totalTime: number;
  mode: TimerMode;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  onEditTime?: () => void;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeLeft,
  totalTime,
  mode,
  isRunning,
  onToggle,
  onReset,
  onEditTime
}) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  // Calculate stroke dashoffset for circle progress
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  // Avoid division by zero
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const getModeColor = () => {
    switch (mode) {
      case TimerMode.FOCUS: return 'text-brand-neon stroke-brand-neon drop-shadow-[0_0_10px_rgba(190,242,100,0.5)]';
      case TimerMode.SHORT_BREAK: return 'text-cyan-400 stroke-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]';
      case TimerMode.LONG_BREAK: return 'text-purple-400 stroke-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]';
      case TimerMode.CUSTOM: return 'text-orange-400 stroke-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]';
      default: return 'text-gray-400 stroke-gray-400';
    }
  };
  
  const getButtonClass = () => {
    switch (mode) {
      case TimerMode.FOCUS: return 'bg-brand-neon text-brand-black hover:bg-brand-lime';
      case TimerMode.SHORT_BREAK: return 'bg-cyan-400 text-brand-black hover:bg-cyan-300';
      case TimerMode.LONG_BREAK: return 'bg-purple-400 text-brand-black hover:bg-purple-300';
      case TimerMode.CUSTOM: return 'bg-orange-400 text-brand-black hover:bg-orange-300';
      default: return 'bg-gray-400';
    }
  };

  const getLabel = () => {
    switch (mode) {
      case TimerMode.FOCUS: return 'LOCK IN';
      case TimerMode.SHORT_BREAK: return 'BREATHER';
      case TimerMode.LONG_BREAK: return 'TOUCH GRASS';
      case TimerMode.CUSTOM: return 'YOUR RULES';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-brand-surface rounded-3xl shadow-2xl border border-brand-border/50">
      <div className="relative mb-6 group">
        
        {/* SVG Timer */}
        <svg className="transform -rotate-90 w-80 h-80" viewBox="0 0 280 280">
          <circle
            cx="140"
            cy="140"
            r={radius}
            stroke="#27272a" /* zinc-800 */
            strokeWidth="16"
            fill="transparent"
          />
          {/* Background track for contrast */}
           <circle
            cx="140"
            cy="140"
            r={radius}
            stroke="currentColor"
            strokeWidth="16"
            fill="transparent"
            className="text-brand-dark/50"
          />
          <circle
            cx="140"
            cy="140"
            r={radius}
            stroke="currentColor"
            strokeWidth="16"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="butt"
            className={`${getModeColor()} transition-all duration-1000 ease-linear`}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <div className="text-brand-muted font-black tracking-[0.2em] text-xs mb-2">{getLabel()}</div>
          <div className={`text-7xl font-black font-sans tabular-nums text-brand-text tracking-tighter`}>
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
          
          <button 
            onClick={onToggle}
            className={`mt-8 px-10 py-4 rounded-xl font-black text-xl uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200 ${getButtonClass()}`}
          >
            {isRunning ? 'PAUSE' : 'GO'}
          </button>
          
          <div className="flex gap-4 mt-4">
             <button 
              onClick={onReset}
              className="text-brand-muted hover:text-brand-text text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Reset
            </button>
            {mode === TimerMode.CUSTOM && (
              <button 
                onClick={onEditTime}
                className="text-orange-400 hover:text-orange-300 text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay;