import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import DataCard from '../components/DataCard';
import { StatusBadge, CircularProgress } from '../components/StatusBadge';
import {
  Package,
  Scissors,
  Layers,
  Flame,
  CheckCircle2,
  TrendingUp,
  Clock,
  AlertTriangle,
  Activity,
  ArrowRight,
  Thermometer,
  ScanSearch,
  Gauge,
  Wrench,
} from 'lucide-react';

const typeToModule: Record<string, string> = {
  prepreg: 'prepreg',
  cutting: 'cutting',
  layup: 'layup',
  curing: 'curing',
  trimming: 'trimming',
  ndt: 'ndt',
  mechanical: 'mechanical',
};

const extractRecordId = (taskId: string) => {
  const parts = taskId.split('-');
  if (parts.length >= 2) {
    const prefix = parts.shift() as string;
    return { module: typeToModule[prefix] || prefix, recordId: parts.join('-') };
  }
  return { module: 'dashboard', recordId: undefined };
};

export default function Dashboard() {
  const { getDashboardStats, prepregs, cuttingTasks, layupRecords, curingProcesses, trimmingRecords } = useAppStore();
  const dashboardStats = useMemo(() => getDashboardStats(), [prepregs, cuttingTasks, layupRecords, curingProcesses, trimmingRecords]);
  const { pendingTasks, recentActivities } = dashboardStats;

  const expiringList = prepregs.filter((p) => {
    const exp = new Date(p.expireDate);
    const now = new Date();
    const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days < 30 && p.status !== 'expired';
  }).slice(0, 3);

  const expiredList = prepregs.filter((p) => {
    const exp = new Date(p.expireDate);
    const now = new Date();
    const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days < 0 && p.status !== 'expired';
  });

  const processStatus = [
    {
      label: '下料裁剪',
      value: cuttingTasks.filter((t) => t.status !== 'pending').length,
      total: cuttingTasks.length || 1,
      color: '#22c55e',
      icon: <Scissors size={18} />,
    },
    {
      label: '模具铺层',
      value: layupRecords.filter((r) => r.status === 'in_progress').length,
      total: layupRecords.length || 1,
      color: '#eab308',
      icon: <Layers size={18} />,
    },
    {
      label: '热压固化',
      value: curingProcesses.filter((p) => p.status === 'heating' || p.status === 'holding').length,
      total: curingProcesses.length || 1,
      color: '#f97316',
      icon: <Flame size={18} />,
    },
    {
      label: '后处理',
      value: trimmingRecords.filter((r) => r.status === 'trimming' || r.status === 'drilling').length,
      total: trimmingRecords.length || 1,
      color: '#a855f7',
      icon: <Wrench size={18} />,
    },
  ];

  const stats = [
    {
      title: '在库预浸料',
      value: dashboardStats.totalPrepregs,
      unit: '批次',
      icon: <Package size={22} />,
      color: 'accent' as const,
      trend: { value: 12.5, isUp: true },
    },
    {
      title: '进行中任务',
      value: dashboardStats.activeTasks,
      unit: '项',
      icon: <Activity size={22} />,
      color: 'success' as const,
      trend: { value: 8.3, isUp: true },
    },
    {
      title: '今日产量',
      value: dashboardStats.todayOutput,
      unit: '件',
      icon: <CheckCircle2 size={22} />,
      color: 'cyan' as const,
      trend: { value: 15.2, isUp: true },
    },
    {
      title: '合格率',
      value: dashboardStats.passRate,
      unit: '%',
      icon: <TrendingUp size={22} />,
      color: 'purple' as const,
      trend: { value: 2.1, isUp: true },
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };

  const getPriorityLabel = (priority: string) => {
    return priority === 'high' ? '高' : priority === 'medium' ? '中' : '低';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'prepreg':
        return <Thermometer size={16} className="text-blue-400" />;
      case 'cutting':
        return <Scissors size={16} className="text-green-400" />;
      case 'layup':
        return <Layers size={16} className="text-yellow-400" />;
      case 'curing':
        return <Flame size={16} className="text-orange-400" />;
      case 'trimming':
        return <Wrench size={16} className="text-purple-400" />;
      case 'ndt':
        return <ScanSearch size={16} className="text-cyan-400" />;
      case 'mechanical':
        return <Gauge size={16} className="text-pink-400" />;
      default:
        return <Activity size={16} className="text-carbon-400" />;
    }
  };

  const handleTaskClick = (taskId: string) => {
    const { module, recordId } = extractRecordId(taskId);
    const ev = new CustomEvent('app:navigate', {
      detail: { module, recordId, timestamp: Date.now() },
    });
    window.dispatchEvent(ev);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <DataCard
            key={index}
            title={stat.title}
            value={stat.value}
            unit={stat.unit}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-carbon-100">工序进度</h3>
            <button
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('app:navigate', { detail: { module: 'cutting', timestamp: Date.now() } })
                )
              }
              className="text-sm text-accent hover:text-accent-light flex items-center gap-1 transition-colors"
            >
              查看全部 <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-5">
            {processStatus.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center border"
                  style={{
                    backgroundColor: `${item.color}15`,
                    borderColor: `${item.color}30`,
                    color: item.color,
                  }}
                >
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-carbon-200 font-medium">{item.label}</span>
                    <span className="text-sm text-carbon-400">
                      {item.value}/{item.total}
                    </span>
                  </div>
                  <div className="h-2 bg-carbon-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(100, (item.value / item.total) * 100)}%`,
                        backgroundColor: item.color,
                        boxShadow: `0 0 8px ${item.color}50`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-carbon-100">材料利用率</h3>
            <span className="text-xs text-carbon-500">本月平均</span>
          </div>

          <div className="flex items-center justify-center py-4">
            <CircularProgress
              value={dashboardStats.utilizationRate}
              size={160}
              strokeWidth={10}
              color="#00d4ff"
              label={`${dashboardStats.utilizationRate}%`}
              sublabel="材料利用率"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-carbon-700">
            <div className="text-center">
              <p className="text-lg font-bold text-carbon-100">
                {(prepregs.reduce((s, p) => s + p.length, 0) / 1000 / 100).toFixed(1)} 吨
              </p>
              <p className="text-xs text-carbon-400">总库存</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-carbon-100">{expiringList.length} 批</p>
              <p className="text-xs text-carbon-400">临期</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-carbon-100">设备状态</h3>
            <span className="text-xs text-carbon-500">实时监控</span>
          </div>

          <div className="space-y-3">
            {[
              {
                name: '热压罐 #1',
                status: curingProcesses.some((p) => p.status === 'heating' || p.status === 'holding') ? '运行中' : '空闲',
                temp: curingProcesses[0]?.status !== 'pending' ? '178°C' : '25°C',
                type: curingProcesses.some((p) => p.status === 'heating' || p.status === 'holding')
                  ? 'in_progress'
                  : 'success',
              },
              { name: '热压罐 #2', status: '空闲', temp: '25°C', type: 'success' as const },
              {
                name: '数控裁剪机',
                status: cuttingTasks.some((t) => t.status === 'cutting') ? '运行中' : '空闲',
                temp: '-',
                type: cuttingTasks.some((t) => t.status === 'cutting') ? 'in_progress' : 'success',
              },
              { name: '冷藏柜 A区', status: '正常', temp: '-18°C', type: 'success' as const },
              { name: '超声检测仪', status: '校准中', temp: '-', type: 'warning' as const },
            ].map((device, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-carbon-900/50 border border-carbon-700/50 hover:border-carbon-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      device.type === 'in_progress' && 'bg-success animate-pulse',
                      device.type === 'success' && 'bg-success',
                      device.type === 'warning' && 'bg-warning'
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-carbon-200">{device.name}</p>
                    <p className="text-xs text-carbon-500">{device.temp}</p>
                  </div>
                </div>
                <StatusBadge
                  status={(device.type === 'in_progress' ? 'in_progress' : device.type) as any}
                  label={device.status}
                  showIcon={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-accent" />
              <h3 className="text-base font-semibold text-carbon-100">待办任务</h3>
            </div>
            <span className="text-xs text-carbon-500">{pendingTasks.length} 项待处理</span>
          </div>
          <div className="divide-y divide-carbon-700/50 max-h-[420px] overflow-y-auto">
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task.id)}
                  className="p-4 flex items-center gap-4 hover:bg-carbon-700/20 transition-colors cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-medium text-carbon-200 truncate group-hover:text-accent transition-colors">
                        {task.title}
                      </p>
                      <StatusBadge
                        status={getPriorityColor(task.priority) as any}
                        label={getPriorityLabel(task.priority)}
                        showIcon={false}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-carbon-500">
                      <span className="uppercase font-mono bg-carbon-700/50 px-1.5 py-0.5 rounded">
                        {task.type}
                      </span>
                      <span>截止: {task.dueDate}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-carbon-600 group-hover:text-accent transition-colors flex-shrink-0" />
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <CheckCircle2 size={40} className="text-success mx-auto mb-2 opacity-50" />
                <p className="text-carbon-500 text-sm">太棒了，所有任务都完成了！</p>
              </div>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-accent" />
              <h3 className="text-base font-semibold text-carbon-100">最近动态</h3>
            </div>
            <span className="text-xs text-carbon-500">{recentActivities.length} 条</span>
          </div>
          <div className="relative max-h-[420px] overflow-y-auto">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-carbon-700" />
            <div className="space-y-1 py-2">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="relative pl-14 pr-4 py-3 hover:bg-carbon-700/20 transition-colors"
                  >
                    <div className="absolute left-4 top-3.5 w-5 h-5 rounded-full bg-carbon-800 border-2 border-carbon-600 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-carbon-200">{activity.description}</p>
                        <p className="text-xs text-carbon-500 mt-1">{activity.user}</p>
                      </div>
                      <span className="text-xs text-carbon-500 whitespace-nowrap">{activity.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center pl-14">
                  <Activity size={32} className="text-carbon-600 mx-auto mb-2 opacity-50" />
                  <p className="text-carbon-500 text-sm">暂无动态</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {(expiringList.length > 0 || expiredList.length > 0) && (
        <div
          className={`card overflow-hidden ${
            expiredList.length > 0
              ? 'bg-gradient-to-r from-danger/10 to-transparent border-danger/30'
              : 'bg-gradient-to-r from-warning/10 to-transparent border-warning/30'
          }`}
        >
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div
                className={`p-2.5 rounded-lg border ${
                  expiredList.length > 0
                    ? 'bg-danger/20 border-danger/30'
                    : 'bg-warning/20 border-warning/30'
                }`}
              >
                <AlertTriangle
                  size={20}
                  className={expiredList.length > 0 ? 'text-danger' : 'text-warning'}
                />
              </div>
              <div className="flex-1">
                <h4
                  className={`text-base font-semibold mb-2 ${
                    expiredList.length > 0 ? 'text-danger' : 'text-warning'
                  }`}
                >
                  预浸料有效期预警
                </h4>
                <div className="space-y-1.5 text-sm text-carbon-300 mb-3">
                  {expiredList.slice(0, 2).map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="text-danger font-bold">已过期</span>
                      <span className="font-mono text-accent">{p.materialCode}</span>
                      <span className="text-carbon-500 text-xs">批次 {p.batchNo}</span>
                    </div>
                  ))}
                  {expiringList.slice(0, 3).map((p) => {
                    const days = Math.ceil(
                      (new Date(p.expireDate).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div key={p.id} className="flex items-center gap-2">
                        <span className="text-warning">剩余 {days} 天</span>
                        <span className="font-mono text-accent">{p.materialCode}</span>
                        <span className="text-carbon-500 text-xs">批次 {p.batchNo}</span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('app:navigate', {
                        detail: { module: 'prepreg', timestamp: Date.now() },
                      })
                    )
                  }
                  className="btn-secondary text-sm"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
