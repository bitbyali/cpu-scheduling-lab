import React from 'react';
import { GitCompare, Award } from 'lucide-react';
import { SimulationResult } from '../types/scheduling';

interface ComparisonViewProps {
  fcfsResult: SimulationResult;
  rrResult: SimulationResult;
  quantum: number;
  onChangeQuantum: (q: number) => boolean;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  fcfsResult,
  rrResult,
  quantum,
  onChangeQuantum,
}) => {
  const getBetterBadge = (
    fcfsVal: number,
    rrVal: number,
    lowerIsBetter: boolean = true
  ) => {
    if (Math.abs(fcfsVal - rrVal) < 0.001) {
      return <span className="comparison-badge equal">مساوی</span>;
    }
    const fcfsWins = lowerIsBetter ? fcfsVal < rrVal : fcfsVal > rrVal;
    return fcfsWins ? (
      <span className="comparison-badge fcfs-win">FCFS بهتر است</span>
    ) : (
      <span className="comparison-badge rr-win">Round Robin بهتر است</span>
    );
  };

  return (
    <div
      className="comparison-view-container"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      <section className="luxury-card" aria-label="مقایسه هم‌زمان FCFS و Round Robin">
        <div className="card-header">
          <div className="card-title">
            <GitCompare size={19} color="#38BDF8" />
            <span>مقایسه هم‌زمان FCFS و Round Robin (Q = {quantum})</span>
          </div>
          <div className="quantum-quick-row" style={{ maxWidth: '260px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              کوانتوم RR:
            </span>
            {[1, 2, 3, 4, 5].map((qVal) => (
              <button
                key={qVal}
                type="button"
                className={`q-chip ${quantum === qVal ? 'active' : ''}`}
                onClick={() => onChangeQuantum(qVal)}
                style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
              >
                Q={qVal}
              </button>
            ))}
          </div>
        </div>

        <p
          className="card-subtitle"
          style={{ marginBottom: '1rem', lineHeight: '1.6' }}
        >
          در این بخش، کارایی دو الگوریتم زمان‌بندی روی مجموعه فرایندهای ورودی یکسان مقایسه شده است. انتخاب «الگوریتم برتر» به معیار هدف سیستم (کاهش زمان پاسخ در سیستم‌های تعاملی یا کاهش سربار تعویض متن در سیستم‌های دسته‌ای) بستگی دارد.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="process-list-table" style={{ textAlign: 'center' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'right' }}>معیار ارزیابی</th>
                <th style={{ textAlign: 'center' }}>FCFS (غیرپیش‌دستانه)</th>
                <th style={{ textAlign: 'center' }}>Round Robin (Q = {quantum})</th>
                <th style={{ textAlign: 'center' }}>مقایسه و نتیجه بهتر</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  میانگین زمان گردش (Average TAT)
                </td>
                <td className="mono">{fcfsResult.avgTurnaroundTime.toFixed(2)}</td>
                <td className="mono">{rrResult.avgTurnaroundTime.toFixed(2)}</td>
                <td>
                  {getBetterBadge(
                    fcfsResult.avgTurnaroundTime,
                    rrResult.avgTurnaroundTime,
                    true
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  میانگین زمان انتظار (Average WT)
                </td>
                <td className="mono">{fcfsResult.avgWaitingTime.toFixed(2)}</td>
                <td className="mono">{rrResult.avgWaitingTime.toFixed(2)}</td>
                <td>
                  {getBetterBadge(
                    fcfsResult.avgWaitingTime,
                    rrResult.avgWaitingTime,
                    true
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  میانگین زمان پاسخ (Average RT)
                </td>
                <td className="mono">{fcfsResult.avgResponseTime.toFixed(2)}</td>
                <td className="mono">{rrResult.avgResponseTime.toFixed(2)}</td>
                <td>
                  {getBetterBadge(
                    fcfsResult.avgResponseTime,
                    rrResult.avgResponseTime,
                    true
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  بهره‌وری پردازنده (CPU Utilization)
                </td>
                <td className="mono">{fcfsResult.cpuUtilization.toFixed(1)}%</td>
                <td className="mono">{rrResult.cpuUtilization.toFixed(1)}%</td>
                <td>
                  {getBetterBadge(
                    fcfsResult.cpuUtilization,
                    rrResult.cpuUtilization,
                    false
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  تعداد تعویض متن (Context Switches)
                </td>
                <td className="mono">{fcfsResult.contextSwitches}</td>
                <td className="mono">{rrResult.contextSwitches}</td>
                <td>
                  {getBetterBadge(
                    fcfsResult.contextSwitches,
                    rrResult.contextSwitches,
                    true
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          className="preset-note"
          style={{
            marginTop: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              color: '#38BDF8',
            }}
          >
            <Award size={15} />
            <span>تحلیل علمی و نتیجه‌گیری:</span>
          </div>
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
            }}
          >
            • الگوریتم <strong>FCFS</strong> به دلیل اجرای یک‌سره و غیرپیش‌دستانه فرایندها، کمترین تعداد تعویض متن (Context Switch) را دارد؛ اما در حضور یک فرایند طولانی در ابتدای صف دچار پدیده <strong>اثر قطار (Convoy Effect)</strong> می‌شود.
          </p>
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
            }}
          >
            • الگوریتم <strong>Round Robin</strong> با تقسیم نوبتی پردازنده در برش‌های زمانی Q، میانگین زمان اولین پاسخ (Response Time) را به شکل چشمگیری بهبود می‌دهد و برای سیستم‌های تعاملی ایده‌آل است؛ هرچند انتخاب کوانتوم بسیار کوچک می‌تواند تعداد تعویض متن را افزایش دهد.
          </p>
        </div>
      </section>
    </div>
  );
};
