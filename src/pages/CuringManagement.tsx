import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from '../components/StatusBadge';
import {
  Flame,
  Thermometer,
  Gauge,
  Clock,
  Wind,
  Play,
  Pause,
  Square,
  Settings,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
} from 'lucide-react';
import type { CuringProcess, DataPoint } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const generateCurves = (targetTemp: number, targetPressure: number, holdTime: number, heatingRate: number, coolingRate: number) => {
  const heatingTime = Math.ceil((targetTemp - 25) / heatingRate);
  const coolingTime = Math.ceil((targetTemp - 60) / coolingRate);
  const totalTime = heatingTime + holdTime + coolingTime + 10;
  
  const tempCurve: DataPoint[] = [];
  const pressureCurve: DataPoint[] = [];
  
  for (let t = 0; t <= totalTime; t += 1) {
    let temp: number;
    let pressure: number;
    
    if (t < 5) {
      temp = 25 + (t / 5) * 10;
      pressure = (t / 5) * targetPressure * 0.3;
    } else if (t < heatingTime + 5) {
      temp = 35 + (t - 5) * heatingRate;
      pressure = targetPressure * 0.3 + ((t - 5) / heatingTime) * targetPressure * 0.7;
    } else if (t < heatingTime + 5 + holdTime) {
      temp = targetTemp;
      pressure = targetPressure;
    } else if (t < totalTime - 10) {
      const ct = t - heatingTime - 5 - holdTime;
      temp = targetTemp - ct * coolingRate;
      pressure = targetPressure * (1 - ct / coolingTime * 0.8);
    } else {
      temp = 60 - (t - totalTime + 10) * 2;
      pressure = targetPressure * 0.2 * (1 - (t - totalTime + 10) / 10);
    }
    
    tempCurve.push({ time: t, value: Math.max(25, temp) });
    pressureCurve.push({ time: t, value: Math.max(0, pressure) });
  }
  
  return { tempCurve, pressureCurve, totalTime };
};

export default function CuringManagement() {
  const { curingProcesses, updateCuringProcess } = useAppStore();
  const [selectedProcess, setSelectedProcess] = useState<CuringProcess | null>(curingProcesses[0] || null);
  const [currentTimes, setCurrentTimes] = useState<Record<string, number>>({});
  const [isRunningMap, setIsRunningMap] = useState<Record<string, boolean>>({});
  const [terminatedMap, setTerminatedMap] = useState<Record<string, boolean>>({});
  const intervalRef = useRef<number | null>(null);

  const getCurrentProcess = () => {
    return curingProcesses.find(p => p.id === selectedProcess?.id) || selectedProcess;
  };

  const currentProcess = getCurrentProcess();

  useEffect(() => {
    const initialTimes: Record<string, number> = {};
    const initialRunning: Record<string, boolean> = {};
    
    curingProcesses.forEach(p => {
      if (p.status === 'heating' || p.status === 'holding') {
        const totalTime = p.tempCurve[p.tempCurve.length - 1]?.time || 0;
        initialTimes[p.id] = totalTime * 0.3;
        initialRunning[p.id] = false;
      } else if (p.status === 'completed') {
        const totalTime = p.tempCurve[p.tempCurve.length - 1]?.time || 0;
        initialTimes[p.id] = totalTime;
      } else {
        initialTimes[p.id] = 0;
      }
    });
    
    setCurrentTimes(initialTimes);
    setIsRunningMap(initialRunning);
  }, []);

  useEffect(() => {
    const activeCount = Object.values(isRunningMap).filter(Boolean).length;
    
    if (activeCount > 0) {
      intervalRef.current = window.setInterval(() => {
        setCurrentTimes(prev => {
          const updated = { ...prev };
          
          Object.keys(isRunningMap).forEach(id => {
            if (isRunningMap[id] && !terminatedMap[id]) {
              const process = curingProcesses.find(p => p.id === id);
              if (process) {
                const totalTime = process.tempCurve[process.tempCurve.length - 1]?.time || 0;
                const newTime = Math.min((prev[id] || 0) + 0.5, totalTime);
                updated[id] = newTime;
                
                if (newTime >= totalTime) {
                  setIsRunningMap(r => ({ ...r, [id]: false }));
                  updateCuringProcess(id, { status: 'completed' });
                } else {
                  const heatingTime = Math.ceil((process.targetTemp - 25) / process.heatingRate);
                  const holdEnd = heatingTime + 5 + process.holdTime;
                  
                  if (newTime <= heatingTime + 5) {
                    if (process.status !== 'heating') {
                      updateCuringProcess(id, { status: 'heating' });
                    }
                  } else if (newTime <= holdEnd) {
                    if (process.status !== 'holding') {
                      updateCuringProcess(id, { status: 'holding' });
                    }
                  } else {
                    if (process.status !== 'cooling') {
                      updateCuringProcess(id, { status: 'cooling' });
                    }
                  }
                }
              }
            }
          });
          
          return updated;
        });
      }, 500);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunningMap, terminatedMap, curingProcesses]);

  const handleStartCuring = (id: string) => {
    const process = curingProcesses.find(p => p.id === id);
    if (!process) return;
    
    if (process.tempCurve.length === 0) {
      const { tempCurve, pressureCurve } = generateCurves(
        process.targetTemp,
        process.targetPressure,
        process.holdTime,
        process.heatingRate,
        process.coolingRate
      );
      updateCuringProcess(id, { tempCurve, pressureCurve });
    }
    
    setCurrentTimes(prev => ({ ...prev, [id]: prev[id] || 0 }));
    setIsRunningMap(prev => ({ ...prev, [id]: true }));
    updateCuringProcess(id, { status: 'heating', startTime: new Date().toLocaleString('zh-CN') });
  };

  const handlePauseCuring = (id: string) => {
    setIsRunningMap(prev => ({ ...prev, [id]: false }));
  };

  const handleResumeCuring = (id: string) => {
    setIsRunningMap(prev => ({ ...prev, [id]: true }));
  };

  const handleTerminateCuring = (id: string) => {
    if (confirm('确定要终止本次固化工序吗？终止后不可恢复。')) {
      setIsRunningMap(prev => ({ ...prev, [id]: false }));
      setTerminatedMap(prev => ({ ...prev, [id]: true }));
      updateCuringProcess(id, { status: 'completed' });
    }
  };

  const getStatusLabel = (status: string, isTerminated?: boolean) => {
    if (isTerminated) return '已终止';
    const labels: Record<string, string> = {
      pending: '待开始',
      heating: '升温中',
      holding: '保温中',
      cooling: '冷却中',
      completed: '已完成',
    };
    return labels[status] || status;
  };

  const getStatusType = (status: string, isTerminated?: boolean) => {
    if (isTerminated) return 'warning';
    const types: Record<string, 'pending' | 'in_progress' | 'success' | 'warning'> = {
      pending: 'pending',
      heating: 'in_progress',
      holding: 'in_progress',
      cooling: 'warning',
      completed: 'success',
    };
    return types[status] || 'pending';
  };

  const getCurrentTemp = () => {
    if (!currentProcess || currentProcess.tempCurve.length === 0) return '25.0';
    const time = currentTimes[currentProcess.id] || 0;
    const point = currentProcess.tempCurve.find(p => p.time >= time);
    return point ? point.value.toFixed(1) : '25.0';
  };

  const getCurrentPressure = () => {
    if (!currentProcess || currentProcess.pressureCurve.length === 0) return '0.000';
    const time = currentTimes[currentProcess.id] || 0;
    const point = currentProcess.pressureCurve.find(p => p.time >= time);
    return point ? point.value.toFixed(3) : '0.000';
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getCurrentTime = () => {
    if (!currentProcess) return 0;
    return currentTimes[currentProcess.id] || 0;
  };

  const isRunning = selectedProcess ? isRunningMap[selectedProcess.id] || false : false;
  const isTerminated = selectedProcess ? terminatedMap[selectedProcess.id] || false : false;

  const chartData = currentProcess ? {
    labels: currentProcess.tempCurve.map(p => formatTime(p.time)),
    datasets: [
      {
        label: '温度 (°C)',
        data: currentProcess.tempCurve.map(p => p.value),
        borderColor: '#ff6b35',
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        tension: 0.3,
        fill: false,
        yAxisID: 'y',
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: '压力 (MPa)',
        data: currentProcess.pressureCurve.map(p => p.value * 100),
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        tension: 0.3,
        fill: false,
        yAxisID: 'y1',
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  } : { labels: [], datasets: [] };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#a0a0ae',
          font: { size: 12 },
          usePointStyle: true,
          pointStyle: 'line',
        },
      },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleColor: '#e5e5ea',
        bodyColor: '#e5e5ea',
        borderColor: '#363647',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#75758a', font: { size: 11 }, maxTicksLimit: 10 },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { 
          color: '#75758a', 
          font: { size: 11 },
          callback: (value: any) => `${value}°C`,
        },
        title: {
          display: true,
          text: '温度 (°C)',
          color: '#ff6b35',
          font: { size: 11 },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { 
          color: '#75758a', 
          font: { size: 11 },
          callback: (value: any) => `${(value / 100).toFixed(2)} MPa`,
        },
        title: {
          display: true,
          text: '压力 (MPa)',
          color: '#00d4ff',
          font: { size: 11 },
        },
      },
    },
  };

  const activeCount = curingProcesses.filter(p => p.status === 'heating' || p.status === 'holding').length;
  const pendingCount = curingProcesses.filter(p => p.status === 'pending').length;
  const completedCount = curingProcesses.filter(p => p.status === 'completed').length;

  const statsData = [
    { label: '进行中固化', value: activeCount, icon: <Flame size={20} />, color: 'text-warning' },
    { label: '已完成', value: completedCount, icon: <CheckCircle2 size={20} />, color: 'text-success' },
    { label: '待固化', value: pendingCount, icon: <Clock size={20} />, color: 'text-accent' },
    { label: '热压罐可用', value: '2/2', icon: <Activity size={20} />, color: 'text-purple-400' },
  ];

  const getProcessProgress = (process: CuringProcess) => {
    const totalTime = process.tempCurve[process.tempCurve.length - 1]?.time || 200;
    const current = currentTimes[process.id] || 0;
    return (current / totalTime) * 100;
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <div key={index} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg bg-carbon-700/50 ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-carbon-100">{stat.value}</p>
                <p className="text-xs text-carbon-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 固化任务列表 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card overflow-hidden">
            <div className="card-header">
              <h3 className="text-base font-semibold text-carbon-100">固化工序</h3>
            </div>
            <div className="divide-y divide-carbon-700/50 max-h-[500px] overflow-y-auto">
              {curingProcesses.map((process) => {
                const terminated = terminatedMap[process.id] || false;
                const progress = getProcessProgress(process);
                
                return (
                  <div
                    key={process.id}
                    onClick={() => setSelectedProcess(process)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-carbon-700/30 ${
                      selectedProcess?.id === process.id ? 'bg-carbon-700/50 border-l-2 border-accent' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-carbon-100 text-sm">{process.productName}</p>
                        <p className="text-xs text-carbon-500 font-mono mt-0.5">{process.autoclaveNo}</p>
                      </div>
                      <StatusBadge 
                        status={getStatusType(process.status, terminated)} 
                        label={getStatusLabel(process.status, terminated)} 
                        showIcon={false} 
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-carbon-400">
                      <span className="flex items-center gap-1">
                        <Thermometer size={12} /> {process.targetTemp}°C
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge size={12} /> {process.targetPressure}MPa
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {process.holdTime}min
                      </span>
                    </div>
                    {(process.status !== 'pending' || terminated) && (
                      <div className="mt-2">
                        <div className="h-1 bg-carbon-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              terminated ? 'bg-yellow-500' : 'bg-accent'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-carbon-500 mt-1">
                          {formatTime(currentTimes[process.id] || 0)} / {formatTime(process.tempCurve[process.tempCurve.length - 1]?.time || 0)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧详情区 */}
        <div className="lg:col-span-2 space-y-6">
          {currentProcess ? (
            <>
              {/* 实时监控 */}
              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${
                      isTerminated 
                        ? 'bg-yellow-500/20 border-yellow-500/30' 
                        : isRunning 
                          ? 'bg-warning/20 border-warning/30 animate-pulse' 
                          : 'bg-carbon-700/50 border-carbon-600'
                    }`}>
                      <Flame size={20} className={isTerminated ? 'text-yellow-500' : isRunning ? 'text-warning' : 'text-carbon-400'} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-carbon-100">{currentProcess.productName}</h3>
                      <p className="text-xs text-carbon-500">{currentProcess.autoclaveNo} · {currentProcess.taskNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentProcess.status === 'pending' && !isTerminated ? (
                      <button 
                        onClick={() => handleStartCuring(currentProcess.id)}
                        className="btn-primary text-sm flex items-center gap-1.5"
                      >
                        <Play size={16} /> 开始固化
                      </button>
                    ) : isTerminated ? (
                      <StatusBadge status="warning" label="已终止" />
                    ) : currentProcess.status === 'completed' ? (
                      <StatusBadge status="success" label="固化完成" />
                    ) : (
                      <div className="flex items-center gap-2">
                        {isRunning ? (
                          <button 
                            onClick={() => handlePauseCuring(currentProcess.id)}
                            className="btn-secondary text-sm flex items-center gap-1.5"
                          >
                            <Pause size={16} /> 暂停
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleResumeCuring(currentProcess.id)}
                            className="btn-primary text-sm flex items-center gap-1.5"
                          >
                            <Play size={16} /> 继续
                          </button>
                        )}
                        <button 
                          onClick={() => handleTerminateCuring(currentProcess.id)}
                          className="btn-secondary text-sm flex items-center gap-1.5 text-danger border-danger/30 hover:bg-danger/10"
                        >
                          <Square size={16} /> 终止
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 实时数据 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 border-b border-carbon-700">
                  <div className="text-center p-3 bg-carbon-900/50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Thermometer size={18} className="text-warning" />
                      <span className="text-xs text-carbon-400">当前温度</span>
                    </div>
                    <p className="text-2xl font-bold text-warning font-mono">{getCurrentTemp()}<span className="text-sm ml-1">°C</span></p>
                    <p className="text-xs text-carbon-500 mt-1">目标: {currentProcess.targetTemp}°C</p>
                  </div>
                  <div className="text-center p-3 bg-carbon-900/50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Gauge size={18} className="text-accent" />
                      <span className="text-xs text-carbon-400">当前压力</span>
                    </div>
                    <p className="text-2xl font-bold text-accent font-mono">{getCurrentPressure()}<span className="text-sm ml-1">MPa</span></p>
                    <p className="text-xs text-carbon-500 mt-1">目标: {currentProcess.targetPressure}MPa</p>
                  </div>
                  <div className="text-center p-3 bg-carbon-900/50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Wind size={18} className="text-purple-400" />
                      <span className="text-xs text-carbon-400">真空度</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-400 font-mono">{currentProcess.vacuumDegree}<span className="text-sm ml-1">MPa</span></p>
                    <p className="text-xs text-carbon-500 mt-1">
                      {currentProcess.vacuumBagChecked ? '真空袋正常' : '未检测'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-carbon-900/50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock size={18} className="text-success" />
                      <span className="text-xs text-carbon-400">已运行</span>
                    </div>
                    <p className="text-2xl font-bold text-success font-mono">{formatTime(getCurrentTime())}</p>
                    <p className="text-xs text-carbon-500 mt-1">保温: {currentProcess.holdTime}min</p>
                  </div>
                </div>

                {/* 温压曲线 */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-carbon-200">温压曲线</h4>
                    <button className="text-xs text-accent hover:text-accent-light transition-colors flex items-center gap-1">
                      <Settings size={12} /> 工艺参数
                    </button>
                  </div>
                  <div className="h-64">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 真空袋检查 */}
                <div className="card overflow-hidden">
                  <div className="card-header">
                    <div className="flex items-center gap-2">
                      <Wind size={18} className="text-purple-400" />
                      <h3 className="text-base font-semibold text-carbon-100">真空袋封装</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="space-y-3">
                      {[
                        { label: '真空袋完好性', status: currentProcess.vacuumBagChecked },
                        { label: '密封胶条密封', status: true },
                        { label: '透气毡铺设', status: true },
                        { label: '吸胶材料放置', status: true },
                        { label: '热电偶布置', status: true },
                        { label: '真空管路连接', status: true },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2.5 bg-carbon-900/50 rounded-lg">
                          <span className="text-sm text-carbon-300">{item.label}</span>
                          {item.status ? (
                            <StatusBadge status="success" label="合格" />
                          ) : (
                            <StatusBadge status="pending" label="待检" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-carbon-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-carbon-400">真空度检测</span>
                        <span className="text-accent font-mono font-medium">{currentProcess.vacuumDegree} MPa</span>
                      </div>
                      <div className="mt-2">
                        <div className="h-2 bg-carbon-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-400 rounded-full"
                            style={{ width: '95%' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 工艺参数 */}
                <div className="card overflow-hidden">
                  <div className="card-header flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-accent" />
                      <h3 className="text-base font-semibold text-carbon-100">固化工艺参数</h3>
                    </div>
                    <button className="text-xs text-accent hover:text-accent-light transition-colors">
                      编辑
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-carbon-400">固化温度</span>
                        <span className="text-sm font-medium text-carbon-200">{currentProcess.targetTemp} °C</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-carbon-400">固化压力</span>
                        <span className="text-sm font-medium text-carbon-200">{currentProcess.targetPressure} MPa</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-carbon-400">保温时间</span>
                        <span className="text-sm font-medium text-carbon-200">{currentProcess.holdTime} 分钟</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-carbon-400">升温速率</span>
                        <span className="text-sm font-medium text-carbon-200">{currentProcess.heatingRate} °C/min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-carbon-400">降温速率</span>
                        <span className="text-sm font-medium text-carbon-200">{currentProcess.coolingRate} °C/min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-carbon-400">真空度要求</span>
                        <span className="text-sm font-medium text-carbon-200">≤ -0.095 MPa</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-carbon-400">操作人</span>
                        <span className="text-sm font-medium text-carbon-200">{currentProcess.operator}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 预警/状态信息 */}
              {isTerminated ? (
                <div className="card overflow-hidden bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                        <AlertTriangle size={20} className="text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-yellow-500 mb-1">工序已终止</h4>
                        <p className="text-sm text-carbon-300">
                          本次固化工序已人工终止，终止时已运行 {formatTime(getCurrentTime())}。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isRunning ? (
                <div className="card overflow-hidden bg-gradient-to-r from-success/10 to-transparent border-success/30">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-success/20 border border-success/30 animate-pulse">
                        <CheckCircle2 size={20} className="text-success" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-success mb-1">固化工况正常</h4>
                        <p className="text-sm text-carbon-300">
                          当前温度压力稳定在设定值范围内，真空度保持良好。
                          {currentProcess.status === 'heating' && ' 正在升温阶段。'}
                          {currentProcess.status === 'holding' && ` 预计还需 ${Math.max(0, currentProcess.holdTime - Math.floor((getCurrentTime() - 40) % currentProcess.holdTime))} 分钟完成保温。`}
                          {currentProcess.status === 'cooling' && ' 正在冷却阶段。'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentProcess.status === 'completed' ? (
                <div className="card overflow-hidden bg-gradient-to-r from-success/10 to-transparent border-success/30">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-success/20 border border-success/30">
                        <CheckCircle2 size={20} className="text-success" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-success mb-1">固化完成</h4>
                        <p className="text-sm text-carbon-300">
                          本次固化工序已完成，总用时 {formatTime(getCurrentTime())}。制品可进入下一工序。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentProcess.status === 'pending' ? (
                <div className="card overflow-hidden bg-gradient-to-r from-accent/10 to-transparent border-accent/30">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-accent/20 border border-accent/30">
                        <Clock size={20} className="text-accent" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-accent mb-1">待开始</h4>
                        <p className="text-sm text-carbon-300">
                          工艺参数已配置完成，真空袋检查合格，点击"开始固化"启动固化工序。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card overflow-hidden bg-gradient-to-r from-warning/10 to-transparent border-warning/30">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-warning/20 border border-warning/30">
                        <Pause size={20} className="text-warning" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-warning mb-1">已暂停</h4>
                        <p className="text-sm text-carbon-300">
                          固化工序已暂停，点击"继续"恢复固化。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center">
              <Flame size={48} className="text-carbon-600 mb-4" />
              <p className="text-carbon-400">选择一个固化工序查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
