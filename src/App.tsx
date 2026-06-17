import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import PrepregManagement from './pages/PrepregManagement';
import CuttingManagement from './pages/CuttingManagement';
import LayupManagement from './pages/LayupManagement';
import CuringManagement from './pages/CuringManagement';
import TrimmingManagement from './pages/TrimmingManagement';
import NdtManagement from './pages/NdtManagement';
import MechanicalManagement from './pages/MechanicalManagement';

const moduleConfig: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: '工作台', subtitle: '生产数据概览与任务中心' },
  prepreg: { title: '预浸料管理', subtitle: '预浸料入库、冷藏存储与出库管理' },
  cutting: { title: '下料裁剪', subtitle: '自动排样与裁剪任务管理' },
  layup: { title: '模具铺层', subtitle: '铺层角度记录与质量检验' },
  curing: { title: '热压罐固化', subtitle: '温压曲线监控与固化过程管理' },
  trimming: { title: '脱模修整', subtitle: '制品脱模、边缘修整与钻孔加工' },
  ndt: { title: '无损检测', subtitle: '超声分层检测与缺陷分析' },
  mechanical: { title: '力学试验', subtitle: '纤维体积含量、剪切强度与模量测试' },
};

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'prepreg':
        return <PrepregManagement />;
      case 'cutting':
        return <CuttingManagement />;
      case 'layup':
        return <LayupManagement />;
      case 'curing':
        return <CuringManagement />;
      case 'trimming':
        return <TrimmingManagement />;
      case 'ndt':
        return <NdtManagement />;
      case 'mechanical':
        return <MechanicalManagement />;
      default:
        return <Dashboard />;
    }
  };

  const config = moduleConfig[activeModule] || moduleConfig.dashboard;

  return (
    <div className="min-h-screen bg-carbon-950 bg-grid-pattern bg-grid bg-carbon-950">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="ml-64">
        <Header title={config.title} subtitle={config.subtitle} />
        <main className="p-6">
          {renderModule()}
        </main>
      </div>
    </div>
  );
}

export default App;
