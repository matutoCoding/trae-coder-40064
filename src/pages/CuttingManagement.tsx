import { useState } from 'react';
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
} from 'lucide-react';
import type { CuttingTask, NestingPart } from '../types';

export default function CuttingManagement() {
  const { cuttingTasks, prepregs } = useAppStore();
  const [selectedTask, setSelectedTask] = useState<CuttingTask | null>(cuttingTasks[0] || null);

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

  const statsData = [
    { label: '今日任务', value: cuttingTasks.length, icon: <Scissors size={20} />, color: 'text-accent' },
    { label: '进行中', value: cuttingTasks.filter(t => t.status === 'cutting').length, icon: <Play size={20} />, color: 'text-success' },
    { label: '已完成', value: cuttingTasks.filter(t => t.status === 'completed').length, icon: <CheckCircle2 size={20} />, color: 'text-blue-400' },
    { label: '平均利用率', value: '78.5%', icon: <Percent size={20} />, color: 'text-warning' },
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
              <button className="btn-primary text-sm flex items-center gap-1.5 py-1.5">
                <Plus size={16} /> 新建
              </button>
            </div>
            <div className="divide-y divide-carbon-700/50 max-h-[500px] overflow-y-auto">
              {cuttingTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
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
                      <ProgressBar value={45} showLabel size="sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧详情区 */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTask ? (
            <>
              {/* 任务详情 */}
              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-carbon-100">{selectedTask.productName}</h3>
                    <p className="text-xs text-carbon-500 mt-0.5">{selectedTask.taskNo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-secondary text-sm flex items-center gap-1.5">
                      <Settings size={16} /> 参数设置
                    </button>
                    {selectedTask.status === 'pending' && (
                      <button className="btn-primary text-sm flex items-center gap-1.5">
                        <Play size={16} /> 开始裁剪
                      </button>
                    )}
                    {selectedTask.status === 'cutting' && (
                      <button className="btn-secondary text-sm flex items-center gap-1.5 text-warning border-warning/30 hover:bg-warning/10">
                        <Pause size={16} /> 暂停
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">使用材料</p>
                      <p className="text-sm font-medium text-carbon-200">{selectedTask.prepregCode}</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">铺层数</p>
                      <p className="text-sm font-medium text-carbon-200">{selectedTask.layerCount} 层</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">总面积</p>
                      <p className="text-sm font-medium text-carbon-200">{selectedTask.totalArea} m²</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">材料利用率</p>
                      <p className="text-sm font-medium text-accent">{selectedTask.utilizationRate}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-carbon-400">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} /> 创建时间: {selectedTask.createTime}
                    </span>
                    {selectedTask.startTime && (
                      <span className="flex items-center gap-1.5">
                        <Play size={14} /> 开始时间: {selectedTask.startTime}
                      </span>
                    )}
                    <span>操作人: {selectedTask.operator}</span>
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
                    <button className="btn-secondary text-sm flex items-center gap-1.5 py-1.5">
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
                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                        </pattern>
                        <linearGradient id="partGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.1" />
                        </linearGradient>
                      </defs>
                      <rect width="1000" height="600" fill="url(#grid)" />
                      
                      <rect 
                        x="30" y="30" width="940" height="540" 
                        fill="none" stroke="#55556b" strokeWidth="2" strokeDasharray="8,4"
                      />
                      <text x="50" y="20" fill="#75758a" fontSize="12">原料: 1000mm × 5000mm</text>
                      
                      {selectedTask.nestingPlan.length > 0 ? (
                        selectedTask.nestingPlan.map((part) => (
                          <g key={part.id}>
                            <rect
                              x={30 + part.x * 0.5}
                              y={30 + part.y * 0.3}
                              width={part.width * 0.5}
                              height={part.height * 0.3}
                              fill="url(#partGradient)"
                              stroke="#00d4ff"
                              strokeWidth="1.5"
                              rx="2"
                            />
                            <text
                              x={30 + part.x * 0.5 + part.width * 0.25}
                              y={30 + part.y * 0.3 + part.height * 0.15 + 4}
                              fill="#00d4ff"
                              fontSize="11"
                              textAnchor="middle"
                            >
                              {part.name}
                            </text>
                          </g>
                        ))
                      ) : (
                        <g>
                          <rect x="50" y="50" width="350" height="200" fill="url(#partGradient)" stroke="#00d4ff" strokeWidth="1.5" rx="4" />
                          <text x="225" y="155" fill="#00d4ff" fontSize="14" textAnchor="middle">零件 A - 8件</text>
                          
                          <rect x="420" y="50" width="250" height="200" fill="url(#partGradient)" stroke="#22c55e" strokeWidth="1.5" rx="4" />
                          <text x="545" y="155" fill="#22c55e" fontSize="14" textAnchor="middle">零件 B - 4件</text>
                          
                          <rect x="690" y="50" width="260" height="120" fill="url(#partGradient)" stroke="#eab308" strokeWidth="1.5" rx="4" />
                          <text x="820" y="110" fill="#eab308" fontSize="14" textAnchor="middle">加强筋 - 16件</text>
                          
                          <rect x="690" y="180" width="260" height="70" fill="url(#partGradient)" stroke="#f97316" strokeWidth="1.5" rx="4" />
                          <text x="820" y="220" fill="#f97316" fontSize="14" textAnchor="middle">包边条 - 8件</text>
                          
                          <rect x="50" y="270" width="500" height="280" fill="url(#partGradient)" stroke="#a855f7" strokeWidth="1.5" rx="4" />
                          <text x="300" y="415" fill="#a855f7" fontSize="14" textAnchor="middle">主面板 - 2件</text>
                          
                          <rect x="570" y="270" width="380" height="130" fill="url(#partGradient)" stroke="#06b6d4" strokeWidth="1.5" rx="4" />
                          <text x="760" y="335" fill="#06b6d4" fontSize="14" textAnchor="middle">侧板 - 4件</text>
                        </g>
                      )}
                    </svg>
                    
                    <div className="absolute bottom-4 right-4 bg-carbon-800/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-carbon-600">
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-carbon-400">利用率:</span>
                          <span className="text-accent font-semibold ml-2">{selectedTask.utilizationRate}%</span>
                        </div>
                        <div>
                          <span className="text-carbon-400">零件数:</span>
                          <span className="text-carbon-200 font-medium ml-2">{selectedTask.layerCount * 8}件</span>
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
                  <span className="text-xs text-carbon-500">共 {selectedTask.layerCount} 层</span>
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
                      {[
                        { no: 1, name: '主面板', qty: 2, size: '1000×500mm', angle: '0°', material: selectedTask.prepregCode, remark: '外观面' },
                        { no: 2, name: '侧板', qty: 4, size: '600×200mm', angle: '0°/±45°', material: selectedTask.prepregCode, remark: '' },
                        { no: 3, name: '加强筋', qty: 16, size: '500×30mm', angle: '0°', material: selectedTask.prepregCode, remark: '单向' },
                        { no: 4, name: '包边条', qty: 8, size: '400×25mm', angle: '45°', material: selectedTask.prepregCode, remark: '' },
                      ].map((item) => (
                        <tr key={item.no}>
                          <td className="text-carbon-400">{item.no}</td>
                          <td className="font-medium text-carbon-200">{item.name}</td>
                          <td className="text-carbon-300">{item.qty} 件</td>
                          <td className="text-carbon-400 font-mono text-sm">{item.size}</td>
                          <td>
                            <span className="text-accent text-sm">{item.angle}</span>
                          </td>
                          <td className="text-carbon-400 font-mono text-xs">{item.material}</td>
                          <td className="text-carbon-500 text-xs">{item.remark || '-'}</td>
                        </tr>
                      ))}
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
    </div>
  );
}
