import {
  GanttSegment,
  ProcessItem,
  ProcessMetrics,
  ProcessRuntimeStatus,
  ProcessStepSnapshot,
  ReadyQueueEntry,
  SimulationResult,
  SimulationStep,
} from '../types/scheduling';

function roundTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function createEmptyResult(
  algorithm: 'FCFS' | 'RR',
  quantum: number | null
): SimulationResult {
  return {
    algorithm,
    algorithmTitle:
      algorithm === 'FCFS'
        ? 'FCFS (First Come, First Served)'
        : `Round Robin (Q=${quantum ?? 2})`,
    quantum,
    processes: [],
    gantt: [],
    metrics: [],
    avgTurnaroundTime: 0,
    avgWaitingTime: 0,
    avgResponseTime: 0,
    totalDuration: 0,
    totalIdleTime: 0,
    cpuUtilization: 0,
    contextSwitches: 0,
    timeline: [],
  };
}

/**
 * اجرای قطعی الگوریتم غیرپیش‌دستانه FCFS (First Come, First Served)
 * مستقل از React و ساعت مرورگر
 */
export function runFCFS(processes: ProcessItem[]): SimulationResult {
  if (processes.length === 0) {
    return createEmptyResult('FCFS', null);
  }

  const indexed = processes.map((p, idx) => ({ ...p, originalIndex: idx }));
  const sorted = [...indexed].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) {
      return a.arrivalTime - b.arrivalTime;
    }
    return a.originalIndex - b.originalIndex;
  });

  const gantt: GanttSegment[] = [];
  const metricsMap = new Map<string, ProcessMetrics>();
  let currentTime = 0;
  let totalIdleTime = 0;

  for (const proc of sorted) {
    if (currentTime < proc.arrivalTime) {
      const idleDuration = proc.arrivalTime - currentTime;
      gantt.push({
        id: `fcfs-idle-${currentTime}-${proc.arrivalTime}`,
        pid: 'Idle',
        color: '#475569',
        start: currentTime,
        end: proc.arrivalTime,
        duration: idleDuration,
        remainingAfter: 0,
        explanation: `در بازه [${currentTime}, ${proc.arrivalTime}) هیچ پردازشی در صف آماده نیست و پردازنده بیکار (Idle) می‌ماند.`,
      });
      totalIdleTime += idleDuration;
      currentTime = proc.arrivalTime;
    }

    const start = currentTime;
    const end = currentTime + proc.burstTime;

    gantt.push({
      id: `fcfs-seg-${proc.pid}-${start}-${end}`,
      pid: proc.pid,
      color: proc.color,
      start,
      end,
      duration: proc.burstTime,
      remainingAfter: 0,
      explanation: `پردازش ${proc.pid} به‌عنوان قدیمی‌ترین پردازش صف آماده در t=${start} انتخاب شده و به‌صورت غیرپیش‌دستانه تا پایان کامل کار خود در t=${end} اجرا می‌شود.`,
    });

    const turnaroundTime = end - proc.arrivalTime;
    const waitingTime = turnaroundTime - proc.burstTime;
    const responseTime = start - proc.arrivalTime;

    metricsMap.set(proc.pid, {
      pid: proc.pid,
      color: proc.color,
      arrivalTime: proc.arrivalTime,
      burstTime: proc.burstTime,
      firstStartTime: start,
      completionTime: end,
      turnaroundTime,
      waitingTime,
      responseTime,
      contextCount: 1,
    });

    currentTime = end;
  }

  const totalDuration = currentTime;
  const metrics = processes.map((p) => metricsMap.get(p.pid)!);
  const n = metrics.length;

  const avgTurnaroundTime = roundTwo(
    metrics.reduce((acc, m) => acc + m.turnaroundTime, 0) / n
  );
  const avgWaitingTime = roundTwo(
    metrics.reduce((acc, m) => acc + m.waitingTime, 0) / n
  );
  const avgResponseTime = roundTwo(
    metrics.reduce((acc, m) => acc + m.responseTime, 0) / n
  );

  const busySegments = gantt.filter((s) => s.pid !== 'Idle');
  const contextSwitches = Math.max(0, busySegments.length - 1);

  const cpuUtilization =
    totalDuration > 0
      ? roundTwo(((totalDuration - totalIdleTime) / totalDuration) * 100)
      : 100;

  const timeline = buildFcfsTimeline(processes, sorted, gantt, metricsMap, totalDuration);

  return {
    algorithm: 'FCFS',
    algorithmTitle: 'FCFS (First Come, First Served)',
    quantum: null,
    processes,
    gantt,
    metrics,
    avgTurnaroundTime,
    avgWaitingTime,
    avgResponseTime,
    totalDuration,
    totalIdleTime,
    cpuUtilization,
    contextSwitches,
    timeline,
  };
}

function buildFcfsTimeline(
  processes: ProcessItem[],
  sortedOrder: Array<ProcessItem & { originalIndex: number }>,
  gantt: GanttSegment[],
  metricsMap: Map<string, ProcessMetrics>,
  totalDuration: number
): SimulationStep[] {
  const steps: SimulationStep[] = [];

  for (let t = 0; t <= totalDuration; t++) {
    const details: string[] = [];

    for (const p of sortedOrder) {
      if (p.arrivalTime === t) {
        details.push(`ورود پردازش ${p.pid} به سیستم در لحظه t=${t} (Burst=${p.burstTime}).`);
      }
      const m = metricsMap.get(p.pid)!;
      if (m.completionTime === t && t > 0) {
        details.push(`تکمیل کامل پردازش ${p.pid} در لحظه t=${t}.`);
      }
    }

    if (t === totalDuration) {
      const finalSnapshots: ProcessStepSnapshot[] = processes.map((p) => {
        const m = metricsMap.get(p.pid)!;
        return {
          pid: p.pid,
          color: p.color,
          arrivalTime: p.arrivalTime,
          burstTime: p.burstTime,
          remainingBurst: 0,
          executedBurst: p.burstTime,
          waitingTimeSoFar: m.waitingTime,
          status: 'COMPLETED',
          queuePosition: null,
          isPreemptedReturn: false,
        };
      });

      steps.push({
        time: t,
        cpu: {
          status: 'COMPLETED',
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
        processes: finalSnapshots,
        completedPids: sortedOrder.map((p) => p.pid),
        activeSegmentId: null,
        headline: `پایان کامل شبیه‌سازی FCFS در لحظه t=${t}`,
        details:
          details.length > 0
            ? details
            : [`تمامی پردازش‌ها با موفقیت اجرا و تکمیل شدند.`],
      });
      continue;
    }

    const activeSeg =
      gantt.find((seg) => t >= seg.start && t < seg.end) || null;

    if (activeSeg && activeSeg.start === t) {
      if (activeSeg.pid === 'Idle') {
        details.push(`شروع بازه بیکاری پردازنده (Idle) از t=${activeSeg.start} تا t=${activeSeg.end}.`);
      } else {
        details.push(
          `انتخاب پردازش ${activeSeg.pid} از ابتدای صف آماده و شروع اجرای یک‌سره از t=${activeSeg.start} تا t=${activeSeg.end}.`
        );
      }
    }

    const readyQueue: ReadyQueueEntry[] = [];
    for (const p of sortedOrder) {
      const m = metricsMap.get(p.pid)!;
      if (p.arrivalTime <= t && m.firstStartTime > t) {
        readyQueue.push({
          pid: p.pid,
          color: p.color,
          arrivalTime: p.arrivalTime,
          burstTime: p.burstTime,
          remainingBurst: p.burstTime,
          isPreemptedReturn: false,
        });
      }
    }

    const completedPids = sortedOrder
      .filter((p) => metricsMap.get(p.pid)!.completionTime <= t)
      .map((p) => p.pid);

    const processSnapshots: ProcessStepSnapshot[] = processes.map((p) => {
      const m = metricsMap.get(p.pid)!;
      let status: ProcessRuntimeStatus = 'FUTURE';
      let executedBurst = 0;
      let waitingTimeSoFar = 0;
      let queuePosition: number | null = null;

      if (t < p.arrivalTime) {
        status = 'FUTURE';
        executedBurst = 0;
        waitingTimeSoFar = 0;
      } else if (t >= m.completionTime) {
        status = 'COMPLETED';
        executedBurst = p.burstTime;
        waitingTimeSoFar = m.waitingTime;
      } else if (activeSeg && activeSeg.pid === p.pid) {
        status = 'RUNNING';
        executedBurst = t - m.firstStartTime;
        waitingTimeSoFar = m.waitingTime;
      } else {
        status = 'READY';
        executedBurst = 0;
        waitingTimeSoFar = t - p.arrivalTime;
        const qIdx = readyQueue.findIndex((q) => q.pid === p.pid);
        queuePosition = qIdx >= 0 ? qIdx + 1 : null;
      }

      return {
        pid: p.pid,
        color: p.color,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        remainingBurst: Math.max(0, p.burstTime - executedBurst),
        executedBurst,
        waitingTimeSoFar,
        status,
        queuePosition,
        isPreemptedReturn: false,
      };
    });

    const isBusy = activeSeg !== null && activeSeg.pid !== 'Idle';
    const sliceElapsed = activeSeg ? t - activeSeg.start : 0;
    const sliceDuration = activeSeg ? activeSeg.duration : 0;
    const remainingBurstOfActive =
      isBusy && activeSeg
        ? activeSeg.end - t
        : 0;

    const headline = isBusy
      ? `t=${t} | اجرای غیرپیش‌دستانه ${activeSeg!.pid} روی پردازنده (باقی‌مانده: ${remainingBurstOfActive} واحد)`
      : `t=${t} | پردازنده در حالت بیکار (Idle)`;

    if (details.length === 0 && isBusy) {
      details.push(
        `ادامه اجرای پردازش ${activeSeg!.pid} روی CPU؛ صف آماده فعلی: ${
          readyQueue.length > 0 ? readyQueue.map((q) => q.pid).join(' ← ') : 'خالی'
        }.`
      );
    }

    steps.push({
      time: t,
      cpu: {
        status: isBusy ? 'RUNNING' : 'IDLE',
        activePid: isBusy ? activeSeg!.pid : null,
        activeColor: isBusy ? activeSeg!.color : null,
        segmentStart: activeSeg ? activeSeg.start : null,
        segmentEnd: activeSeg ? activeSeg.end : null,
        sliceElapsed,
        sliceDuration,
        quantumTotal: null,
        quantumRemaining: null,
        remainingBurstOfActive,
      },
      readyQueue,
      processes: processSnapshots,
      completedPids,
      activeSegmentId: activeSeg ? activeSeg.id : null,
      headline,
      details,
    });
  }

  return steps;
}