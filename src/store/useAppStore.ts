import { create } from 'zustand';
import type {
  Prepreg,
  CuttingTask,
  LayupRecord,
  CuringProcess,
  TrimmingRecord,
  NdtReport,
  MechanicalTest,
  DashboardStats,
  TaskItem,
  ActivityItem,
} from '../types';
import {
  mockPrepregs,
  mockCuttingTasks,
  mockLayupRecords,
  mockCuringProcesses,
  mockTrimmingRecords,
  mockNdtReports,
  mockMechanicalTests,
} from '../data/mockData';

const STORAGE_KEY = 'carbon-factory-store-v1';

interface StoredState {
  prepregs?: Prepreg[];
  cuttingTasks?: CuttingTask[];
  layupRecords?: LayupRecord[];
  curingProcesses?: CuringProcess[];
  trimmingRecords?: TrimmingRecord[];
  ndtReports?: NdtReport[];
  mechanicalTests?: MechanicalTest[];
  selectedIds?: Record<string, string | null>;
  activities?: ActivityItem[];
  activeModule?: string;
}

const loadFromStorage = (): StoredState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
};

const saveToStorage = (state: Partial<StoredState>) => {
  try {
    const existing = loadFromStorage();
    const merged = { ...existing, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {}
};

const stored = loadFromStorage();

export interface SelectedModuleState {
  prepreg: string | null;
  cutting: string | null;
  layup: string | null;
  curing: string | null;
  trimming: string | null;
  ndt: string | null;
  mechanical: string | null;
  [key: string]: string | null;
}

interface AppState {
  prepregs: Prepreg[];
  cuttingTasks: CuttingTask[];
  layupRecords: LayupRecord[];
  curingProcesses: CuringProcess[];
  trimmingRecords: TrimmingRecord[];
  ndtReports: NdtReport[];
  mechanicalTests: MechanicalTest[];
  selectedIds: SelectedModuleState;
  activities: ActivityItem[];

  getDashboardStats: () => DashboardStats;
  addActivity: (type: string, description: string, user?: string) => void;

  getSelectedId: (module: string) => string | null;
  setSelectedId: (module: string, id: string | null) => void;

  getActiveModule: () => string;
  setActiveModule: (module: string) => void;

  addPrepreg: (prepreg: Prepreg) => void;
  updatePrepreg: (id: string, updates: Partial<Prepreg>) => void;
  deletePrepreg: (id: string) => void;

  addCuttingTask: (task: CuttingTask) => void;
  updateCuttingTask: (id: string, updates: Partial<CuttingTask>) => void;

  addLayupRecord: (record: LayupRecord) => void;
  updateLayupRecord: (id: string, updates: Partial<LayupRecord>) => void;

  addCuringProcess: (process: CuringProcess) => void;
  updateCuringProcess: (id: string, updates: Partial<CuringProcess>) => void;

  addTrimmingRecord: (record: TrimmingRecord) => void;
  updateTrimmingRecord: (id: string, updates: Partial<TrimmingRecord>) => void;

  addNdtReport: (report: NdtReport) => void;

  addMechanicalTest: (test: MechanicalTest) => void;
}

const genId = () => Math.random().toString(36).substring(2, 10);

const initialSelected: SelectedModuleState = {
  prepreg: null,
  cutting: null,
  layup: null,
  curing: null,
  trimming: null,
  ndt: null,
  mechanical: null,
  ...(stored.selectedIds || {}),
};

const initialActivities: ActivityItem[] = stored.activities && stored.activities.length > 0
  ? stored.activities
  : [{ id: genId(), type: 'system', description: '系统启动完成', time: new Date().toLocaleString('zh-CN'), user: '系统' }];

export const useAppStore = create<AppState>((set, get) => ({
  prepregs: stored.prepregs || mockPrepregs,
  cuttingTasks: stored.cuttingTasks || mockCuttingTasks,
  layupRecords: stored.layupRecords || mockLayupRecords,
  curingProcesses: stored.curingProcesses || mockCuringProcesses,
  trimmingRecords: stored.trimmingRecords || mockTrimmingRecords,
  ndtReports: stored.ndtReports || mockNdtReports,
  mechanicalTests: stored.mechanicalTests || mockMechanicalTests,
  selectedIds: initialSelected,
  activities: initialActivities,

  getSelectedId: (module) => get().selectedIds[module] || null,

  setSelectedId: (module, id) => {
    set((state) => {
      const newSelected = { ...state.selectedIds, [module]: id };
      saveToStorage({ selectedIds: newSelected });
      return { selectedIds: newSelected };
    });
  },

  getActiveModule: () => stored.activeModule || 'dashboard',
  setActiveModule: (module) => {
    saveToStorage({ activeModule: module });
  },

  addActivity: (type, description, user = '系统') => {
    const activity: ActivityItem = {
      id: genId(),
      type,
      description,
      time: new Date().toLocaleString('zh-CN'),
      user,
    };
    set((state) => {
      const activities = [activity, ...state.activities].slice(0, 50);
      saveToStorage({ activities });
      return { activities };
    });
  },

  getDashboardStats: () => {
    const state = get();

    const pendingTasks: TaskItem[] = [];

    state.prepregs.forEach((p) => {
      const now = new Date();
      const exp = new Date(p.expireDate);
      const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days < 30 && p.status === 'in_stock') {
        pendingTasks.push({
          id: `prepreg-${p.id}`,
          title: `${p.materialCode} 即将过期（剩余${days}天）`,
          type: 'prepreg',
          status: p.status,
          priority: days < 7 ? 'high' : days < 15 ? 'medium' : 'low',
          dueDate: p.expireDate,
        });
      }
    });

    state.cuttingTasks.forEach((t) => {
      if (t.status === 'pending') {
        pendingTasks.push({
          id: `cutting-${t.id}`,
          title: `裁剪任务：${t.productName}`,
          type: 'cutting',
          status: t.status,
          priority: 'medium',
          dueDate: t.createTime,
        });
      }
    });

    state.layupRecords.forEach((r) => {
      if (r.status === 'pending' || r.status === 'in_progress') {
        pendingTasks.push({
          id: `layup-${r.id}`,
          title: `铺层任务：${r.productName}（${r.currentLayer}/${r.totalLayers}层）`,
          type: 'layup',
          status: r.status,
          priority: r.status === 'in_progress' ? 'high' : 'medium',
          dueDate: r.startTime || '-',
        });
      }
    });

    state.curingProcesses.forEach((p) => {
      if (p.status === 'pending' || p.status === 'heating' || p.status === 'holding') {
        pendingTasks.push({
          id: `curing-${p.id}`,
          title: `固化工序：${p.productName}`,
          type: 'curing',
          status: p.status,
          priority: p.status !== 'pending' ? 'high' : 'medium',
          dueDate: p.startTime || '-',
        });
      }
    });

    state.trimmingRecords.forEach((r) => {
      if (r.status !== 'completed') {
        pendingTasks.push({
          id: `trimming-${r.id}`,
          title: `后处理：${r.productName}`,
          type: 'trimming',
          status: r.status,
          priority: 'low',
          dueDate: r.demoldTime,
        });
      }
    });

    const dynamicActivities = [...state.activities];

    state.ndtReports.slice(0, 3).forEach((r) => {
      dynamicActivities.push({
        id: `ndt-${r.id}`,
        type: 'ndt',
        description: `无损检测：${r.productName} - ${r.result === 'pass' ? '合格' : r.result === 'fail' ? '不合格' : '待复检'}`,
        time: r.testDate,
        user: r.operator,
      });
    });

    state.mechanicalTests.slice(0, 2).forEach((r) => {
      dynamicActivities.push({
        id: `mech-${r.id}`,
        type: 'mechanical',
        description: `力学试验：${r.productName} - ${r.result === 'pass' ? '合格' : '不合格'}`,
        time: r.testDate,
        user: r.operator,
      });
    });

    const activeTasks =
      state.cuttingTasks.filter((t) => t.status !== 'pending').length +
      state.layupRecords.filter((r) => r.status === 'in_progress').length +
      state.curingProcesses.filter((p) => p.status === 'heating' || p.status === 'holding').length +
      state.trimmingRecords.filter((r) => r.status === 'trimming' || r.status === 'drilling').length;

    const completedProducts = state.trimmingRecords.filter((r) => r.status === 'completed').length;
    const totalTests = state.ndtReports.length + state.mechanicalTests.length;
    const passTests =
      state.ndtReports.filter((r) => r.result === 'pass').length +
      state.mechanicalTests.filter((r) => r.result === 'pass').length;

    return {
      totalPrepregs: state.prepregs.length,
      activeTasks,
      completedProducts,
      passRate: totalTests > 0 ? Math.round((passTests / totalTests) * 100) : 96,
      todayOutput: completedProducts,
      utilizationRate: state.cuttingTasks.length > 0
        ? Math.round(state.cuttingTasks.reduce((s, t) => s + t.utilizationRate, 0) / state.cuttingTasks.length)
        : 85,
      pendingTasks: pendingTasks.slice(0, 10),
      recentActivities: dynamicActivities.slice(0, 10),
    };
  },

  addPrepreg: (prepreg) =>
    set((state) => {
      const prepregs = [...state.prepregs, prepreg];
      saveToStorage({ prepregs });
      return { prepregs };
    }),
  updatePrepreg: (id, updates) =>
    set((state) => {
      const prepregs = state.prepregs.map((p) => (p.id === id ? { ...p, ...updates } : p));
      saveToStorage({ prepregs });
      return { prepregs };
    }),
  deletePrepreg: (id) =>
    set((state) => {
      const prepregs = state.prepregs.filter((p) => p.id !== id);
      saveToStorage({ prepregs });
      return { prepregs };
    }),

  addCuttingTask: (task) =>
    set((state) => {
      const cuttingTasks = [...state.cuttingTasks, task];
      saveToStorage({ cuttingTasks });
      return { cuttingTasks };
    }),
  updateCuttingTask: (id, updates) =>
    set((state) => {
      const cuttingTasks = state.cuttingTasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveToStorage({ cuttingTasks });
      return { cuttingTasks };
    }),

  addLayupRecord: (record) =>
    set((state) => {
      const layupRecords = [...state.layupRecords, record];
      saveToStorage({ layupRecords });
      return { layupRecords };
    }),
  updateLayupRecord: (id, updates) =>
    set((state) => {
      const layupRecords = state.layupRecords.map((r) => (r.id === id ? { ...r, ...updates } : r));
      saveToStorage({ layupRecords });
      return { layupRecords };
    }),

  addCuringProcess: (process) =>
    set((state) => {
      const curingProcesses = [...state.curingProcesses, process];
      saveToStorage({ curingProcesses });
      return { curingProcesses };
    }),
  updateCuringProcess: (id, updates) =>
    set((state) => {
      const curingProcesses = state.curingProcesses.map((p) => (p.id === id ? { ...p, ...updates } : p));
      saveToStorage({ curingProcesses });
      return { curingProcesses };
    }),

  addTrimmingRecord: (record) =>
    set((state) => {
      const trimmingRecords = [...state.trimmingRecords, record];
      saveToStorage({ trimmingRecords });
      return { trimmingRecords };
    }),
  updateTrimmingRecord: (id, updates) =>
    set((state) => {
      const trimmingRecords = state.trimmingRecords.map((r) => (r.id === id ? { ...r, ...updates } : r));
      saveToStorage({ trimmingRecords });
      return { trimmingRecords };
    }),

  addNdtReport: (report) =>
    set((state) => {
      const ndtReports = [...state.ndtReports, report];
      saveToStorage({ ndtReports });
      return { ndtReports };
    }),

  addMechanicalTest: (test) =>
    set((state) => {
      const mechanicalTests = [...state.mechanicalTests, test];
      saveToStorage({ mechanicalTests });
      return { mechanicalTests };
    }),
}));
