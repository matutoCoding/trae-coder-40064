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
} from 'lucide-react';

export default function Dashboard() {
  const { dashboardStats } = useAppStore();
  const { pendingTasks, recentActivities } = dashboardStats;

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

  const processStatus = [
    { label: '下料裁剪', value: 5, total: 8, color: '#22c55e', icon: <Scissors size={18} /> },
    { label: '模具铺层', value: 3, total: 5, color: '#eab308', icon: <Layers size={18} /> },
    { label: '热压固化', value: 2, total: 3, color: '#f97316', icon: <Flame size={18} /> },
    { label: '后处理', value: 4, total: 6, color: '#a855f7', icon: <CheckCircle2 size={18} /> },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'prepreg': return <Thermometer size={16} className="text-blue-400" />;
      case 'cutting': return <Scissors size={16} className="text-green-400" />;
      case 'curing': return <Flame size={16} className="text-orange-400" />;
      case 'ndt': return <ScanSearch size={16} className="text-cyan-400" />;
      case 'mechanical': return <Gauge size={16} className="text-pink-400" />;
      default: return <Activity size={16} className="text-carbon-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 数据卡片 */}
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
        {/* 工序进度 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-carbon-100">工序进度</h3>
            <button className="text-sm text-accent hover:text-accent-light flex items-center gap-1 transition-colors">
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
                    color: item.color 
                  }}
                >
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-carbon-200 font-medium">{item.label}</span>
                    <span className="text-sm text-carbon-400">{item.value}/{item.total}</span>
                  </div>
                  <div className="h-2 bg-carbon-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${(item.value / item.total) * 100}%`,
                        backgroundColor: item.color,
                        boxShadow: `0 0 8px ${item.color}50`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 材料利用率 */}
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
              <p className="text-lg font-bold text-carbon-100">8.6 吨</p>
              <p className="text-xs text-carbon-400">本月投料</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-carbon-100">6.8 吨</p>
              <p className="text-xs text-carbon-400">有效利用</p>
            </div>
          </div>
        </div>

        {/* 设备状态 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-carbon-100">设备状态</h3>
            <span className="text-xs text-carbon-500">实时监控</span>
          </div>
          
          <div className="space-y-3">
            {[
              { name: '热压罐 #1', status: '运行中', temp: '178°C', type: 'in_progress' },
              { name: '热压罐 #2', status: '空闲', temp: '25°C', type: 'success' },
              { name: '数控裁剪机', status: '运行中', temp: '-', type: 'in_progress' },
              { name: '冷藏柜 A区', status: '正常', temp: '-18°C', type: 'success' },
              { name: '超声检测仪', status: '校准中', temp: '-', type: 'warning' },
            ].map((device, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-carbon-900/50 border border-carbon-700/50 hover:border-carbon-600 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    device.type === 'in_progress' && 'bg-success animate-pulse',
                    device.type === 'success' && 'bg-success',
                    device.type === 'warning' && 'bg-warning',
                  )} />
                  <div>
                    <p className="text-sm font-medium text-carbon-200">{device.name}</p>
                    <p className="text-xs text-carbon-500">{device.temp}</p>
                  </div>
                </div>
                <StatusBadge 
                  status={device.type === 'in_progress' ? 'in_progress' : device.type as any} 
                  label={device.status}
                  showIcon={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 待办任务 */}
        <div className="card overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-accent" />
              <h3 className="text-base font-semibold text-carbon-100">待办任务</h3>
            </div>
            <span className="text-xs text-carbon-500">{pendingTasks.length} 项待处理</span>
          </div>
          <div className="divide-y divide-carbon-700/50">
            {pendingTasks.map((task) => (
              <div 
                key={task.id} 
                className="p-4 flex items-center gap-4 hover:bg-carbon-700/20 transition-colors cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-carbon-200 truncate group-hover:text-accent transition-colors">
                      {task.title}
                    </p>
                    <StatusBadge 
                      status={getPriorityColor(task.priority) as any} 
                      label={task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                      showIcon={false}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-xs text-carbon-500">{task.status}</span>
                    <span className="text-xs text-carbon-500">截止: {task.dueDate}</span>
                  </div>
                </div>
                <ArrowRight size={16} className="text-carbon-600 group-hover:text-accent transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* 最近动态 */}
        <div className="card overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-accent" />
              <h3 className="text-base font-semibold text-carbon-100">最近动态</h3>
            </div>
            <button className="text-xs text-accent hover:text-accent-light transition-colors">
              查看全部
            </button>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-carbon-700" />
            <div className="space-y-1">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="relative pl-14 pr-4 py-3 hover:bg-carbon-700/20 transition-colors">
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
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 预警信息 */}
      <div className="card overflow-hidden bg-gradient-to-r from-warning/10 to-transparent border-warning/30">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-warning/20 border border-warning/30">
              <AlertTriangle size={20} className="text-warning" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-warning mb-1">预浸料有效期预警</h4>
              <p className="text-sm text-carbon-300">
                有 2 批次预浸料将在 7 天内过期，请优先安排使用。其中 CF3051-200 批次 B20251201-05 已过期，请注意隔离。
              </p>
            </div>
            <button className="btn-secondary text-sm">
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
