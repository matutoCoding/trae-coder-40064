import { useState, useEffect } from 'react';
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
import type { CuringProcess } from '../types';
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

export default function CuringManagement() {
  const { curingProcesses } = useAppStore();
  const [selectedProcess, setSelectedProcess] = useState<CuringProcess | null>(curingProcesses[0] || null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(selectedProcess?.status === 'heating' || selectedProcess?.status === 'holding');

  useEffect(() => {
    if (isRunning && selectedProcess && selectedProcess.tempCurve.length > 0) {
      const timer = setInterval(() => {
        setCurrentTime((prev) => {
          const maxTime = selectedProcess.tempCurve[selectedProcess.tempCurve.length - 1]?.time || 0;
          return Math.min(prev + 1, maxTime);
        });
      }, 500);
      return () => clearInterval(timer);
    }
  }, [isRunning, selectedProcess]);

  useEffect(() => {
    if (selectedProcess) {
      const totalTime = selectedProcess.tempCurve[selectedProcess.tempCurve.length - 1]?.time || 0;
      setCurrentTime(selectedProcess.status === 'completed' ? totalTime : totalTime * 0.4);
    }
  }, [selectedProcess]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待开始',
      heating: '升温中',
      holding: '保温中',
      cooling: '冷却中',
      completed: '已完成',
    };
    return labels[status] || status;
  };

  const getStatusType = (status: string) => {
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
    if (!selectedProcess || selectedProcess.tempCurve.length === 0) return 25;
    const point = selectedProcess.tempCurve.find(p => p.time >= currentTime);
    return point ? point.value.toFixed(1) : selectedProcess.targetTemp;
  };

  const getCurrentPressure = () => {
    if (!selectedProcess || selectedProcess.pressureCurve.length === 0) return 0;
    const point = selectedProcess.pressureCurve.find(p => p.time >= currentTime);
    return point ? point.value.toFixed(3) : selectedProcess.targetPressure;
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const chartData = selectedProcess ? {
    labels: selectedProcess.tempCurve.map(p => formatTime(p.time)),
    datasets: [
      {
        label: '温度 (°C)',
        data: selectedProcess.tempCurve.map(p => p.value),
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
        data: selectedProcess.pressureCurve.map(p => p.value * 100),
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

  const statsData = [
    { label: '进行中固化', value: curingProcesses.filter(p => p.status === 'heating' || p.status === 'holding').length, icon: <Flame size={20} />, color: 'text-warning' },
    { label: '今日完成', value: 3, icon: <CheckCircle2 size={20} />, color: 'text-success' },
    { label: '待固化', value: curingProcesses.filter(p => p.status === 'pending').length, icon: <Clock size={20} />, color: 'text-accent' },
    { label: '热压罐可用', value: '2/2', icon: <Activity size={20} />, color: 'text-purple-400' },
  ];

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
              {curingProcesses.map((process) => (
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
                    <StatusBadge status={getStatusType(process.status)} label={getStatusLabel(process.status)} showIcon={false} />
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
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧详情区 */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProcess ? (
            <>
              {/* 实时监控 */}
              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/20 border border-warning/30">
                      <Flame size={20} className="text-warning" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-carbon-100">{selectedProcess.productName}</h3>
                      <p className="text-xs text-carbon-500">{selectedProcess.autoclaveNo} · {selectedProcess.taskNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedProcess.status === 'pending' ? (
                      <button className="btn-primary text-sm flex items-center gap-1.5">
                        <Play size={16} /> 开始固化
                      </button>
                    ) : selectedProcess.status === 'completed' ? (
                      <StatusBadge status="success" label="固化完成" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setIsRunning(!isRunning)}
                          className="btn-secondary text-sm flex items-center gap-1.5"
                        >
                          {isRunning ? <Pause size={16} /> : <Play size={16} />}
                          {isRunning ? '暂停' : '继续'}
                        </button>
                        <button className="btn-secondary text-sm flex items-center gap-1.5 text-danger border-danger/30 hover:bg-danger/10">
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
                    <p className="text-xs text-carbon-500 mt-1">目标: {selectedProcess.targetTemp}°C</p>
                  </div>
                  <div className="text-center p-3 bg-carbon-900/50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Gauge size={18} className="text-accent" />
                      <span className="text-xs text-carbon-400">当前压力</span>
                    </div>
                    <p className="text-2xl font-bold text-accent font-mono">{getCurrentPressure()}<span className="text-sm ml-1">MPa</span></p>
                    <p className="text-xs text-carbon-500 mt-1">目标: {selectedProcess.targetPressure}MPa</p>
                  </div>
                  <div className="text-center p-3 bg-carbon-900/50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Wind size={18} className="text-purple-400" />
                      <span className="text-xs text-carbon-400">真空度</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-400 font-mono">{selectedProcess.vacuumDegree}<span className="text-sm ml-1">MPa</span></p>
                    <p className="text-xs text-carbon-500 mt-1">
                      {selectedProcess.vacuumBagChecked ? '真空袋正常' : '未检测'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-carbon-900/50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock size={18} className="text-success" />
                      <span className="text-xs text-carbon-400">已运行</span>
                    </div>
                    <p className="text-2xl font-bold text-success font-mono">{formatTime(currentTime)}</p>
                    <p className="text-xs text-carbon-500 mt-1">保温: {selectedProcess.holdTime}min</p>
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
                        { label: '真空袋完好性', status: selectedProcess.vacuumBagChecked },
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
                        <span className="text-accent font-mono font-medium">{selectedProcess.vacuumDegree} MPa</span>
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
                        <span className="text-sm font-medium text-carbon-200">{selectedProcess.targetTemp} °C</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-carbon-400">固化压力</span>
                        <span className="text-sm font-medium text-carbon-200">{selectedProcess.targetPressure} MPa</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-carbon-400">保温时间</span>
                        <span className="text-sm font-medium text-carbon-200">{selectedProcess.holdTime} 分钟</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-carbon-400">升温速率</span>
                        <span className="text-sm font-medium text-carbon-200">{selectedProcess.heatingRate} °C/min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-carbon-400">降温速率</span>
                        <span className="text-sm font-medium text-carbon-200">{selectedProcess.coolingRate} °C/min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-carbon-400">真空度要求</span>
                        <span className="text-sm font-medium text-carbon-200">≤ -0.095 MPa</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-carbon-400">操作人</span>
                        <span className="text-sm font-medium text-carbon-200">{selectedProcess.operator}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 预警信息 */}
              <div className="card overflow-hidden bg-gradient-to-r from-success/10 to-transparent border-success/30">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-success/20 border border-success/30">
                      <CheckCircle2 size={20} className="text-success" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-success mb-1">固化工况正常</h4>
                      <p className="text-sm text-carbon-300">
                        当前温度压力稳定在设定值范围内，真空度保持良好，预计还需 {Math.max(0, selectedProcess.holdTime - Math.floor(currentTime % 60))} 分钟完成保温。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
