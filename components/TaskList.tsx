import React, { useState } from 'react';
import { Plus, Loader2, Bell, X, Clock, Timer, Zap, Trash2, Check, FileText, ListTodo } from 'lucide-react';
import { Task } from '../types';
import { breakDownTask } from '../services/geminiService';

interface TaskListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  notes: string;
  setNotes: (n: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, setTasks, notes, setNotes }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [activeReminderTaskId, setActiveReminderTaskId] = useState<string | null>(null);
  
  // Reminder Form State
  const [reminderType, setReminderType] = useState<'duration' | 'time'>('duration');
  const [reminderValue, setReminderValue] = useState(''); // Stores minutes string or "HH:MM" string

  const addTask = (title: string, isAi = false) => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: Date.now().toString() + Math.random().toString(),
      title: title.trim(),
      completed: false,
      isAiGenerated: isAi
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTask(newTaskTitle);
    setNewTaskTitle('');
  };

  const handleAiBreakdown = async () => {
    if (!newTaskTitle.trim()) return;
    setIsBreakingDown(true);
    try {
      const subtasks = await breakDownTask(newTaskTitle);
      if (subtasks.length > 0) {
          subtasks.forEach(t => addTask(t, true));
          setNewTaskTitle(''); 
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBreakingDown(false);
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const openReminderModal = (taskId: string) => {
    setActiveReminderTaskId(taskId);
    setReminderType('duration');
    setReminderValue('');
  };

  const closeReminderModal = () => {
    setActiveReminderTaskId(null);
    setReminderValue('');
  };

  const saveReminder = () => {
    if (!activeReminderTaskId || !reminderValue) return;

    let targetTime = 0;

    if (reminderType === 'duration') {
      const mins = parseInt(reminderValue);
      if (isNaN(mins) || mins <= 0) return;
      targetTime = Date.now() + mins * 60 * 1000;
    } else {
      // Time input format HH:MM
      const [hours, minutes] = reminderValue.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return;

      const now = new Date();
      const targetDate = new Date();
      targetDate.setHours(hours, minutes, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (targetDate.getTime() <= now.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      targetTime = targetDate.getTime();
    }

    setTasks(prev => prev.map(t => t.id === activeReminderTaskId ? { 
      ...t, 
      reminderTime: targetTime,
      reminderFormat: reminderType 
    } : t));
    
    closeReminderModal();
  };

  const cancelReminder = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, reminderTime: undefined } : t));
  };

  return (
    <div className="bg-brand-surface rounded-3xl p-6 border border-brand-border/50 h-full flex flex-col relative shadow-xl overflow-hidden">
      
      {/* Tab Header */}
      <div className="flex items-center justify-between mb-6 border-b border-brand-border/50 pb-2">
        <div className="flex gap-4">
            <button 
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-2 pb-2 -mb-2.5 transition-all text-sm font-black uppercase tracking-wider ${activeTab === 'tasks' ? 'text-white border-b-2 border-brand-neon' : 'text-brand-muted hover:text-brand-text'}`}
            >
                <ListTodo size={16} /> Tasks
            </button>
            <button 
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 pb-2 -mb-2.5 transition-all text-sm font-black uppercase tracking-wider ${activeTab === 'notes' ? 'text-white border-b-2 border-brand-neon' : 'text-brand-muted hover:text-brand-text'}`}
            >
                <FileText size={16} /> Scratchpad
            </button>
        </div>
        {activeTab === 'tasks' && (
             <span className="text-xs font-bold text-brand-black bg-brand-neon px-2 py-1 rounded-md">
                {tasks.filter(t => t.completed).length}/{tasks.length}
            </span>
        )}
      </div>

      {activeTab === 'tasks' ? (
        <>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-hide">
                {tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-brand-muted opacity-50">
                    <p className="italic">Empty list. Clear head.</p>
                    <p className="text-sm font-bold mt-2">ADD SOMETHING.</p>
                </div>
                )}
                {tasks.map(task => (
                <div 
                    key={task.id}
                    className={`group flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                    task.completed 
                        ? 'bg-brand-dark border-transparent opacity-60' 
                        : 'bg-brand-dark/50 border-brand-border hover:border-brand-neon/50'
                    }`}
                >
                    <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                        task.completed 
                        ? 'bg-brand-neon border-brand-neon text-brand-black' 
                        : 'border-brand-muted text-transparent hover:border-brand-neon'
                    }`}
                    >
                    <Check size={14} strokeWidth={4} />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                    <span className={`text-brand-text font-semibold truncate block ${task.completed ? 'line-through decoration-2' : ''}`}>
                        {task.title}
                    </span>
                    {task.reminderTime && task.reminderTime > Date.now() && (
                        <div className="text-xs text-brand-neon flex items-center gap-1 mt-1 font-mono">
                        <Clock size={10} />
                        {task.reminderFormat === 'duration' ? (
                            <span>T-{Math.ceil((task.reminderTime - Date.now()) / 60000)}m</span>
                        ) : (
                            <span>@ {new Date(task.reminderTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        )}
                        </div>
                    )}
                    </div>

                    {task.isAiGenerated && (
                        <Zap size={14} className="text-purple-400 opacity-70 flex-shrink-0" />
                    )}

                    {/* Reminder Button */}
                    <button 
                    onClick={() => task.reminderTime ? cancelReminder(task.id) : openReminderModal(task.id)}
                    className={`p-1.5 rounded-lg transition-all ${
                        task.reminderTime 
                        ? 'text-brand-neon bg-brand-neon/10 opacity-100' 
                        : 'text-brand-muted hover:text-brand-text opacity-0 group-hover:opacity-100'
                    }`}
                    title={task.reminderTime ? "Kill Alarm" : "Set Alarm"}
                    >
                    {task.reminderTime ? <Bell size={16} fill="currentColor" /> : <Bell size={16} />}
                    </button>

                    <button 
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1.5 rounded-lg transition-all"
                    >
                    <Trash2 size={16} />
                    </button>
                </div>
                ))}
            </div>

            <form onSubmit={handleAddSubmit} className="relative mt-auto">
                <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Handle dat..."
                className="w-full pl-4 pr-24 py-4 rounded-xl bg-brand-dark border-2 border-brand-border focus:border-brand-neon focus:outline-none text-brand-text placeholder-brand-muted transition-all font-medium"
                />
                <div className="absolute right-2 top-2 flex gap-1">
                {newTaskTitle && (
                    <button
                    type="button"
                    onClick={handleAiBreakdown}
                    disabled={isBreakingDown}
                    className="p-2.5 bg-brand-surface text-brand-muted hover:text-brand-neon rounded-lg transition-all disabled:opacity-50"
                    title="Deconstruct"
                    >
                    {isBreakingDown ? <Loader2 size={18} className="animate-spin"/> : <Zap size={18} />}
                    </button>
                )}
                <button
                    type="submit"
                    disabled={!newTaskTitle}
                    className="p-2.5 bg-brand-neon text-brand-black rounded-lg hover:bg-brand-lime transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={20} strokeWidth={3} />
                </button>
                </div>
            </form>
        </>
      ) : (
          <div className="flex-1 flex flex-col h-full animate-in fade-in duration-200">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="// Brain dump here. Ideas, clips, random thoughts..."
                className="flex-1 w-full h-full bg-brand-dark/30 rounded-xl p-4 text-brand-text font-mono text-sm resize-none border border-brand-border focus:border-brand-neon focus:outline-none placeholder-brand-muted/40 leading-relaxed"
                spellCheck={false}
              />
          </div>
      )}

      {/* Reminder Modal */}
      {activeReminderTaskId && (
        <div className="absolute inset-0 bg-brand-black/90 backdrop-blur-sm z-20 rounded-3xl flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-brand-text text-lg uppercase tracking-tight">Set Alert</h3>
              <button onClick={closeReminderModal} className="text-brand-muted hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex p-1 bg-brand-surface rounded-xl border border-brand-border">
              <button 
                onClick={() => { setReminderType('duration'); setReminderValue(''); }}
                className={`flex-1 py-2 text-sm font-bold uppercase rounded-lg flex items-center justify-center gap-2 transition-all ${reminderType === 'duration' ? 'bg-brand-neon text-brand-black' : 'text-brand-muted hover:text-white'}`}
              >
                <Timer size={16} /> Timer
              </button>
              <button 
                onClick={() => { setReminderType('time'); setReminderValue(''); }}
                className={`flex-1 py-2 text-sm font-bold uppercase rounded-lg flex items-center justify-center gap-2 transition-all ${reminderType === 'time' ? 'bg-brand-neon text-brand-black' : 'text-brand-muted hover:text-white'}`}
              >
                <Clock size={16} /> Alarm
              </button>
            </div>

            <div className="bg-brand-surface p-4 rounded-xl border border-brand-border">
              {reminderType === 'duration' ? (
                 <div>
                   <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Minutes from now</label>
                   <input 
                    type="number" 
                    min="1" 
                    max="1440"
                    placeholder="25"
                    value={reminderValue}
                    onChange={(e) => setReminderValue(e.target.value)}
                    className="w-full text-3xl font-black text-center text-brand-text bg-transparent border-b-2 border-brand-border focus:border-brand-neon outline-none p-2 placeholder-brand-muted/30"
                    autoFocus
                   />
                 </div>
              ) : (
                <div>
                   <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Alarm Time</label>
                   <input 
                    type="time" 
                    value={reminderValue}
                    onChange={(e) => setReminderValue(e.target.value)}
                    className="w-full text-3xl font-black text-center text-brand-text bg-transparent outline-none p-2 [color-scheme:dark]"
                    autoFocus
                   />
                 </div>
              )}
            </div>

            <button 
              onClick={saveReminder}
              disabled={!reminderValue}
              className="w-full py-3 bg-brand-neon text-brand-black rounded-xl font-bold uppercase tracking-widest hover:bg-brand-lime transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;