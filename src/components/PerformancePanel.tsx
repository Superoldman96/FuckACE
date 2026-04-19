import { Box, Button, Paper, Typography } from '@mui/material';
import { SaveAlt as SaveIcon } from '@mui/icons-material';
import { MetricChart } from './MetricChart';
import type { MetricLine } from './MetricChart';
import type { PerfDataPoint } from '../types/app';

interface PerformancePanelProps {
  history: PerfDataPoint[];
  exportingReport: boolean;
  onExportReport: () => void;
}

interface ChartSection {
  title: string;
  unit: string;
  tooltipFormatter: (value: unknown) => string;
  lines: readonly MetricLine[];
  showLegend?: boolean;
}

const chartSections: ChartSection[] = [
  {
    title: 'CPU (%)',
    unit: '%',
    tooltipFormatter: (value: unknown) => `${value}%`,
    lines: [
      { dataKey: 'sguard_cpu', name: 'SGuard64', stroke: '#f44336' },
      { dataKey: 'sguardsvc_cpu', name: 'SGuardSvc64', stroke: '#ff9800' },
    ],
  },
  {
    title: '内存 (MB)',
    unit: 'MB',
    tooltipFormatter: (value: unknown) => `${value} MB`,
    lines: [
      { dataKey: 'sguard_mem', name: 'SGuard64', stroke: '#f44336' },
      { dataKey: 'sguardsvc_mem', name: 'SGuardSvc64', stroke: '#ff9800' },
    ],
  },
  {
    title: 'I/O (KB/s)',
    unit: 'KB',
    tooltipFormatter: (value: unknown) => `${value} KB/s`,
    lines: [
      { dataKey: 'sguard_io', name: 'SGuard64', stroke: '#f44336' },
      { dataKey: 'sguardsvc_io', name: 'SGuardSvc64', stroke: '#ff9800' },
    ],
    showLegend: true,
  },
];

export function PerformancePanel({
  history,
  exportingReport,
  onExportReport,
}: PerformancePanelProps) {
  return (
    <Paper elevation={2} sx={{ p: 1.5, flex: 2, minWidth: 0, maxWidth: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          实时监控
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<SaveIcon />}
          onClick={onExportReport}
          disabled={exportingReport || history.length === 0}
          sx={{ fontSize: '0.7rem', py: 0.2 }}
        >
          {exportingReport ? '生成中...' : '导出报告（新）'}
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
        {chartSections.map((section) => (
          <MetricChart
            key={section.title}
            title={section.title}
            data={history}
            unit={section.unit}
            tooltipFormatter={section.tooltipFormatter}
            lines={section.lines}
            showLegend={section.showLegend}
          />
        ))}
      </Box>
    </Paper>
  );
}
