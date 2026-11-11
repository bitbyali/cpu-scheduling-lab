import React, { useState, useEffect } from 'react';
import { useSimulation } from './engine/useSimulation';
import { Header, ActiveTab, ThemeMode } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { PlaybackBar } from './components/PlaybackBar';
import { CpuAndQueueView } from './components/CpuAndQueueView';
import { GanttChart } from './components/GanttChart';
import { MetricsTable } from './components/MetricsTable';
import { ComparisonView } from './components/ComparisonView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('cpu-lab-theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  const sim = useSimulation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cpu-lab-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        algorithm={sim.algorithm}
        quantum={sim.quantum}
        processCount={sim.processes.length}
        totalDuration={sim.totalDuration}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="workspace-grid">
        <ControlPanel
          processes={sim.processes}
          algorithm={sim.algorithm}
          quantum={sim.quantum}
          activePresetId={sim.activePresetId}
          validationError={sim.validationError}
          onSelectAlgorithm={sim.setAlgorithm}
          onChangeQuantum={sim.setQuantum}
          onLoadPreset={sim.loadPreset}
          onAddProcess={sim.addProcess}
          onUpdateProcess={sim.updateProcess}
          onRemoveProcess={sim.removeProcess}
          onClearError={sim.clearError}
        />

        <main className="main-stage">
          {activeTab === 'simulator' ? (
            <>
              <PlaybackBar
                currentTime={sim.currentTime}
                totalDuration={sim.totalDuration}
                isPlaying={sim.isPlaying}
                speed={sim.speed}
                currentStep={sim.currentStep}
                onTogglePlay={sim.togglePlay}
                onReset={sim.reset}
                onStepBackward={sim.stepBackward}
                onStepForward={sim.stepForward}
                onJumpToEnd={sim.jumpToEnd}
                onSeekTo={sim.seekTo}
                onChangeSpeed={sim.setSpeed}
              />

              <GanttChart
                gantt={sim.simulationResult.gantt}
                currentTime={sim.currentTime}
                totalDuration={sim.totalDuration}
                algorithm={sim.algorithm}
                quantum={sim.quantum}
                onSeekTo={sim.seekTo}
              />

              <CpuAndQueueView
                currentStep={sim.currentStep}
                algorithm={sim.algorithm}
                quantum={sim.quantum}
                totalDuration={sim.totalDuration}
              />

              <MetricsTable result={sim.simulationResult} />
            </>
          ) : (
            <>
              <ComparisonView
                fcfsResult={sim.fcfsResult}
                rrResult={sim.rrResult}
                quantum={sim.quantum}
                onChangeQuantum={sim.setQuantum}
              />

              <GanttChart
                gantt={sim.fcfsResult.gantt}
                currentTime={sim.fcfsResult.totalDuration}
                totalDuration={sim.fcfsResult.totalDuration}
                algorithm="FCFS"
                quantum={sim.quantum}
                onSeekTo={sim.seekTo}
              />

              <GanttChart
                gantt={sim.rrResult.gantt}
                currentTime={sim.rrResult.totalDuration}
                totalDuration={sim.rrResult.totalDuration}
                algorithm="RR"
                quantum={sim.quantum}
                onSeekTo={sim.seekTo}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;