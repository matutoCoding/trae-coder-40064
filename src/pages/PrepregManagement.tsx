import { useState } from 'react';
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

export default function PrepregManagement() {
  const { prepregs } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPrepreg, setSelectedPrepreg] = useState<Prepreg | null>(null);

  const filteredPrepregs = prepregs.filter((p) => {
    const matchesSearch =
      p.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.materialType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.batchNo.toLowerCase().includes(searchTerm.toLowerCase());
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

  const statsData = [
    { label: '总批次', value: prepregs.length, icon: <Package size={20} />, color: 'text-accent' },
    { label: '在库', value: prepregs.filter(p => p.status === 'in_stock').length, icon: <Package size={20} />, color: 'text-success' },
    { label: '使用中', value: prepregs.filter(p => p.status === 'in_use').length, icon: <Package size={20} />, color: 'text-blue-400' },
    { label: '即将过期', value: prepregs.filter(p => getDaysRemaining(p.expireDate) < 30 && p.status !== 'expired').length, icon: <AlertTriangle size={20} />, color: 'text-warning' },
  ];

  const tempChartData = {
    labels: mockTemperatureData.map(d => d.time),
    datasets: [
      {
        label: '冷藏温度',
        data: mockTemperatureData.map(d => d.temp),
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
        {/* 预浸料列表 */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="card-header flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-base font-semibold text-carbon-100">预浸料库存</h3>
            <div className="flex items-center gap-3">
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
              </select>
              <button className="btn-secondary text-sm flex items-center gap-1.5">
                <Filter size={16} /> 筛选
              </button>
              <button className="btn-primary text-sm flex items-center gap-1.5">
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
                {filteredPrepregs.map((prepreg) => {
                  const daysRemaining = getDaysRemaining(prepreg.expireDate);
                  const isExpiringSoon = daysRemaining < 30 && daysRemaining > 0;
                  
                  return (
                    <tr 
                      key={prepreg.id} 
                      onClick={() => setSelectedPrepreg(prepreg)}
                      className="cursor-pointer"
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
                          <span className={`text-sm ${isExpiringSoon || prepreg.status === 'expired' ? 'text-warning' : 'text-carbon-300'}`}>
                            {prepreg.expireDate}
                          </span>
                          {isExpiringSoon && (
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
                          <button className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-accent transition-colors">
                            <Eye size={16} />
                          </button>
                          <button className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-blue-400 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button className="p-1.5 rounded hover:bg-carbon-700 text-carbon-400 hover:text-danger transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="space-y-6">
          {/* 温度监控 */}
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

          {/* 物料详情 */}
          {selectedPrepreg ? (
            <div className="card overflow-hidden">
              <div className="card-header">
                <h3 className="text-base font-semibold text-carbon-100">物料详情</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-carbon-400 text-sm">物料编码</span>
                  <span className="text-accent font-mono text-sm">{selectedPrepreg.materialCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-carbon-400 text-sm">材料类型</span>
                  <span className="text-carbon-200 text-sm">{selectedPrepreg.materialType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-carbon-400 text-sm">纤维类型</span>
                  <span className="text-carbon-200 text-sm">{selectedPrepreg.fiberType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-carbon-400 text-sm">树脂体系</span>
                  <span className="text-carbon-200 text-sm">{selectedPrepreg.resinType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-carbon-400 text-sm">厚度</span>
                  <span className="text-carbon-200 text-sm">{selectedPrepreg.thickness} mm</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-carbon-400 text-sm">幅宽</span>
                  <span className="text-carbon-200 text-sm">{selectedPrepreg.width} mm</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-carbon-400 text-sm">剩余长度</span>
                  <span className="text-carbon-200 text-sm">{selectedPrepreg.remainingLength / 1000} m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-carbon-400 text-sm">面密度</span>
                  <span className="text-carbon-200 text-sm">{selectedPrepreg.areaWeight} g/m²</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-carbon-400 text-sm flex items-center gap-1">
                    <MapPin size={14} /> 存放位置
                  </span>
                  <span className="text-carbon-200 text-sm">{selectedPrepreg.storageLocation}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-carbon-400 text-sm flex items-center gap-1">
                    <Calendar size={14} /> 生产日期
                  </span>
                  <span className="text-carbon-200 text-sm">{selectedPrepreg.manufactureDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-carbon-400 text-sm flex items-center gap-1">
                    <Clock size={14} /> 有效期至
                  </span>
                  <span className={`text-sm ${getDaysRemaining(selectedPrepreg.expireDate) < 30 ? 'text-warning' : 'text-carbon-200'}`}>
                    {selectedPrepreg.expireDate}
                  </span>
                </div>
                <div className="pt-3 border-t border-carbon-700 flex gap-2">
                  <button className="flex-1 btn-secondary text-sm">
                    出库
                  </button>
                  <button className="flex-1 btn-primary text-sm">
                    查看记录
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-8 flex flex-col items-center justify-center text-center">
              <Package size={48} className="text-carbon-600 mb-3" />
              <p className="text-carbon-400 text-sm">选择一条记录查看详情</p>
            </div>
          )}

          {/* 快捷操作 */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-carbon-100 mb-3">快捷操作</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 rounded-lg bg-carbon-700/50 hover:bg-carbon-700 text-sm text-carbon-300 hover:text-carbon-100 transition-colors flex flex-col items-center gap-2">
                <Plus size={20} className="text-accent" />
                <span>新增入库</span>
              </button>
              <button className="p-3 rounded-lg bg-carbon-700/50 hover:bg-carbon-700 text-sm text-carbon-300 hover:text-carbon-100 transition-colors flex flex-col items-center gap-2">
                <Download size={20} className="text-success" />
                <span>出库登记</span>
              </button>
              <button className="p-3 rounded-lg bg-carbon-700/50 hover:bg-carbon-700 text-sm text-carbon-300 hover:text-carbon-100 transition-colors flex flex-col items-center gap-2">
                <Download size={20} className="text-blue-400" />
                <span>导出报表</span>
              </button>
              <button className="p-3 rounded-lg bg-carbon-700/50 hover:bg-carbon-700 text-sm text-carbon-300 hover:text-carbon-100 transition-colors flex flex-col items-center gap-2">
                <Thermometer size={20} className="text-warning" />
                <span>温度记录</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
