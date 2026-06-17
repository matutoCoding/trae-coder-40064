import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from '../components/StatusBadge';
import {
  Plus,
  Search,
  Filter,
  Download,
  Thermometer,
  Package,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Eye,
  X,
  Save,
  LogOut,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';
import type { Prepreg } from '../types';
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
import { mockTemperatureData } from '../data/mockData';

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

const genId = () => Math.random().toString(36).substring(2, 10);

type ModalType = 'add' | 'edit' | 'outbound' | 'expired' | null;

interface FormState {
  materialCode: string;
  materialType: string;
  thickness: number;
  width: number;
  length: number;
  areaWeight: number;
  fiberType: string;
  resinType: string;
  manufactureDate: string;
  expireDate: string;
  storageLocation: string;
  storageTemp: number;
  supplier: string;
  batchNo: string;
  remainingLength: number;
  status: 'in_stock' | 'in_use' | 'expired' | 'exhausted';
}

const emptyForm: FormState = {
  materialCode: '',
  materialType: '碳纤维预浸料',
  thickness: 0.2,
  width: 1000,
  length: 50000,
  areaWeight: 200,
  fiberType: 'T700',
  resinType: '环氧树脂',
  manufactureDate: new Date().toISOString().split('T')[0],
  expireDate: '',
  storageLocation: 'A-01-01',
  storageTemp: -18,
  supplier: '中复神鹰',
  batchNo: '',
  remainingLength: 50000,
  status: 'in_stock',
};

export default function PrepregManagement() {
  const {
    prepregs,
    addPrepreg,
    updatePrepreg,
    deletePrepreg,
    addActivity,
    getSelectedId,
    setSelectedId,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPrepregId, setSelectedPrepregId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [outboundForm, setOutboundForm] = useState({
    length: 5000,
    operator: '',
    purpose: '',
  });

  useEffect(() => {
    const savedId = getSelectedId('prepreg');
    if (savedId && prepregs.find((p) => p.id === savedId)) {
      setSelectedPrepregId(savedId);
    } else if (prepregs.length > 0) {
      setSelectedPrepregId(prepregs[0].id);
    }
  }, [prepregs.length]);

  useEffect(() => {
    if (selectedPrepregId) {
      setSelectedId('prepreg', selectedPrepregId);
    }
  }, [selectedPrepregId]);

  const selectedPrepreg = prepregs.find((p) => p.id === selectedPrepregId) || null;

  const filteredPrepregs = prepregs.filter((p) => {
    const matchesSearch =
      p.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.materialType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fiberType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      in_stock: '在库',
      in_use: '使用中',
      expired: '已过期',
      exhausted: '已用完',
    };
    return labels[status] || status;
  };

  const getStatusType = (status: string) => {
    const types: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      in_stock: 'success',
      in_use: 'info',
      expired: 'danger',
      exhausted: 'warning',
    };
    return types[status] || 'info';
  };

  const getDaysRemaining = (expireDate: string) => {
    const expire = new Date(expireDate);
    const now = new Date();
    const diff = Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const expiringCount = prepregs.filter(
    (p) => getDaysRemaining(p.expireDate) < 30 && p.status !== 'expired'
  ).length;
  const expiredCount = prepregs.filter((p) => p.status === 'expired').length;

  const statsData = [
    { label: '总批次', value: prepregs.length, icon: <Package size={20} />, color: 'text-accent' },
    {
      label: '在库',
      value: prepregs.filter((p) => p.status === 'in_stock').length,
      icon: <Package size={20} />,
      color: 'text-success',
    },
    {
      label: '使用中',
      value: prepregs.filter((p) => p.status === 'in_use').length,
      icon: <Package size={20} />,
      color: 'text-blue-400',
    },
    {
      label: '即将过期',
      value: expiringCount,
      icon: <AlertTriangle size={20} />,
      color: 'text-warning',
    },
  ];

  const tempChartData = {
    labels: mockTemperatureData.map((d) => d.time),
    datasets: [
      {
        label: '冷藏温度',
        data: mockTemperatureData.map((d) => d.temp),
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#00d4ff',
      },
    ],
  };

  const tempChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleColor: '#e5e5ea',
        bodyColor: '#e5e5ea',
        borderColor: '#363647',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => `温度: ${context.raw}°C`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#75758a', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#75758a',
          font: { size: 11 },
          callback: (value: any) => `${value}°C`,
        },
      },
    },
  };

  const openAddModal = () => {
    const batchNum = String(Math.floor(Math.random() * 900000) + 100000);
    const expireD = new Date();
    expireD.setMonth(expireD.getMonth() + 12);
    setForm({
      ...emptyForm,
      materialCode: `CF-${Math.floor(Math.random() * 9000 + 1000)}`,
      batchNo: `B${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${batchNum}`,
      expireDate: expireD.toISOString().split('T')[0],
      manufactureDate: new Date().toISOString().split('T')[0],
    });
    setModalType('add');
  };

  const openEditModal = (p: Prepreg) => {
    setForm({
      materialCode: p.materialCode,
      materialType: p.materialType,
      thickness: p.thickness,
      width: p.width,
      length: p.length,
      areaWeight: p.areaWeight,
      fiberType: p.fiberType,
      resinType: p.resinType,
      manufactureDate: p.manufactureDate,
      expireDate: p.expireDate,
      storageLocation: p.storageLocation,
      storageTemp: p.storageTemp,
      supplier: p.supplier,
      batchNo: p.batchNo,
      remainingLength: p.remainingLength,
      status: p.status,
    });
    setModalType('edit');
  };

  const openOutboundModal = () => {
    if (!selectedPrepreg) return;
    setOutboundForm({
      length: 5000,
      operator: '',
      purpose: '',
    });
    setModalType('outbound');
  };

  const openExpiredModal = () => {
    setModalType('expired');
  };

  const closeModal = () => setModalType(null);

  const handleAdd = () => {
    if (!form.materialCode || !form.batchNo) {
      alert('请填写物料编码和批次号');
      return;
    }
    const newPrepreg: Prepreg = {
      id: genId(),
      ...form,
      inStockDate: new Date().toISOString().split('T')[0],
    };
    addPrepreg(newPrepreg);
    addActivity('prepreg', `预浸料入库：${form.materialCode}（${form.batchNo}）`, '仓库员');
    setSelectedPrepregId(newPrepreg.id);
    closeModal();
  };

  const handleEdit = () => {
    if (!selectedPrepreg) return;
    updatePrepreg(selectedPrepreg.id, form);
    addActivity('prepreg', `预浸料信息更新：${form.materialCode}`, '仓库员');
    closeModal();
  };

  const handleOutbound = () => {
    if (!selectedPrepreg) return;
    if (!outboundForm.operator) {
      alert('请填写操作人');
      return;
    }
    const newLength = Math.max(0, selectedPrepreg.remainingLength - outboundForm.length);
    const isExhausted = newLength <= 0;
    updatePrepreg(selectedPrepreg.id, {
      remainingLength: newLength,
      status: isExhausted ? ('exhausted' as const) : ('in_use' as const),
    });
    addActivity(
      'prepreg',
      `预浸料出库：${selectedPrepreg.materialCode} 出库 ${(outboundForm.length / 1000).toFixed(1)}m，用途：${outboundForm.purpose || '裁剪'}`,
      outboundForm.operator
    );
    closeModal();
  };

  const handleMarkExpired = () => {
    if (!selectedPrepreg) return;
    updatePrepreg(selectedPrepreg.id, { status: 'expired' });
    addActivity('prepreg', `预浸料过期处理：${selectedPrepreg.materialCode}`, '质检员');
    closeModal();
  };

  const handleDelete = (id: string) => {
    const p = prepregs.find((x) => x.id === id);
    if (confirm(`确定删除预浸料 ${p?.materialCode} 吗？`)) {
      deletePrepreg(id);
      if (selectedPrepregId === id) setSelectedPrepregId(prepregs[0]?.id || null);
    }
  };

  const handleAutoExpire = () => {
    let count = 0;
    prepregs.forEach((p) => {
      if (p.status !== 'expired' && p.status !== 'exhausted' && getDaysRemaining(p.expireDate) < 0) {
        updatePrepreg(p.id, { status: 'expired' });
        count++;
      }
    });
    if (count > 0) {
      addActivity('prepreg', `自动标记 ${count} 条过期预浸料`, '系统');
      alert(`已标记 ${count} 条过期记录`);
    } else {
      alert('暂无新的过期记录');
    }
  };

  return (
    <div className="space-y-6">
      {/* 有效期预警 */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <div className={`card overflow-hidden flex items-center gap-4 p-4 ${
          expiredCount > 0 ? 'bg-danger/10 border-danger/30' : 'bg-warning/10 border-warning/30'
        }`}>
          <div className={`p-2.5 rounded-lg ${expiredCount > 0 ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'}`}>
            <AlertOctagon size={20} />
          </div>
          <div className="flex-1">
            <p className="text-carbon-100 text-sm font-medium">
              有效期预警：{expiredCount > 0 && <span className="text-danger font-bold">{expiredCount} 条已过期，</span>}
              {expiringCount > 0 && <span className="text-warning font-bold">{expiringCount} 条将在30天内过期</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoExpire}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <RefreshCw size={14} /> 自动更新过期状态
            </button>
          </div>
        </div>
      )}

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
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="card-header flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-base font-semibold text-carbon-100">预浸料库存</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-500" />
                <input
                  type="text"
                  placeholder="搜索物料编码..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-carbon-900 border border-carbon-600 rounded-lg pl-9 pr-4 py-2 text-sm text-carbon-200 placeholder-carbon-500 focus:outline-none focus:border-accent/50 w-48"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-carbon-900 border border-carbon-600 rounded-lg px-3 py-2 text-sm text-carbon-200 focus:outline-none focus:border-accent/50"
              >
                <option value="all">全部状态</option>
                <option value="in_stock">在库</option>
                <option value="in_use">使用中</option>
                <option value="expired">已过期</option>
                <option value="exhausted">已用完</option>
              </select>
              <button className="btn-secondary text-sm flex items-center gap-1.5">
                <Filter size={16} /> 筛选
              </button>
              <button
                onClick={openAddModal}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <Plus size={16} /> 新增入库
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="data-table">
              <thead className="sticky top-0">
                <tr>
                  <th>物料编码</th>
                  <th>类型</th>
                  <th>纤维牌号</th>
                  <th>规格</th>
                  <th>批次号</th>
                  <th>库位</th>
                  <th>有效期</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrepregs.length > 0 ? (
                  filteredPrepregs.map((prepreg) => {
                    const daysRemaining = getDaysRemaining(prepreg.expireDate);
                    const isExpiringSoon = daysRemaining < 30 && daysRemaining > 0;

                    return (
                      <tr
                        key={prepreg.id}
                        onClick={() => setSelectedPrepregId(prepreg.id)}
                        className={`cursor-pointer ${
                          selectedPrepregId === prepreg.id ? 'bg-accent/10' : ''
                        }`}
                      >
                        <td>
                          <span className="font-mono text-sm text-accent font-medium">
                            {prepreg.materialCode}
                          </span>
                        </td>
                        <td className="text-carbon-300">{prepreg.materialType}</td>
                        <td className="text-carbon-300">{prepreg.fiberType}</td>
                        <td className="text-carbon-400 text-xs">
                          {prepreg.thickness}mm × {prepreg.width}mm
                        </td>
                        <td className="text-carbon-400 font-mono text-xs">{prepreg.batchNo}</td>
                        <td className="text-carbon-300 text-sm">{prepreg.storageLocation}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-sm ${
                                isExpiringSoon || prepreg.status === 'expired'
                                  ? 'text-warning'
                                  : 'text-carbon-300'
                              }`}
                            >
                              {prepreg.expireDate}
                            </span>
                            {(isExpiringSoon || prepreg.status === 'expired') && (
                              <AlertTriangle size={14} className="text-warning" />
                            )}
                          </div>
                          <span className="text-xs text-carbon-500">
                            {daysRemaining > 0 ? `剩余 ${daysRemaining} 天` : '已过期'}
                          </span>
                        </td>
                        <td>
                          <StatusBadge
                            status={getStatusType(prepreg.status)}
                            label={getStatusLabel(prepreg.status)}
                            showIcon={false}
                          />
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPrepregId(prepreg.id);
                              }}
                              className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-accent transition-colors"
                              title="查看"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPrepregId(prepreg.id);
                                openEditModal(prepreg);
                              }}
                              className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-blue-400 transition-colors"
                              title="编辑"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(prepreg.id);
                              }}
                              className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-danger transition-colors"
                              title="删除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-carbon-500">
                      <Search size={24} className="mx-auto mb-2 opacity-50" />
                      未找到匹配的预浸料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Thermometer size={18} className="text-accent" />
                <h3 className="text-base font-semibold text-carbon-100">冷藏温度监控</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-3xl font-bold text-accent">-18.0</span>
                  <span className="text-lg text-carbon-400 ml-1">°C</span>
                </div>
                <StatusBadge status="success" label="正常" />
              </div>
              <div className="h-32">
                <Line data={tempChartData} options={tempChartOptions} />
              </div>
            </div>
          </div>

          {selectedPrepreg ? (
            <div className="card overflow-hidden">
              <div className="card-header flex items-center justify-between">
                <h3 className="text-base font-semibold text-carbon-100">物料详情</h3>
                <StatusBadge
                  status={getStatusType(selectedPrepreg.status)}
                  label={getStatusLabel(selectedPrepreg.status)}
                  showIcon={false}
                />
              </div>
              <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto">
                <DetailRow label="物料编码" value={selectedPrepreg.materialCode} accent />
                <DetailRow label="材料类型" value={selectedPrepreg.materialType} />
                <DetailRow label="纤维类型" value={selectedPrepreg.fiberType} />
                <DetailRow label="树脂体系" value={selectedPrepreg.resinType} />
                <DetailRow label="厚度 / 幅宽" value={`${selectedPrepreg.thickness} mm / ${selectedPrepreg.width} mm`} />
                <DetailRow label="原长 / 剩余" value={`${(selectedPrepreg.length / 1000).toFixed(1)} m / ${(selectedPrepreg.remainingLength / 1000).toFixed(1)} m`} />
                <DetailRow label="面密度" value={`${selectedPrepreg.areaWeight} g/m²`} />
                <DetailRow label="批次号" value={selectedPrepreg.batchNo} mono />
                <DetailRow label="供应商" value={selectedPrepreg.supplier} />
                <DetailRow label="存放位置" value={selectedPrepreg.storageLocation} icon={<MapPin size={14} />} />
                <DetailRow label="存储温度" value={`${selectedPrepreg.storageTemp} °C`} icon={<Thermometer size={14} />} />
                <DetailRow label="生产日期" value={selectedPrepreg.manufactureDate} icon={<Calendar size={14} />} />
                <DetailRow
                  label="有效期至"
                  value={selectedPrepreg.expireDate}
                  icon={<Clock size={14} />}
                  warning={getDaysRemaining(selectedPrepreg.expireDate) < 30}
                />
                <div className="pt-3 mt-3 border-t border-carbon-700 grid grid-cols-2 gap-2">
                  <button
                    onClick={openOutboundModal}
                    disabled={selectedPrepreg.status === 'exhausted' || selectedPrepreg.status === 'expired'}
                    className="btn-secondary text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut size={14} /> 出库登记
                  </button>
                  <button onClick={() => openEditModal(selectedPrepreg)} className="btn-secondary text-sm flex items-center justify-center gap-1.5">
                    <Edit2 size={14} /> 编辑
                  </button>
                  {selectedPrepreg.status !== 'expired' && selectedPrepreg.status !== 'exhausted' && (
                    <button
                      onClick={openExpiredModal}
                      className="col-span-2 text-sm text-warning hover:text-warning-light border border-warning/30 hover:bg-warning/10 rounded-lg py-2 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle size={14} /> 标记过期处理
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-8 flex flex-col items-center justify-center text-center">
              <Package size={48} className="text-carbon-600 mb-3" />
              <p className="text-carbon-400 text-sm">选择一条记录查看详情</p>
            </div>
          )}

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-carbon-100 mb-3">快捷操作</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={openAddModal}
                className="p-3 rounded-lg bg-carbon-700/50 hover:bg-carbon-700 text-sm text-carbon-300 hover:text-carbon-100 transition-colors flex flex-col items-center gap-2"
              >
                <Plus size={20} className="text-accent" />
                <span>新增入库</span>
              </button>
              <button
                onClick={openOutboundModal}
                disabled={!selectedPrepreg}
                className="p-3 rounded-lg bg-carbon-700/50 hover:bg-carbon-700 text-sm text-carbon-300 hover:text-carbon-100 transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
              >
                <Download size={20} className="text-success" />
                <span>出库登记</span>
              </button>
              <button className="p-3 rounded-lg bg-carbon-700/50 hover:bg-carbon-700 text-sm text-carbon-300 hover:text-carbon-100 transition-colors flex flex-col items-center gap-2">
                <Download size={20} className="text-blue-400" />
                <span>导出报表</span>
              </button>
              <button
                onClick={handleAutoExpire}
                className="p-3 rounded-lg bg-carbon-700/50 hover:bg-carbon-700 text-sm text-carbon-300 hover:text-carbon-100 transition-colors flex flex-col items-center gap-2"
              >
                <AlertTriangle size={20} className="text-warning" />
                <span>更新过期</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 入库弹窗 */}
      {modalType === 'add' && (
        <Modal title="预浸料入库登记" onClose={closeModal}>
          <FormGrid form={form} setForm={setForm} />
          <ModalFooter
            onCancel={closeModal}
            onConfirm={handleAdd}
            confirmText="确认入库"
            confirmIcon={<Save size={14} />}
          />
        </Modal>
      )}

      {/* 编辑弹窗 */}
      {modalType === 'edit' && (
        <Modal title="编辑预浸料信息" onClose={closeModal}>
          <FormGrid form={form} setForm={setForm} />
          <ModalFooter
            onCancel={closeModal}
            onConfirm={handleEdit}
            confirmText="保存修改"
            confirmIcon={<Save size={14} />}
          />
        </Modal>
      )}

      {/* 出库弹窗 */}
      {modalType === 'outbound' && selectedPrepreg && (
        <Modal title="出库登记" onClose={closeModal}>
          <div className="p-5 space-y-4">
            <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-carbon-400">当前物料</span>
                <span className="text-accent font-mono font-medium text-sm">{selectedPrepreg.materialCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-carbon-400">剩余长度</span>
                <span className="text-carbon-200 text-sm font-medium">
                  {(selectedPrepreg.remainingLength / 1000).toFixed(2)} m
                </span>
              </div>
            </div>
            <div>
              <label className="label">出库长度 (米)</label>
              <input
                type="number"
                value={outboundForm.length / 1000}
                onChange={(e) => setOutboundForm({ ...outboundForm, length: Number(e.target.value) * 1000 })}
                className="input-field"
                max={selectedPrepreg.remainingLength / 1000}
                min={0}
                step="0.1"
              />
              <p className="text-xs text-carbon-500 mt-1">
                出库后剩余：{Math.max(0, (selectedPrepreg.remainingLength - outboundForm.length) / 1000).toFixed(2)} m
              </p>
            </div>
            <div>
              <label className="label">用途说明</label>
              <input
                type="text"
                value={outboundForm.purpose}
                onChange={(e) => setOutboundForm({ ...outboundForm, purpose: e.target.value })}
                className="input-field"
                placeholder="如：裁剪任务 #CT2025..."
              />
            </div>
            <div>
              <label className="label">操作人</label>
              <input
                type="text"
                value={outboundForm.operator}
                onChange={(e) => setOutboundForm({ ...outboundForm, operator: e.target.value })}
                className="input-field"
                placeholder="请输入姓名"
              />
            </div>
          </div>
          <ModalFooter
            onCancel={closeModal}
            onConfirm={handleOutbound}
            confirmText="确认出库"
            confirmIcon={<LogOut size={14} />}
          />
        </Modal>
      )}

      {/* 过期处理弹窗 */}
      {modalType === 'expired' && selectedPrepreg && (
        <Modal title="过期处理确认" onClose={closeModal}>
          <div className="p-5">
            <div className="flex items-start gap-4 p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <AlertOctagon size={24} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-carbon-100 mb-1">确定标记为过期吗？</h4>
                <p className="text-sm text-carbon-400">
                  物料：<span className="text-accent font-mono">{selectedPrepreg.materialCode}</span>
                  <br />
                  批次：<span className="text-carbon-300 font-mono">{selectedPrepreg.batchNo}</span>
                  <br />
                  <span className="text-warning">此操作将变更该物料状态，无法恢复。</span>
                </p>
              </div>
            </div>
          </div>
          <ModalFooter
            onCancel={closeModal}
            onConfirm={handleMarkExpired}
            confirmText="确认标记过期"
            confirmIcon={<AlertTriangle size={14} />}
            danger
          />
        </Modal>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon,
  accent,
  mono,
  warning,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: boolean;
  mono?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-carbon-400 text-sm flex items-center gap-1.5 shrink-0">
        {icon}
        {label}
      </span>
      <span
        className={`text-sm text-right break-all ${
          accent
            ? 'text-accent font-medium font-mono'
            : warning
            ? 'text-warning'
            : mono
            ? 'text-carbon-200 font-mono'
            : 'text-carbon-200'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="card-header flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold text-carbon-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-carbon-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({
  onCancel,
  onConfirm,
  confirmText,
  confirmIcon,
  danger,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmText: string;
  confirmIcon?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="p-5 pt-0 flex justify-end gap-3 flex-shrink-0 border-t border-carbon-700/50 mt-2">
      <button onClick={onCancel} className="btn-secondary text-sm">
        取消
      </button>
      <button
        onClick={onConfirm}
        className={`text-sm flex items-center gap-1.5 ${
          danger
            ? 'bg-danger hover:bg-danger-light text-white rounded-lg px-4 py-2 transition-colors'
            : 'btn-primary'
        }`}
      >
        {confirmIcon}
        {confirmText}
      </button>
    </div>
  );
}

function FormGrid({
  form,
  setForm,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
}) {
  return (
    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="label">物料编码 *</label>
        <input
          type="text"
          value={form.materialCode}
          onChange={(e) => setForm({ ...form, materialCode: e.target.value })}
          className="input-field font-mono"
        />
      </div>
      <div>
        <label className="label">批次号 *</label>
        <input
          type="text"
          value={form.batchNo}
          onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
          className="input-field font-mono"
        />
      </div>
      <div>
        <label className="label">材料类型</label>
        <input
          type="text"
          value={form.materialType}
          onChange={(e) => setForm({ ...form, materialType: e.target.value })}
          className="input-field"
        />
      </div>
      <div>
        <label className="label">纤维牌号</label>
        <select
          value={form.fiberType}
          onChange={(e) => setForm({ ...form, fiberType: e.target.value })}
          className="input-field"
        >
          <option value="T300">T300</option>
          <option value="T700">T700</option>
          <option value="T800">T800</option>
          <option value="T1000">T1000</option>
          <option value="M40J">M40J</option>
        </select>
      </div>
      <div>
        <label className="label">树脂体系</label>
        <input
          type="text"
          value={form.resinType}
          onChange={(e) => setForm({ ...form, resinType: e.target.value })}
          className="input-field"
        />
      </div>
      <div>
        <label className="label">供应商</label>
        <input
          type="text"
          value={form.supplier}
          onChange={(e) => setForm({ ...form, supplier: e.target.value })}
          className="input-field"
        />
      </div>
      <div>
        <label className="label">厚度 (mm)</label>
        <input
          type="number"
          step="0.01"
          value={form.thickness}
          onChange={(e) => setForm({ ...form, thickness: Number(e.target.value) })}
          className="input-field"
        />
      </div>
      <div>
        <label className="label">幅宽 (mm)</label>
        <input
          type="number"
          value={form.width}
          onChange={(e) => setForm({ ...form, width: Number(e.target.value) })}
          className="input-field"
        />
      </div>
      <div>
        <label className="label">卷长 (mm)</label>
        <input
          type="number"
          value={form.length}
          onChange={(e) => {
            const len = Number(e.target.value);
            setForm({ ...form, length: len, remainingLength: len });
          }}
          className="input-field"
        />
      </div>
      <div>
        <label className="label">面密度 (g/m²)</label>
        <input
          type="number"
          value={form.areaWeight}
          onChange={(e) => setForm({ ...form, areaWeight: Number(e.target.value) })}
          className="input-field"
        />
      </div>
      <div>
        <label className="label">生产日期</label>
        <input
          type="date"
          value={form.manufactureDate}
          onChange={(e) => setForm({ ...form, manufactureDate: e.target.value })}
          className="input-field"
        />
      </div>
      <div>
        <label className="label">有效期至</label>
        <input
          type="date"
          value={form.expireDate}
          onChange={(e) => setForm({ ...form, expireDate: e.target.value })}
          className="input-field"
        />
      </div>
      <div>
        <label className="label">存放位置</label>
        <input
          type="text"
          value={form.storageLocation}
          onChange={(e) => setForm({ ...form, storageLocation: e.target.value })}
          className="input-field"
          placeholder="如：A-01-01"
        />
      </div>
      <div>
        <label className="label">存储温度 (°C)</label>
        <input
          type="number"
          value={form.storageTemp}
          onChange={(e) => setForm({ ...form, storageTemp: Number(e.target.value) })}
          className="input-field"
        />
      </div>
    </div>
  );
}
