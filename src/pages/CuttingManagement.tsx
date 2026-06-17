import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge, ProgressBar } from '../components/StatusBadge';
import {
  Plus,
  Scissors,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Layers,
  Percent,
  Ruler,
  Download,
  Settings,
  RefreshCw,
  FileText,
  X,
  Save,
} from 'lucide-react';
import type { CuttingTask, NestingPart } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const partColors = ['#00d4ff', '#22c55e', '#eab308', '#f97316', '#a855f7', '#06b6d4', '#ec4899', '#14b8a6'];

function generateNestingPlan(layerCount: number): NestingPart[] {
  const parts: NestingPart[] = [];
  const partCount = 6 + Math.floor(Math.random() * 4);
  
  for (let i = 0; i < partCount; i++) {
    const width = 100 + Math.floor(Math.random() * 300);
    const height = 80 + Math.floor(Math.random() * 250);
    parts.push({
      id: generateId(),
      name: `零件${String.fromCharCode(65 + i)}`,
      width,
      height,
      x: 50 + Math.floor(Math.random() * 800),
      y: 50 + Math.floor(Math.random() * 1500),
      angle: [0, 45, -45, 90][Math.floor(Math.random() * 4)],
      layer: 1,
    });
  }
  
  return parts;
}

function calculateUtilization(parts: NestingPart[]): number {
  const totalPartArea = parts.reduce((sum, p) => sum + p.width * p.height, 0);
  const sheetArea = 1000 * 5000;
  const baseUtil = (totalPartArea / sheetArea) * 100 * 4;
  return Math.min(95, Math.max(60, baseUtil + Math.random() * 10));
}

export default function CuttingManagement() {
  const { cuttingTasks, prepregs, addCuttingTask, updateCuttingTask, addActivity, getSelectedId, setSelectedId } = useAppStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    productName: '',
    prepregId: '',
    layerCount: 8,
    totalArea: 5.0,
    operator: '',
  });
  const [cuttingProgress, setCuttingProgress] = useState<Record<string, number>>({});
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const savedId = getSelectedId('cutting');
    if (savedId && cuttingTasks.find((t) => t.id === savedId)) {
      setSelectedTaskId(savedId);
    } else if (cuttingTasks.length > 0) {
      setSelectedTaskId(cuttingTasks[0].id);
    }
  }, [cuttingTasks.length]);

  useEffect(() => {
    if (selectedTaskId) setSelectedId('cutting', selectedTaskId);
  }, [selectedTaskId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.module === 'cutting' && ce.detail?.recordId) {
        const found = cuttingTasks.find((t) => t.id === ce.detail.recordId);
        if (found) setSelectedTaskId(found.id);
      }
    };
    window.addEventListener('app:select-record', handler);
    return () => window.removeEventListener('app:select-record', handler);
  }, [cuttingTasks]);

  const selectedTask = cuttingTasks.find((t) => t.id === selectedTaskId) || null;

  useEffect(() => {
    const progressStates: Record<string, number> = {};
    cuttingTasks.forEach(task => {
      if (task.status === 'cutting') {
        progressStates[task.id] = 45;
      } else if (task.status === 'completed') {
        progressStates[task.id] = 100;
      } else {
        progressStates[task.id] = 0;
      }
    });
    setCuttingProgress(progressStates);
  }, [cuttingTasks]);

  useEffect(() => {
    const cuttingTasksList = cuttingTasks.filter(t => t.status === 'cutting');
    
    if (cuttingTasksList.length > 0) {
      intervalRef.current = window.setInterval(() => {
        setCuttingProgress(prev => {
          const next = { ...prev };
          cuttingTasksList.forEach(task => {
            const current = prev[task.id] || 0;
            if (current < 100) {
              next[task.id] = Math.min(100, current + 0.5);
              if (next[task.id] >= 100) {
                updateCuttingTask(task.id, { status: 'completed', endTime: new Date().toLocaleString('zh-CN') });
                addActivity('cutting', `裁剪完成：${task.productName}，利用率${task.utilizationRate}%`, task.operator);
              }
            }
          });
          return next;
        });
      }, 500);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [cuttingTasks, updateCuttingTask]);

  const handleStartCutting = (taskId: string) => {
    const task = cuttingTasks.find(t => t.id === taskId);
    updateCuttingTask(taskId, { 
      status: 'cutting', 
      startTime: new Date().toLocaleString('zh-CN') 
    });
    setCuttingProgress(prev => ({ ...prev, [taskId]: 0 }));
    if (task) addActivity('cutting', `开始裁剪：${task.productName} (${task.taskNo})`, task.operator);
  };

  const handlePauseCutting = (taskId: string) => {
    const task = cuttingTasks.find(t => t.id === taskId);
    updateCuttingTask(taskId, { status: 'pending' });
    if (task) addActivity('cutting', `暂停裁剪：${task.productName}，进度${Math.round(cuttingProgress[taskId] || 0)}%`, task.operator);
  };

  const handleRenessing = (taskId: string) => {
    const task = cuttingTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newNestingPlan = generateNestingPlan(task.layerCount);
    const newUtilization = Number(calculateUtilization(newNestingPlan).toFixed(1));
    
    updateCuttingTask(taskId, {
      nestingPlan: newNestingPlan,
      utilizationRate: newUtilization,
    });
    addActivity('cutting', `重新排样：${task.productName}，新利用率${newUtilization}%`, task.operator);
  };

  const handleCreateTask = () => {
    if (!newTaskForm.productName || !newTaskForm.prepregId || !newTaskForm.operator) {
      alert('请填写完整信息');
      return;
    }

    const prepreg = prepregs.find(p => p.id === newTaskForm.prepregId);
    const now = new Date().toLocaleString('zh-CN');
    const taskNo = `CT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const nestingPlan = generateNestingPlan(newTaskForm.layerCount);
    const utilizationRate = Number(calculateUtilization(nestingPlan).toFixed(1));

    const newTask: CuttingTask = {
      id: generateId(),
      taskNo,
      productName: newTaskForm.productName,
      prepregId: newTaskForm.prepregId,
      prepregCode: prepreg?.materialCode || '',
      layerCount: newTaskForm.layerCount,
      totalArea: newTaskForm.totalArea,
      utilizationRate,
      status: 'pending',
      createTime: now,
      operator: newTaskForm.operator,
      nestingPlan,
    };

    addCuttingTask(newTask);
    setSelectedTaskId(newTask.id);
    addActivity('cutting', `新建裁剪任务：${newTask.productName} (${newTask.taskNo})`, newTask.operator);
    setShowNewTaskModal(false);
    setNewTaskForm({
      productName: '',
      prepregId: '',
      layerCount: 8,
      totalArea: 5.0,
      operator: '',
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待开始',
      cutting: '裁剪中',
      completed: '已完成',
    };
    return labels[status] || status;
  };

  const getStatusType = (status: string) => {
    const types: Record<string, 'pending' | 'in_progress' | 'success'> = {
      pending: 'pending',
      cutting: 'in_progress',
      completed: 'success',
    };
    return types[status] || 'pending';
  };

  const getCurrentTask = () => {
    return cuttingTasks.find(t => t.id === selectedTask?.id) || selectedTask;
  };

  const currentTask = getCurrentTask();
  const currentProgress = currentTask ? cuttingProgress[currentTask.id] || 0 : 0;

  const statsData = [
    { label: '今日任务', value: cuttingTasks.length, icon: <Scissors size={20} />, color: 'text-accent' },
    { label: '进行中', value: cuttingTasks.filter(t => t.status === 'cutting').length, icon: <Play size={20} />, color: 'text-success' },
    { label: '已完成', value: cuttingTasks.filter(t => t.status === 'completed').length, icon: <CheckCircle2 size={20} />, color: 'text-blue-400' },
    { label: '平均利用率', value: `${(cuttingTasks.reduce((sum, t) => sum + t.utilizationRate, 0) / (cuttingTasks.length || 1)).toFixed(1)}%`, icon: <Percent size={20} />, color: 'text-warning' },
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
              <h3 className="text-base font-semibold text-carbon-100">裁剪任务</h3>
              <button 
                onClick={() => setShowNewTaskModal(true)}
                className="btn-primary text-sm flex items-center gap-1.5 py-1.5"
              >
                <Plus size={16} /> 新建
              </button>
            </div>
            <div className="divide-y divide-carbon-700/50 max-h-[500px] overflow-y-auto">
              {cuttingTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-carbon-700/30 ${
                    selectedTask?.id === task.id ? 'bg-carbon-700/50 border-l-2 border-accent' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-carbon-100 text-sm">{task.productName}</p>
                      <p className="text-xs text-carbon-500 font-mono mt-0.5">{task.taskNo}</p>
                    </div>
                    <StatusBadge status={getStatusType(task.status)} label={getStatusLabel(task.status)} showIcon={false} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-carbon-400">
                    <span className="flex items-center gap-1">
                      <Layers size={12} /> {task.layerCount}层
                    </span>
                    <span className="flex items-center gap-1">
                      <Ruler size={12} /> {task.totalArea}m²
                    </span>
                    <span className="flex items-center gap-1">
                      <Percent size={12} /> {task.utilizationRate}%
                    </span>
                  </div>
                  {task.status === 'cutting' && (
                    <div className="mt-3">
                      <ProgressBar value={cuttingProgress[task.id] || 0} showLabel size="sm" />
                    </div>
                  )}
                </div>
              ))}
              
              {cuttingTasks.length === 0 && (
                <div className="p-8 text-center">
                  <Scissors size={32} className="text-carbon-600 mx-auto mb-2" />
                  <p className="text-sm text-carbon-500">暂无裁剪任务</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧详情区 */}
        <div className="lg:col-span-2 space-y-6">
          {currentTask ? (
            <>
              {/* 任务详情 */}
              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-carbon-100">{currentTask.productName}</h3>
                    <p className="text-xs text-carbon-500 mt-0.5">{currentTask.taskNo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-secondary text-sm flex items-center gap-1.5">
                      <Settings size={16} /> 参数设置
                    </button>
                    {currentTask.status === 'pending' && (
                      <button 
                        onClick={() => handleStartCutting(currentTask.id)}
                        className="btn-primary text-sm flex items-center gap-1.5"
                      >
                        <Play size={16} /> 开始裁剪
                      </button>
                    )}
                    {currentTask.status === 'cutting' && (
                      <button 
                        onClick={() => handlePauseCutting(currentTask.id)}
                        className="btn-secondary text-sm flex items-center gap-1.5 text-warning border-warning/30 hover:bg-warning/10"
                      >
                        <Pause size={16} /> 暂停
                      </button>
                    )}
                    {currentTask.status === 'completed' && (
                      <StatusBadge status="success" label="已完成" />
                    )}
                  </div>
                </div>
                <div className="p-5">
                  {currentTask.status === 'cutting' && (
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-carbon-400">裁剪进度</span>
                        <span className="text-sm font-medium text-accent">{currentProgress.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 bg-carbon-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-300"
                          style={{ width: `${currentProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">使用材料</p>
                      <p className="text-sm font-medium text-carbon-200">{currentTask.prepregCode}</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">铺层数</p>
                      <p className="text-sm font-medium text-carbon-200">{currentTask.layerCount} 层</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">总面积</p>
                      <p className="text-sm font-medium text-carbon-200">{currentTask.totalArea} m²</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">材料利用率</p>
                      <p className="text-sm font-medium text-accent">{currentTask.utilizationRate}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-carbon-400">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} /> 创建时间: {currentTask.createTime}
                    </span>
                    {currentTask.startTime && (
                      <span className="flex items-center gap-1.5">
                        <Play size={14} /> 开始时间: {currentTask.startTime}
                      </span>
                    )}
                    {currentTask.endTime && (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> 完成时间: {currentTask.endTime}
                      </span>
                    )}
                    <span>操作人: {currentTask.operator}</span>
                  </div>
                </div>
              </div>

              {/* 排样图 */}
              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors size={18} className="text-accent" />
                    <h3 className="text-base font-semibold text-carbon-100">排样图</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleRenessing(currentTask.id)}
                      className="btn-secondary text-sm flex items-center gap-1.5 py-1.5"
                    >
                      <RefreshCw size={14} /> 重新排样
                    </button>
                    <button className="btn-secondary text-sm flex items-center gap-1.5 py-1.5">
                      <Download size={14} /> 导出
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="relative bg-carbon-900 rounded-lg border border-carbon-700 overflow-hidden" style={{ height: '320px' }}>
                    <svg 
                      className="w-full h-full" 
                      viewBox="0 0 1000 600"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <defs>
                        <pattern id="grid-cutting" width="50" height="50" patternUnits="userSpaceOnUse">
                          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="1000" height="600" fill="url(#grid-cutting)" />
                      
                      <rect 
                        x="30" y="30" width="940" height="540" 
                        fill="none" stroke="#55556b" strokeWidth="2" strokeDasharray="8,4"
                      />
                      <text x="50" y="20" fill="#75758a" fontSize="12">原料: 1000mm × 5000mm</text>
                      
                      {currentTask.nestingPlan.length > 0 ? (
                        currentTask.nestingPlan.map((part, idx) => {
                          const color = partColors[idx % partColors.length];
                          return (
                            <g key={part.id}>
                              <rect
                                x={30 + (part.x % 900)}
                                y={30 + (part.y % 500) * 0.3}
                                width={Math.min(part.width * 0.5, 200)}
                                height={Math.min(part.height * 0.3, 120)}
                                fill={color}
                                fillOpacity="0.25"
                                stroke={color}
                                strokeWidth="1.5"
                                rx="3"
                              />
                              <text
                                x={30 + (part.x % 900) + Math.min(part.width * 0.25, 100)}
                                y={30 + (part.y % 500) * 0.3 + Math.min(part.height * 0.15, 60) + 4}
                                fill={color}
                                fontSize="11"
                                textAnchor="middle"
                                fontWeight="500"
                              >
                                {part.name}
                              </text>
                            </g>
                          );
                        })
                      ) : (
                        <text x="500" y="300" fill="#55556b" fontSize="14" textAnchor="middle">
                          点击"重新排样"生成排样方案
                        </text>
                      )}
                    </svg>
                    
                    <div className="absolute bottom-4 right-4 bg-carbon-800/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-carbon-600">
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-carbon-400">利用率:</span>
                          <span className="text-accent font-semibold ml-2">{currentTask.utilizationRate}%</span>
                        </div>
                        <div>
                          <span className="text-carbon-400">零件数:</span>
                          <span className="text-carbon-200 font-medium ml-2">{currentTask.nestingPlan.length * currentTask.layerCount}件</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 下料清单 */}
              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-accent" />
                    <h3 className="text-base font-semibold text-carbon-100">下料清单</h3>
                  </div>
                  <span className="text-xs text-carbon-500">共 {currentTask.layerCount} 层 / {currentTask.nestingPlan.length} 种零件</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>序号</th>
                        <th>零件名称</th>
                        <th>数量</th>
                        <th>尺寸 (长×宽)</th>
                        <th>角度</th>
                        <th>材料</th>
                        <th>备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTask.nestingPlan.length > 0 ? (
                        currentTask.nestingPlan.map((part, idx) => (
                          <tr key={part.id}>
                            <td className="text-carbon-400">{idx + 1}</td>
                            <td className="font-medium text-carbon-200">{part.name}</td>
                            <td className="text-carbon-300">{currentTask.layerCount} 件/层</td>
                            <td className="text-carbon-400 font-mono text-sm">{part.width}×{part.height}mm</td>
                            <td>
                              <span className="text-accent text-sm">
                                {part.angle > 0 ? '+' : ''}{part.angle}°
                              </span>
                            </td>
                            <td className="text-carbon-400 font-mono text-xs">{currentTask.prepregCode}</td>
                            <td className="text-carbon-500 text-xs">-</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-carbon-500">
                            暂无下料清单数据
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
              <Scissors size={48} className="text-carbon-600 mb-4" />
              <p className="text-carbon-400">选择一个任务查看详情</p>
            </div>
          )}
        </div>
      </div>

      {/* 新建任务弹窗 */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card w-full max-w-md mx-4">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-lg font-semibold text-carbon-100">新建裁剪任务</h3>
              <button 
                onClick={() => setShowNewTaskModal(false)}
                className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-carbon-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">产品名称</label>
                <input
                  type="text"
                  value={newTaskForm.productName}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, productName: e.target.value })}
                  className="input-field"
                  placeholder="请输入产品名称"
                />
              </div>
              <div>
                <label className="label">选择预浸料</label>
                <select
                  value={newTaskForm.prepregId}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, prepregId: e.target.value })}
                  className="input-field"
                >
                  <option value="">请选择预浸料</option>
                  {prepregs.filter(p => p.status === 'in_stock').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.materialCode} - {p.fiberType} ({p.remainingLength / 1000}m)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">铺层数</label>
                  <input
                    type="number"
                    value={newTaskForm.layerCount}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, layerCount: Number(e.target.value) })}
                    className="input-field"
                    min="1"
                  />
                </div>
                <div>
                  <label className="label">总面积 (m²)</label>
                  <input
                    type="number"
                    value={newTaskForm.totalArea}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, totalArea: Number(e.target.value) })}
                    className="input-field"
                    step="0.1"
                    min="0.1"
                  />
                </div>
              </div>
              <div>
                <label className="label">操作人员</label>
                <input
                  type="text"
                  value={newTaskForm.operator}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, operator: e.target.value })}
                  className="input-field"
                  placeholder="请输入操作人员姓名"
                />
              </div>
            </div>
            <div className="p-5 pt-0 flex justify-end gap-3">
              <button 
                onClick={() => setShowNewTaskModal(false)}
                className="btn-secondary text-sm"
              >
                取消
              </button>
              <button 
                onClick={handleCreateTask}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <Save size={16} /> 创建任务
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
