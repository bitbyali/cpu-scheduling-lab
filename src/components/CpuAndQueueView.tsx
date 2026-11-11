import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Layers,
  Activity,
  Clock,
  CheckCircle2,
  PauseCircle,
  ArrowLeft,
  RotateCcw,
  Timer,
} from 'lucide-react';
import {
  AlgorithmType,
  ProcessRuntimeStatus,
  SimulationStep,
} from '../types/scheduling';

interface CpuAndQueueViewProps {
  currentStep: SimulationStep;
  algorithm: AlgorithmType;
  quantum: number;
  totalDuration: number;
}

const STATUS_META: Record<
  ProcessRuntimeStatus,
  { labelFa: string; labelEn: string; className: string }
> = {
  FUTURE: {
    labelFa: 'آینده (نیامده)',
    labelEn: 'Future',
    className: 'status-badge-future',
  },
  READY: {
    labelFa: 'آماده در صف',
    labelEn: 'Ready',
    className: 'status-badge-ready',
  },
  RUNNING: {
    labelFa: 'در حال اجرا روی CPU',
    labelEn: 'Running',
    className: 'status-badge-running',
  },
  COMPLETED: {
    labelFa: 'تکمیل‌شده',
    labelEn: 'Completed',
    className: 'status-badge-completed',
  },
};

export const CpuAndQueueView: React.FC<CpuAndQueueViewProps> = ({
  currentStep,
  algorithm,
  quantum,
  totalDuration,
}) => {
  const { time, cpu, readyQueue, processes, details } = currentStep;

  const activeProcessSnap = cpu.activePid
    ? processes.find((p) => p.pid === cpu.activePid) ?? null
    : null;

  const activeTotalExecuted = activeProcessSnap
    ? activeProcessSnap.executedBurst
    : 0;
  const activeTotalBurst = activeProcessSnap ? activeProcessSnap.burstTime : 0;
  const activeOverallPercent =
    activeTotalBurst > 0
      ? Math.min(100, Math.round((activeTotalExecuted / activeTotalBurst) * 100))
      : 0;

  return (
    <div className="cpu-queue-wrapper">
      <div className="cpu-queue-top-grid">
        <section
          className="luxury-card cpu-core-card"
          style={{
            borderColor:
              cpu.status === 'RUNNING' && cpu.activeColor
                ? `${cpu.activeColor}77`
                : undefined,
            boxShadow:
              cpu.status === 'RUNNING' && cpu.activeColor
                ? `0 12px 32px -8px rgba(2, 6, 23, 0.75), 0 0 28px ${cpu.activeColor}26`
                : undefined,
          }}
          aria-label="وضعیت لحظه‌ای پردازنده (CPU)"
        >
          <div className="card-header">
            <div className="card-title">
              <Cpu
                size={19}
                color={
                  cpu.status === 'RUNNING' && cpu.activeColor
                    ? cpu.activeColor
                    : '#38BDF8'
                }
              />
              <span>هسته پردازنده (CPU Core)</span>
            </div>
            <span className="mono card-subtitle">
              t = {time} / {totalDuration}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {cpu.status === 'RUNNING' && cpu.activePid && activeProcessSnap ? (
              <motion.div
                key={`cpu-running-${cpu.activePid}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.16 }}
                className="cpu-active-box"
                style={{
                  borderColor: `${cpu.activeColor}66`,
                  background: `linear-gradient(135deg, ${cpu.activeColor}1c, rgba(15, 23, 42, 0.92))`,
                }}
              >
                <div className="cpu-active-header">
                  <div className="cpu-pid-pill">
                    <span
                      className="color-dot"
                      style={{
                        backgroundColor: cpu.activeColor ?? '#38BDF8',
                        width: 12,
                        height: 12,
                      }}
                    />
                    <span className="mono cpu-pid-text">{cpu.activePid}</span>
                    <span className="cpu-running-tag">در حال اجرا (RUNNING)</span>
                  </div>

                  <span className="mono cpu-slice-window">
                    بازه جاری: [{cpu.segmentStart}, {cpu.segmentEnd})
                  </span>
                </div>

                <div className="cpu-metrics-grid">
                  <div className="cpu-metric-item">
                    <span className="cpu-metric-label">زمان جاری</span>
                    <strong className="mono cpu-metric-val">t = {time}</strong>
                  </div>

                  <div className="cpu-metric-item">
                    <span className="cpu-metric-label">اجراشده (کل / برش)</span>
                    <strong className="mono cpu-metric-val">
                      {activeProcessSnap.executedBurst} از {activeProcessSnap.burstTime}{' '}
                      <span className="cpu-metric-sub">
                        (+{cpu.sliceElapsed} در این نوبت)
                      </span>
                    </strong>
                  </div>

                  <div className="cpu-metric-item">
                    <span className="cpu-metric-label">Burst باقی‌مانده</span>
                    <strong
                      className="mono cpu-metric-val"
                      style={{ color: cpu.activeColor ?? '#38BDF8' }}
                    >
                      {cpu.remainingBurstOfActive} واحد
                    </strong>
                  </div>

                  {algorithm === 'RR' && cpu.quantumTotal !== null && (
                    <div className="cpu-metric-item">
                      <span className="cpu-metric-label">کوانتوم باقی‌مانده</span>
                      <strong className="mono cpu-metric-val" style={{ color: '#F59E0B' }}>
                        {cpu.quantumRemaining} از {cpu.quantumTotal} (Q={quantum})
                      </strong>
                    </div>
                  )}
                </div>

                <div className="cpu-progress-section">
                  <div className="cpu-progress-labels">
                    <span>پیشرفت کل فرایند {cpu.activePid}</span>
                    <span className="mono">{activeOverallPercent}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${activeOverallPercent}%`,
                        backgroundColor: cpu.activeColor ?? '#38BDF8',
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ) : cpu.status === 'COMPLETED' ? (
              <motion.div
                key="cpu-completed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="cpu-state-placeholder cpu-completed-box"
              >
                <CheckCircle2 size={34} color="#10B981" />
                <div className="cpu-placeholder-title">
                  پایان کامل اجرای تمام فرایندها (t = {time})
                </div>
                <p className="cpu-placeholder-sub">
                  تمامی فرایندها CPU Burst خود را تکمیل کرده‌اند و پردازنده آزاد است.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="cpu-idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="cpu-state-placeholder cpu-idle-box"
              >
                <PauseCircle size={34} color="#94A3B8" />
                <div className="cpu-placeholder-title">
                  پردازنده در وضعیت بیکار (CPU IDLE)
                </div>
                <p className="cpu-placeholder-sub">
                  در لحظه <span className="mono">t = {time}</span> هیچ فرایند آماده‌ای در صف
                  حضور ندارد؛ منتظر ورود فرایند بعدی به سیستم هستیم.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section
          className="luxury-card ready-queue-card"
          aria-label="صف آماده (Ready Queue)"
        >
          <div className="card-header">
            <div className="card-title">
              <Layers size={19} color="#10B981" />
              <span>صف آماده (Ready Queue — FIFO)</span>
            </div>
            <span className="mono card-subtitle">
              تعداد منتظر: {readyQueue.length}
            </span>
          </div>

          <div className="queue-direction-bar">
            <span className="queue-pole-badge queue-head-badge">
              ابتدای صف (Head — اولویت بعدی ورود به CPU)
            </span>
            <ArrowLeft size={15} color="#64748B" />
            <span className="queue-pole-badge queue-tail-badge">
              انتهای صف (Tail — ورود جدید / بازگشت از کوانتوم)
            </span>
          </div>

          <div className="ready-queue-track">
            <AnimatePresence initial={false}>
              {readyQueue.length > 0 ? (
                readyQueue.map((item, idx) => (
                  <motion.div
                    layout
                    key={`rq-${item.pid}`}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="queue-node-card"
                    style={{
                      borderColor: `${item.color}66`,
                      background: `linear-gradient(135deg, ${item.color}18, rgba(15, 23, 42, 0.9))`,
                    }}
                  >
                    <div className="queue-node-top">
                      <span className="queue-rank-badge mono">#{idx + 1}</span>
                      <span className="pid-badge">
                        <span
                          className="color-dot"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="mono">{item.pid}</span>
                      </span>
                    </div>

                    <div className="queue-node-metrics mono">
                      <span>AT: {item.arrivalTime}</span>
                      <span>|</span>
                      <span style={{ color: item.color, fontWeight: 700 }}>
                        باقی‌مانده: {item.remainingBurst} از {item.burstTime}
                      </span>
                    </div>

                    {item.isPreemptedReturn ? (
                      <div className="queue-return-tag">
                        <RotateCcw size={11} />
                        <span>بازگشتی پس از پایان کوانتوم</span>
                      </div>
                    ) : (
                      <div className="queue-fresh-tag">
                        <Clock size={11} />
                        <span>ورود به صف در t={item.arrivalTime}</span>
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <motion.div
                  key="empty-queue"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="queue-empty-box"
                >
                  <span>در لحظه </span>
                  <strong className="mono">t = {time}</strong>
                  <span> هیچ فرایندی در صف آماده منتظر نیست.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {details.length > 0 && (
            <div className="step-events-log">
              <div className="step-events-title">
                <Activity size={14} color="#38BDF8" />
                <span>رویدادهای ثبت‌شده در لحظه t = {time}:</span>
              </div>
              <ul className="step-events-list">
                {details.map((ev, i) => (
                  <li key={i}>{ev}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <section
        className="luxury-card process-status-section"
        aria-label="وضعیت لحظه‌ای فرایندها"
      >
        <div className="card-header">
          <div className="card-title">
            <Timer size={19} color="#A855F7" />
            <span>وضعیت لحظه‌ای فرایندها (Process Status در t = {time})</span>
          </div>
          <div className="status-legend-row">
            <span className="legend-item">
              <span className="legend-dot status-dot-future" /> آینده (Future)
            </span>
            <span className="legend-item">
              <span className="legend-dot status-dot-ready" /> آماده (Ready)
            </span>
            <span className="legend-item">
              <span className="legend-dot status-dot-running" /> در حال اجرا (Running)
            </span>
            <span className="legend-item">
              <span className="legend-dot status-dot-completed" /> تکمیل‌شده (Completed)
            </span>
          </div>
        </div>

        <div className="process-status-grid">
          {processes.map((proc) => {
            const meta = STATUS_META[proc.status];
            const progressPct =
              proc.burstTime > 0
                ? Math.min(100, Math.round((proc.executedBurst / proc.burstTime) * 100))
                : 0;

            return (
              <div
                key={proc.pid}
                className={`proc-status-card ${
                  proc.status === 'RUNNING' ? 'proc-card-running' : ''
                }`}
                style={{
                  borderColor:
                    proc.status === 'RUNNING'
                      ? proc.color
                      : proc.status === 'READY'
                      ? `${proc.color}55`
                      : undefined,
                }}
              >
                <div className="proc-card-header">
                  <span className="pid-badge">
                    <span
                      className="color-dot"
                      style={{ backgroundColor: proc.color }}
                    />
                    <span className="mono">{proc.pid}</span>
                  </span>

                  <span className={`proc-status-badge ${meta.className}`}>
                    {meta.labelFa}
                  </span>
                </div>

                <div className="proc-card-stats mono">
                  <div className="proc-stat-box">
                    <span className="proc-stat-lbl">زمان ورود (AT)</span>
                    <strong>{proc.arrivalTime}</strong>
                  </div>
                  <div className="proc-stat-box">
                    <span className="proc-stat-lbl">کل نیاز (BT)</span>
                    <strong>{proc.burstTime}</strong>
                  </div>
                  <div className="proc-stat-box">
                    <span className="proc-stat-lbl">باقی‌مانده</span>
                    <strong style={{ color: proc.color }}>{proc.remainingBurst}</strong>
                  </div>
                  <div className="proc-stat-box">
                    <span className="proc-stat-lbl">انتظار تاکنون</span>
                    <strong>{proc.waitingTimeSoFar}</strong>
                  </div>
                </div>

                <div className="proc-progress-wrap">
                  <div className="proc-progress-info">
                    <span>
                      اجراشده: <strong className="mono">{proc.executedBurst}</strong> از{' '}
                      <strong className="mono">{proc.burstTime}</strong>
                    </span>
                    {proc.queuePosition !== null && (
                      <span className="queue-pos-pill">
                        نوبت صف: #{proc.queuePosition}
                      </span>
                    )}
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${progressPct}%`,
                        backgroundColor: proc.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
