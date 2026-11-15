'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Download,
  Globe,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  summarizeTrafficSeries,
  type DailyTrafficPoint,
  type SiteTrafficStats,
  type TrafficRangeDays,
} from '@/lib/analytics-logic';

type ChartKind = 'area' | 'bars';
type SeriesVisibility = 'both' | 'visitors' | 'downloads';

interface TrafficAnalyticsChartProps {
  stats: SiteTrafficStats;
  loading?: boolean;
  onRangeChange: (days: TrafficRangeDays) => void;
  onRefresh: () => void;
}

interface ChartThemeColors {
  isDark: boolean;
  text: string;
  muted: string;
  grid: string;
  surface: string;
  visitorsStroke: string;
  visitorsFillTop: string;
  visitorsFillBottom: string;
  downloadsStroke: string;
  downloadsFillTop: string;
  downloadsFillBottom: string;
  crosshair: string;
}

function readThemeColors(): ChartThemeColors {
  const root = document.documentElement;
  const isDark = root.classList.contains('dark');
  const styles = getComputedStyle(root);
  const text = styles.getPropertyValue('--velvet-text').trim() || (isDark ? '#F6F3EC' : '#171B24');
  const muted = styles.getPropertyValue('--velvet-muted').trim() || (isDark ? '#B4BDCC' : '#565E6E');
  const surface = styles.getPropertyValue('--velvet-surface').trim() || (isDark ? '#10151F' : '#FFFDF8');

  return {
    isDark,
    text,
    muted,
    surface,
    grid: isDark ? 'rgba(180, 189, 204, 0.11)' : 'rgba(23, 27, 36, 0.08)',
    crosshair: isDark ? 'rgba(240, 201, 122, 0.35)' : 'rgba(138, 97, 24, 0.32)',
    visitorsStroke: isDark ? '#7AD7F0' : '#1D698B',
    visitorsFillTop: isDark ? 'rgba(122, 215, 240, 0.30)' : 'rgba(29, 105, 139, 0.22)',
    visitorsFillBottom: isDark ? 'rgba(122, 215, 240, 0.00)' : 'rgba(29, 105, 139, 0.00)',
    downloadsStroke: isDark ? '#F0C97A' : '#B57B14',
    downloadsFillTop: isDark ? 'rgba(240, 201, 122, 0.34)' : 'rgba(181, 123, 20, 0.24)',
    downloadsFillBottom: isDark ? 'rgba(240, 201, 122, 0.00)' : 'rgba(181, 123, 20, 0.00)',
  };
}

function calcNiceAxisMax(rawMax: number): number {
  if (rawMax <= 0) return 5;
  if (rawMax <= 4) return 4;
  const exp = Math.floor(Math.log10(rawMax));
  const pow = 10 ** exp;
  const fraction = rawMax / pow;
  let niceFraction = 10;
  if (fraction <= 1.2) niceFraction = 1.2;
  else if (fraction <= 1.5) niceFraction = 1.5;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 2.5) niceFraction = 2.5;
  else if (fraction <= 3) niceFraction = 3;
  else if (fraction <= 4) niceFraction = 4;
  else if (fraction <= 5) niceFraction = 5;
  else if (fraction <= 6) niceFraction = 6;
  else if (fraction <= 8) niceFraction = 8;
  return Math.max(4, Math.ceil(niceFraction * pow));
}

/**
 * Monotonic Fritsch-Carlson cubic Hermite spline path so curves stay ultra-smooth
 * without ever overshooting below the baseline.
 */
function traceMonotoneSpline(
  ctx: CanvasRenderingContext2D,
  pts: Array<{ x: number; y: number }>,
) {
  if (pts.length === 0) return;
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 1) return;
  if (pts.length === 2) {
    ctx.lineTo(pts[1].x, pts[1].y);
    return;
  }

  const n = pts.length;
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];
  const tangents: number[] = new Array(n).fill(0);

  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = pts[i + 1].x - pts[i].x;
    dy[i] = pts[i + 1].y - pts[i].y;
    m[i] = dx[i] !== 0 ? dy[i] / dx[i] : 0;
  }

  tangents[0] = m[0];
  tangents[n - 1] = m[n - 2];

  for (let i = 1; i < n - 1; i += 1) {
    if (m[i - 1] * m[i] <= 0) {
      tangents[i] = 0;
    } else {
      tangents[i] = (m[i - 1] + m[i]) / 2;
    }
  }

  for (let i = 0; i < n - 1; i += 1) {
    if (m[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const a = tangents[i] / m[i];
      const b = tangents[i + 1] / m[i];
      const sq = a * a + b * b;
      if (sq > 9) {
        const tau = 3 / Math.sqrt(sq);
        tangents[i] = tau * a * m[i];
        tangents[i + 1] = tau * b * m[i];
      }
    }
  }

  for (let i = 0; i < n - 1; i += 1) {
    const h = dx[i] / 3;
    const cp1x = pts[i].x + h;
    const cp1y = pts[i].y + tangents[i] * h;
    const cp2x = pts[i + 1].x - h;
    const cp2y = pts[i + 1].y - tangents[i + 1] * h;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pts[i + 1].x, pts[i + 1].y);
  }
}

export function TrafficAnalyticsChart({
  stats,
  loading = false,
  onRangeChange,
  onRefresh,
}: TrafficAnalyticsChartProps) {
  const [chartKind, setChartKind] = useState<ChartKind>('area');
  const [visibility, setVisibility] = useState<SeriesVisibility>('both');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 720,
    height: 310,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animProgressRef = useRef<number>(1);
  const rafRef = useRef<number | null>(null);

  const series = stats.series;
  const summary = useMemo(() => summarizeTrafficSeries(series), [series]);
  const hasAnyPeriodData =
    summary.periodDownloads > 0 || summary.periodVisitors > 0;

  const showVisitors = visibility === 'both' || visibility === 'visitors';
  const showDownloads = visibility === 'both' || visibility === 'downloads';

  const pad = useMemo(
    () => ({
      top: 22,
      right: 24,
      bottom: 34,
      left: 44,
    }),
    [],
  );

  const drawChart = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = canvasSize;
      if (width <= 0 || height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const theme = readThemeColors();
      const plotW = Math.max(80, width - pad.left - pad.right);
      const plotH = Math.max(80, height - pad.top - pad.bottom);
      const baselineY = pad.top + plotH;

      let rawMax = 0;
      for (const pt of series) {
        if (showVisitors && pt.uniqueVisitors > rawMax) rawMax = pt.uniqueVisitors;
        if (showDownloads && pt.downloads > rawMax) rawMax = pt.downloads;
      }
      const yMax = calcNiceAxisMax(rawMax);
      const tickCount = 4;

      // 1. Horizontal Gridlines + Y-axis labels
      ctx.font = '500 11px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';

      for (let i = 0; i <= tickCount; i += 1) {
        const ratio = i / tickCount;
        const y = baselineY - ratio * plotH;
        const val = Math.round(ratio * yMax);

        ctx.beginPath();
        ctx.strokeStyle = theme.grid;
        ctx.lineWidth = 1;
        if (i > 0) ctx.setLineDash([4, 4]);
        else ctx.setLineDash([]);
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + plotW, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = theme.muted;
        ctx.fillText(val.toLocaleString('en-US'), pad.left - 10, y);
      }

      if (series.length === 0) {
        ctx.restore();
        return;
      }

      const n = series.length;
      const getX = (idx: number) => {
        if (n === 1) return pad.left + plotW / 2;
        if (chartKind === 'bars') {
          const slotW = plotW / n;
          return pad.left + slotW * idx + slotW / 2;
        }
        return pad.left + (idx / (n - 1)) * plotW;
      };

      const getY = (value: number) => {
        const clamped = Math.max(0, value) * progress;
        return baselineY - (clamped / yMax) * plotH;
      };

      // 2. X-Axis Date Ticks (adaptive spacing so labels never overlap)
      const approxLabelSpace = width < 480 ? 58 : 66;
      const maxLabels = Math.max(3, Math.floor(plotW / approxLabelSpace));
      const step = Math.max(1, Math.ceil(n / maxLabels));

      ctx.font = '500 11px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      ctx.fillStyle = theme.muted;

      for (let i = 0; i < n; i += 1) {
        const isLast = i === n - 1;
        const isFirst = i === 0;
        const showTick = isFirst || isLast || (i % step === 0 && n - 1 - i >= Math.ceil(step / 2));
        if (!showTick) continue;
        const x = getX(i);
        ctx.fillText(series[i].shortLabel, x, baselineY + 11);
      }

      // 3. Hovered Column Band (subtle highlight)
      if (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < n) {
        const hx = getX(hoveredIndex);
        if (chartKind === 'bars') {
          const slotW = plotW / n;
          ctx.fillStyle = theme.isDark
            ? 'rgba(240, 201, 122, 0.06)'
            : 'rgba(138, 97, 24, 0.06)';
          ctx.fillRect(hx - slotW / 2, pad.top, slotW, plotH);
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = theme.crosshair;
          ctx.lineWidth = 1.25;
          ctx.moveTo(hx, pad.top);
          ctx.lineTo(hx, baselineY);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 4. Data Rendering (Smooth Area Curves OR Grouped Bars)
      if (chartKind === 'area') {
        const drawSeriesCurve = (
          values: number[],
          stroke: string,
          fillTop: string,
          fillBottom: string,
        ) => {
          const coords = values.map((v, idx) => ({ x: getX(idx), y: getY(v) }));

          // Area fill gradient
          const grad = ctx.createLinearGradient(0, pad.top, 0, baselineY);
          grad.addColorStop(0, fillTop);
          grad.addColorStop(1, fillBottom);

          ctx.save();
          ctx.beginPath();
          traceMonotoneSpline(ctx, coords);
          ctx.lineTo(coords[coords.length - 1].x, baselineY);
          ctx.lineTo(coords[0].x, baselineY);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.restore();

          // Luminous line stroke
          ctx.save();
          ctx.beginPath();
          traceMonotoneSpline(ctx, coords);
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 2.5;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.shadowColor = stroke;
          ctx.shadowBlur = theme.isDark ? 10 : 4;
          ctx.stroke();
          ctx.restore();

          // Small data dots when range is compact (<= 14 days) or on hovered day
          for (let i = 0; i < coords.length; i += 1) {
            const isHovered = hoveredIndex === i;
            if (!isHovered && n > 14) continue;
            const radius = isHovered ? 5.5 : 2.6;
            ctx.save();
            if (isHovered) {
              ctx.beginPath();
              ctx.arc(coords[i].x, coords[i].y, 9.5, 0, Math.PI * 2);
              ctx.fillStyle = fillTop;
              ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(coords[i].x, coords[i].y, radius, 0, Math.PI * 2);
            ctx.fillStyle = isHovered ? stroke : theme.surface;
            ctx.fill();
            ctx.lineWidth = isHovered ? 2.5 : 1.75;
            ctx.strokeStyle = isHovered ? theme.surface : stroke;
            ctx.stroke();
            ctx.restore();
          }
        };

        if (showVisitors) {
          drawSeriesCurve(
            series.map((p) => p.uniqueVisitors),
            theme.visitorsStroke,
            theme.visitorsFillTop,
            theme.visitorsFillBottom,
          );
        }
        if (showDownloads) {
          drawSeriesCurve(
            series.map((p) => p.downloads),
            theme.downloadsStroke,
            theme.downloadsFillTop,
            theme.downloadsFillBottom,
          );
        }
      } else {
        // Grouped Rounded Bars Mode
        const slotW = plotW / n;
        const activeSeriesCount = (showVisitors ? 1 : 0) + (showDownloads ? 1 : 0);
        const maxBarW = activeSeriesCount === 2 ? Math.min(18, slotW * 0.34) : Math.min(28, slotW * 0.54);
        const barGap = activeSeriesCount === 2 ? Math.max(2, Math.min(6, slotW * 0.08)) : 0;

        const drawBar = (
          x: number,
          value: number,
          barW: number,
          stroke: string,
          fillTop: string,
          isHovered: boolean,
        ) => {
          const y = getY(value);
          const h = Math.max(0, baselineY - y);
          if (h < 1) return;
          const r = Math.min(6, barW / 2, h);

          const grad = ctx.createLinearGradient(0, y, 0, baselineY);
          grad.addColorStop(0, stroke);
          grad.addColorStop(1, fillTop);

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x, baselineY);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.lineTo(x + barW - r, y);
          ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
          ctx.lineTo(x + barW, baselineY);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.globalAlpha = hoveredIndex !== null && !isHovered ? 0.55 : 1;
          if (isHovered) {
            ctx.shadowColor = stroke;
            ctx.shadowBlur = 12;
          }
          ctx.fill();
          ctx.restore();
        };

        for (let i = 0; i < n; i += 1) {
          const centerX = getX(i);
          const isHovered = hoveredIndex === i;
          if (showVisitors && showDownloads) {
            const totalW = maxBarW * 2 + barGap;
            const leftX = centerX - totalW / 2;
            drawBar(
              leftX,
              series[i].uniqueVisitors,
              maxBarW,
              theme.visitorsStroke,
              theme.visitorsFillTop,
              isHovered,
            );
            drawBar(
              leftX + maxBarW + barGap,
              series[i].downloads,
              maxBarW,
              theme.downloadsStroke,
              theme.downloadsFillTop,
              isHovered,
            );
          } else if (showVisitors) {
            drawBar(
              centerX - maxBarW / 2,
              series[i].uniqueVisitors,
              maxBarW,
              theme.visitorsStroke,
              theme.visitorsFillTop,
              isHovered,
            );
          } else if (showDownloads) {
            drawBar(
              centerX - maxBarW / 2,
              series[i].downloads,
              maxBarW,
              theme.downloadsStroke,
              theme.downloadsFillTop,
              isHovered,
            );
          }
        }
      }

      ctx.restore();
    },
    [canvasSize, chartKind, hoveredIndex, pad, series, showDownloads, showVisitors],
  );

  // Measure container cleanly
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setCanvasSize({
          width: Math.round(rect.width),
          height: rect.width < 520 ? 250 : 310,
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animate curve/bar draw-in smoothly on dataset/mode change
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      animProgressRef.current = 1;
      drawChart(1);
      return;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const duration = 480;

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      animProgressRef.current = eased;
      drawChart(eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [series, chartKind, visibility, drawChart]);

  // Redraw immediately on hover or theme toggle without re-running entry reveal
  useEffect(() => {
    drawChart(animProgressRef.current);
    const observer = new MutationObserver(() => {
      drawChart(animProgressRef.current);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, [drawChart]);

  const handlePointerMove = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas || series.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const relX = clientX - rect.left;
    const plotW = Math.max(80, rect.width - pad.left - pad.right);
    const n = series.length;

    let idx = 0;
    if (n > 1) {
      if (chartKind === 'bars') {
        const slotW = plotW / n;
        idx = Math.floor((relX - pad.left) / slotW);
      } else {
        const ratio = (relX - pad.left) / plotW;
        idx = Math.round(ratio * (n - 1));
      }
    }
    const clamped = Math.max(0, Math.min(n - 1, idx));
    setHoveredIndex(clamped);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (series.length === 0) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setHoveredIndex((prev) =>
        prev === null ? 0 : Math.min(series.length - 1, prev + 1),
      );
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setHoveredIndex((prev) =>
        prev === null ? series.length - 1 : Math.max(0, prev - 1),
      );
    } else if (e.key === 'Escape') {
      setHoveredIndex(null);
    }
  };

  const hoveredPoint: DailyTrafficPoint | null =
    hoveredIndex !== null && series[hoveredIndex] ? series[hoveredIndex] : null;

  const hoveredPointLeftPx = useMemo(() => {
    if (hoveredIndex === null || series.length === 0) return 0;
    const plotW = Math.max(80, canvasSize.width - pad.left - pad.right);
    if (series.length === 1) return pad.left + plotW / 2;
    if (chartKind === 'bars') {
      const slotW = plotW / series.length;
      return pad.left + slotW * hoveredIndex + slotW / 2;
    }
    return pad.left + (hoveredIndex / (series.length - 1)) * plotW;
  }, [hoveredIndex, series.length, canvasSize.width, pad.left, pad.right, chartKind]);

  const topPagesMaxHits = useMemo(
    () => Math.max(1, ...stats.topPages.map((p) => p.hits)),
    [stats.topPages],
  );

  return (
    <div
      data-testid="traffic-analytics-chart"
      className="lux-card rounded-3xl p-5 sm:p-7"
    >
      {/* Top Toolbar: Title & Interactive Filters */}
      <div className="flex flex-col gap-4 border-b border-[var(--velvet-border)] pb-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-5 w-5 text-[var(--velvet-gold)]" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-[var(--velvet-text)] sm:text-xl">
              منحنى الزيارات والتحميلات اليومي
            </h2>
          </div>
          <p className="text-xs text-[var(--velvet-muted)]">
            مقارنة يومية حقيقية خلال آخر{' '}
            <span className="font-numeric font-semibold text-[var(--velvet-text)]">
              {stats.rangeDays}
            </span>{' '}
            يوم
            <span aria-hidden="true"> · </span>
            الزوار:{' '}
            <span className="font-numeric font-bold text-[var(--velvet-sky)]">
              {summary.periodVisitors.toLocaleString('en-US')}
            </span>
            <span aria-hidden="true"> · </span>
            التحميلات:{' '}
            <span className="font-numeric font-bold text-[var(--velvet-gold)]">
              {summary.periodDownloads.toLocaleString('en-US')}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Range Switcher */}
          <div
            role="group"
            aria-label="الفترة الزمنية"
            className="inline-flex items-center rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] p-1"
          >
            {([7, 14, 30] as TrafficRangeDays[]).map((days) => {
              const active = stats.rangeDays === days;
              return (
                <button
                  key={days}
                  type="button"
                  disabled={loading}
                  onClick={() => onRangeChange(days)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#F0C97A] text-[#1A1408]'
                      : 'text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]'
                  }`}
                >
                  <span className="font-numeric">{days}</span> يوم
                </button>
              );
            })}
          </div>

          {/* Series Filter */}
          <div
            role="group"
            aria-label="تصفية السلاسل"
            className="inline-flex items-center rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] p-1"
          >
            {(
              [
                { id: 'both', label: 'الكل' },
                { id: 'visitors', label: 'الزوار' },
                { id: 'downloads', label: 'التحميلات' },
              ] as Array<{ id: SeriesVisibility; label: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setVisibility(opt.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  visibility === opt.id
                    ? 'bg-[var(--velvet-surface)] text-[var(--velvet-text)] shadow-sm'
                    : 'text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Chart Kind Switcher */}
          <div
            role="group"
            aria-label="نوع الرسم البياني"
            className="inline-flex items-center rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] p-1"
          >
            <button
              type="button"
              onClick={() => setChartKind('area')}
              aria-label="عرض كمنحنى انسيابي"
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                chartKind === 'area'
                  ? 'bg-[var(--velvet-surface)] text-[var(--velvet-text)] shadow-sm'
                  : 'text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]'
              }`}
            >
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              <span>منحنى</span>
            </button>
            <button
              type="button"
              onClick={() => setChartKind('bars')}
              aria-label="عرض كأعمدة مقارنة"
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                chartKind === 'bars'
                  ? 'bg-[var(--velvet-surface)] text-[var(--velvet-text)] shadow-sm'
                  : 'text-[var(--velvet-muted)] hover:text-[var(--velvet-text)]'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>أعمدة</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="تحديث بيانات الرسم البياني"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)] px-3 py-2 text-xs font-semibold text-[var(--velvet-text)] transition-colors hover:border-[var(--velvet-gold)] disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Quantitative Summary Strip (Clean 2x2 -> 4-col grid, no broken dividers) */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-b border-[var(--velvet-border)] py-4 text-xs sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-x-reverse sm:divide-[var(--velvet-border)]">
        <div className="sm:px-3">
          <dt className="text-[var(--velvet-muted)]">متوسط الزوار يومياً</dt>
          <dd className="mt-1 font-numeric text-lg font-bold text-[var(--velvet-sky)]">
            {summary.avgVisitorsPerDay.toLocaleString('en-US')}
          </dd>
          <p className="mt-0.5 text-[11px] text-[var(--velvet-muted)]">
            {summary.peakVisitorsDay
              ? `الذروة: ${summary.peakVisitorsDay.value} (${summary.peakVisitorsDay.label})`
              : 'لم تُسجّل ذروة بعد'}
          </p>
        </div>

        <div className="sm:px-3">
          <dt className="text-[var(--velvet-muted)]">متوسط التحميلات يومياً</dt>
          <dd className="mt-1 font-numeric text-lg font-bold text-[var(--velvet-gold)]">
            {summary.avgDownloadsPerDay.toLocaleString('en-US')}
          </dd>
          <p className="mt-0.5 text-[11px] text-[var(--velvet-muted)]">
            {summary.peakDownloadsDay
              ? `الذروة: ${summary.peakDownloadsDay.value} (${summary.peakDownloadsDay.label})`
              : 'لم تُسجّل ذروة بعد'}
          </p>
        </div>

        <div className="sm:px-3">
          <dt className="text-[var(--velvet-muted)]">نسبة التحويل للتحميل</dt>
          <dd className="mt-1 font-numeric text-lg font-bold text-[var(--velvet-emerald)]">
            {summary.conversionRatePercent.toLocaleString('en-US')}%
          </dd>
          <p className="mt-0.5 text-[11px] text-[var(--velvet-muted)]">
            تحميل لكل زائر في الفترة
          </p>
        </div>

        <div className="sm:px-3">
          <dt className="text-[var(--velvet-muted)]">مجموع زيارات الصفحات</dt>
          <dd className="mt-1 font-numeric text-lg font-bold text-[var(--velvet-text)]">
            {summary.periodVisits.toLocaleString('en-US')}
          </dd>
          <p className="mt-0.5 text-[11px] text-[var(--velvet-muted)]">
            إجمالي كل الزمن: {stats.totalVisits.toLocaleString('en-US')}
          </p>
        </div>
      </dl>

      {/* Chart Canvas Stage */}
      <div className="relative pt-5">
        {/* Legend Row */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {showVisitors && (
              <span className="inline-flex items-center gap-2 font-semibold text-[var(--velvet-text)]">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--velvet-sky)]" aria-hidden="true" />
                <Users className="h-3.5 w-3.5 text-[var(--velvet-sky)]" aria-hidden="true" />
                <span>الزوار الفعليون</span>
              </span>
            )}
            {showDownloads && (
              <span className="inline-flex items-center gap-2 font-semibold text-[var(--velvet-text)]">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--velvet-gold)]" aria-hidden="true" />
                <Download className="h-3.5 w-3.5 text-[var(--velvet-gold)]" aria-hidden="true" />
                <span>التحميلات (APK)</span>
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--velvet-muted)]">
            مرّر على الرسم لعرض تفاصيل كل يوم
          </span>
        </div>

        <div
          ref={containerRef}
          dir="ltr"
          tabIndex={0}
          role="img"
          aria-label={
            hoveredPoint
              ? `${hoveredPoint.fullLabel}: ${hoveredPoint.uniqueVisitors} زائر و ${hoveredPoint.downloads} تحميل`
              : `رسم بياني للزيارات والتحميلات خلال آخر ${stats.rangeDays} يوم`
          }
          onKeyDown={handleKeyDown}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onMouseLeave={() => setHoveredIndex(null)}
          onTouchStart={(e) => {
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
          }}
          onTouchMove={(e) => {
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
          }}
          className="relative w-full select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--velvet-gold)] rounded-2xl"
        >
          <canvas
            ref={canvasRef}
            style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}
            className="block w-full cursor-crosshair"
          />

          {/* Precision Floating Scrub Tooltip */}
          {hoveredPoint && (
            <div
              dir="rtl"
              style={{
                left:
                  hoveredPointLeftPx > canvasSize.width * 0.62
                    ? `${Math.max(12, hoveredPointLeftPx - 208)}px`
                    : `${Math.min(canvasSize.width - 210, hoveredPointLeftPx + 14)}px`,
                top: '14px',
              }}
              className="pointer-events-none absolute z-20 w-48 rounded-2xl border border-[var(--velvet-border)] bg-[var(--velvet-surface)]/95 p-3 text-xs shadow-xl backdrop-blur-md"
            >
              <p className="border-b border-[var(--velvet-border)]/70 pb-1.5 font-display font-bold text-[var(--velvet-text)]">
                {hoveredPoint.fullLabel}
              </p>
              <dl className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[var(--velvet-muted)]">الزوار</dt>
                  <dd className="font-numeric font-bold text-[var(--velvet-sky)]">
                    {hoveredPoint.uniqueVisitors.toLocaleString('en-US')}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[var(--velvet-muted)]">التحميلات</dt>
                  <dd className="font-numeric font-bold text-[var(--velvet-gold)]">
                    {hoveredPoint.downloads.toLocaleString('en-US')}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-[var(--velvet-border)]/50 pt-1">
                  <dt className="text-[var(--velvet-muted)]">كل الزيارات</dt>
                  <dd className="font-numeric font-semibold text-[var(--velvet-text)]">
                    {hoveredPoint.totalVisits.toLocaleString('en-US')}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Quiet Baseline Explanation When Period Has Zero Recorded Events */}
          {!hasAnyPeriodData && !loading && (
            <div
              dir="rtl"
              className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-center"
            >
              <p className="rounded-xl border border-[var(--velvet-border)] bg-[var(--velvet-bg)]/90 px-4 py-2 text-center text-xs text-[var(--velvet-muted)] backdrop-blur-sm">
                لم تُسجّل زيارات أو تحميلات خلال هذه الفترة بعد — يرتفع المنحنى تلقائياً مع أول تفاعل حقيقي.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top Public Pages Breakdown */}
      {stats.topPages.length > 0 && (
        <div className="mt-5 border-t border-[var(--velvet-border)] pt-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[var(--velvet-muted)]">
            <Globe className="h-3.5 w-3.5 text-[var(--velvet-sky)]" aria-hidden="true" />
            <span>أكثر الصفحات زيارة على الموقع</span>
          </div>
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.topPages.map((page) => {
              const pct = Math.max(6, Math.round((page.hits / topPagesMaxHits) * 100));
              return (
                <div key={page.path} className="flex flex-col gap-1.5 py-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-[var(--velvet-text)]">
                      {page.label}
                    </span>
                    <span className="font-numeric font-bold text-[var(--velvet-sky)] shrink-0">
                      {page.hits.toLocaleString('en-US')}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--velvet-border)]/45">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-gradient-to-l from-[#7AD7F0] to-[#F0C97A]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
