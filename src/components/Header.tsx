import { Bell, Search, Clock, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return `${year}年${month}月${day}日 ${weekDays[date.getDay()]}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <header className="h-16 bg-carbon-800/80 backdrop-blur-sm border-b border-carbon-700 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-carbon-100">{title}</h2>
          {subtitle && <p className="text-sm text-carbon-400">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-6 text-sm text-carbon-300">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-carbon-500" />
            <span>{formatDate(currentTime)}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-accent">
            <Clock size={16} />
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-500" />
          <input
            type="text"
            placeholder="搜索产品、任务..."
            className="bg-carbon-900 border border-carbon-700 rounded-lg pl-9 pr-4 py-2 text-sm text-carbon-200 placeholder-carbon-500 focus:outline-none focus:border-accent/50 w-56 transition-colors"
          />
        </div>

        <button className="relative p-2 rounded-lg bg-carbon-900 border border-carbon-700 text-carbon-400 hover:text-carbon-200 hover:border-carbon-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warning rounded-full animate-pulse" />
        </button>
      </div>
    </header>
  );
}
