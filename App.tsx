import React, { useState, useEffect, useCallback, useRef } from 'react';
import TimerDisplay from './components/TimerDisplay';
import TaskList from './components/TaskList';
import { TimerMode, DEFAULT_SETTINGS, Task } from './types';
import { getHypeQuote } from './services/geminiService';
import confetti from 'canvas-confetti';
import { Target, Coffee, Battery, Sliders, BellRing, X, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>(TimerMode.FOCUS);
  const [customDuration, setCustomDuration] = useState<number>(30); // Default custom minutes
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<string>(""); // Notepad state
  const [quote, setQuote] = useState<string>("Bro. Handle dat.");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Custom Timer Modal State
  const [showCustomModal, setShowCustomModal] = useState(false);
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

  const playBeep = () => {
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

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center font-sans relative overflow-hidden">
      
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-10" 
           style={{
             backgroundImage: 'radial-gradient(#bef264 1px, transparent 1px)',
             backgroundSize: '30px 30px'
           }}>
      </div>

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
                        className="w-full text-4xl font-black text-center text-white bg-brand-dark rounded-xl p-4 outline-none border-2 border-transparent focus:border-brand-neon"
                        autoFocus
                    />
                </div>
                <button 
                    onClick={handleCustomDurationSubmit}
                    className="w-full py-3 bg-brand-neon text-brand-black rounded-xl font-bold uppercase tracking-wider hover:bg-brand-lime transition-colors"
                >
                    Set Timer
                </button>
             </div>
        </div>
      )}

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
        
        {/* Left Column: Header & Timer */}
        <div className="space-y-6">
          <header className="flex justify-between items-end mb-6">
             <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-10 bg-brand-neon"></div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase">
                    Handle-Dat
                    </h1>
                </div>
                <p className="text-brand-muted font-mono text-xs pl-6 uppercase tracking-widest">
                    Discipline Protocol v2.0
                </p>
             </div>

             {/* Minimalist Clock */}
             <div className="text-right font-mono text-brand-muted/70 flex flex-col items-end leading-tight">
                 <span className="text-[10px] tracking-widest uppercase">{formatDate(currentTime)}</span>
                 <span className="text-xl font-bold text-brand-text">{formatTime(currentTime)}</span>
             </div>
          </header>

          {/* Mode Switcher */}
          <div className="grid grid-cols-4 gap-2 bg-brand-dark/50 p-2 rounded-2xl border border-brand-border">
            {[
              { m: TimerMode.FOCUS, icon: Target, label: 'LOCK IN' },
              { m: TimerMode.SHORT_BREAK, icon: Coffee, label: 'REST' },
              { m: TimerMode.LONG_BREAK, icon: Battery, label: 'LONG' },
              { m: TimerMode.CUSTOM, icon: Sliders, label: 'OWN' }
            ].map((item) => (
              <button
                key={item.m}
                onClick={() => switchMode(item.m)}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-xl transition-all duration-200 ${
                  mode === item.m 
                    ? 'bg-brand-surface border border-brand-border shadow-lg text-white' 
                    : 'text-brand-muted hover:bg-brand-surface/50 hover:text-brand-text'
                }`}
              >
                <item.icon size={18} className={mode === item.m ? 'text-brand-neon' : ''} />
                <span className="font-bold text-[10px] uppercase tracking-wider">{item.label}</span>
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
            onEditTime={() => { setTempCustomValue(customDuration.toString()); setShowCustomModal(true); }}
          />

          {/* Quote Card */}
          <div className="bg-brand-surface border-l-4 border-brand-neon p-6 rounded-r-2xl shadow-lg relative min-h-[100px] flex items-center">
             <div className="absolute top-4 right-4 opacity-20 text-brand-neon">
               <Zap size={24} />
             </div>
             <p className="font-bold text-xl text-white leading-tight font-sans tracking-tight">
               "{quote}"
             </p>
          </div>
        </div>

        {/* Right Column: Tasks & Notes */}
        <div className="h-full min-h-[500px]">
          <TaskList 
            tasks={tasks} 
            setTasks={setTasks} 
            notes={notes}
            setNotes={setNotes}
          />
          
          <div className="mt-6 flex justify-between items-center text-[10px] text-brand-muted uppercase tracking-widest font-mono opacity-50">
            <span>Systems Online</span>
            <span>CRISPYICECREAM.XYZ</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;