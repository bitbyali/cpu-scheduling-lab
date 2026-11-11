export type AlgorithmType = 'FCFS' | 'RR';

export type ProcessRuntimeStatus = 'FUTURE' | 'READY' | 'RUNNING' | 'COMPLETED';

export interface ProcessItem {
  pid: string;
  arrivalTime: number;
  burstTime: number;
  color: string;
}

export interface GanttSegment {
  id: string;
  pid: string;
  color: string;
  start: number;
  end: number;
  duration: number;
  remainingAfter: number;
  explanation: string;
}

export interface ProcessMetrics {
  pid: string;
  color: string;
  arrivalTime: number;
  burstTime: number;
  firstStartTime: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
  contextCount: number;
}

export interface ReadyQueueEntry {
  pid: string;
  color: string;
  arrivalTime: number;
  burstTime: number;
  remainingBurst: number;
  isPreemptedReturn: boolean;
}

export interface ProcessStepSnapshot {
  pid: string;
  color: string;
  arrivalTime: number;
  burstTime: number;
  remainingBurst: number;
  executedBurst: number;
  waitingTimeSoFar: number;
  status: ProcessRuntimeStatus;
  queuePosition: number | null;
  isPreemptedReturn: boolean;
}

export interface CpuStepState {
  status: 'IDLE' | 'RUNNING' | 'COMPLETED';
  activePid: string | null;
  activeColor: string | null;
  segmentStart: number | null;
  segmentEnd: number | null;
  sliceElapsed: number;
  sliceDuration: number;
  quantumTotal: number | null;
  quantumRemaining: number | null;
  remainingBurstOfActive: number;
}

export interface SimulationStep {
  time: number;
  cpu: CpuStepState;
  readyQueue: ReadyQueueEntry[];
  processes: ProcessStepSnapshot[];
  completedPids: string[];
  activeSegmentId: string | null;
  headline: string;
  details: string[];
}

export interface SimulationResult {
  algorithm: AlgorithmType;
  algorithmTitle: string;
  quantum: number | null;
  processes: ProcessItem[];
  gantt: GanttSegment[];
  metrics: ProcessMetrics[];
  avgTurnaroundTime: number;
  avgWaitingTime: number;
  avgResponseTime: number;
  totalDuration: number;
  totalIdleTime: number;
  cpuUtilization: number;
  contextSwitches: number;
  timeline: SimulationStep[];
}

export interface PresetScenario {
  id: string;
  title: string;
  badge: string;
  educationalPoint: string;
  recommendedQuantum: number;
  processes: ProcessItem[];
}