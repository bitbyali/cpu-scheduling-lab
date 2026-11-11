import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { AlgorithmType, ProcessItem } from '../types/scheduling';
import { PRESET_SCENARIOS } from '../data/presets';

interface ControlPanelProps {
  processes: ProcessItem[];
  algorithm: AlgorithmType;
  quantum: number;
  activePresetId: string | null;
  validationError: string | null;
  onSelectAlgorithm: (algo: AlgorithmType) => void;
  onChangeQuantum: (q: number) => boolean;
  onLoadPreset: (presetId: string) => void;
  onAddProcess: (arrivalTime: number, burstTime: number) => boolean;
  onUpdateProcess: (pid: string, arrivalTime: number, burstTime: number) => boolean;
  onRemoveProcess: (pid: string) => boolean;
  onClearError: () => void;
}

const QUICK_QUANTUMS = [1, 2, 3, 4, 5];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  processes,
  algorithm,
  quantum,
  activePresetId,
  validationError,
  onSelectAlgorithm,
  onChangeQuantum,
  onLoadPreset,
  onAddProcess,
  onUpdateProcess,
  onRemoveProcess,
  onClearError,
}) => {
  const [newArrival, setNewArrival] = useState<string>('3');
  const [newBurst, setNewBurst] = useState<string>('4');

  const activePreset = PRESET_SCENARIOS.find((p) => p.id === activePresetId);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const at = Number(newArrival);
    const bt = Number(newBurst);
    const ok = onAddProcess(at, bt);
    if (ok) {
      setNewArrival(String(Math.min(100, at + 1)));
    }
  };

  return (
    <aside className="control-panel">
      <section className="luxury-card">
        <div className="card-header">
          <div className="card-title">
            <Sliders size={18} color="#38BDF8" />
            <span>تنظیمات الگوریتم زمان‌بندی</span>
          </div>
        </div>

        <div className="section-label">
          <span>انتخاب الگوریتم اجرا</span>
        </div>

        <div className="algo-switcher">
          <button
            type="button"
            className={`algo-btn ${algorithm === 'FCFS' ? 'active' : ''}`}
            onClick={() => onSelectAlgorithm('FCFS')}
          >
            <span className="algo-btn-title mono">FCFS</span>
            <span className="algo-btn-desc">غیرپیش‌دستانه (صف FIFO)</span>
          </button>

          <button
            type="button"
            className={`algo-btn ${algorithm === 'RR' ? 'active' : ''}`}
            onClick={() => onSelectAlgorithm('RR')}
          >
            <span className="algo-btn-title mono">Round Robin</span>
            <span className="algo-btn-desc">پیش‌دستانه (با کوانتوم Q)</span>
          </button>
        </div>

        {algorithm === 'RR' && (
          <div className="quantum-box" style={{ marginTop: '0.9rem' }}>
            <div className="section-label" style={{ marginBottom: 0 }}>
              <span>اندازه کوانتوم زمانی (Time Quantum)</span>
              <span className="mono" style={{ color: '#38BDF8', fontWeight: 700 }}>
                Q = {quantum}
              </span>
            </div>

            <div className="quantum-quick-row">
              {QUICK_QUANTUMS.map((qVal) => (
                <button
                  key={qVal}
                  type="button"
                  className={`q-chip ${quantum === qVal ? 'active' : ''}`}
                  onClick={() => onChangeQuantum(qVal)}
                >
                  Q={qVal}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={20}
                value={quantum}
                aria-label="کوانتوم سفارشی"
                className="q-input-number"
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!Number.isNaN(val)) {
                    onChangeQuantum(val);
                  }
                }}
              />
            </div>

            <p className="card-subtitle" style={{ fontSize: '0.74rem' }}>
              قرارداد مرزی استاندارد: در لحظه پایان کوانتوم، ابتدا فرایندهای تازه‌وارد به صف اضافه شده و سپس فرایند ناتمام به انتهای صف برمی‌گردد.
            </p>
          </div>
        )}
      </section>

      <section className="luxury-card">
        <div className="card-header">
          <div className="card-title">
            <Sparkles size={18} color="#10B981" />
            <span>سناریوهای آماده ارائه دانشگاهی</span>
          </div>
        </div>

        <div className="preset-list">
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-btn ${activePresetId === preset.id ? 'active' : ''}`}
              onClick={() => onLoadPreset(preset.id)}
            >
              <span>{preset.title}</span>
              <span className="preset-badge">{preset.badge}</span>
            </button>
          ))}
        </div>

        {activePreset && (
          <div className="preset-note">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 700,
                color: '#38BDF8',
                marginBottom: '0.25rem',
              }}
            >
              <BookOpen size={14} />
              <span>نکته آموزشی سناریو:</span>
            </div>
            <p>{activePreset.educationalPoint}</p>
          </div>
        )}
      </section>

      <section className="luxury-card">
        <div className="card-header">
          <div className="card-title">
            <span>فرایندهای ورودی (Processes)</span>
          </div>
          <span className="card-subtitle mono">{processes.length} / 10</span>
        </div>

        {validationError && (
          <div className="error-banner" role="alert" style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={16} />
              <span>{validationError}</span>
            </div>
            <button
              type="button"
              onClick={onClearError}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              ×
            </button>
          </div>
        )}

        <table className="process-list-table">
          <thead>
            <tr>
              <th>شناسه</th>
              <th>زمان ورود (AT)</th>
              <th>زمان اجرا (BT)</th>
              <th style={{ textAlign: 'left' }}>حذف</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((proc) => (
              <tr key={proc.pid}>
                <td>
                  <span className="pid-badge">
                    <span
                      className="color-dot"
                      style={{ backgroundColor: proc.color }}
                    />
                    <span>{proc.pid}</span>
                  </span>
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={proc.arrivalTime}
                    aria-label={`زمان ورود ${proc.pid}`}
                    className="inline-num-input"
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!Number.isNaN(val)) {
                        onUpdateProcess(proc.pid, val, proc.burstTime);
                      }
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={proc.burstTime}
                    aria-label={`زمان اجرای ${proc.pid}`}
                    className="inline-num-input"
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!Number.isNaN(val)) {
                        onUpdateProcess(proc.pid, proc.arrivalTime, val);
                      }
                    }}
                  />
                </td>
                <td style={{ textAlign: 'left' }}>
                  <button
                    type="button"
                    className="icon-btn-danger"
                    disabled={processes.length <= 1}
                    title="حذف فرایند"
                    onClick={() => onRemoveProcess(proc.pid)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form className="add-process-form" onSubmit={handleAddSubmit}>
          <div className="field-group">
            <label htmlFor="new-at-input">زمان ورود (AT)</label>
            <input
              id="new-at-input"
              type="number"
              min={0}
              max={100}
              value={newArrival}
              onChange={(e) => setNewArrival(e.target.value)}
              className="field-input"
            />
          </div>

          <div className="field-group">
            <label htmlFor="new-bt-input">زمان اجرا (BT)</label>
            <input
              id="new-bt-input"
              type="number"
              min={1}
              max={50}
              value={newBurst}
              onChange={(e) => setNewBurst(e.target.value)}
              className="field-input"
            />
          </div>

          <button type="submit" className="btn-primary">
            <Plus size={16} />
            <span>افزودن</span>
          </button>
        </form>
      </section>
    </aside>
  );
};