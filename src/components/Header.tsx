import React from 'react';
import { Cpu, Layers, GitCompare, Clock, Activity, Sun, Moon } from 'lucide-react';
import { AlgorithmType } from '../types/scheduling';

export type ActiveTab = 'simulator' | 'comparison';
export type ThemeMode = 'dark' | 'light';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  algorithm: AlgorithmType;
  quantum: number;
  processCount: number;
  totalDuration: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  algorithm,
  quantum,
  processCount,
  totalDuration,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="lab-header">
      <div className="brand-group">
        <div className="brand-icon" aria-hidden="true">
          <Cpu size={26} />
        </div>
        <div>
          <div className="brand-title">
            <span>آزمایشگاه زمان‌بندی پردازنده</span>
            <span className="brand-badge mono">CPU Scheduling Lab</span>
          </div>
          <p className="brand-subtitle">
            شبیه‌ساز تعاملی و بصری الگوریتم‌های FCFS و Round Robin — ارائه درس سیستم‌عامل
          </p>
        </div>
      </div>

      <div className="header-controls">
        <div className="status-pills">
          <span className="status-pill">
            <Activity size={14} color="#38BDF8" />
            <span>الگوریتم فعال:</span>
            <strong className="mono">
              {algorithm === 'FCFS' ? 'FCFS' : `Round Robin (Q=${quantum})`}
            </strong>
          </span>

          <span className="status-pill">
            <Clock size={14} color="#10B981" />
            <span>فرایندها:</span>
            <strong className="mono">{processCount}</strong>
            <span>| کل زمان:</span>
            <strong className="mono">{totalDuration}</strong>
          </span>
        </div>

        <nav className="mode-tabs" aria-label="حالت نمایش آزمایشگاه">
          <button
            type="button"
            className={`mode-tab ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => onSelectTab('simulator')}
          >
            <Layers size={16} />
            <span>آزمایشگاه شبیه‌ساز</span>
          </button>

          <button
            type="button"
            className={`mode-tab ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => onSelectTab('comparison')}
          >
            <GitCompare size={16} />
            <span>مقایسه FCFS و Round Robin</span>
          </button>
        </nav>

        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={16} color="#F59E0B" />
              <span>تم روشن</span>
            </>
          ) : (
            <>
              <Moon size={16} color="#0284C7" />
              <span>تم تاریک</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};