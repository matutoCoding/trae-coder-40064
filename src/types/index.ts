export interface Prepreg {
  id: string;
  materialCode: string;
  materialType: string;
  thickness: number;
  width: number;
  length: number;
  areaWeight: number;
  fiberType: string;
  resinType: string;
  manufactureDate: string;
  expireDate: string;
  storageLocation: string;
  storageTemp: number;
  status: 'in_stock' | 'in_use' | 'expired' | 'exhausted';
  supplier: string;
  batchNo: string;
  inStockDate: string;
  remainingLength: number;
}

export interface CuttingTask {
  id: string;
  taskNo: string;
  productName: string;
  prepregId: string;
  prepregCode: string;
  layerCount: number;
  totalArea: number;
  utilizationRate: number;
  status: 'pending' | 'cutting' | 'completed';
  createTime: string;
  startTime?: string;
  endTime?: string;
  operator: string;
  nestingPlan: NestingPart[];
}

export interface NestingPart {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  angle: number;
  layer: number;
}

export interface LayupRecord {
  id: string;
  taskId: string;
  taskNo: string;
  moldNo: string;
  productName: string;
  totalLayers: number;
  currentLayer: number;
  layers: LayupLayer[];
  status: 'pending' | 'in_progress' | 'completed' | 'inspected';
  startTime?: string;
  endTime?: string;
  operator: string;
  inspector?: string;
}

export interface LayupLayer {
  index: number;
  angle: number;
  materialCode: string;
  layupTime: string;
  operator: string;
  inspected: boolean;
  inspector?: string;
  remark?: string;
}

export interface CuringProcess {
  id: string;
  layupId: string;
  taskNo: string;
  productName: string;
  autoclaveNo: string;
  targetTemp: number;
  targetPressure: number;
  holdTime: number;
  heatingRate: number;
  coolingRate: number;
  vacuumDegree: number;
  vacuumBagChecked: boolean;
  status: 'pending' | 'heating' | 'holding' | 'cooling' | 'completed';
  startTime?: string;
  endTime?: string;
  operator: string;
  tempCurve: DataPoint[];
  pressureCurve: DataPoint[];
}

export interface DataPoint {
  time: number;
  value: number;
}

export interface TrimmingRecord {
  id: string;
  curingId: string;
  taskNo: string;
  productName: string;
  demoldTime: string;
  demoldOperator: string;
  demoldTemp: number;
  trimResult: string;
  trimOperator: string;
  drillingSpec: string;
  holeCount: number;
  edgeQuality: 'excellent' | 'good' | 'fair' | 'poor';
  status: 'pending' | 'demolded' | 'trimming' | 'drilling' | 'completed';
  remark: string;
}

export interface NdtReport {
  id: string;
  productId: string;
  taskNo: string;
  productName: string;
  testMethod: string;
  testDate: string;
  operator: string;
  defectRate: number;
  maxDefectSize: number;
  defectLocations: DefectLocation[];
  result: 'pass' | 'fail' | 'recheck';
  remark: string;
  scanImage?: string;
}

export interface DefectLocation {
  id: string;
  x: number;
  y: number;
  size: number;
  depth: number;
  type: 'delamination' | 'void' | 'inclusion';
}

export interface MechanicalTest {
  id: string;
  productId: string;
  taskNo: string;
  productName: string;
  testDate: string;
  operator: string;
  fiberVolumeContent: number;
  voidContent: number;
  interlaminarShearStrength: number;
  tensileStrength: number;
  tensileModulus: number;
  flexuralStrength: number;
  flexuralModulus: number;
  result: 'pass' | 'fail';
  remark: string;
  stressStrainCurve: DataPoint[];
}

export interface DashboardStats {
  totalPrepregs: number;
  activeTasks: number;
  completedProducts: number;
  passRate: number;
  todayOutput: number;
  utilizationRate: number;
  pendingTasks: TaskItem[];
  recentActivities: ActivityItem[];
}

export interface TaskItem {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  time: string;
  user: string;
}

export type ModuleType = 
  | 'dashboard'
  | 'prepreg'
  | 'cutting'
  | 'layup'
  | 'curing'
  | 'trimming'
  | 'ndt'
  | 'mechanical';
