import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  AlgorithmType,
  ProcessItem,
  SimulationResult,
  SimulationStep,
} from '../types/scheduling';
import { PRESET_SCENARIOS, getProcessColor } from '../data/presets';
import { runFCFS } from './fcfs';
import { runRoundRobin } from './roundRobin';

export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

const FALLBACK_STEP: SimulationStep = {
  time: 0,
  cpu: {
    status: 'IDLE',
    activePid: null,
    activeColor: null,
    segmentStart: null,
    segmentEnd: null,
    sliceElapsed: 0,
    sliceDuration: 0,
    quantumTotal: null,
    quantumRemaining: null,
    remainingBurstOfActive: 0,
  },
  readyQueue: [],
  processes: [],
  completedPids: [],
  activeSegmentId: null,
  headline: 'آماده شروع شبیه‌سازی',
  details: [],
};

export function useSimulation() {
  const defaultPreset = PRESET_SCENARIOS[0];

  const [processes, setProcesses] = useState<ProcessItem[]>(
    defaultPreset.processes.map((p) => ({ ...p }))
  );
  const [algorithm, setAlgorithmState] = useState<AlgorithmType>('RR');
  const [quantum, setQuantumState] = useState<number>(
    defaultPreset.recommendedQuantum
  );
  const [activePresetId, setActivePresetId] = useState<string | null>(
    defaultPreset.id
  );
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fcfsResult: SimulationResult = useMemo(
    () => runFCFS(processes),
    [processes]
  );

  const rrResult: SimulationResult = useMemo(
    () => runRoundRobin(processes, quantum),
    [processes, quantum]
  );

  const simulationResult: SimulationResult =
    algorithm === 'FCFS' ? fcfsResult : rrResult;

  const totalDuration = simulationResult.totalDuration;
  const clampedTime = Math.min(Math.max(0, currentTime), totalDuration);

  const currentStep: SimulationStep =
    simulationResult.timeline[clampedTime] ??
    simulationResult.timeline[simulationResult.timeline.length - 1] ??
    FALLBACK_STEP;

  useEffect(() => {
    if (!isPlaying) return;
    if (clampedTime >= totalDuration) {
      setIsPlaying(false);
      return;
    }

    const intervalMs = Math.round(900 / speed);
    const timer = window.setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        const next = prev + 1;
        if (next >= totalDuration) {
          setIsPlaying(false);
        }
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, clampedTime, totalDuration, speed]);

  const setAlgorithm = useCallback((algo: AlgorithmType) => {
    setIsPlaying(false);
    setAlgorithmState(algo);
    setCurrentTime(0);
    setValidationError(null);
  }, []);

  const setQuantum = useCallback((q: number): boolean => {
    if (!Number.isInteger(q) || q < 1 || q > 20) {
      setValidationError('اندازه کوانتوم زمانی باید عددی صحیح بین ۱ تا ۲۰ باشد.');
      return false;
    }
    setIsPlaying(false);
    setQuantumState(q);
    setCurrentTime(0);
    setValidationError(null);
    return true;
  }, []);

  const loadPreset = useCallback((presetId: string) => {
    const found = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (!found) return;
    setIsPlaying(false);
    setProcesses(found.processes.map((p) => ({ ...p })));
    setQuantumState(found.recommendedQuantum);
    setActivePresetId(found.id);
    setCurrentTime(0);
    setValidationError(null);
  }, []);

  const addProcess = useCallback(
    (arrivalTime: number, burstTime: number): boolean => {
      if (processes.length >= 10) {
        setValidationError('حداکثر ۱۰ فرایند قابل تعریف است.');
        return false;
      }
      if (!Number.isInteger(arrivalTime) || arrivalTime < 0 || arrivalTime > 100) {
        setValidationError('زمان ورود (AT) باید عددی صحیح بین ۰ تا ۱۰۰ باشد.');
        return false;
      }
      if (!Number.isInteger(burstTime) || burstTime < 1 || burstTime > 50) {
        setValidationError('زمان اجرا (BT) باید عددی صحیح بین ۱ تا ۵۰ باشد.');
        return false;
      }

      const usedNums = processes
        .map((p) => parseInt(p.pid.replace(/\D/g, ''), 10))
        .filter((n) => !Number.isNaN(n));
      const nextNum = usedNums.length > 0 ? Math.max(...usedNums) + 1 : 1;
      const newPid = `P${nextNum}`;
      const color = getProcessColor(nextNum - 1);

      setIsPlaying(false);
      setProcesses((prev) => [
        ...prev,
        { pid: newPid, arrivalTime, burstTime, color },
      ]);
      setActivePresetId(null);
      setCurrentTime(0);
      setValidationError(null);
      return true;
    },
    [processes]
  );

  const updateProcess = useCallback(
    (pid: string, arrivalTime: number, burstTime: number): boolean => {
      if (!Number.isInteger(arrivalTime) || arrivalTime < 0 || arrivalTime > 100) {
        setValidationError('زمان ورود (AT) باید عددی صحیح بین ۰ تا ۱۰۰ باشد.');
        return false;
      }
      if (!Number.isInteger(burstTime) || burstTime < 1 || burstTime > 50) {
        setValidationError('زمان اجرا (BT) باید عددی صحیح بین ۱ تا ۵۰ باشد.');
        return false;
      }

      setIsPlaying(false);
      setProcesses((prev) =>
        prev.map((p) =>
          p.pid === pid ? { ...p, arrivalTime, burstTime } : p
        )
      );
      setActivePresetId(null);
      setCurrentTime(0);
      setValidationError(null);
      return true;
    },
    []
  );

  const removeProcess = useCallback(
    (pid: string): boolean => {
      if (processes.length <= 1) {
        setValidationError('حداقل یک فرایند باید در آزمایشگاه باقی بماند.');
        return false;
      }
      setIsPlaying(false);
      setProcesses((prev) => prev.filter((p) => p.pid !== pid));
      setActivePresetId(null);
      setCurrentTime(0);
      setValidationError(null);
      return true;
    },
    [processes.length]
  );

  const clearError = useCallback(() => setValidationError(null), []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev && clampedTime >= totalDuration) {
        setCurrentTime(0);
      }
      return !prev;
    });
  }, [clampedTime, totalDuration]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime((prev) => Math.min(totalDuration, prev + 1));
  }, [totalDuration]);

  const stepBackward = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime((prev) => Math.max(0, prev - 1));
  }, []);

  const jumpToEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(totalDuration);
  }, [totalDuration]);

  const seekTo = useCallback(
    (time: number) => {
      setIsPlaying(false);
      const rounded = Math.round(time);
      setCurrentTime(Math.min(Math.max(0, rounded), totalDuration));
    },
    [totalDuration]
  );

  return {
    processes,
    algorithm,
    quantum,
    activePresetId,
    validationError,
    simulationResult,
    fcfsResult,
    rrResult,
    currentTime: clampedTime,
    totalDuration,
    currentStep,
    isPlaying,
    speed,
    setAlgorithm,
    setQuantum,
    loadPreset,
    addProcess,
    updateProcess,
    removeProcess,
    clearError,
    togglePlay,
    reset,
    stepForward,
    stepBackward,
    jumpToEnd,
    seekTo,
    setSpeed,
  };
}