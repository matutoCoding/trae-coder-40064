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
} from '../types';
import {
  mockPrepregs,
  mockCuttingTasks,
  mockLayupRecords,
  mockCuringProcesses,
  mockTrimmingRecords,
  mockNdtReports,
  mockMechanicalTests,
  mockDashboardStats,
} from '../data/mockData';

interface AppState {
  prepregs: Prepreg[];
  cuttingTasks: CuttingTask[];
  layupRecords: LayupRecord[];
  curingProcesses: CuringProcess[];
  trimmingRecords: TrimmingRecord[];
  ndtReports: NdtReport[];
  mechanicalTests: MechanicalTest[];
  dashboardStats: DashboardStats;
  activeModule: string;
  
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

export const useAppStore = create<AppState>((set) => ({
  prepregs: mockPrepregs,
  cuttingTasks: mockCuttingTasks,
  layupRecords: mockLayupRecords,
  curingProcesses: mockCuringProcesses,
  trimmingRecords: mockTrimmingRecords,
  ndtReports: mockNdtReports,
  mechanicalTests: mockMechanicalTests,
  dashboardStats: mockDashboardStats,
  activeModule: 'dashboard',

  setActiveModule: (module) => set({ activeModule: module }),

  addPrepreg: (prepreg) =>
    set((state) => ({ prepregs: [...state.prepregs, prepreg] })),
  updatePrepreg: (id, updates) =>
    set((state) => ({
      prepregs: state.prepregs.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  deletePrepreg: (id) =>
    set((state) => ({
      prepregs: state.prepregs.filter((p) => p.id !== id),
    })),

  addCuttingTask: (task) =>
    set((state) => ({ cuttingTasks: [...state.cuttingTasks, task] })),
  updateCuttingTask: (id, updates) =>
    set((state) => ({
      cuttingTasks: state.cuttingTasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  addLayupRecord: (record) =>
    set((state) => ({ layupRecords: [...state.layupRecords, record] })),
  updateLayupRecord: (id, updates) =>
    set((state) => ({
      layupRecords: state.layupRecords.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  addCuringProcess: (process) =>
    set((state) => ({ curingProcesses: [...state.curingProcesses, process] })),
  updateCuringProcess: (id, updates) =>
    set((state) => ({
      curingProcesses: state.curingProcesses.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  addTrimmingRecord: (record) =>
    set((state) => ({ trimmingRecords: [...state.trimmingRecords, record] })),
  updateTrimmingRecord: (id, updates) =>
    set((state) => ({
      trimmingRecords: state.trimmingRecords.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  addNdtReport: (report) =>
    set((state) => ({ ndtReports: [...state.ndtReports, report] })),

  addMechanicalTest: (test) =>
    set((state) => ({ mechanicalTests: [...state.mechanicalTests, test] })),
}));
