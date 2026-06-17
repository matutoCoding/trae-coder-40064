import { useState, useEffect } from 'react';
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
  AlertTriangle,
  RotateCw,
  FileText,
  Grid3x3,
  X,
  Save,
} from 'lucide-react';
import type { LayupRecord, LayupLayer } from '../types';
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
  const { layupRecords, prepregs, updateLayupRecord } = useAppStore();
  const [selectedRecord, setSelectedRecord] = useState<LayupRecord | null>(null);
  const [showAddLayerModal, setShowAddLayerModal] = useState(false);
  const [newLayerForm, setNewLayerForm] = useState({
    angle: 0,
    materialCode: '',
    operator: '',
  });

  useEffect(() => {
    if (layupRecords.length > 0 && !selectedRecord) {
      setSelectedRecord(layupRecords[0]);
    }
  }, [layupRecords]);

  const getCurrentRecord = () => {
    return layupRecords.find(r => r.id === selectedRecord?.id) || selectedRecord;
  };

  const currentRecord = getCurrentRecord();

  const handleAddLayer = () => {
    if (!currentRecord) return;
    if (!newLayerForm.operator) {
      alert('请填写操作人员');
      return;
    }

    const newLayer: LayupLayer = {
      index: currentRecord.currentLayer + 1,
      angle: newLayerForm.angle,
      materialCode: newLayerForm.materialCode || currentRecord.layers[0]?.materialCode || 'CF3051-200',
      layupTime: new Date().toLocaleString('zh-CN'),
      operator: newLayerForm.operator,
      inspected: false,
    };

    const updatedLayers = [...currentRecord.layers, newLayer];
    const newCurrentLayer = currentRecord.currentLayer + 1;
    const isCompleted = newCurrentLayer >= currentRecord.totalLayers;

    updateLayupRecord(currentRecord.id, {
      layers: updatedLayers,
      currentLayer: newCurrentLayer,
      status: isCompleted ? 'completed' : 'in_progress',
    });

    setShowAddLayerModal(false);
    setNewLayerForm({
      angle: 0,
      materialCode: '',
      operator: '',
    });
  };

  const handleInspectLayer = (layerIndex: number) => {
    if (!currentRecord) return;

    const updatedLayers = currentRecord.layers.map(layer => {
      if (layer.index === layerIndex) {
        return {
          ...layer,
          inspected: true,
          inspector: '质检员A',
        };
      }
      return layer;
    });

    const allInspected = updatedLayers.every(l => l.inspected);
    const allLayersDone = updatedLayers.length >= currentRecord.totalLayers;

    updateLayupRecord(currentRecord.id, {
      layers: updatedLayers,
      status: allInspected && allLayersDone ? 'inspected' : currentRecord.status,
    });
  };

  const handleStartLayup = (recordId: string) => {
    updateLayupRecord(recordId, {
      status: 'in_progress',
      startTime: new Date().toLocaleString('zh-CN'),
    });
  };

  const openAddLayerModal = () => {
    if (currentRecord && currentRecord.layers.length > 0) {
      setNewLayerForm(prev => ({
        ...prev,
        materialCode: currentRecord.layers[0].materialCode,
      }));
    }
    setShowAddLayerModal(true);
  };

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

  const angleStats = currentRecord?.layers.length
    ? [
        { angle: '0°', count: currentRecord.layers.filter(l => Math.abs(l.angle) < 1).length },
        { angle: '45°', count: currentRecord.layers.filter(l => l.angle > 30 && l.angle < 60).length },
        { angle: '90°', count: currentRecord.layers.filter(l => Math.abs(l.angle - 90) < 10 || Math.abs(l.angle + 90) < 10).length },
        { angle: '-45°', count: currentRecord.layers.filter(l => l.angle < -30 && l.angle > -60).length },
      ]
    : [
        { angle: '0°', count: 0 },
        { angle: '45°', count: 0 },
        { angle: '90°', count: 0 },
        { angle: '-45°', count: 0 },
      ];

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
    { label: '总层数', value: layupRecords.reduce((sum, r) => sum + r.currentLayer, 0), icon: <Layers size={20} />, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
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
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-carbon-100 text-sm truncate">{record.productName}</p>
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
              
              {layupRecords.length === 0 && (
                <div className="p-8 text-center">
                  <Layers size={32} className="text-carbon-600 mx-auto mb-2" />
                  <p className="text-sm text-carbon-500">暂无铺层任务</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {currentRecord ? (
            <>
              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-carbon-100">{currentRecord.productName}</h3>
                    <p className="text-xs text-carbon-500 mt-0.5">模具号: {currentRecord.moldNo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={getStatusType(currentRecord.status)} label={getStatusLabel(currentRecord.status)} />
                    {currentRecord.status === 'pending' && (
                      <button
                        onClick={() => handleStartLayup(currentRecord.id)}
                        className="btn-primary text-sm flex items-center gap-1.5"
                      >
                        <Play size={16} /> 开始铺层
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">任务单号</p>
                      <p className="text-sm font-mono text-carbon-200">{currentRecord.taskNo}</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">总层数</p>
                      <p className="text-sm font-medium text-carbon-200">{currentRecord.totalLayers} 层</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">当前层数</p>
                      <p className="text-sm font-medium text-accent">第 {currentRecord.currentLayer} 层</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">操作人员</p>
                      <p className="text-sm font-medium text-carbon-200">{currentRecord.operator}</p>
                    </div>
                  </div>

                  {currentRecord.status === 'in_progress' && (
                    <div className="mt-4 pt-4 border-t border-carbon-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-carbon-400">铺层进度</span>
                        <span className="text-sm font-medium text-accent">
                          {currentRecord.currentLayer} / {currentRecord.totalLayers} 层
                        </span>
                      </div>
                      <div className="h-2 bg-carbon-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500"
                          style={{ width: `${(currentRecord.currentLayer / currentRecord.totalLayers) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card overflow-hidden">
                  <div className="card-header">
                    <div className="flex items-center gap-2">
                      <RotateCw size={18} className="text-accent" />
                      <h3 className="text-sm font-semibold text-carbon-100">角度分布</h3>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-center">
                    <div className="w-48 h-48">
                      <Radar data={radarData} options={radarOptions} />
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: '0°', count: angleStats[0].count, color: 'bg-accent' },
                        { label: '±45°', count: angleStats[1].count + angleStats[3].count, color: 'bg-yellow-400' },
                        { label: '90°', count: angleStats[2].count, color: 'bg-green-400' },
                        { label: '其他', count: Math.max(0, currentRecord.layers.length - angleStats.reduce((s, a) => s + a.count, 0)), color: 'bg-purple-400' },
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

                <div className="card overflow-hidden md:col-span-2">
                  <div className="card-header flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid3x3 size={18} className="text-accent" />
                      <h3 className="text-sm font-semibold text-carbon-100">铺层记录</h3>
                    </div>
                    {currentRecord.status === 'in_progress' && currentRecord.currentLayer < currentRecord.totalLayers && (
                      <button
                        onClick={openAddLayerModal}
                        className="text-xs text-accent hover:text-accent-light transition-colors flex items-center gap-1"
                      >
                        <Plus size={14} /> 添加铺层
                      </button>
                    )}
                  </div>
                  <div className="p-4 max-h-64 overflow-y-auto">
                    {currentRecord.layers.length > 0 ? (
                      <div className="space-y-2">
                        {[...currentRecord.layers].reverse().map((layer) => (
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
                                <div className="flex items-center gap-1">
                                  <StatusBadge status="warning" label="待检验" showIcon={false} />
                                  <button
                                    onClick={() => handleInspectLayer(layer.index)}
                                    className="p-1.5 rounded hover:bg-carbon-700 text-success hover:text-success-light transition-colors"
                                    title="检验合格"
                                  >
                                    <CheckCircle2 size={16} />
                                  </button>
                                </div>
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
                        <p className="text-sm text-carbon-500 mb-3">暂无铺层记录</p>
                        {currentRecord.status === 'in_progress' && (
                          <button
                            onClick={openAddLayerModal}
                            className="btn-primary text-sm"
                          >
                            开始铺层
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-accent" />
                    <h3 className="text-base font-semibold text-carbon-100">铺层工艺表</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentRecord.status === 'in_progress' && currentRecord.currentLayer < currentRecord.totalLayers && (
                      <button
                        onClick={openAddLayerModal}
                        className="btn-primary text-sm flex items-center gap-1.5 py-1.5"
                      >
                        <Plus size={14} /> 添加层
                      </button>
                    )}
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
                      {currentRecord.layers.length > 0 ? (
                        currentRecord.layers.map((layer) => (
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
                                  <button
                                    onClick={() => handleInspectLayer(layer.index)}
                                    className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-success transition-colors"
                                    title="检验合格"
                                  >
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

      {showAddLayerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card w-full max-w-md mx-4">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-lg font-semibold text-carbon-100">添加铺层</h3>
              <button
                onClick={() => setShowAddLayerModal(false)}
                className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-carbon-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">层号</label>
                <input
                  type="text"
                  value={`第 ${(currentRecord?.currentLayer || 0) + 1} 层 / 共 ${currentRecord?.totalLayers || 0} 层`}
                  disabled
                  className="input-field bg-carbon-900/50 text-carbon-500"
                />
              </div>
              <div>
                <label className="label">铺层角度 (°)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[0, 45, -45, 90].map((angle) => (
                    <button
                      key={angle}
                      onClick={() => setNewLayerForm(prev => ({ ...prev, angle }))}
                      className={`py-2 rounded-lg text-sm font-medium transition-all ${
                        newLayerForm.angle === angle
                          ? 'bg-accent text-carbon-900'
                          : 'bg-carbon-700 text-carbon-300 hover:bg-carbon-600'
                      }`}
                    >
                      {angle > 0 ? '+' : ''}{angle}°
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={newLayerForm.angle}
                  onChange={(e) => setNewLayerForm(prev => ({ ...prev, angle: Number(e.target.value) }))}
                  className="input-field"
                  step="0.1"
                />
              </div>
              <div>
                <label className="label">材料牌号</label>
                <select
                  value={newLayerForm.materialCode}
                  onChange={(e) => setNewLayerForm(prev => ({ ...prev, materialCode: e.target.value }))}
                  className="input-field"
                >
                  <option value="">请选择材料</option>
                  {prepregs.map((p) => (
                    <option key={p.id} value={p.materialCode}>
                      {p.materialCode} ({p.fiberType})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">操作人员</label>
                <input
                  type="text"
                  value={newLayerForm.operator}
                  onChange={(e) => setNewLayerForm(prev => ({ ...prev, operator: e.target.value }))}
                  className="input-field"
                  placeholder="请输入操作人员姓名"
                />
              </div>
            </div>
            <div className="p-5 pt-0 flex justify-end gap-3">
              <button
                onClick={() => setShowAddLayerModal(false)}
                className="btn-secondary text-sm"
              >
                取消
              </button>
              <button
                onClick={handleAddLayer}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <Save size={16} /> 确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
