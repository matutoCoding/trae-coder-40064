import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from '../components/StatusBadge';
import {
  Gauge,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  Clock,
  User,
  Ruler,
  TrendingUp,
  Activity,
  Target,
  Layers,
  Wrench,
  X,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import type { MechanicalTest, ReworkRecord } from '../types';

const genId = () => Math.random().toString(36).substring(2, 10);
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
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function MechanicalManagement() {
  const { mechanicalTests, getSelectedId, setSelectedId, addActivity, addReworkRecord, updateMechanicalTest } = useAppStore();
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkForm, setReworkForm] = useState({
    reason: '',
    returnTo: 'trimming' as 'trimming' | 'layup',
    operator: '',
    remark: '',
  });

  useEffect(() => {
    const savedId = getSelectedId('mechanical');
    if (savedId && mechanicalTests.find((t) => t.id === savedId)) {
      setSelectedTestId(savedId);
    } else if (mechanicalTests.length > 0) {
      setSelectedTestId(mechanicalTests[0].id);
    }
  }, [mechanicalTests.length]);

  useEffect(() => {
    if (selectedTestId) setSelectedId('mechanical', selectedTestId);
  }, [selectedTestId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.module === 'mechanical' && ce.detail?.recordId) {
        const found = mechanicalTests.find((t) => t.id === ce.detail.recordId);
        if (found) setSelectedTestId(found.id);
      }
    };
    window.addEventListener('app:select-record', handler);
    return () => window.removeEventListener('app:select-record', handler);
  }, [mechanicalTests]);

  const selectedTest = mechanicalTests.find((t) => t.id === selectedTestId) || null;

  const filteredTests = mechanicalTests.filter(test => {
    if (!searchKeyword.trim()) return true;
    const keyword = searchKeyword.toLowerCase();
    return test.productName.toLowerCase().includes(keyword) ||
           test.taskNo.toLowerCase().includes(keyword);
  });

  const getResultLabel = (result: string) => {
    return result === 'pass' ? '合格' : '不合格';
  };

  const getResultType = (result: string) => {
    return result === 'pass' ? 'success' : 'danger';
  };

  const stressStrainData = selectedTest ? {
    labels: selectedTest.stressStrainCurve.map(p => p.time.toFixed(2)),
    datasets: [
      {
        label: '应力-应变曲线',
        data: selectedTest.stressStrainCurve.map(p => p.value),
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        tension: 0.2,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
      },
    ],
  } : { labels: [], datasets: [] };

  const stressStrainOptions = {
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
          title: (items: any) => `应变: ${items[0].label}%`,
          label: (item: any) => `应力: ${item.raw.toFixed(1)} MPa`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '应变 (%)',
          color: '#75758a',
          font: { size: 12 },
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#75758a', font: { size: 11 }, maxTicksLimit: 8 },
      },
      y: {
        title: {
          display: true,
          text: '应力 (MPa)',
          color: '#75758a',
          font: { size: 12 },
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#75758a', font: { size: 11 } },
      },
    },
  };

  const compareData = {
    labels: ['纤维体积含量', '层间剪切强度', '拉伸强度', '拉伸模量', '弯曲强度', '弯曲模量'],
    datasets: [
      {
        label: '测试值',
        data: selectedTest ? [
          selectedTest.fiberVolumeContent,
          selectedTest.interlaminarShearStrength,
          selectedTest.tensileStrength / 10,
          selectedTest.tensileModulus,
          selectedTest.flexuralStrength / 10,
          selectedTest.flexuralModulus,
        ] : [],
        backgroundColor: 'rgba(0, 212, 255, 0.6)',
        borderColor: '#00d4ff',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: '标准值',
        data: [55, 60, 65, 42, 85, 42],
        backgroundColor: 'rgba(255, 107, 53, 0.4)',
        borderColor: '#ff6b35',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const compareOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#a0a0ae',
          font: { size: 11 },
          usePointStyle: true,
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
        grid: { display: false },
        ticks: { color: '#75758a', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#75758a', font: { size: 11 } },
      },
    },
  };

  const statsData = [
    { label: '试验总数', value: mechanicalTests.length, icon: <Gauge size={20} />, color: 'text-accent' },
    { label: '合格数', value: mechanicalTests.filter(t => t.result === 'pass').length, icon: <CheckCircle2 size={20} />, color: 'text-success' },
    { label: '不合格', value: mechanicalTests.filter(t => t.result === 'fail').length, icon: <XCircle size={20} />, color: 'text-danger' },
    { label: '合格率', value: '100%', icon: <TrendingUp size={20} />, color: 'text-purple-400' },
  ];

  const testItems = selectedTest ? [
    { 
      label: '纤维体积含量', 
      value: selectedTest.fiberVolumeContent, 
      unit: '%', 
      standard: '≥ 55%',
      status: selectedTest.fiberVolumeContent >= 55 ? 'pass' : 'fail',
      icon: <Layers size={16} />
    },
    { 
      label: '孔隙率', 
      value: selectedTest.voidContent, 
      unit: '%', 
      standard: '≤ 2%',
      status: selectedTest.voidContent <= 2 ? 'pass' : 'fail',
      icon: <Target size={16} />
    },
    { 
      label: '层间剪切强度', 
      value: selectedTest.interlaminarShearStrength, 
      unit: 'MPa', 
      standard: '≥ 60 MPa',
      status: selectedTest.interlaminarShearStrength >= 60 ? 'pass' : 'fail',
      icon: <Activity size={16} />
    },
    { 
      label: '拉伸强度', 
      value: selectedTest.tensileStrength, 
      unit: 'MPa', 
      standard: '≥ 600 MPa',
      status: selectedTest.tensileStrength >= 600 ? 'pass' : 'fail',
      icon: <TrendingUp size={16} />
    },
    { 
      label: '拉伸模量', 
      value: selectedTest.tensileModulus, 
      unit: 'GPa', 
      standard: '≥ 40 GPa',
      status: selectedTest.tensileModulus >= 40 ? 'pass' : 'fail',
      icon: <Gauge size={16} />
    },
    { 
      label: '弯曲强度', 
      value: selectedTest.flexuralStrength, 
      unit: 'MPa', 
      standard: '≥ 800 MPa',
      status: selectedTest.flexuralStrength >= 800 ? 'pass' : 'fail',
      icon: <Ruler size={16} />
    },
    { 
      label: '弯曲模量', 
      value: selectedTest.flexuralModulus, 
      unit: 'GPa', 
      standard: '≥ 40 GPa',
      status: selectedTest.flexuralModulus >= 40 ? 'pass' : 'fail',
      icon: <Gauge size={16} />
    },
  ] : [];

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
        {/* 试验记录列表 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-base font-semibold text-carbon-100">力学试验</h3>
              <button className="btn-primary text-sm flex items-center gap-1.5 py-1.5">
                <Plus size={16} /> 新建
              </button>
            </div>
            <div className="p-3 border-b border-carbon-700">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-500" />
                <input
                  type="text"
                  placeholder="搜索产品、任务号..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full bg-carbon-900 border border-carbon-600 rounded-lg pl-9 pr-4 py-2 text-sm text-carbon-200 placeholder-carbon-500 focus:outline-none focus:border-accent/50"
                />
              </div>
            </div>
            <div className="divide-y divide-carbon-700/50 max-h-[420px] overflow-y-auto">
              {filteredTests.length > 0 ? (
                filteredTests.map((test) => (
                  <div
                    key={test.id}
                    onClick={() => setSelectedTestId(test.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-carbon-700/30 ${
                      selectedTest?.id === test.id ? 'bg-carbon-700/50 border-l-2 border-accent' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-medium text-carbon-100 text-sm truncate">{test.productName}</p>
                        <p className="text-xs text-carbon-500 font-mono mt-0.5">{test.taskNo}</p>
                      </div>
                      <StatusBadge status={getResultType(test.result)} label={getResultLabel(test.result)} showIcon={false} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-carbon-400">
                      <span className="flex items-center gap-1">
                        <Gauge size={12} /> {test.tensileModulus} GPa
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} /> {test.operator}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Search size={32} className="text-carbon-600 mx-auto mb-2" />
                  <p className="text-sm text-carbon-500">未找到匹配的试验记录</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧详情区 */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTest ? (
            <>
              {/* 试验结果概览 */}
              <div className={`card overflow-hidden ${
                selectedTest.result === 'pass' ? 'border-success/30' : 'border-danger/30'
              }`}>
                <div className={`p-5 ${
                  selectedTest.result === 'pass' 
                    ? 'bg-gradient-to-r from-success/10 to-transparent' 
                    : 'bg-gradient-to-r from-danger/10 to-transparent'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-carbon-100">{selectedTest.productName}</h3>
                      <p className="text-sm text-carbon-400 mt-1">{selectedTest.taskNo}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge 
                        status={getResultType(selectedTest.result)} 
                        label={getResultLabel(selectedTest.result)} 
                      />
                      <p className="text-xs text-carbon-500 mt-2">{selectedTest.testDate}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 p-5 border-t border-carbon-700/50">
                  <div className="text-center p-3 bg-carbon-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-accent">{selectedTest.fiberVolumeContent}<span className="text-sm ml-1">%</span></p>
                    <p className="text-xs text-carbon-400 mt-1">纤维体积含量</p>
                  </div>
                  <div className="text-center p-3 bg-carbon-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-success">{selectedTest.tensileModulus}<span className="text-sm ml-1">GPa</span></p>
                    <p className="text-xs text-carbon-400 mt-1">拉伸模量</p>
                  </div>
                  <div className="text-center p-3 bg-carbon-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-warning">{selectedTest.interlaminarShearStrength}<span className="text-sm ml-1">MPa</span></p>
                    <p className="text-xs text-carbon-400 mt-1">层间剪切强度</p>
                  </div>
                </div>
              </div>

              {/* 应力应变曲线 */}
              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-accent" />
                    <h3 className="text-base font-semibold text-carbon-100">应力-应变曲线</h3>
                  </div>
                  <button className="text-xs text-accent hover:text-accent-light transition-colors flex items-center gap-1">
                    <Download size={12} /> 导出数据
                  </button>
                </div>
                <div className="p-5">
                  <div className="h-64">
                    <Line data={stressStrainData} options={stressStrainOptions} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-carbon-700">
                    <div className="text-center">
                      <p className="text-lg font-bold text-accent">{selectedTest.tensileStrength} MPa</p>
                      <p className="text-xs text-carbon-500">抗拉强度</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-success">{selectedTest.tensileModulus} GPa</p>
                      <p className="text-xs text-carbon-500">弹性模量</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-warning">1.58%</p>
                      <p className="text-xs text-carbon-500">断裂延伸率</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 性能对比 */}
              <div className="card overflow-hidden">
                <div className="card-header">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-purple-400" />
                    <h3 className="text-base font-semibold text-carbon-100">性能指标对比</h3>
                  </div>
                </div>
                <div className="p-5">
                  <div className="h-64">
                    <Bar data={compareData} options={compareOptions} />
                  </div>
                </div>
              </div>

              {/* 试验项目明细 */}
              <div className="card overflow-hidden">
                <div className="card-header">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-accent" />
                    <h3 className="text-base font-semibold text-carbon-100">试验项目明细</h3>
                  </div>
                </div>
                <div className="divide-y divide-carbon-700/50">
                  {testItems.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 hover:bg-carbon-700/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          item.status === 'pass' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                        }`}>
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-carbon-200">{item.label}</p>
                          <p className="text-xs text-carbon-500">标准: {item.standard}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold font-mono ${
                          item.status === 'pass' ? 'text-success' : 'text-danger'
                        }`}>
                          {item.value} <span className="text-sm font-normal text-carbon-400">{item.unit}</span>
                        </p>
                        <StatusBadge 
                          status={item.status === 'pass' ? 'success' : 'danger'} 
                          label={item.status === 'pass' ? '达标' : '不达标'} 
                          showIcon={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 试验信息 */}
              <div className="card overflow-hidden">
                <div className="card-header">
                  <h3 className="text-sm font-semibold text-carbon-100">试验信息</h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">试验日期</p>
                      <p className="text-sm font-medium text-carbon-200">{selectedTest.testDate}</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">操作人员</p>
                      <p className="text-sm font-medium text-carbon-200">{selectedTest.operator}</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">试验环境</p>
                      <p className="text-sm font-medium text-carbon-200">23°C / 50%RH</p>
                    </div>
                    <div className="p-3 bg-carbon-900/50 rounded-lg">
                      <p className="text-xs text-carbon-500 mb-1">试样数量</p>
                      <p className="text-sm font-medium text-carbon-200">5 件</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-carbon-700">
                    <p className="text-sm text-carbon-400 mb-2">试验结论</p>
                    <p className="text-sm text-carbon-300 leading-relaxed">
                      {selectedTest.remark}
                    </p>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center justify-end gap-3">
                <button className="btn-secondary text-sm flex items-center gap-1.5">
                  <FileText size={16} /> 生成报告
                </button>
                <button className="btn-secondary text-sm flex items-center gap-1.5">
                  <Download size={16} /> 导出PDF
                </button>
                {selectedTest.result === 'fail' && (
                  <button onClick={() => setShowReworkModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
                    <RotateCcw size={16} /> 提交返修
                  </button>
                )}
              </div>

              {selectedTest.reworkId && (
                <div className="card overflow-hidden border-warning/30">
                  <div className="p-5 bg-gradient-to-r from-warning/10 to-transparent">
                    <div className="flex items-start gap-3">
                      <RotateCcw size={20} className="text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-carbon-100">已发起返修</p>
                        <p className="text-xs text-carbon-400 mt-1">返修单号：{selectedTest.reworkId}</p>
                        {selectedTest.retestCount ? (
                          <p className="text-xs text-warning mt-1">已复检 {selectedTest.retestCount} 次</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center">
              <Gauge size={48} className="text-carbon-600 mb-4" />
              <p className="text-carbon-400">选择一个试验记录查看详情</p>
            </div>
          )}
        </div>
      </div>

      {showReworkModal && selectedTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-lg font-semibold text-carbon-100">发起返修</h3>
              <button onClick={() => setShowReworkModal(false)} className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-carbon-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-carbon-100">{selectedTest.productName} - 力学试验不合格</p>
                    <p className="text-xs text-carbon-400 mt-1">拉伸 {selectedTest.tensileStrength}MPa / 弯曲 {selectedTest.flexuralStrength}MPa</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="label">返修原因</label>
                <select value={reworkForm.reason} onChange={(e) => setReworkForm({ ...reworkForm, reason: e.target.value })} className="input-field">
                  <option value="">请选择</option>
                  <option value="拉伸强度不达标">拉伸强度不达标</option>
                  <option value="弯曲强度不达标">弯曲强度不达标</option>
                  <option value="层间剪切强度低">层间剪切强度低</option>
                  <option value="纤维体积含量低">纤维体积含量低</option>
                  <option value="孔隙率超标">孔隙率超标</option>
                </select>
              </div>
              <div>
                <label className="label">返回工序</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setReworkForm({ ...reworkForm, returnTo: 'trimming' })}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      reworkForm.returnTo === 'trimming' ? 'bg-accent text-carbon-900' : 'bg-carbon-700 text-carbon-300 hover:bg-carbon-600'
                    }`}
                  >
                    <Wrench size={16} /> 返回后处理
                  </button>
                  <button
                    onClick={() => setReworkForm({ ...reworkForm, returnTo: 'layup' })}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      reworkForm.returnTo === 'layup' ? 'bg-accent text-carbon-900' : 'bg-carbon-700 text-carbon-300 hover:bg-carbon-600'
                    }`}
                  >
                    <Layers size={16} /> 返回铺层
                  </button>
                </div>
              </div>
              <div>
                <label className="label">操作人</label>
                <input type="text" value={reworkForm.operator} onChange={(e) => setReworkForm({ ...reworkForm, operator: e.target.value })} className="input-field" placeholder="请输入姓名" />
              </div>
              <div>
                <label className="label">备注</label>
                <input type="text" value={reworkForm.remark} onChange={(e) => setReworkForm({ ...reworkForm, remark: e.target.value })} className="input-field" placeholder="选填" />
              </div>
            </div>
            <div className="p-5 pt-0 flex justify-end gap-3">
              <button onClick={() => setShowReworkModal(false)} className="btn-secondary text-sm">取消</button>
              <button
                onClick={() => {
                  if (!reworkForm.reason || !reworkForm.operator) {
                    alert('请填写返修原因和操作人');
                    return;
                  }
                  const reworkId = genId();
                  const rework: ReworkRecord = {
                    id: reworkId,
                    taskNo: selectedTest.taskNo,
                    productName: selectedTest.productName,
                    sourceModule: 'mechanical',
                    sourceId: selectedTest.id,
                    reason: reworkForm.reason,
                    returnTo: reworkForm.returnTo,
                    operator: reworkForm.operator,
                    createTime: new Date().toLocaleString('zh-CN'),
                    remark: reworkForm.remark,
                    status: 'in_progress',
                  };
                  addReworkRecord(rework);
                  updateMechanicalTest(selectedTest.id, { reworkId });
                  addActivity('mechanical', `发起返修：${selectedTest.productName}，原因：${reworkForm.reason}，返回${reworkForm.returnTo === 'trimming' ? '后处理' : '铺层'}`, reworkForm.operator);
                  setShowReworkModal(false);
                  setReworkForm({ reason: '', returnTo: 'trimming', operator: '', remark: '' });
                }}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <RotateCcw size={14} /> 确认发起返修
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
