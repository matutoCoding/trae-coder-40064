import { useState, useEffect } from 'react';
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
  X,
  Save,
} from 'lucide-react';
import type { TrimmingRecord } from '../types';

type FormType = 'demold' | 'trimming' | 'drilling' | 'complete' | null;

interface StepFormState {
  operator: string;
  temp: string;
  remark: string;
  edgeQuality: 'excellent' | 'good' | 'fair' | 'poor';
  trimResult: string;
  holeCount: string;
}

const emptyStepForm: StepFormState = {
  operator: '',
  temp: '60',
  remark: '',
  edgeQuality: 'good',
  trimResult: '合格',
  holeCount: '6',
};

export default function TrimmingManagement() {
  const {
    trimmingRecords,
    updateTrimmingRecord,
    addActivity,
    getSelectedId,
    setSelectedId,
  } = useAppStore();

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [formType, setFormType] = useState<FormType>(null);
  const [stepForm, setStepForm] = useState<StepFormState>(emptyStepForm);

  useEffect(() => {
    const savedId = getSelectedId('trimming');
    if (savedId && trimmingRecords.find((r) => r.id === savedId)) {
      setSelectedRecordId(savedId);
    } else if (trimmingRecords.length > 0) {
      setSelectedRecordId(trimmingRecords[0].id);
    }
  }, [trimmingRecords.length]);

  useEffect(() => {
    if (selectedRecordId) setSelectedId('trimming', selectedRecordId);
  }, [selectedRecordId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.module === 'trimming' && ce.detail?.recordId) {
        const found = trimmingRecords.find((r) => r.id === ce.detail.recordId);
        if (found) setSelectedRecordId(found.id);
      }
    };
    window.addEventListener('app:select-record', handler);
    return () => window.removeEventListener('app:select-record', handler);
  }, [trimmingRecords]);

  const selectedRecord = trimmingRecords.find((r) => r.id === selectedRecordId) || null;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待脱模',
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

    if (currentStatus === 'completed') return 'done';
    if (stepIndex < currentIndex - 1) return 'done';
    if (stepIndex === currentIndex - 1) return 'current';
    return 'pending';
  };

  const getNextStep = (status: string) => {
    const order = ['pending', 'demolded', 'trimming', 'drilling', 'completed'];
    const idx = order.indexOf(status);
    return order[Math.min(idx + 1, order.length - 1)];
  };

  const getNextStepLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '脱模',
      demolded: '边缘修整',
      trimming: '钻孔加工',
      drilling: '完成',
    };
    return labels[status] || '下一步';
  };

  const statsData = [
    { label: '今日脱模', value: trimmingRecords.filter((r) => r.status !== 'pending').length, icon: <Package size={20} />, color: 'text-accent' },
    { label: '修整中', value: trimmingRecords.filter((r) => r.status === 'trimming').length, icon: <Wrench size={20} />, color: 'text-warning' },
    { label: '钻孔中', value: trimmingRecords.filter((r) => r.status === 'drilling').length, icon: <CircleDot size={20} />, color: 'text-purple-400' },
    { label: '已完成', value: trimmingRecords.filter((r) => r.status === 'completed').length, icon: <CheckCircle2 size={20} />, color: 'text-success' },
  ];

  const openStepModal = (type: FormType) => {
    if (!selectedRecord) return;
    setStepForm({
      ...emptyStepForm,
      operator: selectedRecord.demoldOperator || selectedRecord.trimOperator || '',
      temp: String(selectedRecord.demoldTemp || 60),
    });
    setFormType(type);
  };

  const closeModal = () => {
    setFormType(null);
    setStepForm(emptyStepForm);
  };

  const handleSubmitStep = () => {
    if (!selectedRecord) return;
    if (!stepForm.operator && formType !== 'complete') {
      alert('请填写操作人');
      return;
    }
    const now = new Date().toLocaleString('zh-CN');

    if (formType === 'demold') {
      updateTrimmingRecord(selectedRecord.id, {
        status: 'demolded',
        demoldTime: now,
        demoldOperator: stepForm.operator,
        demoldTemp: Number(stepForm.temp),
        remark: stepForm.remark,
      });
      addActivity('trimming', `制品脱模完成：${selectedRecord.productName}（${stepForm.temp}°C）`, stepForm.operator);
    } else if (formType === 'trimming') {
      updateTrimmingRecord(selectedRecord.id, {
        status: 'trimming',
        trimOperator: stepForm.operator,
        trimResult: stepForm.trimResult,
        edgeQuality: stepForm.edgeQuality,
      });
      addActivity('trimming', `边缘修整完成：${selectedRecord.productName} - ${getEdgeQualityLabel(stepForm.edgeQuality)} / ${stepForm.trimResult}`, stepForm.operator);
    } else if (formType === 'drilling') {
      const count = Number(stepForm.holeCount) || selectedRecord.holeCount;
      updateTrimmingRecord(selectedRecord.id, {
        status: 'drilling',
        drillOperator: stepForm.operator,
        drillTime: now,
        holeCount: count,
      });
      addActivity('trimming', `开始钻孔加工：${selectedRecord.productName}（共${count}孔）`, stepForm.operator);
    } else if (formType === 'complete') {
      updateTrimmingRecord(selectedRecord.id, {
        status: 'completed',
        completeTime: now,
        remark: (selectedRecord.remark || '') + (stepForm.remark ? ` | ${stepForm.remark}` : ''),
      });
      addActivity('trimming', `后处理完成：${selectedRecord.productName} 可进入下一工序`, stepForm.operator || '系统');
    }
    closeModal();
  };

  const canDoStep = (step: FormType, status: string) => {
    if (step === 'demold') return status === 'pending';
    if (step === 'trimming') return status === 'demolded';
    if (step === 'drilling') return status === 'trimming';
    if (step === 'complete') return status === 'drilling';
    return false;
  };

  const handleNextStep = () => {
    if (!selectedRecord) return;
    const s = selectedRecord.status;
    if (s === 'pending') openStepModal('demold');
    else if (s === 'demolded') openStepModal('trimming');
    else if (s === 'trimming') openStepModal('drilling');
    else if (s === 'drilling') openStepModal('complete');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <div key={index} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg bg-carbon-700/50 ${stat.color}`}>{stat.icon}</div>
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
              <h3 className="text-base font-semibold text-carbon-100">后处理任务</h3>
              <button className="btn-primary text-sm flex items-center gap-1.5 py-1.5">
                <Plus size={16} /> 新建
              </button>
            </div>
            <div className="divide-y divide-carbon-700/50 max-h-[500px] overflow-y-auto">
              {trimmingRecords.map((record) => (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecordId(record.id)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-carbon-700/30 ${
                    selectedRecordId === record.id ? 'bg-carbon-700/50 border-l-2 border-accent' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-carbon-100 text-sm truncate">{record.productName}</p>
                      <p className="text-xs text-carbon-500 font-mono mt-0.5">{record.taskNo}</p>
                    </div>
                    <StatusBadge
                      status={getStatusType(record.status)}
                      label={getStatusLabel(record.status)}
                      showIcon={false}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-carbon-400">
                    <span className="flex items-center gap-1">
                      <User size={12} /> {record.trimOperator}
                    </span>
                    <span className="flex items-center gap-1">
                      <CircleDot size={12} /> {record.holeCount}孔
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-1">
                      {processSteps.map((s) => {
                        const st = getStepStatus(s.key, record.status);
                        return (
                          <div
                            key={s.key}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                              st === 'done'
                                ? 'bg-success/20 text-success'
                                : st === 'current'
                                ? 'bg-accent/20 text-accent'
                                : 'bg-carbon-700/50 text-carbon-500'
                            }`}
                          >
                            {st === 'done' ? <CheckCircle2 size={12} /> : s.icon?.props?.size ? '' : processSteps.indexOf(s) + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedRecord ? (
            <>
              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-carbon-100">{selectedRecord.productName}</h3>
                    <p className="text-xs text-carbon-500 mt-0.5">任务号: {selectedRecord.taskNo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={getStatusType(selectedRecord.status)}
                      label={getStatusLabel(selectedRecord.status)}
                    />
                    {canDoStep('demold', selectedRecord.status) && (
                      <button onClick={() => openStepModal('demold')} className="btn-primary text-sm flex items-center gap-1.5">
                        <Package size={16} /> 登记脱模
                      </button>
                    )}
                    {canDoStep('trimming', selectedRecord.status) && (
                      <button onClick={() => openStepModal('trimming')} className="btn-primary text-sm flex items-center gap-1.5">
                        <Wrench size={16} /> 登记修整
                      </button>
                    )}
                    {canDoStep('drilling', selectedRecord.status) && (
                      <button onClick={() => openStepModal('drilling')} className="btn-primary text-sm flex items-center gap-1.5">
                        <CircleDot size={16} /> 登记钻孔
                      </button>
                    )}
                    {canDoStep('complete', selectedRecord.status) && (
                      <button onClick={() => openStepModal('complete')} className="btn-primary text-sm flex items-center gap-1.5">
                        <CheckCircle2 size={16} /> 完成后处理
                      </button>
                    )}
                    {selectedRecord.status !== 'completed' && (
                      <button onClick={handleNextStep} className="btn-secondary text-sm flex items-center gap-1.5">
                        下一步 <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    {processSteps.map((step, index) => {
                      const status = getStepStatus(step.key, selectedRecord.status);
                      const isLast = index === processSteps.length - 1;

                      return (
                        <div key={step.key} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                status === 'done'
                                  ? 'bg-success/20 border-success text-success'
                                  : status === 'current'
                                  ? 'bg-accent/20 border-accent text-accent animate-pulse'
                                  : 'bg-carbon-800 border-carbon-600 text-carbon-500'
                              }`}
                            >
                              {step.icon}
                            </div>
                            <span
                              className={`mt-2 text-xs font-medium ${
                                status === 'done'
                                  ? 'text-success'
                                  : status === 'current'
                                  ? 'text-accent'
                                  : 'text-carbon-500'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                          {!isLast && (
                            <div
                              className={`flex-1 h-0.5 mx-2 ${status === 'done' ? 'bg-success' : 'bg-carbon-700'}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-accent" />
                    <h3 className="text-base font-semibold text-carbon-100">制品信息</h3>
                  </div>
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
                        {canDoStep('demold', selectedRecord.status) && (
                          <button
                            onClick={() => openStepModal('demold')}
                            className="w-full mt-3 btn-primary text-sm"
                          >
                            登记脱模
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-carbon-900/30 rounded-lg border border-carbon-700/50">
                      <h4 className="text-sm font-semibold text-carbon-200 mb-3 flex items-center gap-2">
                        <Wrench size={16} className="text-warning" />
                        修整信息
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-carbon-400">修整结果</span>
                          <span className="text-sm text-carbon-200">{selectedRecord.trimResult || '待处理'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-carbon-400">修整人员</span>
                          <span className="text-sm text-carbon-200">{selectedRecord.trimOperator || '待分配'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-carbon-400">边缘质量</span>
                          <span className={`text-sm font-medium ${getEdgeQualityColor(selectedRecord.edgeQuality)}`}>
                            {getEdgeQualityLabel(selectedRecord.edgeQuality)}
                          </span>
                        </div>
                        {canDoStep('trimming', selectedRecord.status) && (
                          <button
                            onClick={() => openStepModal('trimming')}
                            className="w-full mt-3 btn-primary text-sm"
                          >
                            登记修整
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      {canDoStep('drilling', selectedRecord.status) && (
                        <button onClick={() => openStepModal('drilling')} className="w-full btn-primary text-sm">
                          登记钻孔并完成
                        </button>
                      )}
                    </div>
                  </div>
                </div>

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
                          {selectedRecord.edgeQuality === 'excellent'
                            ? 'A'
                            : selectedRecord.edgeQuality === 'good'
                            ? 'B'
                            : selectedRecord.edgeQuality === 'fair'
                            ? 'C'
                            : 'D'}
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
                        <div className="text-4xl font-bold text-accent">
                          {selectedRecord.status === 'completed' ? 'A' : '-'}
                        </div>
                        <p className="text-xs text-carbon-500 mt-1">综合评级</p>
                      </div>
                    </div>
                    <div className="space-y-2.5 pt-4 border-t border-carbon-700">
                      {[
                        { label: '表面质量', score: selectedRecord.edgeQuality === 'excellent' ? 95 : selectedRecord.edgeQuality === 'good' ? 85 : 70, color: 'bg-success' },
                        { label: '尺寸精度', score: 92, color: 'bg-accent' },
                        { label: '孔位精度', score: selectedRecord.status === 'completed' ? 88 : 0, color: 'bg-yellow-400' },
                        { label: '边缘质量', score: selectedRecord.edgeQuality === 'excellent' ? 96 : selectedRecord.edgeQuality === 'good' ? 86 : 72, color: 'bg-success' },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-carbon-400">{item.label}</span>
                            <span className="text-xs text-carbon-300 font-medium">{item.score}分</span>
                          </div>
                          <div className="h-1.5 bg-carbon-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

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

              <div className="flex items-center justify-end gap-3 flex-wrap">
                <button className="btn-secondary text-sm flex items-center gap-1.5">
                  <Eye size={16} /> 查看详情
                </button>
                <button className="btn-secondary text-sm flex items-center gap-1.5">
                  <Edit2 size={16} /> 编辑记录
                </button>
                {selectedRecord.status === 'drilling' && (
                  <button onClick={() => openStepModal('complete')} className="btn-primary text-sm flex items-center gap-1.5">
                    完成后处理 <ArrowRight size={16} />
                  </button>
                )}
                {selectedRecord.status !== 'completed' && !canDoStep('demold', selectedRecord.status) && !canDoStep('trimming', selectedRecord.status) && !canDoStep('drilling', selectedRecord.status) && !canDoStep('complete', selectedRecord.status) && (
                  <button onClick={handleNextStep} className="btn-primary text-sm flex items-center gap-1.5">
                    {getNextStepLabel(selectedRecord.status)} <ArrowRight size={16} />
                  </button>
                )}
                {selectedRecord.status === 'completed' && (
                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('app:navigate', {
                          detail: { module: 'ndt', timestamp: Date.now() },
                        })
                      )
                    }
                    className="btn-primary text-sm flex items-center gap-1.5"
                  >
                    下一步：无损检测 <ArrowRight size={16} />
                  </button>
                )}
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

      {/* 脱模弹窗 */}
      {formType === 'demold' && selectedRecord && (
        <StepModal
          title="登记脱模信息"
          onClose={closeModal}
          stepForm={stepForm}
          setStepForm={setStepForm}
          onSubmit={handleSubmitStep}
          confirmText="确认脱模"
          showTemp
        />
      )}

      {/* 修整弹窗 */}
      {formType === 'trimming' && selectedRecord && (
        <StepModal
          title="登记修整信息"
          onClose={closeModal}
          stepForm={stepForm}
          setStepForm={setStepForm}
          onSubmit={handleSubmitStep}
          confirmText="确认修整完成"
          showTrimOptions
        />
      )}

      {/* 钻孔弹窗 */}
      {formType === 'drilling' && selectedRecord && (
        <StepModal
          title="登记钻孔信息"
          onClose={closeModal}
          stepForm={stepForm}
          setStepForm={setStepForm}
          onSubmit={handleSubmitStep}
          confirmText="确认开始钻孔"
          showHoleCount
        />
      )}

      {/* 完成后处理弹窗 */}
      {formType === 'complete' && selectedRecord && (
        <StepModal
          title="完成后处理"
          onClose={closeModal}
          stepForm={stepForm}
          setStepForm={setStepForm}
          onSubmit={handleSubmitStep}
          confirmText="确认完成"
          isComplete
        />
      )}
    </div>
  );
}

function StepModal({
  title,
  onClose,
  stepForm,
  setStepForm,
  onSubmit,
  confirmText,
  showTemp,
  showTrimOptions,
  showHoleCount,
  isComplete,
}: {
  title: string;
  onClose: () => void;
  stepForm: StepFormState;
  setStepForm: (f: StepFormState) => void;
  onSubmit: () => void;
  confirmText: string;
  showTemp?: boolean;
  showTrimOptions?: boolean;
  showHoleCount?: boolean;
  isComplete?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-lg font-semibold text-carbon-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-carbon-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {isComplete && (
            <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-carbon-100">确认完成后处理</p>
                  <p className="text-xs text-carbon-400 mt-1">后处理完成后，产品将进入无损检测工序。</p>
                </div>
              </div>
            </div>
          )}
          {showTemp && (
            <div>
              <label className="label">脱模温度 (°C)</label>
              <input
                type="number"
                value={stepForm.temp}
                onChange={(e) => setStepForm({ ...stepForm, temp: e.target.value })}
                className="input-field"
              />
            </div>
          )}
          {showTrimOptions && (
            <>
              <div>
                <label className="label">修整结果</label>
                <select
                  value={stepForm.trimResult}
                  onChange={(e) => setStepForm({ ...stepForm, trimResult: e.target.value })}
                  className="input-field"
                >
                  <option value="合格">合格</option>
                  <option value="返工">返工</option>
                  <option value="报废">报废</option>
                </select>
              </div>
              <div>
                <label className="label">边缘质量</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['excellent', 'good', 'fair', 'poor'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setStepForm({ ...stepForm, edgeQuality: q })}
                      className={`py-2 rounded-lg text-sm font-medium transition-all ${
                        stepForm.edgeQuality === q
                          ? 'bg-accent text-carbon-900'
                          : 'bg-carbon-700 text-carbon-300 hover:bg-carbon-600'
                      }`}
                    >
                      {q === 'excellent' ? '优' : q === 'good' ? '良' : q === 'fair' ? '中' : '差'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {showHoleCount && (
            <div>
              <label className="label">钻孔数量 (个)</label>
              <input
                type="number"
                value={stepForm.holeCount}
                onChange={(e) => setStepForm({ ...stepForm, holeCount: e.target.value })}
                className="input-field"
                min="1"
              />
            </div>
          )}
          {!isComplete && (
            <div>
              <label className="label">操作人</label>
              <input
                type="text"
                value={stepForm.operator}
                onChange={(e) => setStepForm({ ...stepForm, operator: e.target.value })}
                className="input-field"
                placeholder="请输入姓名"
              />
            </div>
          )}
          <div>
            <label className="label">备注</label>
            <input
              type="text"
              value={stepForm.remark}
              onChange={(e) => setStepForm({ ...stepForm, remark: e.target.value })}
              className="input-field"
              placeholder="选填"
            />
          </div>
        </div>
        <div className="p-5 pt-0 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary text-sm">
            取消
          </button>
          <button onClick={onSubmit} className="btn-primary text-sm flex items-center gap-1.5">
            <Save size={14} /> {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
