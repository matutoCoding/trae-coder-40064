import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from '../components/StatusBadge';
import {
  Layers,
  Play,
  CheckCircle2,
  Clock,
  User,
  Plus,
  Eye,
  Edit2,
  AlertTriangle,
  RotateCw,
  FileText,
  Grid3x3,
} from 'lucide-react';
import type { LayupRecord } from '../types';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function LayupManagement() {
  const { layupRecords } = useAppStore();
  const [selectedRecord, setSelectedRecord] = useState<LayupRecord | null>(layupRecords[0] || null);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待开始',
      in_progress: '进行中',
      completed: '已完成',
      inspected: '已检验',
    };
    return labels[status] || status;
  };

  const getStatusType = (status: string) => {
    const types: Record<string, 'pending' | 'in_progress' | 'success' | 'info'> = {
      pending: 'pending',
      in_progress: 'in_progress',
      completed: 'success',
      inspected: 'info',
    };
    return types[status] || 'pending';
  };

  const angleStats = selectedRecord?.layers.length
    ? [
        { angle: '0°', count: selectedRecord.layers.filter(l => Math.abs(l.angle) < 1).length },
        { angle: '45°', count: selectedRecord.layers.filter(l => l.angle > 30 && l.angle < 60).length },
        { angle: '90°', count: selectedRecord.layers.filter(l => Math.abs(l.angle - 90) < 10 || Math.abs(l.angle + 90) < 10).length },
        { angle: '-45°', count: selectedRecord.layers.filter(l => l.angle < -30 && l.angle > -60).length },
      ]
    : [];

  const radarData = {
    labels: ['0°', '45°', '90°', '-45°'],
    datasets: [
      {
        label: '铺层数量',
        data: angleStats.map(s => s.count),
        backgroundColor: 'rgba(0, 212, 255, 0.2)',
        borderColor: '#00d4ff',
        borderWidth: 2,
        pointBackgroundColor: '#00d4ff',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#00d4ff',
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: {
          color: '#a0a0ae',
          font: { size: 12 },
        },
        ticks: {
          display: false,
          stepSize: 1,
        },
      },
    },
  };

  const statsData = [
    { label: '进行中', value: layupRecords.filter(r => r.status === 'in_progress').length, icon: <Play size={20} />, color: 'text-accent' },
    { label: '待开始', value: layupRecords.filter(r => r.status === 'pending').length, icon: <Clock size={20} />, color: 'text-warning' },
    { label: '已完成', value: layupRecords.filter(r => r.status === 'completed' || r.status === 'inspected').length, icon: <CheckCircle2 size={20} />, color: 'text-success' },
    { label: '总层数', value: 86, icon: <Layers size={20} />, color: 'text-purple-400' },
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
        {/* 任务列表 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-base font-semibold text-carbon-100">铺层任务</h3>
              <button className="btn-primary text-sm flex items-center gap-1.5 py-1.5">
                <Plus size={16} /> 新建
              </button>
            </div>
            <div className="divide-y divide-carbon-700/50 max-h-[500px] overflow-y-auto">
              {layupRecords.map((record) => (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-carbon-700/30 ${
                    selectedRecord?.id === record.id ? 'bg-carbon-700/50 border-l-2 border-accent' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-carbon-100 text-sm">{record.productName}</p>
                      <p className="text-xs text-carbon-500 font-mono mt-0.5">{record.taskNo}</p>
                    </div>
                    <StatusBadge status={getStatusType(record.status)} label={getStatusLabel(record.status)} showIcon={false} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-carbon-400">
                    <span className="flex items-center gap-1">
                      <Layers size={12} /> {record.currentLayer}/{record.totalLayers}层
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={12} /> {record.operator}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 bg-carbon-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${(record.currentLayer / record.totalLayers) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-carbon-500 mt-1">
                      完成 {((record.currentLayer / record.totalLayers) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧详情区 */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRecord ? (
            <>
              {/* 基本信息 */}
              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-carbon-100">{selectedRecord.productName}</h3>
                    <p className="text-xs text-carbon-500 mt-0.5">模具号: {selectedRecord.moldNo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={getStatusType(selectedRecord.status)} label={getStatusLabel(selectedRecord.status)} />
                    {selectedRecord.status === 'in_progress' && (
                      <button className="btn-primary text-sm flex items-center gap-1.5">
                        <CheckCircle2 size={16} /> 完成铺层
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">任务单号</p>
                      <p className="text-sm font-mono text-carbon-200">{selectedRecord.taskNo}</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">总层数</p>
                      <p className="text-sm font-medium text-carbon-200">{selectedRecord.totalLayers} 层</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">当前层数</p>
                      <p className="text-sm font-medium text-accent">第 {selectedRecord.currentLayer} 层</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">操作人员</p>
                      <p className="text-sm font-medium text-carbon-200">{selectedRecord.operator}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 角度分布雷达图 */}
                <div className="card overflow-hidden">
                  <div className="card-header">
                    <div className="flex items-center gap-2">
                      <RotateCw size={18} className="text-accent" />
                      <h3 className="text-sm font-semibold text-carbon-100">角度分布</h3>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-center">
                    <div className="w-48 h-48">
                      {selectedRecord.layers.length > 0 && (
                        <Radar data={radarData} options={radarOptions} />
                      )}
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: '0°', count: angleStats.find(s => s.angle === '0°')?.count || 0, color: 'bg-accent' },
                        { label: '±45°', count: (angleStats.find(s => s.angle === '45°')?.count || 0) + (angleStats.find(s => s.angle === '-45°')?.count || 0), color: 'bg-yellow-400' },
                        { label: '90°', count: angleStats.find(s => s.angle === '90°')?.count || 0, color: 'bg-green-400' },
                        { label: '其他', count: 0, color: 'bg-purple-400' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-xs text-carbon-400">{item.label}:</span>
                          <span className="text-xs text-carbon-200 font-medium">{item.count}层</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 铺层进度 */}
                <div className="card overflow-hidden md:col-span-2">
                  <div className="card-header flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid3x3 size={18} className="text-accent" />
                      <h3 className="text-sm font-semibold text-carbon-100">铺层记录</h3>
                    </div>
                    <button className="text-xs text-accent hover:text-accent-light transition-colors">
                      添加铺层
                    </button>
                  </div>
                  <div className="p-4 max-h-64 overflow-y-auto">
                    {selectedRecord.layers.length > 0 ? (
                      <div className="space-y-2">
                        {[...selectedRecord.layers].reverse().map((layer) => (
                          <div
                            key={layer.index}
                            className="flex items-center gap-4 p-3 bg-carbon-900/50 rounded-lg hover:bg-carbon-900 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-accent">{layer.index}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <span className="text-accent font-mono text-sm font-medium">
                                  {layer.angle > 0 ? '+' : ''}{layer.angle}°
                                </span>
                                <span className="text-xs text-carbon-500">{layer.materialCode}</span>
                              </div>
                              <p className="text-xs text-carbon-500 mt-0.5">
                                {layer.layupTime} · {layer.operator}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {layer.inspected ? (
                                <StatusBadge status="success" label="已检验" showIcon={false} />
                              ) : (
                                <StatusBadge status="warning" label="待检验" showIcon={false} />
                              )}
                              <button className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-carbon-200 transition-colors">
                                <Eye size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Layers size={32} className="text-carbon-600 mx-auto mb-2" />
                        <p className="text-sm text-carbon-500">暂无铺层记录</p>
                        <button className="mt-3 btn-primary text-sm">
                          开始铺层
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 铺层顺序表 */}
              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-accent" />
                    <h3 className="text-base font-semibold text-carbon-100">铺层工艺表</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-secondary text-sm flex items-center gap-1.5 py-1.5">
                      <Edit2 size={14} /> 编辑
                    </button>
                    <button className="btn-primary text-sm flex items-center gap-1.5 py-1.5">
                      <Plus size={14} /> 添加层
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>层号</th>
                        <th>铺层角度</th>
                        <th>材料牌号</th>
                        <th>铺层时间</th>
                        <th>操作人员</th>
                        <th>检验状态</th>
                        <th>检验员</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.layers.length > 0 ? (
                        selectedRecord.layers.map((layer) => (
                          <tr key={layer.index}>
                            <td>
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-accent/20 text-accent text-sm font-bold">
                                {layer.index}
                              </span>
                            </td>
                            <td>
                              <span className="text-accent font-mono font-medium">
                                {layer.angle > 0 ? '+' : ''}{layer.angle}°
                              </span>
                            </td>
                            <td className="text-carbon-300 font-mono text-sm">{layer.materialCode}</td>
                            <td className="text-carbon-400 text-sm">{layer.layupTime}</td>
                            <td className="text-carbon-300 text-sm">{layer.operator}</td>
                            <td>
                              {layer.inspected ? (
                                <StatusBadge status="success" label="合格" />
                              ) : (
                                <StatusBadge status="pending" label="待检" />
                              )}
                            </td>
                            <td className="text-carbon-400 text-sm">{layer.inspector || '-'}</td>
                            <td>
                              <div className="flex items-center gap-1">
                                <button className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-accent transition-colors">
                                  <Eye size={14} />
                                </button>
                                {!layer.inspected && (
                                  <button className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-success transition-colors">
                                    <CheckCircle2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-carbon-500">
                            <AlertTriangle size={24} className="mx-auto mb-2 opacity-50" />
                            暂无铺层数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center">
              <Layers size={48} className="text-carbon-600 mb-4" />
              <p className="text-carbon-400">选择一个任务查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
