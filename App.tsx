import React, { useState, useEffect, useCallback, useRef } from 'react';
import TimerDisplay from './components/TimerDisplay';
import TaskList from './components/TaskList';
import SettingsModal from './components/SettingsModal';
import { TimerMode, DEFAULT_SETTINGS, Task, TimerSettings, WaveSpeed } from './types';
import { getHypeQuote } from './services/geminiService';
import confetti from 'canvas-confetti';
import { Target, Coffee, Battery, Sliders, BellRing, X, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>(TimerMode.FOCUS);
  const [customDuration, setCustomDuration] = useState<number>(30); // Default custom minutes
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<string>(""); // Notepad state
  const [quote, setQuote] = useState<string>("Bro. Handle dat.");
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modals
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempCustomValue, setTempCustomValue] = useState(customDuration.toString());

  // Alarm Alert State
  const [activeAlarmTask, setActiveAlarmTask] = useState<Task | null>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Theme Sync Effect
  useEffect(() => {
    const root = document.documentElement;
    switch (mode) {
      case TimerMode.FOCUS:
        // Lime
        root.style.setProperty('--brand-rgb', '190 242 100');       // #bef264
        root.style.setProperty('--brand-light-rgb', '217 249 157'); // #d9f99d
        break;
      case TimerMode.SHORT_BREAK:
        // Cyan
        root.style.setProperty('--brand-rgb', '34 211 238');        // #22d3ee
        root.style.setProperty('--brand-light-rgb', '165 243 252'); // #a5f3fc
        break;
      case TimerMode.LONG_BREAK:
        // Purple
        root.style.setProperty('--brand-rgb', '192 132 252');       // #c084fc
        root.style.setProperty('--brand-light-rgb', '233 213 255'); // #e9d5ff
        break;
      case TimerMode.CUSTOM:
        // Orange
        root.style.setProperty('--brand-rgb', '251 146 60');        // #fb923c
        root.style.setProperty('--brand-light-rgb', '254 215 170'); // #fed7aa
        break;
    }
  }, [mode]);

  const playBeep = () => {
    if (!settings.soundEnabled) return;
    const ctx = getAudioContext();
    if (ctx && ctx.state !== 'closed') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth'; // Aggressive wave
        osc.frequency.setValueAtTime(440, ctx.currentTime); 
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }
  };

  const playAlarmSound = () => {
    if (!settings.soundEnabled) return;
    const ctx = getAudioContext();
    if (ctx && ctx.state !== 'closed') {
        const now = ctx.currentTime;
        [0, 0.2, 0.4, 0.6].forEach(offset => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'square'; // Aggressive alarm
          osc.frequency.setValueAtTime(800, now + offset); 
          osc.frequency.exponentialRampToValueAtTime(400, now + offset + 0.1);
          gain.gain.setValueAtTime(0.1, now + offset);
          gain.gain.linearRampToValueAtTime(0, now + offset + 0.1);
          osc.start(now + offset);
          osc.stop(now + offset + 0.1);
        });
    }
  };

  const getTotalTime = useCallback(() => {
    switch (mode) {
      case TimerMode.FOCUS: return settings.focusDuration * 60;
      case TimerMode.SHORT_BREAK: return settings.shortBreakDuration * 60;
      case TimerMode.LONG_BREAK: return settings.longBreakDuration * 60;
      case TimerMode.CUSTOM: return customDuration * 60;
    }
  }, [mode, settings, customDuration]);

  const switchMode = (newMode: TimerMode) => {
    if (newMode === TimerMode.CUSTOM && mode !== TimerMode.CUSTOM) {
        // First entry to custom mode
        setShowCustomModal(true);
    }

    setMode(newMode);
    setIsRunning(false);
    
    // Reset time based on new mode immediately
    let duration = 0;
    if (newMode === TimerMode.FOCUS) duration = settings.focusDuration;
    else if (newMode === TimerMode.SHORT_BREAK) duration = settings.shortBreakDuration;
    else if (newMode === TimerMode.LONG_BREAK) duration = settings.longBreakDuration;
    else duration = customDuration;
    
    setTimeLeft(duration * 60);
    if (newMode !== TimerMode.CUSTOM) { 
        fetchNewQuote(newMode);
    }
  };

  const handleCustomDurationSubmit = () => {
    const val = parseInt(tempCustomValue);
    if (!isNaN(val) && val > 0) {
        setCustomDuration(val);
        setMode(TimerMode.CUSTOM);
        setIsRunning(false);
        setTimeLeft(val * 60);
        setShowCustomModal(false);
    }
  };
  
  const handleSettingsSave = (newSettings: TimerSettings) => {
      setSettings(newSettings);
      // If timer is NOT running, update the current display to reflect new settings immediately if applicable
      if (!isRunning) {
        if (mode === TimerMode.FOCUS) setTimeLeft(newSettings.focusDuration * 60);
        if (mode === TimerMode.SHORT_BREAK) setTimeLeft(newSettings.shortBreakDuration * 60);
        if (mode === TimerMode.LONG_BREAK) setTimeLeft(newSettings.longBreakDuration * 60);
      }
      // Refresh quote when settings are saved
      fetchNewQuote(mode);
  };

  const fetchNewQuote = async (currentMode: TimerMode) => {
    const q = await getHypeQuote(currentMode);
    setQuote(q);
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    playBeep();
    
    if (mode === TimerMode.FOCUS || mode === TimerMode.CUSTOM) {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#bef264', '#ffffff'] // Lime and white
      });
    } else {
       playBeep(); 
       setTimeout(playBeep, 200);
    }
  };

  // Timer Tick Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Alarm Check Effect
  useEffect(() => {
    const interval = setInterval(() => {
        const now = Date.now();
        const triggeredTask = tasks.find(t => t.reminderTime && t.reminderTime <= now);
        
        if (triggeredTask) {
            playAlarmSound();
            setActiveAlarmTask(triggeredTask);
            setTasks(prev => prev.map(t => 
                t.id === triggeredTask.id ? { ...t, reminderTime: undefined } : t
            ));
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  // Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial quote and Rotation Effect (15 mins)
  useEffect(() => {
    fetchNewQuote(TimerMode.FOCUS);
    
    const quoteInterval = setInterval(() => {
      fetchNewQuote(mode);
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(quoteInterval);
  }, [mode]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getTotalTime());
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date).toUpperCase();
  };
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
  };
  
  const getWaveClass = (layer: 1 | 2) => {
      const speed = settings.waveSpeed;
      if (speed === 'frozen') return '';
      
      if (layer === 1) {
          if (speed === 'slow') return 'animate-wave-super-slow';
          if (speed === 'normal') return 'animate-wave-slow';
          if (speed === 'fast') return 'animate-wave';
      } else {
          if (speed === 'slow') return 'animate-wave-slow';
          if (speed === 'normal') return 'animate-wave';
          if (speed === 'fast') return 'animate-wave-fast';
      }
      return 'animate-wave';
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center font-sans relative overflow-hidden transition-colors duration-500">
      
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-10" 
           style={{
             backgroundImage: 'radial-gradient(rgb(var(--brand-rgb)) 1px, transparent 1px)',
             backgroundSize: '30px 30px'
           }}>
      </div>
      
      {showSettingsModal && (
          <SettingsModal 
            settings={settings} 
            onSave={handleSettingsSave} 
            onClose={() => setShowSettingsModal(false)} 
          />
      )}

      {/* Alarm Alert Overlay */}
      {activeAlarmTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-brand-surface p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border-2 border-brand-neon animate-bounce-slow">
                <div className="w-20 h-20 bg-brand-neon text-brand-black rounded-full flex items-center justify-center mx-auto mb-6">
                    <BellRing size={40} className="animate-pulse" />
                </div>
                <h2 className="text-3xl font-black text-white uppercase mb-2 tracking-tight">Time's Up</h2>
                <p className="text-xl text-brand-muted mb-8 font-medium">Handle: <span className="text-white">"{activeAlarmTask.title}"</span></p>
                <button 
                    onClick={() => setActiveAlarmTask(null)}
                    className="w-full py-4 bg-brand-neon text-brand-black rounded-xl font-bold text-lg uppercase tracking-wider hover:bg-brand-lime transition-colors"
                >
                    I'm On It
                </button>
            </div>
        </div>
      )}

      {/* Custom Time Modal Overlay */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
             <div className="bg-brand-surface p-6 rounded-3xl shadow-2xl max-w-xs w-full border border-brand-border">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-white uppercase">Your Rules</h3>
                    <button onClick={() => setShowCustomModal(false)} className="text-brand-muted hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <div className="mb-6">
                    <label className="block text-xs font-bold text-brand-muted uppercase mb-2">Minutes</label>
                    <input 
                        type="number" 
                        value={tempCustomValue}
                        onChange={(e) => setTempCustomValue(e.target.value)}
                        className="w-full text-4xl font-black text-center text-white bg-brand-dark rounded-xl p-4 outline-none"
                        autoFocus
                    />
                </div>
                <button 
                    onClick={handleCustomDurationSubmit}
                    className="w-full py-3 bg-brand-neon text-brand-black rounded-xl font-bold uppercase tracking-widest hover:bg-brand-lime transition-colors"
                >
                    Let's Go
                </button>
             </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-stretch h-[85vh]">
        
        {/* LEFT COLUMN - TIMER */}
        <div className="flex flex-col gap-6 h-full justify-center">
            
            {/* Header / Mode Switcher */}
            <div className="flex justify-center bg-brand-dark/40 p-1.5 rounded-2xl backdrop-blur-sm border border-brand-border/30 self-center md:self-start">
                {[
                    { id: TimerMode.FOCUS, icon: Target, label: 'Focus' },
                    { id: TimerMode.SHORT_BREAK, icon: Coffee, label: 'Short' },
                    { id: TimerMode.LONG_BREAK, icon: Battery, label: 'Long' },
                    { id: TimerMode.CUSTOM, icon: Sliders, label: 'Custom' },
                ].map((m) => (
                    <button
                        key={m.id}
                        onClick={() => switchMode(m.id as TimerMode)}
                        className={`
                            relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300
                            ${mode === m.id ? 'text-brand-black bg-brand-neon shadow-lg scale-105' : 'text-brand-muted hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <m.icon size={16} strokeWidth={3} />
                        <span className="uppercase tracking-wide hidden sm:inline">{m.label}</span>
                    </button>
                ))}
            </div>

            <TimerDisplay 
                timeLeft={timeLeft} 
                totalTime={getTotalTime()}
                mode={mode}
                isRunning={isRunning} 
                onToggle={toggleTimer} 
                onReset={resetTimer}
                onEditTime={() => setShowCustomModal(true)}
            />

            {/* Quote / Status */}
            <div className="bg-brand-dark/30 backdrop-blur-sm rounded-2xl p-6 border border-brand-border/30 text-center relative overflow-hidden group">
                 <p className="text-brand-text font-medium text-lg italic relative z-10 transition-all duration-500">
                    "{quote}"
                 </p>
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </div>

             {/* Metadata */}
             <div className="flex justify-between items-center px-2 text-brand-muted text-xs font-mono font-bold tracking-widest uppercase opacity-60">
                <span>{formatDate(currentTime)}</span>
                <span>{formatTime(currentTime)}</span>
            </div>
        </div>

        {/* RIGHT COLUMN - TASKS */}
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-neon animate-pulse"></span>
                    Mission Control
                </h2>
                <button 
                    onClick={() => setShowSettingsModal(true)}
                    className="p-2 text-brand-muted hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                    <Settings size={20} />
                </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
                <TaskList 
                    tasks={tasks} 
                    setTasks={setTasks} 
                    notes={notes}
                    setNotes={setNotes}
                />
            </div>
        </div>
      </div>
      
      {/* Background Ambience / Visuals */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 opacity-20 pointer-events-none overflow-hidden">
         <div className={`absolute bottom-0 w-[200%] h-full bg-brand-neon/20 blur-[60px] rounded-[100%] transition-all duration-1000 ${getWaveClass(1)}`}></div>
         <div className={`absolute bottom-[-10%] left-[-50%] w-[200%] h-full bg-brand-neon/20 blur-[60px] rounded-[100%] animation-delay-2000 transition-all duration-1000 ${getWaveClass(2)}`}></div>
      </div>

    </div>
  );
};

export default App;