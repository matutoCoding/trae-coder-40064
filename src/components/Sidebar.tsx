import React from 'react';
import {
  LayoutDashboard,
  Thermometer,
  Scissors,
  Layers,
  Flame,
  Wrench,
  ScanSearch,
  Gauge,
  Settings,
  ChevronRight,
  GitBranch,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: '工作台', icon: <LayoutDashboard size={20} />, color: 'text-accent' },
  { id: 'prepreg', label: '预浸料管理', icon: <Thermometer size={20} />, color: 'text-blue-400' },
  { id: 'cutting', label: '下料裁剪', icon: <Scissors size={20} />, color: 'text-green-400' },
  { id: 'layup', label: '模具铺层', icon: <Layers size={20} />, color: 'text-yellow-400' },
  { id: 'curing', label: '热压罐固化', icon: <Flame size={20} />, color: 'text-orange-400' },
  { id: 'trimming', label: '脱模修整', icon: <Wrench size={20} />, color: 'text-purple-400' },
  { id: 'ndt', label: '无损检测', icon: <ScanSearch size={20} />, color: 'text-cyan-400' },
  { id: 'mechanical', label: '力学试验', icon: <Gauge size={20} />, color: 'text-pink-400' },
  { id: 'traceability', label: '产品流转档案', icon: <GitBranch size={20} />, color: 'text-emerald-400' },
];

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

export default function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-carbon-900 border-r border-carbon-700 flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-5 border-b border-carbon-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center border border-accent/30">
            <div className="w-6 h-6 bg-carbon-fiber bg-cover rounded bg-center" 
                 style={{ backgroundImage: 'repeating-linear-gradient(45deg, #00d4ff 0px, #00d4ff 1px, transparent 1px, transparent 3px)' }}>
            </div>
          </div>
          <div>
            <h1 className="font-bold text-carbon-100 text-lg">碳纤维管理系统</h1>
            <p className="text-xs text-carbon-400">Carbon Fiber MES</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-medium text-carbon-500 uppercase tracking-wider">
          生产管理
        </p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onModuleChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                  isActive
                    ? 'bg-accent/10 text-accent border border-accent/30/30'
                    : 'text-carbon-300 hover:bg-carbon-800 hover:text-carbon-100 border border-transparent'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full" />
                )}
                <span className={cn(isActive ? item.color : 'text-carbon-400 group-hover:text-carbon-200')}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left text-sm font-medium">
                  {item.label}
                </span>
                {isActive && <ChevronRight size={16} className="text-accent" />}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-carbon-700">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-carbon-400 hover:bg-carbon-800 hover:text-carbon-200 transition-colors">
          <Settings size={20} />
          <span className="text-sm font-medium">系统设置</span>
        </button>
        
        <div className="mt-3 p-3 bg-carbon-800/50 rounded-lg border border-carbon-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
              <span className="text-accent text-sm font-bold">管</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-carbon-200 truncate">管理员</p>
              <p className="text-xs text-carbon-500">admin@factory.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
