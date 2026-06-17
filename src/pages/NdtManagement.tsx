import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from '../components/StatusBadge';
import {
  ScanSearch,
  Search,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  Clock,
  User,
  MapPin,
  Ruler,
  Layers,
  Target,
} from 'lucide-react';
import type { NdtReport } from '../types';

export default function NdtManagement() {
  const { ndtReports } = useAppStore();
  const [selectedReport, setSelectedReport] = useState<NdtReport | null>(ndtReports[0] || null);
  const [hoveredDefect, setHoveredDefect] = useState<string | null>(null);

  const getResultLabel = (result: string) => {
    const labels: Record<string, string> = {
      pass: '合格',
      fail: '不合格',
      recheck: '复检',
    };
    return labels[result] || result;
  };

  const getResultType = (result: string) => {
    const types: Record<string, 'success' | 'danger' | 'warning'> = {
      pass: 'success',
      fail: 'danger',
      recheck: 'warning',
    };
    return types[result] || 'warning';
  };

  const getDefectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      delamination: '分层',
      void: '孔隙',
      inclusion: '夹杂',
    };
    return labels[type] || type;
  };

  const getDefectTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      delamination: '#ff4757',
      void: '#ff6b35',
      inclusion: '#ffd93d',
    };
    return colors[type] || '#ff6b35';
  };

  const statsData = [
    { label: '检测总数', value: ndtReports.length, icon: <ScanSearch size={20} />, color: 'text-accent' },
    { label: '合格', value: ndtReports.filter(r => r.result === 'pass').length, icon: <CheckCircle2 size={20} />, color: 'text-success' },
    { label: '不合格', value: ndtReports.filter(r => r.result === 'fail').length, icon: <XCircle size={20} />, color: 'text-danger' },
    { label: '合格率', value: '85.7%', icon: <Target size={20} />, color: 'text-purple-400' },
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
        {/* 检测报告列表 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-base font-semibold text-carbon-100">检测报告</h3>
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
                  className="w-full bg-carbon-900 border border-carbon-600 rounded-lg pl-9 pr-4 py-2 text-sm text-carbon-200 placeholder-carbon-500 focus:outline-none focus:border-accent/50"
                />
              </div>
            </div>
            <div className="divide-y divide-carbon-700/50 max-h-[420px] overflow-y-auto">
              {ndtReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-carbon-700/30 ${
                    selectedReport?.id === report.id ? 'bg-carbon-700/50 border-l-2 border-accent' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-carbon-100 text-sm truncate">{report.productName}</p>
                      <p className="text-xs text-carbon-500 font-mono mt-0.5">{report.taskNo}</p>
                    </div>
                    <StatusBadge status={getResultType(report.result)} label={getResultLabel(report.result)} showIcon={false} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-carbon-400">
                    <span className="flex items-center gap-1">
                      <ScanSearch size={12} /> {report.testMethod}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle size={12} /> {report.defectRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧详情区 */}
        <div className="lg:col-span-2 space-y-6">
          {selectedReport ? (
            <>
              {/* 检测结果概览 */}
              <div className={`card overflow-hidden ${
                selectedReport.result === 'pass' ? 'border-success/30' : 
                selectedReport.result === 'fail' ? 'border-danger/30' : 'border-warning/30'
              }`}>
                <div className={`p-5 ${
                  selectedReport.result === 'pass' ? 'bg-gradient-to-r from-success/10 to-transparent' : 
                  selectedReport.result === 'fail' ? 'bg-gradient-to-r from-danger/10 to-transparent' : 
                  'bg-gradient-to-r from-warning/10 to-transparent'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-carbon-100">{selectedReport.productName}</h3>
                      <p className="text-sm text-carbon-400 mt-1">{selectedReport.taskNo}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge 
                        status={getResultType(selectedReport.result)} 
                        label={getResultLabel(selectedReport.result)} 
                      />
                      <p className="text-xs text-carbon-500 mt-2">{selectedReport.testMethod}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 border-t border-carbon-700/50">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{selectedReport.defectRate}%</p>
                    <p className="text-xs text-carbon-400 mt-1">缺陷率</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">{selectedReport.maxDefectSize}<span className="text-sm ml-1">mm</span></p>
                    <p className="text-xs text-carbon-400 mt-1">最大缺陷</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-danger">{selectedReport.defectLocations.length}</p>
                    <p className="text-xs text-carbon-400 mt-1">缺陷数量</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">
                      {(100 - selectedReport.defectRate).toFixed(1)}%
                    </p>
                    <p className="text-xs text-carbon-400 mt-1">完好率</p>
                  </div>
                </div>
              </div>

              {/* 超声扫描图 */}
              <div className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScanSearch size={18} className="text-accent" />
                    <h3 className="text-base font-semibold text-carbon-100">超声C扫描图</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-secondary text-sm flex items-center gap-1.5 py-1.5">
                      <Eye size={14} /> 放大查看
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
                      viewBox="0 0 600 300"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <defs>
                        <linearGradient id="scanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#1a1a2e" />
                          <stop offset="50%" stopColor="#252540" />
                          <stop offset="100%" stopColor="#1a1a2e" />
                        </linearGradient>
                        <radialGradient id="defectGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ff4757" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="#ff4757" stopOpacity="0" />
                        </radialGradient>
                        <pattern id="scanLines" width="4" height="4" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(0, 212, 255, 0.03)" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      
                      <rect width="600" height="300" fill="url(#scanGradient)" />
                      <rect width="600" height="300" fill="url(#scanLines)" />
                      
                      <rect x="20" y="20" width="560" height="260" fill="none" stroke="#55556b" strokeWidth="1" strokeDasharray="5,5" rx="4" />
                      
                      {[...Array(30)].map((_, i) => (
                        <line 
                          key={i} 
                          x1={20 + i * 20} 
                          y1="20" 
                          x2={20 + i * 20} 
                          y2="280" 
                          stroke="rgba(0, 212, 255, 0.08)" 
                          strokeWidth="1"
                        />
                      ))}
                      
                      {selectedReport.defectLocations.map((defect) => {
                        const x = 30 + defect.x;
                        const y = 30 + defect.y;
                        const size = defect.size * 8;
                        const isHovered = hoveredDefect === defect.id;
                        
                        return (
                          <g 
                            key={defect.id}
                            onMouseEnter={() => setHoveredDefect(defect.id)}
                            onMouseLeave={() => setHoveredDefect(null)}
                            className="cursor-pointer"
                          >
                            <circle cx={x} cy={y} r={size * 2} fill="url(#defectGlow)" opacity={isHovered ? 1 : 0.6} />
                            <circle 
                              cx={x} 
                              cy={y} 
                              r={size} 
                              fill={getDefectTypeColor(defect.type)}
                              fillOpacity="0.8"
                              stroke="#fff"
                              strokeWidth={isHovered ? 2 : 1}
                              strokeOpacity="0.5"
                            />
                            {isHovered && (
                              <g>
                                <rect 
                                  x={x + size + 8} 
                                  y={y - 25} 
                                  width="120" 
                                  height="48" 
                                  fill="#1a1a2e" 
                                  stroke="#363647"
                                  rx="4"
                                />
                                <text x={x + size + 16} y={y - 8} fill="#e5e5ea" fontSize="11" fontWeight="bold">
                                  {getDefectTypeLabel(defect.type)}
                                </text>
                                <text x={x + size + 16} y={y + 8} fill="#a0a0ae" fontSize="10">
                                  尺寸: {defect.size}mm
                                </text>
                                <text x={x + size + 16} y={y + 18} fill="#a0a0ae" fontSize="10">
                                  深度: {defect.depth}mm
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                      
                      <text x="30" y="15" fill="#75758a" fontSize="10">0mm</text>
                      <text x="560" y="15" fill="#75758a" fontSize="10">600mm</text>
                      <text x="5" y="20" fill="#75758a" fontSize="10">0</text>
                      <text x="5" y="280" fill="#75758a" fontSize="10">300</text>
                    </svg>
                    
                    <div className="absolute bottom-4 left-4 flex items-center gap-4 bg-carbon-800/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-carbon-600">
                      <span className="text-xs text-carbon-400">图例:</span>
                      {[
                        { type: 'delamination', label: '分层' },
                        { type: 'void', label: '孔隙' },
                        { type: 'inclusion', label: '夹杂' },
                      ].map((item) => (
                        <div key={item.type} className="flex items-center gap-1.5">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getDefectTypeColor(item.type) }}
                          />
                          <span className="text-xs text-carbon-300">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 缺陷列表 */}
                <div className="card overflow-hidden">
                  <div className="card-header">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-warning" />
                      <h3 className="text-sm font-semibold text-carbon-100">缺陷明细</h3>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="data-table">
                      <thead className="sticky top-0">
                        <tr>
                          <th>类型</th>
                          <th>位置</th>
                          <th>尺寸</th>
                          <th>深度</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReport.defectLocations.map((defect) => (
                          <tr 
                            key={defect.id}
                            onMouseEnter={() => setHoveredDefect(defect.id)}
                            onMouseLeave={() => setHoveredDefect(null)}
                            className="cursor-pointer"
                          >
                            <td>
                              <span 
                                className="inline-flex items-center gap-1.5 text-sm"
                                style={{ color: getDefectTypeColor(defect.type) }}
                              >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getDefectTypeColor(defect.type) }} />
                                {getDefectTypeLabel(defect.type)}
                              </span>
                            </td>
                            <td className="text-carbon-400 text-sm font-mono">
                              ({defect.x}, {defect.y})
                            </td>
                            <td className="text-carbon-300 text-sm">{defect.size} mm</td>
                            <td className="text-carbon-300 text-sm">{defect.depth} mm</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 检测信息 */}
                <div className="card overflow-hidden">
                  <div className="card-header">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-accent" />
                      <h3 className="text-sm font-semibold text-carbon-100">检测信息</h3>
                    </div>
                  </div>
                  <div className="p-5 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-carbon-400 flex items-center gap-2">
                        <Clock size={14} /> 检测日期
                      </span>
                      <span className="text-sm text-carbon-200">{selectedReport.testDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-carbon-400 flex items-center gap-2">
                        <User size={14} /> 检测人员
                      </span>
                      <span className="text-sm text-carbon-200">{selectedReport.operator}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-carbon-400 flex items-center gap-2">
                        <ScanSearch size={14} /> 检测方法
                      </span>
                      <span className="text-sm text-carbon-200">{selectedReport.testMethod}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-carbon-400 flex items-center gap-2">
                        <Target size={14} /> 缺陷率
                      </span>
                      <span className={`text-sm font-medium ${
                        selectedReport.defectRate < 1 ? 'text-success' :
                        selectedReport.defectRate < 3 ? 'text-warning' : 'text-danger'
                      }`}>
                        {selectedReport.defectRate}%
                      </span>
                    </div>
                    <div className="pt-3 border-t border-carbon-700">
                      <p className="text-sm text-carbon-400 mb-2">检测结论</p>
                      <p className="text-sm text-carbon-300 leading-relaxed">
                        {selectedReport.remark}
                      </p>
                    </div>
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
                {selectedReport.result === 'fail' && (
                  <button className="btn-primary text-sm flex items-center gap-1.5">
                    提交返修
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center">
              <ScanSearch size={48} className="text-carbon-600 mb-4" />
              <p className="text-carbon-400">选择一份报告查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
