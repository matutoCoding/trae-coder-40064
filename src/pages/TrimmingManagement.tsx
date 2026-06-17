import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from '../components/StatusBadge';
import {
  Wrench,
  Package,
  CheckCircle2,
  Clock,
  User,
  Thermometer,
  Ruler,
  CircleDot,
  Star,
  Plus,
  Eye,
  Edit2,
  FileText,
  ArrowRight,
} from 'lucide-react';
import type { TrimmingRecord } from '../types';

export default function TrimmingManagement() {
  const { trimmingRecords } = useAppStore();
  const [selectedRecord, setSelectedRecord] = useState<TrimmingRecord | null>(trimmingRecords[0] || null);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待处理',
      demolded: '已脱模',
      trimming: '修整中',
      drilling: '钻孔中',
      completed: '已完成',
    };
    return labels[status] || status;
  };

  const getStatusType = (status: string) => {
    const types: Record<string, 'pending' | 'in_progress' | 'success' | 'warning'> = {
      pending: 'pending',
      demolded: 'in_progress',
      trimming: 'in_progress',
      drilling: 'in_progress',
      completed: 'success',
    };
    return types[status] || 'pending';
  };

  const getEdgeQualityLabel = (quality: string) => {
    const labels: Record<string, string> = {
      excellent: '优秀',
      good: '良好',
      fair: '一般',
      poor: '较差',
    };
    return labels[quality] || quality;
  };

  const getEdgeQualityColor = (quality: string) => {
    const colors: Record<string, string> = {
      excellent: 'text-success',
      good: 'text-accent',
      fair: 'text-warning',
      poor: 'text-danger',
    };
    return colors[quality] || 'text-carbon-400';
  };

  const processSteps = [
    { key: 'demolded', label: '脱模', icon: <Package size={18} /> },
    { key: 'trimming', label: '边缘修整', icon: <Wrench size={18} /> },
    { key: 'drilling', label: '钻孔加工', icon: <CircleDot size={18} /> },
    { key: 'completed', label: '完成', icon: <CheckCircle2 size={18} /> },
  ];

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const statusOrder = ['pending', 'demolded', 'trimming', 'drilling', 'completed'];
    const stepOrder = ['demolded', 'trimming', 'drilling', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = stepOrder.indexOf(stepKey);
    
    if (stepIndex < currentIndex - 1 || currentStatus === 'completed') return 'done';
    if (stepIndex === currentIndex - 1) return 'current';
    return 'pending';
  };

  const statsData = [
    { label: '今日脱模', value: 5, icon: <Package size={20} />, color: 'text-accent' },
    { label: '修整中', value: trimmingRecords.filter(r => r.status === 'trimming').length, icon: <Wrench size={20} />, color: 'text-warning' },
    { label: '钻孔中', value: trimmingRecords.filter(r => r.status === 'drilling').length, icon: <CircleDot size={20} />, color: 'text-purple-400' },
    { label: '已完成', value: trimmingRecords.filter(r => r.status === 'completed').length, icon: <CheckCircle2 size={20} />, color: 'text-success' },
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
              <h3 className="text-base font-semibold text-carbon-100">后处理任务</h3>
              <button className="btn-primary text-sm flex items-center gap-1.5 py-1.5">
                <Plus size={16} /> 新建
              </button>
            </div>
            <div className="divide-y divide-carbon-700/50 max-h-[500px] overflow-y-auto">
              {trimmingRecords.map((record) => (
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
                      <User size={12} /> {record.trimOperator}
                    </span>
                    <span className="flex items-center gap-1">
                      <CircleDot size={12} /> {record.holeCount}孔
                    </span>
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
              {/* 工序流程图 */}
              <div className="card overflow-hidden">
                <div className="card-header">
                  <h3 className="text-base font-semibold text-carbon-100">后处理工序</h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    {processSteps.map((step, index) => {
                      const status = getStepStatus(step.key, selectedRecord.status);
                      const isLast = index === processSteps.length - 1;
                      
                      return (
                        <div key={step.key} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              status === 'done' ? 'bg-success/20 border-success text-success' :
                              status === 'current' ? 'bg-accent/20 border-accent text-accent animate-pulse' :
                              'bg-carbon-800 border-carbon-600 text-carbon-500'
                            }`}>
                              {step.icon}
                            </div>
                            <span className={`mt-2 text-xs font-medium ${
                              status === 'done' ? 'text-success' :
                              status === 'current' ? 'text-accent' :
                              'text-carbon-500'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                          {!isLast && (
                            <div className={`flex-1 h-0.5 mx-2 ${
                              status === 'done' ? 'bg-success' : 'bg-carbon-700'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 基本信息 */}
              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-accent" />
                    <h3 className="text-base font-semibold text-carbon-100">制品信息</h3>
                  </div>
                  <StatusBadge status={getStatusType(selectedRecord.status)} label={getStatusLabel(selectedRecord.status)} />
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">产品名称</p>
                      <p className="text-sm font-medium text-carbon-200">{selectedRecord.productName}</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">任务单号</p>
                      <p className="text-sm font-mono text-carbon-200">{selectedRecord.taskNo}</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">脱模温度</p>
                      <p className="text-sm font-medium text-carbon-200">{selectedRecord.demoldTemp} °C</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">钻孔数量</p>
                      <p className="text-sm font-medium text-carbon-200">{selectedRecord.holeCount} 个</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 脱模信息 */}
                    <div className="p-4 bg-carbon-900/30 rounded-lg border border-carbon-700/50">
                      <h4 className="text-sm font-semibold text-carbon-200 mb-3 flex items-center gap-2">
                        <Package size={16} className="text-accent" />
                        脱模记录
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-carbon-400">脱模时间</span>
                          <span className="text-sm text-carbon-200">{selectedRecord.demoldTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-carbon-400">脱模人员</span>
                          <span className="text-sm text-carbon-200">{selectedRecord.demoldOperator}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-carbon-400">脱模温度</span>
                          <span className="text-sm text-carbon-200">{selectedRecord.demoldTemp} °C</span>
                        </div>
                      </div>
                    </div>

                    {/* 修整信息 */}
                    <div className="p-4 bg-carbon-900/30 rounded-lg border border-carbon-700/50">
                      <h4 className="text-sm font-semibold text-carbon-200 mb-3 flex items-center gap-2">
                        <Wrench size={16} className="text-warning" />
                        修整信息
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-carbon-400">修整结果</span>
                          <span className="text-sm text-carbon-200">{selectedRecord.trimResult}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-carbon-400">修整人员</span>
                          <span className="text-sm text-carbon-200">{selectedRecord.trimOperator}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-carbon-400">边缘质量</span>
                          <span className={`text-sm font-medium ${getEdgeQualityColor(selectedRecord.edgeQuality)}`}>
                            {getEdgeQualityLabel(selectedRecord.edgeQuality)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 钻孔参数 */}
                <div className="card overflow-hidden">
                  <div className="card-header">
                    <div className="flex items-center gap-2">
                      <CircleDot size={18} className="text-purple-400" />
                      <h3 className="text-sm font-semibold text-carbon-100">钻孔参数</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-carbon-900/50 rounded-lg">
                        <span className="text-sm text-carbon-400">钻孔规格</span>
                        <span className="text-sm font-mono text-carbon-200">{selectedRecord.drillingSpec}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-carbon-900/50 rounded-lg">
                        <span className="text-sm text-carbon-400">孔数量</span>
                        <span className="text-sm font-medium text-carbon-200">{selectedRecord.holeCount} 个</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-carbon-900/50 rounded-lg">
                        <span className="text-sm text-carbon-400">孔径公差</span>
                        <span className="text-sm text-carbon-200">±0.05 mm</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-carbon-900/50 rounded-lg">
                        <span className="text-sm text-carbon-400">孔位精度</span>
                        <span className="text-sm text-carbon-200">±0.1 mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 质量评级 */}
                <div className="card overflow-hidden">
                  <div className="card-header">
                    <div className="flex items-center gap-2">
                      <Star size={18} className="text-yellow-400" />
                      <h3 className="text-sm font-semibold text-carbon-100">质量评级</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-center gap-6 mb-4">
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getEdgeQualityColor(selectedRecord.edgeQuality)}`}>
                          {selectedRecord.edgeQuality === 'excellent' ? 'A' : 
                           selectedRecord.edgeQuality === 'good' ? 'B' :
                           selectedRecord.edgeQuality === 'fair' ? 'C' : 'D'}
                        </div>
                        <p className="text-xs text-carbon-500 mt-1">外观等级</p>
                      </div>
                      <div className="w-px h-12 bg-carbon-700" />
                      <div className="text-center">
                        <div className="text-4xl font-bold text-success">优</div>
                        <p className="text-xs text-carbon-500 mt-1">尺寸精度</p>
                      </div>
                      <div className="w-px h-12 bg-carbon-700" />
                      <div className="text-center">
                        <div className="text-4xl font-bold text-accent">A</div>
                        <p className="text-xs text-carbon-500 mt-1">综合评级</p>
                      </div>
                    </div>
                    <div className="space-y-2.5 pt-4 border-t border-carbon-700">
                      {[
                        { label: '表面质量', score: 95, color: 'bg-success' },
                        { label: '尺寸精度', score: 92, color: 'bg-accent' },
                        { label: '孔位精度', score: 88, color: 'bg-yellow-400' },
                        { label: '边缘质量', score: 96, color: 'bg-success' },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-carbon-400">{item.label}</span>
                            <span className="text-xs text-carbon-300 font-medium">{item.score}分</span>
                          </div>
                          <div className="h-1.5 bg-carbon-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${item.color}`}
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 备注信息 */}
              <div className="card overflow-hidden">
                <div className="card-header">
                  <h3 className="text-sm font-semibold text-carbon-100">备注信息</h3>
                </div>
                <div className="p-5">
                  <p className="text-sm text-carbon-300 leading-relaxed">
                    {selectedRecord.remark || '暂无备注信息'}
                  </p>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center justify-end gap-3">
                <button className="btn-secondary text-sm flex items-center gap-1.5">
                  <Eye size={16} /> 查看详情
                </button>
                <button className="btn-secondary text-sm flex items-center gap-1.5">
                  <Edit2 size={16} /> 编辑记录
                </button>
                <button className="btn-primary text-sm flex items-center gap-1.5">
                  下一步：无损检测 <ArrowRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center">
              <Wrench size={48} className="text-carbon-600 mb-4" />
              <p className="text-carbon-400">选择一个任务查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
