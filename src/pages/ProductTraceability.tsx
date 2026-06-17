import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from '../components/StatusBadge';
import {
  GitBranch,
  Scissors,
  Layers,
  Flame,
  Wrench,
  ScanSearch,
  Gauge,
  Search,
  ArrowRight,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Package,
  Thermometer,
  Star,
  ChevronRight,
  RotateCcw,
  Filter,
} from 'lucide-react';

interface ProductChain {
  productName: string;
  taskNo: string;
  currentStage: string;
  currentStatus: string;
  cutting?: any;
  layup?: any;
  curing?: any;
  trimming?: any;
  ndt?: any;
  mechanical?: any;
  reworks?: any[];
}

const stageMeta: Record<string, { label: string; icon: any; color: string }> = {
  cutting: { label: '下料裁剪', icon: <Scissors size={18} />, color: 'text-green-400' },
  layup: { label: '模具铺层', icon: <Layers size={18} />, color: 'text-yellow-400' },
  curing: { label: '热压罐固化', icon: <Flame size={18} />, color: 'text-orange-400' },
  trimming: { label: '脱模修整', icon: <Wrench size={18} />, color: 'text-purple-400' },
  ndt: { label: '无损检测', icon: <ScanSearch size={18} />, color: 'text-cyan-400' },
  mechanical: { label: '力学试验', icon: <Gauge size={18} />, color: 'text-pink-400' },
};

const stageOrder = ['cutting', 'layup', 'curing', 'trimming', 'ndt', 'mechanical'];

export default function ProductTraceability() {
  const {
    cuttingTasks,
    layupRecords,
    curingProcesses,
    trimmingRecords,
    ndtReports,
    mechanicalTests,
    reworkRecords,
    prepregs,
    getSelectedId,
    setSelectedId,
  } = useAppStore();

  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterResult, setFilterResult] = useState('');

  const productChains = useMemo<ProductChain[]>(() => {
    const map = new Map<string, ProductChain>();

    cuttingTasks.forEach((c) => {
      map.set(c.taskNo, {
        productName: c.productName,
        taskNo: c.taskNo,
        currentStage: 'cutting',
        currentStatus: c.status,
        cutting: c,
      });
    });

    layupRecords.forEach((l) => {
      const existing = map.get(l.taskNo);
      if (existing) {
        existing.layup = l;
        if (existing.currentStage === 'cutting' || stageOrder.indexOf('layup') > stageOrder.indexOf(existing.currentStage)) {
          existing.currentStage = 'layup';
          existing.currentStatus = l.status;
        }
      } else {
        map.set(l.taskNo, {
          productName: l.productName,
          taskNo: l.taskNo,
          currentStage: 'layup',
          currentStatus: l.status,
          layup: l,
        });
      }
    });

    curingProcesses.forEach((cu) => {
      const existing = map.get(cu.taskNo);
      if (existing) {
        existing.curing = cu;
        if (stageOrder.indexOf('curing') > stageOrder.indexOf(existing.currentStage)) {
          existing.currentStage = 'curing';
          existing.currentStatus = cu.status;
        }
      } else {
        map.set(cu.taskNo, {
          productName: cu.productName,
          taskNo: cu.taskNo,
          currentStage: 'curing',
          currentStatus: cu.status,
          curing: cu,
        });
      }
    });

    trimmingRecords.forEach((t) => {
      const existing = map.get(t.taskNo);
      if (existing) {
        existing.trimming = t;
        if (stageOrder.indexOf('trimming') > stageOrder.indexOf(existing.currentStage)) {
          existing.currentStage = 'trimming';
          existing.currentStatus = t.status;
        }
      } else {
        map.set(t.taskNo, {
          productName: t.productName,
          taskNo: t.taskNo,
          currentStage: 'trimming',
          currentStatus: t.status,
          trimming: t,
        });
      }
    });

    ndtReports.forEach((n) => {
      const existing = map.get(n.taskNo);
      if (existing) {
        existing.ndt = n;
        if (stageOrder.indexOf('ndt') > stageOrder.indexOf(existing.currentStage)) {
          existing.currentStage = 'ndt';
          existing.currentStatus = n.result;
        }
      } else {
        map.set(n.taskNo, {
          productName: n.productName,
          taskNo: n.taskNo,
          currentStage: 'ndt',
          currentStatus: n.result,
          ndt: n,
        });
      }
    });

    mechanicalTests.forEach((m) => {
      const existing = map.get(m.taskNo);
      if (existing) {
        existing.mechanical = m;
        if (stageOrder.indexOf('mechanical') > stageOrder.indexOf(existing.currentStage)) {
          existing.currentStage = 'mechanical';
          existing.currentStatus = m.result;
        }
      } else {
        map.set(m.taskNo, {
          productName: m.productName,
          taskNo: m.taskNo,
          currentStage: 'mechanical',
          currentStatus: m.result,
          mechanical: m,
        });
      }
    });

    reworkRecords.forEach((rw) => {
      const existing = map.get(rw.taskNo);
      if (existing) {
        if (!existing.reworks) existing.reworks = [];
        existing.reworks.push(rw);
      }
    });

    return Array.from(map.values());
  }, [cuttingTasks, layupRecords, curingProcesses, trimmingRecords, ndtReports, mechanicalTests, reworkRecords]);

  useEffect(() => {
    const savedId = getSelectedId('traceability');
    if (savedId && productChains.find((p) => p.taskNo === savedId)) {
      setSelectedProductKey(savedId);
    } else if (productChains.length > 0) {
      setSelectedProductKey(productChains[0].taskNo);
    }
  }, [productChains.length]);

  useEffect(() => {
    if (selectedProductKey) setSelectedId('traceability', selectedProductKey);
  }, [selectedProductKey]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.module === 'traceability' && ce.detail?.recordId) {
        const found = productChains.find((p) => p.taskNo === ce.detail.recordId);
        if (found) setSelectedProductKey(found.taskNo);
      }
    };
    window.addEventListener('app:select-record', handler);
    return () => window.removeEventListener('app:select-record', handler);
  }, [productChains]);

  const selectedProduct = productChains.find((p) => p.taskNo === selectedProductKey) || null;

  const getOverallResult = (p: ProductChain | null) => {
    if (!p) return '';
    if (p.mechanical) return p.mechanical.result;
    if (p.ndt) return p.ndt.result;
    return '';
  };

  const filteredChains = productChains.filter((p) => {
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      if (!p.productName.toLowerCase().includes(kw) && !p.taskNo.toLowerCase().includes(kw)) return false;
    }
    if (filterStage && p.currentStage !== filterStage) return false;
    if (filterResult) {
      const r = getOverallResult(p);
      if (filterResult === 'pass' && r !== 'pass') return false;
      if (filterResult === 'fail' && r !== 'fail') return false;
      if (filterResult === 'pending' && r !== '') return false;
    }
    return true;
  });

  const getStageState = (stageKey: string, product: ProductChain | null): 'done' | 'current' | 'pending' => {
    if (!product) return 'pending';
    const stageData = (product as any)[stageKey];
    if (!stageData) return 'pending';
    if (product.currentStage === stageKey) return 'current';
    if (stageOrder.indexOf(product.currentStage) > stageOrder.indexOf(stageKey)) return 'done';
    if (stageKey === 'cutting' && product.cutting) {
      const s = product.cutting.status;
      if (s === 'completed') return 'done';
      return 'current';
    }
    if (stageKey === 'layup' && product.layup) {
      const s = product.layup.status;
      if (s === 'completed') return 'done';
      return 'current';
    }
    if (stageKey === 'curing' && product.curing) {
      const s = product.curing.status;
      if (s === 'completed' || s === 'cooling') return 'done';
      return 'current';
    }
    if (stageKey === 'trimming' && product.trimming) {
      const s = product.trimming.status;
      if (s === 'completed') return 'done';
      return 'current';
    }
    if (stageKey === 'ndt' && product.ndt) return 'done';
    if (stageKey === 'mechanical' && product.mechanical) return 'done';
    return 'pending';
  };

  const getStatusType = (product: ProductChain | null) => {
    if (!product) return 'pending' as const;
    const s = product.currentStage;
    if (s === 'mechanical' && product.currentStatus === 'fail') return 'warning' as const;
    if (s === 'ndt' && product.currentStatus === 'fail') return 'warning' as const;
    if (s === 'cutting' && product.currentStatus === 'completed') return 'success' as const;
    if (s === 'cutting' && product.currentStatus === 'cutting') return 'in_progress' as const;
    if (s === 'layup' && product.currentStatus === 'in_progress') return 'in_progress' as const;
    if (s === 'layup' && product.currentStatus === 'completed') return 'success' as const;
    if (s === 'curing' && (product.currentStatus === 'heating' || product.currentStatus === 'holding')) return 'in_progress' as const;
    if (s === 'curing' && product.currentStatus === 'completed') return 'success' as const;
    if (s === 'trimming' && product.currentStatus === 'completed') return 'success' as const;
    if (s === 'trimming') return 'in_progress' as const;
    if (s === 'mechanical' && product.currentStatus === 'pass') return 'success' as const;
    if (s === 'ndt' && product.currentStatus === 'pass') return 'success' as const;
    return 'pending' as const;
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: '待开始',
      cutting: '裁剪中',
      completed: '已完成',
      in_progress: '进行中',
      heating: '升温中',
      holding: '保温中',
      cooling: '降温中',
      demolded: '已脱模',
      trimming: '修整中',
      drilling: '钻孔中',
      pass: '合格',
      fail: '不合格',
    };
    return map[status] || status;
  };

  const getTimelineEvents = (product: ProductChain | null) => {
    if (!product) return [];
    const events: Array<{
      stage: string;
      time: string;
      title: string;
      detail: string;
      user: string;
      state: 'done' | 'current' | 'pending';
      status?: string;
    }> = [];

    if (product.cutting) {
      events.push({
        stage: 'cutting',
        time: product.cutting.endTime || product.cutting.startTime || product.cutting.createTime,
        title: product.cutting.endTime ? '裁剪完成' : product.cutting.status === 'cutting' ? '裁剪进行中' : '裁剪任务创建',
        detail: `${product.cutting.prepregCode} · ${product.cutting.layerCount}层 · 利用率${product.cutting.utilizationRate}%`,
        user: product.cutting.operator,
        state: product.cutting.status === 'completed' ? 'done' : product.cutting.status === 'cutting' ? 'current' : 'pending',
        status: product.cutting.status,
      });
    }
    if (product.layup) {
      events.push({
        stage: 'layup',
        time: product.layup.startTime || '-',
        title: product.layup.status === 'completed' ? '铺层完成' : `铺层中（第${product.layup.currentLayer}/${product.layup.totalLayers}层）`,
        detail: `模具 ${product.layup.moldNo} · 共${product.layup.totalLayers}层${product.layup.layers?.length ? ` · 已记录${product.layup.layers.length}层` : ''}`,
        user: product.layup.operator,
        state: product.layup.status === 'completed' ? 'done' : product.layup.status === 'in_progress' ? 'current' : 'pending',
        status: product.layup.status,
      });
    }
    if (product.curing) {
      events.push({
        stage: 'curing',
        time: product.curing.endTime || product.curing.startTime,
        title: product.curing.status === 'completed' ? '固化完成' : `${product.curing.status === 'holding' ? '保温保压中' : product.curing.status === 'heating' ? '升温中' : '固化启动'}`,
        detail: `${product.curing.autoclaveNo} · ${product.curing.targetTemp}°C / ${product.curing.targetPressure}MPa · 保温${product.curing.holdTime}分钟`,
        user: product.curing.operator,
        state: product.curing.status === 'completed' ? 'done' : ['heating', 'holding', 'cooling'].includes(product.curing.status) ? 'current' : 'pending',
        status: product.curing.status,
      });
    }
    if (product.trimming) {
      events.push({
        stage: 'trimming',
        time: product.trimming.completeTime || product.trimming.drillTime || product.trimming.demoldTime,
        title: product.trimming.status === 'completed'
          ? '后处理完成'
          : product.trimming.status === 'drilling'
          ? '钻孔加工中'
          : product.trimming.status === 'trimming'
          ? '边缘修整中'
          : product.trimming.status === 'demolded'
          ? '已脱模待修整'
          : '待后处理',
        detail: `脱模温度${product.trimming.demoldTemp}°C · ${product.trimming.holeCount || 0}孔 · 边缘${product.trimming.edgeQuality ? ({excellent:'优',good:'良',fair:'中',poor:'差'} as any)[product.trimming.edgeQuality] : '-'}`,
        user: product.trimming.trimOperator || product.trimming.demoldOperator || '-',
        state: product.trimming.status === 'completed' ? 'done' : product.trimming.status === 'pending' ? 'pending' : 'current',
        status: product.trimming.status,
      });
    }
    if (product.ndt) {
      events.push({
        stage: 'ndt',
        time: product.ndt.testDate,
        title: product.ndt.result === 'pass' ? '无损检测合格' : product.ndt.result === 'fail' ? '无损检测不合格' : '待复检',
        detail: `${product.ndt.testMethod} · 缺陷率${product.ndt.defectRate}% · 最大缺陷${product.ndt.maxDefectSize}mm`,
        user: product.ndt.operator,
        state: 'done',
        status: product.ndt.result,
      });
    }
    if (product.mechanical) {
      events.push({
        stage: 'mechanical',
        time: product.mechanical.testDate,
        title: product.mechanical.result === 'pass' ? '力学试验合格' : '力学试验不合格',
        detail: `拉伸${product.mechanical.tensileStrength}MPa / 弯曲${product.mechanical.flexuralStrength}MPa / 剪切${product.mechanical.interlaminarShearStrength}MPa`,
        user: product.mechanical.operator,
        state: 'done',
        status: product.mechanical.result,
      });
    }
    return events;
  };

  const openStageModule = (stageKey: string, recordId?: string) => {
    const ev = new CustomEvent('app:navigate', {
      detail: { module: stageKey, recordId, timestamp: Date.now() },
    });
    window.dispatchEvent(ev);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accent/15 text-accent"><GitBranch size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-carbon-100">{productChains.length}</p>
              <p className="text-xs text-carbon-400">在产产品</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-500/15 text-orange-400"><Package size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-carbon-100">{productChains.filter(p => stageOrder.indexOf(p.currentStage) <= stageOrder.indexOf('curing')).length}</p>
              <p className="text-xs text-carbon-400">生产中</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/15 text-cyan-400"><ScanSearch size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-carbon-100">{productChains.filter(p => p.ndt || p.mechanical).length}</p>
              <p className="text-xs text-carbon-400">进入质检</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400"><CheckCircle2 size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-carbon-100">
                {productChains.filter(p => p.mechanical && p.mechanical.result === 'pass').length}
              </p>
              <p className="text-xs text-carbon-400">全流程合格</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card overflow-hidden">
            <div className="card-header space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-carbon-100">产品列表</h3>
                <div className="relative flex-1 max-w-[180px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-500" />
                  <input
                    type="text"
                    placeholder="产品/任务号搜索"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="input-field pl-9 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-carbon-500" />
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="bg-carbon-900 border border-carbon-600 rounded-lg px-2 py-1 text-xs text-carbon-300 focus:outline-none focus:border-accent/50"
                >
                  <option value="">全部工序</option>
                  {stageOrder.map((s) => (
                    <option key={s} value={s}>{stageMeta[s].label}</option>
                  ))}
                </select>
                <select
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value)}
                  className="bg-carbon-900 border border-carbon-600 rounded-lg px-2 py-1 text-xs text-carbon-300 focus:outline-none focus:border-accent/50"
                >
                  <option value="">全部状态</option>
                  <option value="pass">合格</option>
                  <option value="fail">不合格</option>
                  <option value="pending">未检测</option>
                </select>
              </div>
            </div>
            <div className="divide-y divide-carbon-700/50 max-h-[620px] overflow-y-auto">
              {filteredChains.map((p) => {
                const meta = stageMeta[p.currentStage];
                return (
                  <div
                    key={p.taskNo}
                    onClick={() => setSelectedProductKey(p.taskNo)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-carbon-700/30 ${
                      selectedProductKey === p.taskNo ? 'bg-carbon-700/50 border-l-2 border-accent' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-carbon-100 text-sm truncate">{p.productName}</p>
                        <p className="text-xs text-carbon-500 font-mono mt-0.5">{p.taskNo}</p>
                      </div>
                      <StatusBadge status={getStatusType(p)} label={statusLabel(p.currentStatus)} showIcon={false} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-carbon-400">
                      <span className={`flex items-center gap-1 ${meta.color}`}>
                        {meta.icon} 当前：{meta.label}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1">
                      {stageOrder.map((s) => {
                        const st = getStageState(s, p);
                        const m = stageMeta[s];
                        return (
                          <div
                            key={s}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                              st === 'done'
                                ? 'bg-success/20 text-success'
                                : st === 'current'
                                ? 'bg-accent/20 text-accent animate-pulse'
                                : 'bg-carbon-700/50 text-carbon-500'
                            }`}
                            title={m.label}
                          >
                            {st === 'done' ? <CheckCircle2 size={12} /> : stageOrder.indexOf(s) + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {filteredChains.length === 0 && (
                <div className="p-12 text-center text-carbon-500 text-sm">没有匹配的产品记录</div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedProduct ? (
            <>
              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-carbon-100">{selectedProduct.productName}</h3>
                      <StatusBadge status={getStatusType(selectedProduct)} label={statusLabel(selectedProduct.currentStatus)} />
                    </div>
                    <p className="text-xs text-carbon-500">任务号：{selectedProduct.taskNo}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.keys(stageMeta).map((s) => {
                      const data = (selectedProduct as any)[s];
                      if (!data) return null;
                      const st = getStageState(s, selectedProduct);
                      const meta = stageMeta[s];
                      const id = data.id;
                      return (
                        <button
                          key={s}
                          onClick={() => openStageModule(s, id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
                            st === 'done'
                              ? 'bg-success/10 text-success border-success/30 hover:bg-success/20'
                              : st === 'current'
                              ? 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20'
                              : 'bg-carbon-700 text-carbon-300 border-carbon-600 hover:bg-carbon-600'
                          }`}
                        >
                          {meta.icon} {meta.label} <ChevronRight size={12} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    {stageOrder.map((s, idx) => {
                      const meta = stageMeta[s];
                      const st = getStageState(s, selectedProduct);
                      const isLast = idx === stageOrder.length - 1;
                      return (
                        <div key={s} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                                st === 'done'
                                  ? 'bg-success/20 border-success text-success'
                                  : st === 'current'
                                  ? 'bg-accent/20 border-accent text-accent animate-pulse'
                                  : 'bg-carbon-800 border-carbon-600 text-carbon-500'
                              }`}
                            >
                              {meta.icon}
                            </div>
                            <span
                              className={`mt-2 text-xs font-medium ${
                                st === 'done'
                                  ? 'text-success'
                                  : st === 'current'
                                  ? 'text-accent'
                                  : 'text-carbon-500'
                              }`}
                            >
                              {meta.label}
                            </span>
                          </div>
                          {!isLast && (
                            <div
                              className={`flex-1 h-0.5 mx-1 ${
                                st === 'done' ? 'bg-success' : 'bg-carbon-700'
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedProduct.cutting && (
                  <div className="card p-4 hover:bg-carbon-800/40 transition-colors cursor-pointer" onClick={() => openStageModule('cutting', selectedProduct.cutting.id)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-green-400"><Scissors size={16} /><span className="font-semibold text-sm">下料裁剪</span></div>
                      <ArrowRight size={14} className="text-carbon-500" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-carbon-500">状态</span><span className="text-carbon-200">{statusLabel(selectedProduct.cutting.status)}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">负责人</span><span className="text-carbon-200">{selectedProduct.cutting.operator}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">利用率</span><span className="text-carbon-200">{selectedProduct.cutting.utilizationRate}%</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">质检结论</span><span className={selectedProduct.cutting.status === 'completed' ? 'text-success' : 'text-carbon-400'}>{selectedProduct.cutting.status === 'completed' ? '合格' : '-'}</span></div>
                    </div>
                  </div>
                )}
                {selectedProduct.layup && (
                  <div className="card p-4 hover:bg-carbon-800/40 transition-colors cursor-pointer" onClick={() => openStageModule('layup', selectedProduct.layup.id)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-yellow-400"><Layers size={16} /><span className="font-semibold text-sm">模具铺层</span></div>
                      <ArrowRight size={14} className="text-carbon-500" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-carbon-500">状态</span><span className="text-carbon-200">{statusLabel(selectedProduct.layup.status)}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">负责人</span><span className="text-carbon-200">{selectedProduct.layup.operator}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">模具号</span><span className="text-carbon-200">{selectedProduct.layup.moldNo}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">质检结论</span><span className={selectedProduct.layup.status === 'completed' || selectedProduct.layup.status === 'inspected' ? 'text-success' : 'text-carbon-400'}>{selectedProduct.layup.status === 'completed' || selectedProduct.layup.status === 'inspected' ? '合格' : '-'}</span></div>
                    </div>
                  </div>
                )}
                {selectedProduct.curing && (
                  <div className="card p-4 hover:bg-carbon-800/40 transition-colors cursor-pointer" onClick={() => openStageModule('curing', selectedProduct.curing.id)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-orange-400"><Flame size={16} /><span className="font-semibold text-sm">热压罐固化</span></div>
                      <ArrowRight size={14} className="text-carbon-500" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-carbon-500">状态</span><span className="text-carbon-200">{statusLabel(selectedProduct.curing.status)}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">负责人</span><span className="text-carbon-200">{selectedProduct.curing.operator}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">设备</span><span className="text-carbon-200">{selectedProduct.curing.autoclaveNo}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">质检结论</span><span className={selectedProduct.curing.status === 'completed' ? 'text-success' : 'text-carbon-400'}>{selectedProduct.curing.status === 'completed' ? '合格' : '-'}</span></div>
                    </div>
                  </div>
                )}
                {selectedProduct.trimming && (
                  <div className="card p-4 hover:bg-carbon-800/40 transition-colors cursor-pointer" onClick={() => openStageModule('trimming', selectedProduct.trimming.id)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-purple-400"><Wrench size={16} /><span className="font-semibold text-sm">脱模修整</span></div>
                      <ArrowRight size={14} className="text-carbon-500" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-carbon-500">状态</span><span className="text-carbon-200">{statusLabel(selectedProduct.trimming.status)}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">负责人</span><span className="text-carbon-200">{selectedProduct.trimming.completeOperator || selectedProduct.trimming.trimOperator || selectedProduct.trimming.demoldOperator}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">脱模温度</span><span className="text-carbon-200">{selectedProduct.trimming.demoldTemp}°C</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">质检结论</span><span className={selectedProduct.trimming.conclusion === '合格' ? 'text-success' : selectedProduct.trimming.conclusion === '不合格' ? 'text-danger' : 'text-carbon-400'}>{selectedProduct.trimming.conclusion || (selectedProduct.trimming.status === 'completed' ? '合格' : '-')}</span></div>
                    </div>
                  </div>
                )}
                {selectedProduct.ndt && (
                  <div className="card p-4 hover:bg-carbon-800/40 transition-colors cursor-pointer" onClick={() => openStageModule('ndt', selectedProduct.ndt.id)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-cyan-400"><ScanSearch size={16} /><span className="font-semibold text-sm">无损检测</span></div>
                      <ArrowRight size={14} className="text-carbon-500" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-carbon-500">结论</span><span className={selectedProduct.ndt.result === 'pass' ? 'text-success' : 'text-danger'}>{statusLabel(selectedProduct.ndt.result)}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">负责人</span><span className="text-carbon-200">{selectedProduct.ndt.operator}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">方法</span><span className="text-carbon-200">{selectedProduct.ndt.testMethod}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">缺陷率</span><span className="text-carbon-200">{selectedProduct.ndt.defectRate}%</span></div>
                    </div>
                  </div>
                )}
                {selectedProduct.mechanical && (
                  <div className="card p-4 hover:bg-carbon-800/40 transition-colors cursor-pointer" onClick={() => openStageModule('mechanical', selectedProduct.mechanical.id)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-pink-400"><Gauge size={16} /><span className="font-semibold text-sm">力学试验</span></div>
                      <ArrowRight size={14} className="text-carbon-500" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-carbon-500">结论</span><span className={selectedProduct.mechanical.result === 'pass' ? 'text-success' : 'text-danger'}>{statusLabel(selectedProduct.mechanical.result)}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">负责人</span><span className="text-carbon-200">{selectedProduct.mechanical.operator}</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">拉伸强度</span><span className="text-carbon-200">{selectedProduct.mechanical.tensileStrength}MPa</span></div>
                      <div className="flex justify-between"><span className="text-carbon-500">弯曲强度</span><span className="text-carbon-200">{selectedProduct.mechanical.flexuralStrength}MPa</span></div>
                    </div>
                  </div>
                )}
              </div>

              {selectedProduct.cutting && selectedProduct.cutting.prepregId && (() => {
                const pp = prepregs.find((p: any) => p.id === selectedProduct.cutting.prepregId);
                if (!pp) return null;
                return (
                  <div className="card p-4 col-span-2 md:col-span-3">
                    <div className="flex items-center gap-2 mb-3 text-blue-400">
                      <Thermometer size={16} />
                      <span className="font-semibold text-sm">批次用料</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                      <div><span className="text-carbon-500">物料编码</span><p className="text-carbon-200 mt-0.5 font-mono">{pp.materialCode}</p></div>
                      <div><span className="text-carbon-500">批次号</span><p className="text-carbon-200 mt-0.5 font-mono">{pp.batchNo}</p></div>
                      <div><span className="text-carbon-500">纤维类型</span><p className="text-carbon-200 mt-0.5">{pp.fiberType}</p></div>
                      <div><span className="text-carbon-500">厚度</span><p className="text-carbon-200 mt-0.5">{pp.thickness}mm</p></div>
                      <div><span className="text-carbon-500">供应商</span><p className="text-carbon-200 mt-0.5">{pp.supplier}</p></div>
                    </div>
                  </div>
                );
              })()}

              {selectedProduct.reworks && selectedProduct.reworks.length > 0 && (
                <div className="card p-4 col-span-2 md:col-span-3 border-warning/30">
                  <div className="flex items-center gap-2 mb-3 text-amber-400">
                    <RotateCcw size={16} />
                    <span className="font-semibold text-sm">返修记录</span>
                    <span className="text-xs text-carbon-500">共 {selectedProduct.reworks.length} 次</span>
                  </div>
                  <div className="space-y-3">
                    {selectedProduct.reworks.map((rw: any, idx: number) => (
                      <div key={rw.id} className="p-3 bg-carbon-800/50 rounded-lg border border-carbon-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              rw.status === 'completed' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                            }`}>
                              {rw.status === 'completed' ? '已完成' : '进行中'}
                            </span>
                            <span className="text-sm text-carbon-200">第{idx + 1}次返修</span>
                          </div>
                          <span className="text-xs text-carbon-500">{rw.createTime}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div><span className="text-carbon-500">来源</span><p className="text-carbon-200 mt-0.5">{rw.sourceModule === 'ndt' ? '无损检测' : '力学试验'}</p></div>
                          <div><span className="text-carbon-500">原因</span><p className="text-carbon-200 mt-0.5">{rw.reason}</p></div>
                          <div><span className="text-carbon-500">返回工序</span><p className="text-carbon-200 mt-0.5">{rw.returnTo === 'trimming' ? '后处理' : '铺层'}</p></div>
                          <div><span className="text-carbon-500">操作人</span><p className="text-carbon-200 mt-0.5">{rw.operator}</p></div>
                          {rw.status === 'completed' && (
                            <>
                              <div><span className="text-carbon-500">完成时间</span><p className="text-carbon-200 mt-0.5">{rw.completeTime}</p></div>
                              <div><span className="text-carbon-500">处理结果</span><p className={`mt-0.5 ${rw.result === 'fixed' ? 'text-success' : 'text-danger'}`}>{rw.result === 'fixed' ? '修复' : '报废'}</p></div>
                            </>
                          )}
                        </div>
                        {rw.remark && <p className="text-xs text-carbon-400 mt-2">备注：{rw.remark}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card overflow-hidden col-span-2 md:col-span-3">
                <div className="card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-accent" />
                    <h3 className="text-base font-semibold text-carbon-100">生产时间线</h3>
                  </div>
                </div>
                <div className="p-5">
                  <div className="relative">
                    <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-carbon-700" />
                    <div className="space-y-5">
                      {getTimelineEvents(selectedProduct).map((ev, i) => {
                        const meta = stageMeta[ev.stage];
                        const EventIcon = meta?.icon?.type || Clock;
                        return (
                          <div key={i} className="relative flex items-start gap-4 pl-12">
                            <div
                              className={`absolute left-0 top-0.5 w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                                ev.state === 'done'
                                  ? 'bg-success/15 border-success/40 text-success'
                                  : ev.state === 'current'
                                  ? 'bg-accent/15 border-accent/40 text-accent animate-pulse'
                                  : 'bg-carbon-800 border-carbon-600 text-carbon-500'
                              }`}
                            >
                              {typeof meta?.icon === 'object' && 'type' in (meta.icon as any)
                                ? <EventIcon size={18} />
                                : meta?.icon || <Clock size={18} />
                              }
                            </div>
                            <div className="flex-1 pt-1.5">
                              <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
                                <div>
                                  <h4 className="font-semibold text-sm text-carbon-100 flex items-center gap-2">
                                    {ev.title}
                                    {(ev.status === 'pass' || ev.status === 'fail' || ev.status === 'completed') && (
                                      <span className={`text-xs ${ev.status === 'fail' ? 'text-danger' : 'text-success'}`}>
                                        {ev.status === 'fail' ? <AlertCircle size={12} className="inline mr-1" /> : <CheckCircle2 size={12} className="inline mr-1" />}
                                        {ev.status === 'pass' ? '合格' : ev.status === 'fail' ? '不合格' : '完成'}
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-xs text-carbon-400 mt-1 flex items-center gap-3">
                                    <span className={meta?.color}>{meta?.label}</span>
                                    <span className="flex items-center gap-1"><Clock size={11} /> {ev.time}</span>
                                    <span className="flex items-center gap-1"><User size={11} /> {ev.user}</span>
                                  </p>
                                </div>
                                <button
                                  onClick={() => openStageModule(ev.stage, (selectedProduct as any)[ev.stage]?.id)}
                                  className="btn-secondary py-1 px-3 text-xs flex items-center gap-1"
                                >
                                  查看详情 <ChevronRight size={12} />
                                </button>
                              </div>
                              <div className="mt-2 p-3 bg-carbon-800/50 rounded-lg border border-carbon-700/50 text-xs text-carbon-300">
                                <div className="flex items-center gap-2">
                                  <Star size={12} className="text-warning flex-shrink-0" />
                                  <span>{ev.detail}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-16 flex flex-col items-center justify-center">
              <GitBranch size={56} className="text-carbon-600 mb-4" />
              <p className="text-carbon-400 mb-1">选择一条产品记录查看流转档案</p>
              <p className="text-xs text-carbon-500">从左侧列表选择或在工作台中点击对应待办跳转</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
