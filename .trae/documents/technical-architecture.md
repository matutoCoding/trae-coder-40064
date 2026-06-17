## 1. 架构设计

```mermaid
graph TB
    subgraph "前端应用层"
        A["主应用框架"]
        B["路由管理"]
        C["状态管理"]
        D["组件库"]
    end
    
    subgraph "业务模块层"
        E1["预浸料管理模块"]
        E2["下料裁剪模块"]
        E3["模具铺层模块"]
        E4["热压罐固化模块"]
        E5["脱模修整模块"]
        E6["无损检测模块"]
        E7["力学试验模块"]
    end
    
    subgraph "数据层"
        F["本地数据存储 (localStorage)"]
        G["Mock 数据"]
        H["图表可视化 (Chart.js)"]
    end
    
    A --> B
    A --> C
    A --> D
    D --> E1
    D --> E2
    D --> E3
    D --> E4
    D --> E5
    D --> E6
    D --> E7
    E1 --> F
    E2 --> F
    E3 --> F
    E4 --> F
    E5 --> F
    E6 --> F
    E7 --> F
    E4 --> H
    E7 --> H
```

## 2. 技术描述

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite 5
- **样式方案**：TailwindCSS 3 + CSS 变量
- **图表库**：Chart.js + react-chartjs-2
- **路由管理**：React Router v6
- **图标库**：Lucide React
- **数据存储**：localStorage（本地持久化）
- **UI 组件**：自定义工业风组件库

## 3. 路由定义

| 路由 | 页面 | 用途 |
|------|------|------|
| /dashboard | 工作台 | 生产数据概览、待办任务 |
| /prepreg | 预浸料管理 | 预浸料入库、冷藏管理、出库 |
| /cutting | 下料裁剪 | 裁剪任务、排样管理 |
| /layup | 模具铺层 | 铺层记录、角度管理 |
| /curing | 热压罐固化 | 温压曲线、固化监控 |
| /trimming | 脱模修整 | 脱模、修整、钻孔记录 |
| /ndt | 无损检测 | 超声检测、缺陷分析 |
| /mechanical | 力学试验 | 性能测试、数据管理 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    PREPREG ||--o{ CUTTING_TASK : "用于"
    CUTTING_TASK ||--o{ LAYUP_RECORD : "铺层用料"
    LAYUP_RECORD ||--o| CURING_PROCESS : "进入固化"
    CURING_PROCESS ||--o| TRIMMING_RECORD : "脱模修整"
    TRIMMING_RECORD ||--o| NDT_REPORT : "无损检测"
    TRIMMING_RECORD ||--o| MECHANICAL_TEST : "力学试验"
    
    PREPREG {
        string id PK
        string material_code
        string material_type
        float thickness
        float width
        float length
        date manufacture_date
        date expire_date
        string storage_location
        string status
    }
    
    CUTTING_TASK {
        string id PK
        string task_no
        string prepreg_id FK
        string product_name
        int layer_count
        float utilization_rate
        string status
        datetime create_time
    }
    
    LAYUP_RECORD {
        string id PK
        string task_id FK
        string mold_no
        int layer_index
        float angle
        string operator
        datetime layup_time
        boolean inspected
    }
    
    CURING_PROCESS {
        string id PK
        string layup_id FK
        string autoclave_no
        float target_temp
        float target_pressure
        int hold_time
        float vacuum_degree
        string status
        datetime start_time
        datetime end_time
    }
    
    TRIMMING_RECORD {
        string id PK
        string curing_id FK
        datetime demold_time
        string trim_result
        string drilling_spec
        string operator
    }
    
    NDT_REPORT {
        string id PK
        string product_id FK
        string test_method
        float defect_rate
        string result
        text remark
        datetime test_time
    }
    
    MECHANICAL_TEST {
        string id PK
        string product_id FK
        float fiber_volume_content
        float interlaminar_shear_strength
        float tensile_modulus
        string result
        datetime test_time
    }
```

### 4.2 数据存储说明

- 使用 localStorage 进行本地数据持久化
- 每个模块独立管理其数据状态
- 提供数据导入导出功能（JSON 格式）
- 初始化时加载 Mock 数据用于演示

## 5. 组件设计

### 5.1 公共组件
- Sidebar：左侧导航栏
- Header：顶部状态栏
- DataCard：数据卡片组件
- Table：数据表格组件
- Modal：弹窗组件
- Form：表单组件
- ProgressBar：进度条组件
- StatusBadge：状态标签组件

### 5.2 业务组件
- PrepregList：预浸料列表
- CuttingChart：排样图表
- LayupAngleChart：铺层角度图
- CuringCurveChart：温压曲线图
- NdtScanImage：超声扫描图
- StressStrainChart：应力应变曲线图
