import React, { useState } from 'react';
import { X, Volume2, VolumeX, Waves } from 'lucide-react';
import { TimerSettings, DEFAULT_SETTINGS, WaveSpeed } from '../types';

interface SettingsModalProps {
  settings: TimerSettings;
  onSave: (newSettings: TimerSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<TimerSettings>(settings);

  const handleDurationChange = (key: keyof TimerSettings, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setLocalSettings(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const handleWaveChange = (speed: WaveSpeed) => {
    setLocalSettings(prev => ({ ...prev, waveSpeed: speed }));
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-brand-surface w-full max-w-md p-6 rounded-3xl shadow-2xl border border-brand-border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={onClose} className="text-brand-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          
          {/* Audio */}
          <div className="flex items-center justify-between p-4 bg-brand-dark rounded-2xl">
              <div className="flex items-center gap-3">
                  {localSettings.soundEnabled ? <Volume2 className="text-brand-neon" /> : <VolumeX className="text-brand-muted" />}
                  <span className="font-medium text-brand-text">Sound Effects</span>
              </div>
              <button 
                onClick={() => setLocalSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                className={`w-12 h-7 rounded-full transition-colors relative ${localSettings.soundEnabled ? 'bg-brand-neon' : 'bg-brand-muted'}`}
              >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${localSettings.soundEnabled ? 'left-6' : 'left-1'}`} />
              </button>
          </div>

          {/* Wave Speed */}
          <div className="space-y-3">
              <div className="flex items-center gap-2 text-brand-text font-medium">
                  <Waves size={18} className="text-brand-neon"/>
                  <span>Wave Animation Speed</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                  {(['frozen', 'slow', 'normal', 'fast'] as WaveSpeed[]).map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handleWaveChange(speed)}
                        className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                            localSettings.waveSpeed === speed
                             ? 'bg-brand-neon text-brand-black'
                             : 'bg-brand-dark text-brand-muted hover:bg-brand-dark/80'
                        }`}
                      >
                          {speed}
                      </button>
                  ))}
              </div>
          </div>

          {/* Durations */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-muted uppercase tracking-wider">Durations (minutes)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-brand-muted mb-1">Focus</label>
                <input 
                  type="number" 
                  value={localSettings.focusDuration}
                  onChange={(e) => handleDurationChange('focusDuration', e.target.value)}
                  className="w-full bg-brand-dark text-white rounded-xl p-3 text-center font-bold border border-brand-border focus:border-brand-neon outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-brand-muted mb-1">Short Break</label>
                <input 
                  type="number" 
                  value={localSettings.shortBreakDuration}
                  onChange={(e) => handleDurationChange('shortBreakDuration', e.target.value)}
                  className="w-full bg-brand-dark text-white rounded-xl p-3 text-center font-bold border border-brand-border focus:border-brand-neon outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-brand-muted mb-1">Long Break</label>
                <input 
                  type="number" 
                  value={localSettings.longBreakDuration}
                  onChange={(e) => handleDurationChange('longBreakDuration', e.target.value)}
                  className="w-full bg-brand-dark text-white rounded-xl p-3 text-center font-bold border border-brand-border focus:border-brand-neon outline-none"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="flex gap-3 mt-8">
            <button 
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl font-bold text-brand-muted hover:bg-brand-dark transition-colors"
            >
                Reset Defaults
            </button>
            <button 
                onClick={() => { onSave(localSettings); onClose(); }}
                className="flex-[2] py-3 bg-brand-neon text-brand-black rounded-xl font-bold hover:bg-brand-lime transition-colors"
            >
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;