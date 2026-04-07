import { useState, useEffect, useCallback, useRef } from 'react';
import { useInitialData } from './services/api';
import { APP_VERSION } from './constants';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { storage } from './utils/storage';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Avatar,
  Switch,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Snackbar
} from '@mui/material';
import {
  PlayArrow as StartIcon,

  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  GitHub as GitHubIcon,
  Notifications as NotificationsIcon,
  SystemUpdate as UpdateIcon,
  Close as CloseIcon,
  SaveAlt as SaveIcon,
} from '@mui/icons-material';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    success: {
      main: '#81c784',
    },
    warning: {
      main: '#ffb74d',
    },
    error: {
      main: '#f44336',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography: {
    h3: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

interface ProcessStatus {
  target_core: number;
  sguard64_found: boolean;
  sguard64_restricted: boolean;
  sguardsvc64_found: boolean;
  sguardsvc64_restricted: boolean;
  message: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
}

interface SystemInfo {
  cpu_model: string;
  cpu_cores: number;
  cpu_logical_cores: number;
  os_name: string;
  os_version: string;
  is_admin: boolean;
  total_memory_gb: number;
  webview2_env: string;
}

interface ProcessPerformance {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_mb: number;
  disk_read_bytes: number;
  disk_write_bytes: number;
}

// 历史图表数据点
interface PerfDataPoint {
  time: string;
  sguard_cpu: number | null;
  sguard_mem: number | null;
  sguardsvc_cpu: number | null;
  sguardsvc_mem: number | null;
  sguard_io: number | null;
  sguardsvc_io: number | null;
}

function App() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [targetCore, setTargetCore] = useState<number | null>(null);
  const [processStatus, setProcessStatus] = useState<ProcessStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [performance, setPerformance] = useState<ProcessPerformance[]>([]);
  const [perfHistory, setPerfHistory] = useState<PerfDataPoint[]>([]);
  const [enableCpuAffinity, setEnableCpuAffinity] = useState(true);
  const [enableProcessPriority, setEnableProcessPriority] = useState(true);
  const [enableEfficiencyMode, setEnableEfficiencyMode] = useState(false);
  const [enableIoPriority, setEnableIoPriority] = useState(false);
  const [enableMemoryPriority, setEnableMemoryPriority] = useState(false);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [autoRestrict, setAutoRestrict] = useState(false);
  const [hasAutoRestricted, setHasAutoRestricted] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);

  const gameProcesses = performance.map(p => p.name);

  const { announcements, latestVersion, hasUpdate, fetchError } = useInitialData(APP_VERSION);

  const addLog = useCallback((message: string) => {
    const newLog: LogEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      message,
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const executeProcessRestriction = useCallback(async () => {
    try {
      addLog('进程限制开始b（￣▽￣）d　');
      setLoading(true);

      const result = await invoke<ProcessStatus>('restrict_processes', {
        enableCpuAffinity,
        enableProcessPriority,
        enableEfficiencyMode,
        enableIoPriority,
        enableMemoryPriority
      });
      setProcessStatus(result);
      setTargetCore(result.target_core);

      addLog(result.message);
    } catch (error) {
      addLog(`执行失败: ${error}`);
      console.error('执行进程限制失败/(ㄒoㄒ)/~~', error);
    } finally {
      setLoading(false);
    }
  }, [addLog, enableCpuAffinity, enableProcessPriority, enableEfficiencyMode, enableIoPriority, enableMemoryPriority]);

  const executeOnce = useCallback(async () => {
    try {
      setIsMonitoring(true);
      const modeStr = [
        enableCpuAffinity && 'CPU亲和性',
        enableProcessPriority && '进程优先级',
        enableEfficiencyMode && '效率模式',
        enableIoPriority && 'I/O优先级',
        enableMemoryPriority && '内存优先级'
      ].filter(Boolean).join('+') || '标准模式';
      addLog(`执行进程限制 (${modeStr})`);
      await executeProcessRestriction();
      setIsMonitoring(false);
    } catch (error) {
      addLog(`执行失败: ${error}`);
      setIsMonitoring(false);
    }
  }, [addLog, executeProcessRestriction, enableCpuAffinity, enableProcessPriority, enableEfficiencyMode, enableIoPriority, enableMemoryPriority]);

  const fetchSystemInfo = useCallback(async () => {
    try {
      const info = await invoke<SystemInfo>('get_system_info');
      setSystemInfo(info);
      const lastCore = info.cpu_logical_cores - 1;
      setTargetCore(lastCore);
      addLog(`系统信息已加载: ${info.os_name} ${info.os_version}`);
      addLog(`CPU: ${info.cpu_model}`);
      addLog(`核心: ${info.cpu_cores}物理/${info.cpu_logical_cores}逻辑`);
      addLog(`内存: ${info.total_memory_gb.toFixed(2)} GB`);
      addLog(`WebView2环境: ${info.webview2_env}`);

      if (!info.is_admin) {
        addLog('小春未以管理员权限运行，部分功能可能受限');
      } else {
        addLog('小春已获取管理员权限，正在降低ACE占用');
      }
    } catch (error) {
      addLog(`获取系统信息失败: ${error}`);
    }
  }, [addLog]);

  const DISPLAY_POINTS = 360;
  const displayedHistory = perfHistory.slice(-DISPLAY_POINTS);

  const fetchPerformance = useCallback(async () => {
    try {
      const perf = await invoke<ProcessPerformance[]>('get_process_performance');
      setPerformance(perf);

      const sguard = perf.find(p => p.name.toLowerCase().includes('sguard64.exe'));
      const sguardsvc = perf.find(p => p.name.toLowerCase().includes('sguardsvc64.exe'));

      const point: PerfDataPoint = {
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        sguard_cpu: sguard ? parseFloat(sguard.cpu_usage.toFixed(1)) : null,
        sguard_mem: sguard ? parseFloat(sguard.memory_mb.toFixed(1)) : null,
        sguardsvc_cpu: sguardsvc ? parseFloat(sguardsvc.cpu_usage.toFixed(1)) : null,
        sguardsvc_mem: sguardsvc ? parseFloat(sguardsvc.memory_mb.toFixed(1)) : null,
        sguard_io: sguard ? parseFloat(((sguard.disk_read_bytes + sguard.disk_write_bytes) / 1024 / 5).toFixed(1)) : null,
        sguardsvc_io: sguardsvc ? parseFloat(((sguardsvc.disk_read_bytes + sguardsvc.disk_write_bytes) / 1024 / 5).toFixed(1)) : null,
      };

      setPerfHistory(prev => [...prev, point]);
    } catch (error) {
      console.error('获取性能数据失败:', error);
    }
  }, []);

  const checkAutoStart = useCallback(async () => {
    try {
      const enabled = await invoke<boolean>('check_autostart');
      setAutoStartEnabled(enabled);
    } catch (error) {
      console.error('检查自启动状态失败:', error);
    }
  }, []);

  const toggleAutoStartup = useCallback(async () => {
    try {
      if (autoStartEnabled) {
        await invoke<string>('disable_autostart');
        setAutoStartEnabled(false);
        addLog('已禁用开机自启动');
      } else {
        await invoke<string>('enable_autostart');
        setAutoStartEnabled(true);
        addLog('已启用开机自启动');
      }
    } catch (error) {
      addLog(`切换自启动失败: ${error}`);
      console.error('切换自启动失败:', error);
    }
  }, [autoStartEnabled, addLog]);



  const lowerAcePriority = useCallback(async () => {
    try {
      setLoading(true);
      addLog('开始降低ACE优先级...');
      const result = await invoke<string>('lower_ace_priority');
      addLog('ACE优先级降低完成:');
      result.split('\n').forEach(line => addLog(line));
    } catch (error) {
      addLog(`降低ACE优先级失败: ${error}`);
      console.error('降低ACE优先级失败:', error);
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  const raiseDeltaPriority = useCallback(async () => {
    try {
      setLoading(true);
      addLog('开始提高三角洲优先级...');
      const result = await invoke<string>('raise_delta_priority');
      addLog('三角洲优先级提高完成:');
      result.split('\n').forEach(line => addLog(line));
    } catch (error) {
      addLog(`提高三角洲优先级失败: ${error}`);
      console.error('提高三角洲优先级失败:', error);
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  const modifyValorantRegistryPriority = useCallback(async () => {
    try {
      setLoading(true);
      addLog('开始修改瓦罗兰特注册表优先级...');
      const result = await invoke<string>('modify_valorant_registry_priority');
      addLog('瓦罗兰特注册表修改完成:');
      result.split('\n').forEach(line => addLog(line));
    } catch (error) {
      addLog(`修改瓦罗兰特注册表失败: ${error}`);
      console.error('修改瓦罗兰特注册表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  const raiseLeaguePriority = useCallback(async () => {
    try {
      setLoading(true);
      addLog('开始提高英雄联盟优先级...');
      const result = await invoke<string>('raise_league_priority');
      addLog('英雄联盟优先级修改完成:');
      result.split('\n').forEach(line => addLog(line));
    } catch (error) {
      addLog(`提高英雄联盟优先级失败: ${error}`);
      console.error('提高英雄联盟优先级失败:', error);
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  const raiseArenaPriority = useCallback(async () => {
    try {
      setLoading(true);
      addLog('开始提高暗区突围优先级...');
      const result = await invoke<string>('raise_arena_priority');
      addLog('暗区突围优先级修改完成:');
      result.split('\n').forEach(line => addLog(line));
    } catch (error) {
      addLog(`提高暗区突围优先级失败: ${error}`);
      console.error('提高暗区突围优先级失败:', error);
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  const raiseFinalsPriority = useCallback(async () => {
    try {
      setLoading(true);
      addLog('开始提高THE FINALS优先级...');
      const result = await invoke<string>('raise_finals_priority');
      addLog('THE FINALS优先级修改完成:');
      result.split('\n').forEach(line => addLog(line));
    } catch (error) {
      addLog(`提高THE FINALS优先级失败: ${error}`);
      console.error('提高THE FINALS优先级失败:', error);
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  const raiseNzfuturePriority = useCallback(async () => {
    try {
      setLoading(true);
      addLog('开始提高逆战未来优先级...');
      const result = await invoke<string>('raise_nzfuture_priority');
      addLog('逆战未来优先级修改完成:');
      result.split('\n').forEach(line => addLog(line));
    } catch (error) {
      addLog(`提高逆战未来优先级失败: ${error}`);
      console.error('提高逆战未来优先级失败:', error);
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  const raiseCrossfirePriority = useCallback(async () => {
    try {
      setLoading(true);
      addLog('开始提高穿越火线优先级...');
      const result = await invoke<string>('raise_crossfire_priority');
      addLog('穿越火线优先级修改完成:');
      result.split('\n').forEach(line => addLog(line));
    } catch (error) {
      addLog(`提高穿越火线优先级失败: ${error}`);
      console.error('提高穿越火线优先级失败:', error);
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  const raiseDnfPriority = useCallback(async () => {
    try {
      setLoading(true);
      addLog('开始提高地下城与勇士优先级...');
      const result = await invoke<string>('raise_dnf_priority');
      addLog('地下城与勇士优先级修改完成:');
      result.split('\n').forEach(line => addLog(line));
    } catch (error) {
      addLog(`提高地下城与勇士优先级失败: ${error}`);
      console.error('提高地下城与勇士优先级失败:', error);
    } finally {
      setLoading(false);
    }
  }, [addLog]);



  const checkRegistryPriority = useCallback(async () => {
    try {
      setLoading(true);
      addLog('正在检查注册表状态...');
      const result = await invoke<string>('check_registry_priority');
      addLog('注册表状态:');
      result.split('\n').forEach(line => addLog(line));
    } catch (error) {
      addLog(`检查注册表失败: ${error}`);
      console.error('检查注册表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  const resetRegistryPriority = useCallback(async () => {
    try {
      setLoading(true);
      addLog('开始恢复注册表默认设置...');
      const result = await invoke<string>('reset_registry_priority');
      addLog('注册表恢复完成:');
      result.split('\n').forEach(line => addLog(line));
    } catch (error) {
      addLog(`恢复注册表失败: ${error}`);
      console.error('恢复注册表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  const generateReport = useCallback(async () => {
    if (perfHistory.length === 0) {
      addLog('没有性能数据可导出');
      return;
    }
    setExportingReport(true);
    addLog('正在生成性能报告...');
    try {
      const data = perfHistory;
      const w = 1400;
      const pad = 50;
      const chartW = w - pad * 2;
      const chartH = 200;
      const chartGap = 80;
      const headerH = 160;
      const totalH = headerH + 3 * (chartH + chartGap) + pad;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = totalH;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, w, totalH);
      // 加载logo
      const logo = await new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
        img.src = '/logo.png';
      });
      const logoSize = 36;
      const titleText = 'FuckACE 性能监控报告';
      ctx.font = 'bold 26px sans-serif';
      const titleWidth = ctx.measureText(titleText).width;
      const totalWidth = logoSize + 12 + titleWidth;
      const startX = (w - totalWidth) / 2;
      if (logo.complete && logo.naturalWidth > 0) {
        ctx.drawImage(logo, startX, 18, logoSize, logoSize);
      }
      ctx.fillStyle = '#90caf9';
      ctx.textAlign = 'left';
      ctx.fillText(titleText, startX + logoSize + 12, 46);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      const mins = Math.floor(data.length * 5 / 60);
      const secs = (data.length * 5) % 60;
      const dur = mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
      ctx.fillText(
        `生成时间: ${new Date().toLocaleString('zh-CN')}  |  数据点: ${data.length}  |  监控时长: ${dur}  |  CPU: ${systemInfo?.cpu_model || 'N/A'}`,
        w / 2, 76
      );
      ctx.fillText(
        `系统: ${systemInfo?.os_name || ''} ${systemInfo?.os_version || ''}  |  内存: ${systemInfo?.total_memory_gb?.toFixed(1) || 'N/A'} GB  |  权限: ${systemInfo?.is_admin ? '管理员' : '普通用户'}`,
        w / 2, 100
      );
      const drawChart = (yOff: number, title: string, unit: string, series: { values: (number | null)[], color: string, label: string }[]) => {
        const x0 = pad;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(title, x0, yOff - 10);
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(x0, yOff, chartW, chartH);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x0, yOff, chartW, chartH);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        for (let i = 1; i < 4; i++) {
          const gy = yOff + (chartH / 4) * i;
          ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x0 + chartW, gy); ctx.stroke();
        }
        let maxVal = 0;
        for (const s of series) for (const v of s.values) if (v !== null && v > maxVal) maxVal = v;
        if (maxVal === 0) maxVal = 1;
        maxVal *= 1.15;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
          ctx.fillText(`${(maxVal / 4 * (4 - i)).toFixed(1)}${unit}`, x0 - 5, yOff + (chartH / 4) * i + 4);
        }
        ctx.textAlign = 'center';
        const step = Math.max(1, Math.floor(data.length / 10));
        for (let i = 0; i < data.length; i += step) {
          ctx.fillText(data[i].time, x0 + (i / Math.max(1, data.length - 1)) * chartW, yOff + chartH + 14);
        }
        for (const s of series) {
          ctx.beginPath(); ctx.strokeStyle = s.color; ctx.lineWidth = 1.5;
          let started = false;
          for (let i = 0; i < s.values.length; i++) {
            const v = s.values[i];
            if (v === null) { started = false; continue; }
            const px = x0 + (i / Math.max(1, data.length - 1)) * chartW;
            const py = yOff + chartH - (v / maxVal) * chartH;
            if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        let lx = x0 + chartW - series.length * 110;
        for (const s of series) {
          ctx.fillStyle = s.color;
          ctx.fillRect(lx, yOff - 14, 10, 10);
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(s.label, lx + 14, yOff - 5);
          lx += 110;
        }
      };
      const y1 = headerH;
      drawChart(y1, 'CPU 占用 (%)', '%', [
        { values: data.map(d => d.sguard_cpu), color: '#f44336', label: 'SGuard64' },
        { values: data.map(d => d.sguardsvc_cpu), color: '#ff9800', label: 'SGuardSvc64' },
      ]);
      drawChart(y1 + chartH + chartGap, '内存占用 (MB)', ' MB', [
        { values: data.map(d => d.sguard_mem), color: '#f44336', label: 'SGuard64' },
        { values: data.map(d => d.sguardsvc_mem), color: '#ff9800', label: 'SGuardSvc64' },
      ]);
      drawChart(y1 + 2 * (chartH + chartGap), 'I/O 读写 (KB/s)', ' KB/s', [
        { values: data.map(d => d.sguard_io), color: '#f44336', label: 'SGuard64' },
        { values: data.map(d => d.sguardsvc_io), color: '#ff9800', label: 'SGuardSvc64' },
      ]);
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const savedPath = await invoke<string>('save_report_to_desktop', {
        imageBase64: base64Data,
        filename: `FuckACE_Report_${ts}.png`,
      });
      addLog(`报告已保存: ${savedPath}`);
    } catch (error) {
      addLog(`生成报告失败: ${error}`);
    } finally {
      setExportingReport(false);
    }
  }, [perfHistory, systemInfo, addLog]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    addLog('FuckACE已启动，开始法克ACE');
    fetchSystemInfo();
    checkAutoStart();

    const perfInterval = setInterval(fetchPerformance, 5000);

    return () => {
      clearInterval(perfInterval);
    };
  }, [addLog, fetchSystemInfo, fetchPerformance, checkAutoStart]);

  useEffect(() => {
    const cached = storage.getChoices();
    if (cached.rememberChoices) {
      if (cached.enableCpuAffinity !== undefined) setEnableCpuAffinity(cached.enableCpuAffinity);
      if (cached.enableProcessPriority !== undefined) setEnableProcessPriority(cached.enableProcessPriority);
      if (cached.enableEfficiencyMode !== undefined) setEnableEfficiencyMode(cached.enableEfficiencyMode);
      if (cached.enableIoPriority !== undefined) setEnableIoPriority(cached.enableIoPriority);
      if (cached.enableMemoryPriority !== undefined) setEnableMemoryPriority(cached.enableMemoryPriority);
      if (cached.autoRestrict !== undefined) setAutoRestrict(cached.autoRestrict);
    }
  }, []);

  useEffect(() => {
    storage.saveChoices({
      enableCpuAffinity,
      enableProcessPriority,
      enableEfficiencyMode,
      enableIoPriority,
      enableMemoryPriority,
      autoRestrict,
      rememberChoices: true,
    });
  }, [enableCpuAffinity, enableProcessPriority, enableEfficiencyMode, enableIoPriority, enableMemoryPriority, autoRestrict]);

  useEffect(() => {
    if (!autoRestrict || hasAutoRestricted || !systemInfo?.is_admin) return;

    const anyFound = performance.some(p => p.name.toLowerCase().includes('sguard64.exe')) ||
      performance.some(p => p.name.toLowerCase().includes('sguardsvc64.exe'));

    if (anyFound) {
      setHasAutoRestricted(true);
      addLog('检测到ACE进程，自动执行主动限制...');
      executeProcessRestriction();
    }
  }, [performance, autoRestrict, hasAutoRestricted, systemInfo, addLog, executeProcessRestriction]);

  useEffect(() => {
    const anyFound = performance.some(p => p.name.toLowerCase().includes('sguard64.exe')) ||
      performance.some(p => p.name.toLowerCase().includes('sguardsvc64.exe'));
    if (!anyFound) {
      setHasAutoRestricted(false);
    }
  }, [performance]);



  useEffect(() => {
    if (hasUpdate) {
      setShowUpdateDialog(true);
    }
  }, [hasUpdate]);

  const getProcessStatusColor = (found: boolean, restricted: boolean) => {
    if (!found) return 'default';
    return restricted ? 'warning' : 'success';
  };

  const getProcessStatusText = (found: boolean, restricted: boolean) => {
    if (!found) return '未找到';
    return restricted ? '已限制' : '运行中';
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const openExternalLink = async (url: string) => {
    try {
      await openUrl(url);
    } catch (error) {
      console.error('opener插件打开链接失败:', error);
      try {
        const { open: shellOpen } = await import('@tauri-apps/plugin-shell');
        await shellOpen(url);
      } catch (shellError) {
        console.error('shell插件打开链接失败:', shellError);
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : createTheme()}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Paper elevation={3} sx={{ p: 1.5, mb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                src="/logo.png"
                sx={{ width: 36, height: 36 }}
                variant="rounded"
              />
              <Box>
                <Typography variant="h5" component="h1" color="primary" sx={{ lineHeight: 1.2 }}>
                  FuckACE v{APP_VERSION}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  小春正在持续监控并限制ACE占用
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={0.5} alignItems="center" flexWrap="wrap">
              <Badge badgeContent={announcements.length > 0 ? announcements.length : 0} color="info">
                <Button
                  variant="outlined"
                  startIcon={<NotificationsIcon />}
                  onClick={() => setShowAnnouncements(true)}
                  sx={{ minWidth: 'auto', px: 0.8 }}
                  size="small"
                >
                  公告
                </Button>
              </Badge>
              <Badge badgeContent={hasUpdate ? 1 : 0} color="error">
                <Button
                  variant="outlined"
                  startIcon={<UpdateIcon />}
                  onClick={() => setShowUpdateDialog(true)}
                  sx={{ minWidth: 'auto', px: 0.8 }}
                  size="small"
                  color={hasUpdate ? "error" : "success"}
                >
                  更新
                </Button>
              </Badge>
              <Button
                variant="outlined"
                startIcon={<GitHubIcon />}
                onClick={async () => await openExternalLink('https://github.com/shshouse/FuckACE')}
                sx={{ minWidth: 'auto', px: 0.8 }}
                size="small"
                title="欢迎star！＞﹏＜"
              >
                Github仓库
              </Button>
              <Button
                variant="outlined"
                startIcon={darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                onClick={toggleDarkMode}
                sx={{ minWidth: 'auto', px: 0.8 }}
                size="small"
              >
                {darkMode ? '浅色' : '暗色'}
              </Button>
            </Box>
          </Box>
        </Paper>

        <Box display="flex" flexDirection="column" gap={1} sx={{ flex: 1, overflow: 'hidden' }}>
          <Box display="flex" gap={1}>
            <Paper elevation={2} sx={{ p: 1.5, flex: 2, minWidth: 0, maxWidth: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>实时监控</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={generateReport}
                  disabled={exportingReport || perfHistory.length === 0}
                  sx={{ fontSize: '0.7rem', py: 0.2 }}
                >
                  {exportingReport ? '生成中...' : '导出报告'}
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5, lineHeight: 1.2 }}>CPU (%)</Typography>
                <ResponsiveContainer width="100%" height={65}>
                  <LineChart data={displayedHistory} margin={{ top: 2, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9 }} domain={[0, 'auto']} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #444', fontSize: 11 }}
                      formatter={(v: unknown) => [`${v}%`]}
                    />
                    <Line type="monotone" dataKey="sguard_cpu" name="SGuard64" stroke="#f44336" dot={false} strokeWidth={1.5} connectNulls />
                    <Line type="monotone" dataKey="sguardsvc_cpu" name="SGuardSvc64" stroke="#ff9800" dot={false} strokeWidth={1.5} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
                <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5, lineHeight: 1.2 }}>内存 (MB)</Typography>
                <ResponsiveContainer width="100%" height={65}>
                  <LineChart data={displayedHistory} margin={{ top: 2, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9 }} domain={[0, 'auto']} unit="MB" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #444', fontSize: 11 }}
                      formatter={(v: unknown) => [`${v} MB`]}
                    />
                    <Line type="monotone" dataKey="sguard_mem" name="SGuard64" stroke="#f44336" dot={false} strokeWidth={1.5} connectNulls />
                    <Line type="monotone" dataKey="sguardsvc_mem" name="SGuardSvc64" stroke="#ff9800" dot={false} strokeWidth={1.5} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
                <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5, lineHeight: 1.2 }}>I/O (KB/s)</Typography>
                <ResponsiveContainer width="100%" height={65}>
                  <LineChart data={displayedHistory} margin={{ top: 2, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9 }} domain={[0, 'auto']} unit="KB" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #444', fontSize: 11 }}
                      formatter={(v: unknown) => [`${v} KB/s`]}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, lineHeight: '14px' }} />
                    <Line type="monotone" dataKey="sguard_io" name="SGuard64" stroke="#f44336" dot={false} strokeWidth={1.5} connectNulls />
                    <Line type="monotone" dataKey="sguardsvc_io" name="SGuardSvc64" stroke="#ff9800" dot={false} strokeWidth={1.5} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            <Paper elevation={2} sx={{ p: 1.5, flex: 1, minWidth: 0, maxWidth: '100%' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>系统信息</Typography>
              {systemInfo ? (
                <Box display="flex" flexDirection="column" gap={0.5} sx={{ maxHeight: 150, overflow: 'hidden' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">CPU:</Typography>
                    <Typography variant="caption" noWrap sx={{ maxWidth: '65%' }} title={systemInfo.cpu_model}>
                      {systemInfo.cpu_model.split(' ').slice(-2).join(' ')}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">核心:</Typography>
                    <Typography variant="caption">{systemInfo.cpu_cores}P / {systemInfo.cpu_logical_cores}L</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">系统:</Typography>
                    <Typography variant="caption">{systemInfo.os_name} {systemInfo.os_version.split('.')[0]}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">内存:</Typography>
                    <Typography variant="caption">{systemInfo.total_memory_gb.toFixed(1)} GB</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">权限:</Typography>
                    <Typography variant="caption">管理员</Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">加载中...</Typography>
              )}
            </Paper>
          </Box>

          <Box display="flex" gap={1}>

            <Paper elevation={2} sx={{ p: 1.5, flex: 1, minWidth: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 0.5, fontWeight: 600 }}>被动限制(开游戏前使用)</Typography>
              <Box display="flex" flexDirection="column" gap={0.4} sx={{ flex: 1 }}>
                <Button
                  variant="contained"
                  onClick={lowerAcePriority}
                  disabled={loading || !systemInfo?.is_admin}
                  color="error"
                  size="small"
                  fullWidth
                  sx={{ py: 0.3, fontSize: '0.75rem' }}
                >
                  降低ACE优先级
                </Button>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={0.4}>
                  <Button
                    variant="contained"
                    onClick={raiseDeltaPriority}
                    disabled={loading || !systemInfo?.is_admin}
                    color="success"
                    size="small"
                    sx={{ py: 0.3, fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                  >
                    三角洲优化
                  </Button>
                  <Button
                    variant="contained"
                    onClick={modifyValorantRegistryPriority}
                    disabled={loading || !systemInfo?.is_admin}
                    color="success"
                    size="small"
                    sx={{ py: 0.3, fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                  >
                    瓦罗兰特优化
                  </Button>
                  <Button
                    variant="contained"
                    onClick={raiseLeaguePriority}
                    disabled={loading || !systemInfo?.is_admin}
                    color="success"
                    size="small"
                    sx={{ py: 0.3, fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                  >
                    英雄联盟优化
                  </Button>
                  <Button
                    variant="contained"
                    onClick={raiseArenaPriority}
                    disabled={loading || !systemInfo?.is_admin}
                    color="success"
                    size="small"
                    sx={{ py: 0.3, fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                  >
                    暗区突围优化
                  </Button>
                  <Button
                    variant="contained"
                    onClick={raiseFinalsPriority}
                    disabled={loading || !systemInfo?.is_admin}
                    color="success"
                    size="small"
                    sx={{ py: 0.3, fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                  >
                    终极角逐优化
                  </Button>
                  <Button
                    variant="contained"
                    onClick={raiseNzfuturePriority}
                    disabled={loading || !systemInfo?.is_admin}
                    color="success"
                    size="small"
                    sx={{ py: 0.3, fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                  >
                    逆战未来优化
                  </Button>
                  <Button
                    variant="contained"
                    onClick={raiseCrossfirePriority}
                    disabled={loading || !systemInfo?.is_admin}
                    color="success"
                    size="small"
                    sx={{ py: 0.3, fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                  >
                    穿越火线优化
                  </Button>
                  <Button
                    variant="contained"
                    onClick={raiseDnfPriority}
                    disabled={loading || !systemInfo?.is_admin}
                    color="success"
                    size="small"
                    sx={{ py: 0.3, fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                  >
                    地下城与勇士优化
                  </Button>
                </Box>
                <Box display="flex" gap={0.4}>
                  <Button
                    variant="outlined"
                    onClick={checkRegistryPriority}
                    disabled={loading}
                    color="info"
                    size="small"
                    fullWidth
                    sx={{ py: 0.3, fontSize: '0.7rem' }}
                  >
                    检查状态
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={resetRegistryPriority}
                    disabled={loading || !systemInfo?.is_admin}
                    color="warning"
                    size="small"
                    fullWidth
                    sx={{ py: 0.3, fontSize: '0.7rem' }}
                  >
                    恢复默认
                  </Button>
                </Box>
              </Box>
            </Paper>

            <Paper elevation={2} sx={{ p: 1.5, flex: 1, minWidth: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 0.5, fontWeight: 600 }}>主动限制(开游戏后使用)</Typography>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={0.5} sx={{ mb: 0.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enableCpuAffinity}
                      onChange={(e) => setEnableCpuAffinity(e.target.checked)}
                      disabled={isMonitoring}
                      color="success"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="caption">CPU亲和性</Typography>
                  }
                  sx={{ m: 0 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={enableProcessPriority}
                      onChange={(e) => setEnableProcessPriority(e.target.checked)}
                      disabled={isMonitoring}
                      color="success"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="caption">进程优先级</Typography>
                  }
                  sx={{ m: 0 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={enableEfficiencyMode}
                      onChange={(e) => setEnableEfficiencyMode(e.target.checked)}
                      disabled={isMonitoring}
                      color="warning"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="caption">效率模式</Typography>
                  }
                  sx={{ m: 0 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={enableIoPriority}
                      onChange={(e) => setEnableIoPriority(e.target.checked)}
                      disabled={isMonitoring}
                      color="error"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="caption">I/O优先级</Typography>
                  }
                  sx={{ m: 0 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={enableMemoryPriority}
                      onChange={(e) => setEnableMemoryPriority(e.target.checked)}
                      disabled={isMonitoring}
                      color="error"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="caption">内存优先级</Typography>
                  }
                  sx={{ m: 0 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoStartEnabled}
                      onChange={toggleAutoStartup}
                      color="primary"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="caption">开机自启动</Typography>
                  }
                  sx={{ m: 0 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRestrict}
                      onChange={(e) => setAutoRestrict(e.target.checked)}
                      disabled={isMonitoring}
                      color="info"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="caption">自动限制（新）</Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Box>
              <Box display="flex" flexDirection="column" gap={0.6} sx={{ flex: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<StartIcon />}
                  onClick={executeOnce}
                  disabled={loading || isMonitoring}
                  color="primary"
                  size="small"
                  fullWidth
                >
                  执行限制
                </Button>
              </Box>
            </Paper>

            <Paper elevation={2} sx={{ p: 1.5, flex: 1, minWidth: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 0.5, fontWeight: 600 }}>主动限制状态</Typography>
              <Box display="flex" flexDirection="column" gap={0.8}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">目标核心:</Typography>
                  <Chip
                    label={targetCore !== null ? `核心 ${targetCore}` : '检测中...'}
                    color="info"
                    variant="outlined"
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>目标进程:</Typography>
                  <Chip
                    label={gameProcesses.length > 0 ? gameProcesses.join(', ') : '未检测到'}
                    color={gameProcesses.length > 0 ? 'success' : 'default'}
                    size="small"
                    sx={{ maxWidth: '70%' }}
                  />
                </Box>
                <Divider sx={{ my: 0.3 }} />
                <List dense sx={{ py: 0 }}>
                  <ListItem secondaryAction={
                    <Chip
                      label={getProcessStatusText(processStatus?.sguard64_found || false, processStatus?.sguard64_restricted || false)}
                      color={getProcessStatusColor(processStatus?.sguard64_found || false, processStatus?.sguard64_restricted || false)}
                      size="small"
                    />
                  }
                    sx={{ py: 0.3 }}
                  >
                    <ListItemText primary="SGuard64.exe" primaryTypographyProps={{ variant: 'body2', fontSize: '0.85rem' }} />
                  </ListItem>
                  <Divider />
                  <ListItem secondaryAction={
                    <Chip
                      label={getProcessStatusText(processStatus?.sguardsvc64_found || false, processStatus?.sguardsvc64_restricted || false)}
                      color={getProcessStatusColor(processStatus?.sguardsvc64_found || false, processStatus?.sguardsvc64_restricted || false)}
                      size="small"
                    />
                  }
                    sx={{ py: 0.3 }}
                  >
                    <ListItemText primary="SGuardSvc64.exe" primaryTypographyProps={{ variant: 'body2', fontSize: '0.85rem' }} />
                  </ListItem>
                </List>
                {loading && <LinearProgress sx={{ mt: 0.5 }} />}
              </Box>
            </Paper>
          </Box>

          <Paper elevation={2} sx={{ p: 1.5, flex: 1, maxWidth: '100%', minHeight: 120 }}>
            <Box
              ref={logContainerRef}
              sx={{
                height: '100%',
                minHeight: 80,
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 0.75,
                backgroundColor: 'background.default',
              }}
            >
              {logs.map((log) => (
                <Typography
                  key={log.id}
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    py: 0.15,
                    lineHeight: 1.4,
                  }}
                >
                  [{log.timestamp}] {log.message}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* 公告对话框 */}
        <Dialog
          open={showAnnouncements}
          onClose={() => setShowAnnouncements(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">公告</Typography>
              <Button onClick={() => setShowAnnouncements(false)} size="small">
                <CloseIcon />
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {announcements.map((announcement) => (
              <Alert
                key={announcement.id}
                severity={
                  announcement.priority === 'urgent' ? 'error' :
                    announcement.priority === 'high' ? 'warning' :
                      announcement.priority === 'low' ? 'info' : 'success'
                }
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  {announcement.title}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                  {announcement.content}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  发布时间: {new Date(announcement.created_at).toLocaleDateString('zh-CN')}
                </Typography>
              </Alert>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAnnouncements(false)}>关闭</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={showUpdateDialog}
          onClose={() => setShowUpdateDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{hasUpdate ? '发现新版本' : '版本检查'}</Typography>
              <Button onClick={() => setShowUpdateDialog(false)} size="small">
                <CloseIcon />
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {hasUpdate && latestVersion ? (
              <Box>
                <Alert severity={latestVersion.is_critical ? 'error' : 'info'} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    版本 {latestVersion.version}
                    {latestVersion.is_critical && ' (重要更新)'}
                  </Typography>
                </Alert>

                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  更新内容:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                  {latestVersion.changelog}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  发布时间: {new Date(latestVersion.created_at).toLocaleDateString('zh-CN')}
                </Typography>
              </Box>
            ) : (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    已是最新版本
                  </Typography>
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  当前版本: v{APP_VERSION}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowUpdateDialog(false)}>{hasUpdate ? '稍后更新' : '关闭'}</Button>
            {hasUpdate && latestVersion && (
              <Button
                variant="contained"
                onClick={async () => {
                  await openExternalLink(latestVersion.download_url);
                }}
                color="primary"
              >
                立即下载
              </Button>
            )}
          </DialogActions>
        </Dialog>


        <Snackbar
          open={fetchError}
          autoHideDuration={6000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="warning" variant="filled" sx={{ width: '100%' }}>
            无法获取更新，请检查网络/(ㄒoㄒ)/~~
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;