import React, { useState } from 'react';
import { BarChart3, Eye, Info, Sparkles } from 'lucide-react';
import { AlgorithmType, GanttSegment } from '../types/scheduling';

interface GanttChartProps {
  gantt: GanttSegment[];
  currentTime: number;
  totalDuration: number;
  algorithm: AlgorithmType;
  quantum: number;
  onSeekTo: (time: number) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  gantt,
  currentTime,
  totalDuration,
  algorithm,
  quantum,
  onSeekTo,
}) => {
  const [progressiveMode, setProgressiveMode] = useState<boolean>(false);
  const [selectedSegId, setSelectedSegId] = useState<string | null>(null);

  const activeTimeSegment =
    gantt.find((seg) => currentTime >= seg.start && currentTime < seg.end) ??
    (currentTime === totalDuration && gantt.length > 0
      ? gantt[gantt.length - 1]
      : null);

  const inspectedSegment =
    gantt.find((seg) => seg.id === selectedSegId) ?? activeTimeSegment;

  const playheadPercent =
    totalDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / totalDuration) * 100))
      : 0;

  const boundaryPoints = Array.from(
    new Set([0, ...gantt.map((s) => s.start), ...gantt.map((s) => s.end)])
  ).sort((a, b) => a - b);

  return (
    <section
      className="luxury-card gantt-section-card"
      aria-label="نمودار گانت زمان‌بندی پردازنده"
    >
      <div className="card-header">
        <div className="card-title">
          <BarChart3 size={19} color="#38BDF8" />
          <span>
            نمودار گانت تعاملی (Gantt Chart —{' '}
            {algorithm === 'FCFS' ? 'FCFS' : `Round Robin با Q=${quantum}`})
          </span>
        </div>

        <div className="gantt-header-actions">
          <button
            type="button"
            className={`gantt-mode-btn ${progressiveMode ? 'active' : ''}`}
            onClick={() => setProgressiveMode((prev) => !prev)}
            title="تغییر حالت بین نمایش کل نمودار و رشد تدریجی تا لحظه فعلی"
          >
            <Eye size={14} />
            <span>
              {progressiveMode
                ? 'حالت فعلی: رشد تدریجی تا لحظه t'
                : 'حالت فعلی: نمایش کامل + نشانگر زمان'}
            </span>
          </button>
        </div>
      </div>

      <div className="gantt-scroll-container">
        <div
          className="gantt-canvas"
          style={{
            minWidth: `${Math.max(580, gantt.length * 82)}px`,
          }}
        >
          <div className="gantt-track-wrapper">
            <div
              className="gantt-playhead-line"
              style={{ left: `${playheadPercent}%` }}
              aria-hidden="true"
            >
              <span className="gantt-playhead-tag mono">t={currentTime}</span>
            </div>

            <div className="gantt-bars-row">
              {gantt.map((seg) => {
                const widthPct =
                  totalDuration > 0 ? (seg.duration / totalDuration) * 100 : 0;
                const isIdle = seg.pid === 'Idle';
                const isCurrentRunning =
                  currentTime >= seg.start && currentTime < seg.end;
                const isPast = currentTime >= seg.end;
                const isFuture = currentTime <= seg.start;

                let fillFraction = 1;
                if (progressiveMode) {
                  if (isFuture) fillFraction = 0;
                  else if (isCurrentRunning) {
                    fillFraction = (currentTime - seg.start) / seg.duration;
                  } else {
                    fillFraction = 1;
                  }
                }

                const isSelected = inspectedSegment?.id === seg.id;

                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => {
                      setSelectedSegId(seg.id);
                      onSeekTo(seg.start);
                    }}
                    onMouseEnter={() => setSelectedSegId(seg.id)}
                    className={`gantt-segment-block ${
                      isIdle ? 'gantt-seg-idle' : ''
                    } ${isCurrentRunning ? 'gantt-seg-running' : ''} ${
                      isSelected ? 'gantt-seg-selected' : ''
                    } ${isFuture && !progressiveMode ? 'gantt-seg-future-dim' : ''}`}
                    style={{
                      width: `${widthPct}%`,
                      borderColor: isIdle ? '#475569' : seg.color,
                      background: isIdle
                        ? undefined
                        : `linear-gradient(180deg, ${seg.color}2e, ${seg.color}14)`,
                    }}
                    title={`${seg.pid}: [${seg.start}, ${seg.end}) — طول: ${seg.duration} واحد`}
                  >
                    {!isIdle && (
                      <div
                        className="gantt-segment-fill"
                        style={{
                          width: `${fillFraction * 100}%`,
                          backgroundColor: `${seg.color}44`,
                        }}
                      />
                    )}

                    <div className="gantt-segment-content">
                      <span
                        className="gantt-seg-pid mono"
                        style={{ color: isIdle ? '#94A3B8' : '#F8FAFC' }}
                      >
                        {isIdle ? 'IDLE' : seg.pid}
                      </span>
                      <span className="gantt-seg-range mono">
                        [{seg.start}, {seg.end})
                      </span>
                      <span className="gantt-seg-dur">
                        {seg.duration} واحد
                      </span>
                    </div>

                    {isPast && !isIdle && (
                      <span
                        className="gantt-seg-completed-dot"
                        style={{ backgroundColor: seg.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="gantt-axis-row">
              {boundaryPoints.map((pt) => {
                const leftPct =
                  totalDuration > 0 ? (pt / totalDuration) * 100 : 0;
                const isCurrentTick = pt === currentTime;
                return (
                  <button
                    key={`axis-pt-${pt}`}
                    type="button"
                    onClick={() => onSeekTo(pt)}
                    className={`gantt-axis-tick mono ${
                      isCurrentTick ? 'active-tick' : ''
                    }`}
                    style={{ left: `${leftPct}%` }}
                    title={`پرش به لحظه t=${pt}`}
                  >
                    <span className="gantt-tick-mark" />
                    <span className="gantt-tick-label">{pt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {inspectedSegment && (
        <div
          className="gantt-inspector-box"
          style={{
            borderRightColor:
              inspectedSegment.pid === 'Idle'
                ? '#64748B'
                : inspectedSegment.color,
          }}
        >
          <div className="gantt-inspector-header">
            <div className="gantt-inspector-title">
              <Info size={16} color="#38BDF8" />
              <span>جزئیات بازه زمانی انتخابی:</span>
              <span className="pid-badge mono">
                <span
                  className="color-dot"
                  style={{ backgroundColor: inspectedSegment.color }}
                />
                <span>{inspectedSegment.pid}</span>
              </span>
              <span className="mono gantt-inspector-badge">
                [{inspectedSegment.start}, {inspectedSegment.end}) — مدت:{' '}
                {inspectedSegment.duration} واحد
              </span>
              {inspectedSegment.pid !== 'Idle' && (
                <span className="mono gantt-inspector-badge">
                  باقی‌مانده پس از این بازه: {inspectedSegment.remainingAfter} واحد
                </span>
              )}
            </div>

            <span className="gantt-inspector-hint">
              <Sparkles size={13} />
              <span>با کلیک روی هر بلوک، زمان شبیه‌سازی به ابتدای آن بازه منتقل می‌شود</span>
            </span>
          </div>

          <p className="gantt-inspector-desc">{inspectedSegment.explanation}</p>
        </div>
      )}
    </section>
  );
};
