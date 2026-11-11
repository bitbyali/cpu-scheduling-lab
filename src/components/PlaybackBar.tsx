import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepBack,
  StepForward,
  FastForward,
} from 'lucide-react';
import { SimulationStep } from '../types/scheduling';
import { PlaybackSpeed } from '../engine/useSimulation';

interface PlaybackBarProps {
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  currentStep: SimulationStep;
  onTogglePlay: () => void;
  onReset: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onJumpToEnd: () => void;
  onSeekTo: (time: number) => void;
  onChangeSpeed: (speed: PlaybackSpeed) => void;
}

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2, 4];

export const PlaybackBar: React.FC<PlaybackBarProps> = ({
  currentTime,
  totalDuration,
  isPlaying,
  speed,
  currentStep,
  onTogglePlay,
  onReset,
  onStepBackward,
  onStepForward,
  onJumpToEnd,
  onSeekTo,
  onChangeSpeed,
}) => {
  const ticks = Array.from({ length: totalDuration + 1 }, (_, idx) => idx);

  return (
    <section className="luxury-card playback-card" aria-label="کنترل اجرای شبیه‌سازی">
      <div className="playback-top-row">
        <div className="clock-box">
          <div className="digital-clock" title="ساعت منطقی شبیه‌سازی">
            t = {currentTime} / {totalDuration}
          </div>
          <div className="step-headline-box">
            <div className="step-headline">{currentStep.headline}</div>
            {currentStep.details.length > 0 && (
              <div className="step-subevent">{currentStep.details[0]}</div>
            )}
          </div>
        </div>

        <div className="transport-buttons">
          <button
            type="button"
            className="ctrl-btn"
            onClick={onReset}
            disabled={currentTime === 0 && !isPlaying}
            title="بازنشانی به لحظه صفر (Reset)"
          >
            <RotateCcw size={16} />
            <span>ریست</span>
          </button>

          <button
            type="button"
            className="ctrl-btn"
            onClick={onStepBackward}
            disabled={currentTime <= 0}
            title="یک گام به عقب (Step Backward: t - 1)"
          >
            <StepForward size={16} />
            <span>گام قبل</span>
          </button>

          <button
            type="button"
            className="ctrl-btn ctrl-btn-play"
            onClick={onTogglePlay}
            title={isPlaying ? 'توقف (Pause)' : 'شروع پخش خودکار (Play)'}
          >
            {isPlaying ? (
              <>
                <Pause size={17} />
                <span>توقف</span>
              </>
            ) : (
              <>
                <Play size={17} />
                <span>{currentTime >= totalDuration ? 'پخش مجدد' : 'اجرا'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="ctrl-btn"
            onClick={onStepForward}
            disabled={currentTime >= totalDuration}
            title="یک گام به جلو (Step Forward: t + 1)"
          >
            <span>گام بعد</span>
            <StepBack size={16} />
          </button>

          <button
            type="button"
            className="ctrl-btn"
            onClick={onJumpToEnd}
            disabled={currentTime >= totalDuration}
            title="پرش به پایان شبیه‌سازی"
          >
            <FastForward size={16} />
          </button>

          <div className="speed-selector" aria-label="سرعت پخش">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                className={`speed-btn ${speed === s ? 'active' : ''}`}
                onClick={() => onChangeSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="timeline-scrubber-wrap">
        <input
          type="range"
          min={0}
          max={totalDuration}
          step={1}
          value={currentTime}
          onChange={(e) => onSeekTo(Number(e.target.value))}
          className="timeline-range"
          aria-label="اسلایدر زمان شبیه‌سازی"
          style={{ direction: 'ltr' }}
        />

        {totalDuration <= 24 && (
          <div className="timeline-ticks">
            {ticks.map((t) => (
              <button
                key={t}
                type="button"
                className={`tick-btn ${t === currentTime ? 'active' : ''}`}
                onClick={() => onSeekTo(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};