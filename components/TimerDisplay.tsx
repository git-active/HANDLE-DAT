import React from 'react';
import { TimerMode } from '../types';
import { Play, Pause, RefreshCw, Settings2 } from 'lucide-react';

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
  
  // Calculate stroke dashoffset for a circle if needed, but we'll stick to big text for this design
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;

  return (
    <div className="flex flex-col items-center justify-center bg-brand-dark/50 p-8 rounded-3xl border border-brand-border/50 relative overflow-hidden group">
        
        {/* Background glow pulse based on isRunning */}
        {isRunning && (
            <div className="absolute inset-0 bg-brand-neon/5 animate-pulse rounded-3xl z-0"></div>
        )}

        <div className="relative z-10 flex flex-col items-center">
            {/* Big Time Display */}
            <div className="text-[8rem] leading-none font-black text-white tabular-nums tracking-tighter drop-shadow-2xl mb-8 select-none">
                {minutes.toString().padStart(2, '0')}
                <span className="text-brand-muted animate-pulse">:</span>
                {seconds.toString().padStart(2, '0')}
            </div>

            {/* Main Controls */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={onToggle}
                    className={`h-16 px-8 rounded-2xl flex items-center gap-3 font-bold text-lg transition-all transform hover:-translate-y-1 active:translate-y-0 ${
                        isRunning 
                        ? 'bg-brand-surface text-white border border-brand-border hover:bg-brand-border' 
                        : 'bg-brand-neon text-brand-black shadow-lg shadow-brand-neon/20 hover:shadow-brand-neon/40'
                    }`}
                >
                    {isRunning ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                    {isRunning ? 'PAUSE' : 'START'}
                </button>

                <button 
                    onClick={onReset}
                    className="h-16 w-16 flex items-center justify-center rounded-2xl bg-brand-surface text-brand-muted hover:text-white border border-brand-border hover:border-white transition-all hover:rotate-180 duration-500"
                    title="Reset Timer"
                >
                    <RefreshCw size={24} />
                </button>
                
                {mode === TimerMode.CUSTOM && (
                    <button 
                        onClick={onEditTime}
                        className="h-16 w-16 flex items-center justify-center rounded-2xl bg-brand-surface text-brand-muted hover:text-white border border-brand-border hover:border-white transition-all"
                        title="Edit Time"
                    >
                        <Settings2 size={24} />
                    </button>
                )}
            </div>
        </div>

        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 h-1 bg-brand-surface w-full">
            <div 
                className="h-full bg-brand-neon transition-all duration-1000 ease-linear"
                style={{ width: `${(1 - progress) * 100}%` }}
            ></div>
        </div>

    </div>
  );
};

export default TimerDisplay;