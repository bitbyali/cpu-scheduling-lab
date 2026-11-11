import React from 'react';
import { Table, Calculator, Award, Activity } from 'lucide-react';
import { SimulationResult } from '../types/scheduling';

interface MetricsTableProps {
  result: SimulationResult;
}

export const MetricsTable: React.FC<MetricsTableProps> = ({ result }) => {
  const {
    algorithmTitle,
    metrics,
    avgTurnaroundTime,
    avgWaitingTime,
    avgResponseTime,
    cpuUtilization,
    contextSwitches,
  } = result;

  const hasData = Array.isArray(metrics) && metrics.length > 0;

  return (
    <section
      className="luxury-card"
      aria-label="جدول معیارهای ارزیابی زمان‌بندی پردازنده"
    >
      <div className="card-header">
        <div className="card-title">
          <Table size={19} color="#38BDF8" />
          <span>جدول محاسبات و معیارهای زمان‌بندی ({algorithmTitle})</span>
        </div>
        <span className="card-subtitle mono">
          تعداد فرایندها: {hasData ? metrics.length : 0}
        </span>
      </div>

      {!hasData ? (
        <div className="queue-empty-box">
          <span>داده‌ای برای نمایش معیارهای محاسباتی وجود ندارد.</span>
        </div>
      ) : (
        <>
          <div
            className="cpu-metrics-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
              marginBottom: '1rem',
            }}
          >
            <div className="cpu-metric-item">
              <span className="cpu-metric-label">میانگین زمان گردش (Avg TAT)</span>
              <strong className="mono cpu-metric-val" style={{ color: '#38BDF8' }}>
                {avgTurnaroundTime.toFixed(2)} واحد
              </strong>
            </div>

            <div className="cpu-metric-item">
              <span className="cpu-metric-label">میانگین زمان انتظار (Avg WT)</span>
              <strong className="mono cpu-metric-val" style={{ color: '#F59E0B' }}>
                {avgWaitingTime.toFixed(2)} واحد
              </strong>
            </div>

            <div className="cpu-metric-item">
              <span className="cpu-metric-label">میانگین زمان پاسخ (Avg RT)</span>
              <strong className="mono cpu-metric-val" style={{ color: '#10B981' }}>
                {avgResponseTime.toFixed(2)} واحد
              </strong>
            </div>

            <div className="cpu-metric-item">
              <span className="cpu-metric-label">بهره‌وری CPU / تعویض متن</span>
              <strong className="mono cpu-metric-val">
                {cpuUtilization.toFixed(1)}% | CS: {contextSwitches}
              </strong>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="process-list-table">
              <thead>
                <tr>
                  <th>فرایند</th>
                  <th>ورود (AT)</th>
                  <th>اجرا (BT)</th>
                  <th>اولین شروع</th>
                  <th>پایان (CT)</th>
                  <th>گردش (TAT)</th>
                  <th>انتظار (WT)</th>
                  <th>پاسخ (RT)</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.pid}>
                    <td>
                      <span className="pid-badge">
                        <span
                          className="color-dot"
                          style={{ backgroundColor: m.color }}
                        />
                        <span className="mono">{m.pid}</span>
                      </span>
                    </td>
                    <td className="mono">{m.arrivalTime}</td>
                    <td className="mono">{m.burstTime}</td>
                    <td className="mono">{m.firstStartTime}</td>
                    <td className="mono" style={{ fontWeight: 700 }}>
                      {m.completionTime}
                    </td>
                    <td className="mono" style={{ color: '#38BDF8', fontWeight: 700 }}>
                      {m.turnaroundTime}
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: '#94A3B8',
                          marginRight: '0.3rem',
                        }}
                      >
                        ({m.completionTime}-{m.arrivalTime})
                      </span>
                    </td>
                    <td className="mono" style={{ color: '#F59E0B', fontWeight: 700 }}>
                      {m.waitingTime}
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: '#94A3B8',
                          marginRight: '0.3rem',
                        }}
                      >
                        ({m.turnaroundTime}-{m.burstTime})
                      </span>
                    </td>
                    <td className="mono" style={{ color: '#10B981', fontWeight: 700 }}>
                      {m.responseTime}
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: '#94A3B8',
                          marginRight: '0.3rem',
                        }}
                      >
                        ({m.firstStartTime}-{m.arrivalTime})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr
                  style={{
                    borderTop: '2px solid rgba(148, 163, 184, 0.25)',
                    background: 'rgba(15, 23, 42, 0.55)',
                    fontWeight: 800,
                  }}
                >
                  <td colSpan={5}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Award size={15} color="#38BDF8" />
                      <span>میانگین کل (Averages)</span>
                    </span>
                  </td>
                  <td className="mono" style={{ color: '#38BDF8' }}>
                    {avgTurnaroundTime.toFixed(2)}
                  </td>
                  <td className="mono" style={{ color: '#F59E0B' }}>
                    {avgWaitingTime.toFixed(2)}
                  </td>
                  <td className="mono" style={{ color: '#10B981' }}>
                    {avgResponseTime.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div
            className="preset-note"
            style={{
              marginTop: '1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#38BDF8' }}>
                <Calculator size={14} />
                <span>زمان گردش (Turnaround Time):</span>
              </div>
              <div className="mono" style={{ fontSize: '0.78rem', marginTop: '0.15rem' }}>
                TAT = CT - AT
              </div>
              <p style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                کل زمان حضور فرایند در سیستم از لحظه ورود تا پایان کامل اجرا.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#F59E0B' }}>
                <Calculator size={14} />
                <span>زمان انتظار (Waiting Time):</span>
              </div>
              <div className="mono" style={{ fontSize: '0.78rem', marginTop: '0.15rem' }}>
                WT = TAT - BT
              </div>
              <p style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                مجموع زمان‌هایی که فرایند در صف آماده (Ready Queue) منتظر نوبت مانده است.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#10B981' }}>
                <Activity size={14} />
                <span>زمان پاسخ (Response Time):</span>
              </div>
              <div className="mono" style={{ fontSize: '0.78rem', marginTop: '0.15rem' }}>
                RT = First Start Time - AT
              </div>
              <p style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                فاصله زمانی از لحظه ورود فرایند تا اولین باری که CPU به آن اختصاص می‌یابد.
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
};