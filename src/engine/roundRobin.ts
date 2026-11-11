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
import { createEmptyResult } from './fcfs';

function roundTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

interface InternalQueueItem {
  pid: string;
  isPreemptedReturn: boolean;
}

export function runRoundRobin(
  processes: ProcessItem[],
  quantum: number
): SimulationResult {
  const safeQuantum = Math.max(1, Math.floor(quantum || 1));

  if (processes.length === 0) {
    return createEmptyResult('RR', safeQuantum);
  }

  const n = processes.length;
  const procMap = new Map<string, ProcessItem>();
  processes.forEach((p) => procMap.set(p.pid, p));

  const indexed = processes.map((p, idx) => ({ ...p, originalIndex: idx }));
  const sortedByArrival = [...indexed].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) {
      return a.arrivalTime - b.arrivalTime;
    }
    return a.originalIndex - b.originalIndex;
  });

  const remainingMap = new Map<string, number>();
  const firstStartMap = new Map<string, number>();
  const completionMap = new Map<string, number>();
  const sliceCountMap = new Map<string, number>();
  const eventsAtTime = new Map<number, string[]>();

  const addEvent = (t: number, msg: string) => {
    if (!eventsAtTime.has(t)) {
      eventsAtTime.set(t, []);
    }
    eventsAtTime.get(t)!.push(msg);
  };

  processes.forEach((p) => {
    remainingMap.set(p.pid, p.burstTime);
    sliceCountMap.set(p.pid, 0);
  });

  const gantt: GanttSegment[] = [];
  const queue: InternalQueueItem[] = [];
  let arrivedIdx = 0;
  let currentTime = 0;
  let completedCount = 0;
  let totalIdleTime = 0;

  const queueAtTick = new Map<number, ReadyQueueEntry[]>();

  while (
    arrivedIdx < n &&
    sortedByArrival[arrivedIdx].arrivalTime <= currentTime
  ) {
    const arriving = sortedByArrival[arrivedIdx];
    queue.push({ pid: arriving.pid, isPreemptedReturn: false });
    addEvent(
      currentTime,
      `ورود پردازش ${arriving.pid} به صف آماده در لحظه t=${currentTime} (Burst=${arriving.burstTime}).`
    );
    arrivedIdx++;
  }

  while (completedCount < n) {
    if (queue.length === 0) {
      const nextArrivalTime = sortedByArrival[arrivedIdx].arrivalTime;
      const idleDuration = nextArrivalTime - currentTime;

      for (let tick = currentTime; tick < nextArrivalTime; tick++) {
        queueAtTick.set(tick, []);
      }

      gantt.push({
        id: `rr-idle-${currentTime}-${nextArrivalTime}`,
        pid: 'Idle',
        color: '#475569',
        start: currentTime,
        end: nextArrivalTime,
        duration: idleDuration,
        remainingAfter: 0,
        explanation: `صف آماده خالی است؛ پردازنده در بازه [${currentTime}, ${nextArrivalTime}) بیکار (Idle) می‌ماند.`,
      });

      addEvent(
        currentTime,
        `صف آماده خالی است؛ شروع بازه بیکاری پردازنده تا لحظه t=${nextArrivalTime}.`
      );

      totalIdleTime += idleDuration;
      currentTime = nextArrivalTime;

      while (
        arrivedIdx < n &&
        sortedByArrival[arrivedIdx].arrivalTime <= currentTime
      ) {
        const arriving = sortedByArrival[arrivedIdx];
        queue.push({ pid: arriving.pid, isPreemptedReturn: false });
        addEvent(
          currentTime,
          `ورود پردازش ${arriving.pid} به صف آماده در لحظه t=${currentTime} (Burst=${arriving.burstTime}).`
        );
        arrivedIdx++;
      }
      continue;
    }

    const currentItem = queue.shift()!;
    const pid = currentItem.pid;
    const proc = procMap.get(pid)!;
    const remBefore = remainingMap.get(pid)!;

    if (!firstStartMap.has(pid)) {
      firstStartMap.set(pid, currentTime);
    }
    sliceCountMap.set(pid, (sliceCountMap.get(pid) || 0) + 1);

    const execDuration = Math.min(safeQuantum, remBefore);
    const start = currentTime;
    const end = currentTime + execDuration;
    const remAfter = remBefore - execDuration;

    addEvent(
      start,
      `تخصیص پردازنده به ${pid} در بازه [${start}, ${end}) به مدت ${execDuration} واحد (حداکثر کوانتوم Q=${safeQuantum}).`
    );

    for (let tick = start; tick < end; tick++) {
      while (
        arrivedIdx < n &&
        sortedByArrival[arrivedIdx].arrivalTime <= tick
      ) {
        const arriving = sortedByArrival[arrivedIdx];
        queue.push({ pid: arriving.pid, isPreemptedReturn: false });
        addEvent(
          tick,
          `ورود پردازش ${arriving.pid} به انتهای صف آماده در لحظه t=${tick} (Burst=${arriving.burstTime}).`
        );
        arrivedIdx++;
      }

      queueAtTick.set(
        tick,
        queue.map((qItem) => {
          const qp = procMap.get(qItem.pid)!;
          return {
            pid: qItem.pid,
            color: qp.color,
            arrivalTime: qp.arrivalTime,
            burstTime: qp.burstTime,
            remainingBurst: remainingMap.get(qItem.pid)!,
            isPreemptedReturn: qItem.isPreemptedReturn,
          };
        })
      );
    }

    currentTime = end;
    remainingMap.set(pid, remAfter);

    const newlyArrivedAtEnd: string[] = [];
    while (
      arrivedIdx < n &&
      sortedByArrival[arrivedIdx].arrivalTime <= currentTime
    ) {
      const arriving = sortedByArrival[arrivedIdx];
      queue.push({ pid: arriving.pid, isPreemptedReturn: false });
      newlyArrivedAtEnd.push(arriving.pid);
      addEvent(
        currentTime,
        `ورود پردازش ${arriving.pid} به صف آماده در لحظه مرزی t=${currentTime} (پیش از بازگشت پردازش ناتمام).`
      );
      arrivedIdx++;
    }

    let explanation = '';
    if (remAfter > 0) {
      queue.push({ pid, isPreemptedReturn: true });
      const queueNames = queue.map((q) => q.pid).join(' ← ');
      addEvent(
        currentTime,
        `پایان کوانتوم ${pid} در t=${currentTime} (باقی‌مانده: ${remAfter} واحد) و بازگشت به انتهای صف آماده [${queueNames}].`
      );
      explanation =
        newlyArrivedAtEnd.length > 0
          ? `اجرای ${pid} به اندازه کوانتوم Q=${safeQuantum} در [${start}, ${end}). در t=${end} ابتدا ${newlyArrivedAtEnd.join(
              '، '
            )} وارد صف شده و سپس ${pid} با ${remAfter} واحد کار باقی‌مانده به انتهای صف برمی‌گردد.`
          : `اجرای ${pid} به اندازه کوانتوم Q=${safeQuantum} در [${start}, ${end})؛ به دلیل باقی ماندن ${remAfter} واحد، به انتهای صف آماده منتقل می‌شود.`;
    } else {
      completionMap.set(pid, currentTime);
      completedCount++;
      addEvent(
        currentTime,
        `تکمیل کامل پردازش ${pid} در لحظه t=${currentTime}.`
      );
      explanation = `اجرای ${execDuration} واحد پایانی پردازش ${pid} در [${start}, ${end}) و خروج کامل آن از سیستم در t=${end}.`;
    }

    gantt.push({
      id: `rr-seg-${pid}-${start}-${end}`,
      pid,
      color: proc.color,
      start,
      end,
      duration: execDuration,
      remainingAfter: remAfter,
      explanation,
    });
  }

  const totalDuration = currentTime;

  const metrics: ProcessMetrics[] = processes.map((p) => {
    const firstStartTime = firstStartMap.get(p.pid)!;
    const completionTime = completionMap.get(p.pid)!;
    const turnaroundTime = completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;
    const responseTime = firstStartTime - p.arrivalTime;

    return {
      pid: p.pid,
      color: p.color,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      firstStartTime,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
      contextCount: sliceCountMap.get(p.pid) || 1,
    };
  });

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
  let contextSwitches = 0;
  for (let i = 1; i < busySegments.length; i++) {
    if (busySegments[i].pid !== busySegments[i - 1].pid) {
      contextSwitches++;
    }
  }

  const cpuUtilization =
    totalDuration > 0
      ? roundTwo(((totalDuration - totalIdleTime) / totalDuration) * 100)
      : 100;

  const timeline = buildRoundRobinTimeline(
    processes,
    gantt,
    metrics,
    queueAtTick,
    eventsAtTime,
    safeQuantum,
    totalDuration
  );

  return {
    algorithm: 'RR',
    algorithmTitle: `Round Robin (Q=${safeQuantum})`,
    quantum: safeQuantum,
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

function buildRoundRobinTimeline(
  processes: ProcessItem[],
  gantt: GanttSegment[],
  metrics: ProcessMetrics[],
  queueAtTick: Map<number, ReadyQueueEntry[]>,
  eventsAtTime: Map<number, string[]>,
  quantum: number,
  totalDuration: number
): SimulationStep[] {
  const steps: SimulationStep[] = [];
  const metricsMap = new Map<string, ProcessMetrics>();
  metrics.forEach((m) => metricsMap.set(m.pid, m));

  const getExecutedUntil = (pid: string, t: number): number => {
    let executed = 0;
    for (const seg of gantt) {
      if (seg.pid !== pid) continue;
      if (seg.end <= t) {
        executed += seg.duration;
      } else if (seg.start < t && t < seg.end) {
        executed += t - seg.start;
      }
    }
    return executed;
  };

  for (let t = 0; t <= totalDuration; t++) {
    const details = eventsAtTime.get(t) ? [...eventsAtTime.get(t)!] : [];

    if (t === totalDuration) {
      const finalProcesses: ProcessStepSnapshot[] = processes.map((p) => {
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
          quantumTotal: quantum,
          quantumRemaining: 0,
          remainingBurstOfActive: 0,
        },
        readyQueue: [],
        processes: finalProcesses,
        completedPids: processes.map((p) => p.pid),
        activeSegmentId: null,
        headline: `پایان کامل شبیه‌سازی Round Robin (Q=${quantum}) در لحظه t=${t}`,
        details:
          details.length > 0
            ? details
            : ['تمامی پردازش‌ها با موفقیت به پایان رسیدند.'],
      });
      continue;
    }

    const activeSeg =
      gantt.find((seg) => t >= seg.start && t < seg.end) || null;
    const readyQueue = queueAtTick.get(t) || [];

    const completedPids = processes
      .filter((p) => metricsMap.get(p.pid)!.completionTime <= t)
      .map((p) => p.pid);

    const processSnapshots: ProcessStepSnapshot[] = processes.map((p) => {
      const m = metricsMap.get(p.pid)!;
      const executedBurst = getExecutedUntil(p.pid, t);
      const remainingBurst = Math.max(0, p.burstTime - executedBurst);
      let status: ProcessRuntimeStatus = 'FUTURE';
      let waitingTimeSoFar = 0;
      let queuePosition: number | null = null;
      let isPreemptedReturn = false;

      if (t < p.arrivalTime) {
        status = 'FUTURE';
        waitingTimeSoFar = 0;
      } else if (t >= m.completionTime) {
        status = 'COMPLETED';
        waitingTimeSoFar = m.waitingTime;
      } else if (activeSeg && activeSeg.pid === p.pid) {
        status = 'RUNNING';
        waitingTimeSoFar = t - p.arrivalTime - executedBurst;
      } else {
        status = 'READY';
        waitingTimeSoFar = t - p.arrivalTime - executedBurst;
        const qIdx = readyQueue.findIndex((q) => q.pid === p.pid);
        if (qIdx >= 0) {
          queuePosition = qIdx + 1;
          isPreemptedReturn = readyQueue[qIdx].isPreemptedReturn;
        }
      }

      return {
        pid: p.pid,
        color: p.color,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        remainingBurst,
        executedBurst,
        waitingTimeSoFar,
        status,
        queuePosition,
        isPreemptedReturn,
      };
    });

    const isBusy = activeSeg !== null && activeSeg.pid !== 'Idle';
    const sliceElapsed = activeSeg ? t - activeSeg.start : 0;
    const sliceDuration = activeSeg ? activeSeg.duration : 0;
    const quantumRemaining = isBusy ? quantum - sliceElapsed : null;

    const activeProcSnap = isBusy
      ? processSnapshots.find((p) => p.pid === activeSeg!.pid)
      : null;
    const remainingBurstOfActive = activeProcSnap
      ? activeProcSnap.remainingBurst
      : 0;

    const headline = isBusy
      ? `t=${t} | اجرای ${activeSeg!.pid} (کوانتوم باقی‌مانده: ${quantumRemaining} از ${quantum} | کار باقی‌مانده: ${remainingBurstOfActive})`
      : `t=${t} | پردازنده در حالت بیکار (Idle)`;

    if (details.length === 0 && isBusy) {
      details.push(
        `ادامه اجرای کوانتوم فعلی ${activeSeg!.pid} روی CPU؛ صف آماده: ${
          readyQueue.length > 0
            ? readyQueue.map((q) => q.pid).join(' ← ')
            : 'خالی'
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
        quantumTotal: quantum,
        quantumRemaining,
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
