# 系统 UI 设计规范（草案）

目标：把“页面骨架、间距、颜色、组件状态”收敛成统一标准，后续新增/改造页面时只需要对齐本规范即可保持一致。

## 1. 全局原则

- 页面结构优先：先统一“页面骨架”，再统一“组件细节”
- 组件一致性优先：同类组件（按钮、输入框、表格、弹窗）在不同页面表现一致
- 克制的装饰：阴影、渐变与动画只做轻量增强，不喧宾夺主

## 2. 系统 UI 规范

### 2.1 主题色（brand）

来源：`tailwind.config.js` 的 `colors.brand`。

| Token | Hex | 推荐用途 |
| --- | --- | --- |
| brand-50 | #eff6ff | 主题浅底（卡片高亮、选中背景） |
| brand-100 | #dbeafe | 主题描边（轻） |
| brand-200 | #bfdbfe | 主题描边（中） |
| brand-300 | #93c5fd | 低频装饰/弱强调 |
| brand-400 | #60a5fa | 弱强调 |
| brand-500 | #3b82f6 | 强调/图标高亮 |
| brand-600 | #2563eb | 默认主题色（主按钮/主色文案） |
| brand-700 | #1d4ed8 | hover/active 强调 |
| brand-800 | #1e40af | 深色文字/极强强调（慎用） |
| brand-900 | #1e3a8a | 极深（慎用） |

推荐用法：

- 主按钮/主色文字：`text-brand-600` / `bg-brand-600`
- 主按钮 hover：`hover:bg-brand-700`
- 主色浅底：`bg-brand-50`、描边：`border-brand-100` / `border-brand-200`

### 2.2 副色

副色使用 Tailwind 默认语义色板（不在项目内二次定义）：

- 告警色：`red-*`
- 警告色：`amber-*`
- 成功色：`emerald-*`
- 灰色：`slate-*`

推荐默认：

- 浅底：`bg-*-50`
- 文字：`text-*-600`
- 强调/hover：`text-*-700` / `bg-*-700`
- 描边：`border-*-100` / `border-*-200`

### 2.3 布局结构

- 左右布局：左侧为菜单（可收起），右侧为内容区
- 右侧上下布局：Header 固定在顶部，下面为主体内容区

### 2.4 菜单样式

- 一级菜单：icon + 文案；有二级菜单时右侧带折叠按钮（展开/收起）
- 二级菜单：仅文案，不展示 icon
- 选中态（一级/二级联动）：
  - 二级菜单：浅底背景 + 主题色文案（`bg-brand-50 text-brand-600`）
  - 对应一级菜单：icon 与文案变为主题色（`text-brand-600`），无背景色

### 2.5 系统基础组件

#### 2.5.1 图标（Lucide）

- 统一使用 `lucide-react`，避免混用多套图标风格
- 默认大小：16/18/20；菜单一级 icon 建议 20
- 默认颜色：`text-slate-400`；激活/强调：`text-brand-600`
- 常用示例（按业务扩展）：Home、Settings、User、Bell、Search、Plus

#### 2.5.2 按钮（3 种）

- 普通按钮（白底灰边框，hover 文字变主题色、背景变灰）：
  - `px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-brand-600 text-sm font-bold`
- 主题色按钮（主按钮）：
  - `px-5 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 text-sm font-bold shadow-sm`
- 带 icon 的按钮（左 icon + 文案，间距 gap-2）：
  - `flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 text-sm font-bold shadow-sm`

#### 2.5.3 文本（字体规范 / 标题大小）

- 正文：`text-sm text-slate-600`
- 弱说明：`text-xs text-slate-500`
- 强调正文：`text-sm font-bold text-slate-800`
- 区块标题：`text-sm font-bold text-slate-800`
- 大标题（少用）：`text-xl font-bold text-slate-800`

#### 2.5.4 链接

- a 标签链接：`text-brand-600 hover:text-brand-700`（默认不强制下划线，必要时再加 `hover:underline`）
- 删除文本：`text-red-500 hover:text-red-600 font-medium`（无背景）

#### 2.5.5 标签（Tag）

- 统一形态：`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border`
- 统一配色：浅底 `bg-*-50` + 字色 `text-*-600/700` + 描边 `border-*-200`
- 颜色集合：灰（slate）、蓝（brand）、黄（yellow）、橙（orange）、绿（emerald）、紫（violet）、红（red）

#### 2.5.6 Tabs

- Tabs 用于同一页面内的内容分区切换，优先使用项目内封装的 Tabs（不再手写一堆按钮）
- Primary（默认）：选中为 `bg-brand-600 text-white`；非选中 `text-slate-600 hover:bg-slate-50`
- Secondary：选中为主题色文案 + 下划线指示器（更轻量的分区切换）
- 交互：支持 disabled；键盘左右切换（跳过 disabled）

### 2.6 表单组件

#### 2.6.1 Input / InputSearch

- Input 基础形态：
  - `w-full h-11 rounded-xl border border-slate-200 px-4 bg-slate-50 text-sm outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500`
- InputSearch：
  - 左侧 Search icon + `pl-9`；输入框形态与 Input 一致

#### 2.6.2 Radio / RadioButton

- Radio：用于互斥选择（少量选项），文案 `text-sm text-slate-700`
- RadioButton：分段按钮式互斥选择，样式建议与表格页筛选 Tab 保持一致

#### 2.6.3 Checkbox / Switch

- Checkbox：用于多选或确认勾选；选中态使用主题色底 + 白色对勾
- Switch：用于启用/禁用；开启态 `bg-brand-600`，关闭态 `bg-slate-200`

#### 2.6.4 Select / MultiSelect

- Select/MultiSelect 不使用原生 `<select>`，统一使用项目内封装组件（参考 HeroUI 交互）
- Trigger 形态（参考）：`h-11 rounded-xl border border-slate-200`，focus 使用 brand ring
- 面板：白底 + 轻边框 + shadow；hover 高亮；选中项主题色高亮，并显示选中标记
- MultiSelect：触发器内用 Tag 回显选中项（必要时折叠为 `+N`）

#### 2.6.5 Textarea

- 与 Input 同体系：`rounded-xl border border-slate-200 bg-slate-50 text-sm`
- 规则：默认 3 行；focus 同 Input

## 3. 设计令牌（Tailwind）

### 3.1 品牌色（brand）

见“2.1 主题色（brand）”。

### 3.2 圆角、边框、阴影

- 卡片圆角：`rounded-2xl`
- 轻弹窗圆角：`rounded-3xl`
- 卡片边框：`border border-slate-100`
- 分割线：`border-slate-100`（轻）/ `border-slate-200`（中）
- 卡片阴影：`shadow-sm`

### 3.3 页面间距

- 页面容器：`p-6 space-y-6`
- 卡片内边距：筛选卡 `p-5`；表格卡通常不需要 `p`，使用表格 `px-6 py-4` 控制
- 区块间距：`gap-3`（按钮组）/ `gap-4`（筛选项）/ `space-y-4`（卡片内纵向）

## 4. 常规表格页（推荐标准）

表格页= 工具栏（筛选/搜索/Action 同块）+ 表格主体。页面结构推荐如下：

```
Page（p-6 space-y-6）
  SpecCard（浅蓝背景+蓝色边框+标题+无序列表）
  ToolbarCard（bg-white rounded-2xl shadow-sm border border-slate-100 p-4）
  TableCard（bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden）
```

### 4.1 组件规范卡（SpecCard）

- 位置：每个组件示例顶部必须有一张规范卡
- 容器：`rounded-2xl border border-brand-200 bg-brand-50/60 p-4`
- 标题：`text-sm font-bold text-brand-700`
- 内容：无序列表（list-disc），用于写该组件开发约束与注意事项

### 4.2 工具栏（ToolbarCard）

- 容器：`bg-white rounded-2xl shadow-sm border border-slate-100 p-4`
- 布局：左侧筛选（如状态 Tab），右侧搜索/重置/新增
- Action（新增）必须位于最右侧，和左侧查询区用竖线分割：`h-8 w-px bg-slate-200`
- 搜索输入框：`pl-9` + 搜索图标绝对定位
- 主操作按钮（新增/搜索）：`bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold`
- 次按钮（重置）：`border border-slate-200 text-slate-600 hover:bg-slate-50`

### 4.3 表格主体（TableCard）

- 容器：`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden`
- Table：`w-full text-left border-collapse whitespace-nowrap`
- 表头行：`bg-slate-50/80 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider`
- 表头单元格：`px-6 py-4 font-semibold`
- 表体：`divide-y divide-slate-100 text-sm`
- Hover：行 `hover:bg-slate-50/80 transition-colors`
- 空态：`py-12 text-center text-slate-400`

### 4.4 操作列（Actions）

- 所有操作项：必须是 `cursor-pointer`
- 第一个操作（如“查看详情/编辑”）：按钮式，浅色主题背景 + 主题色文字
  - 推荐：`cursor-pointer px-3 py-2 rounded-md bg-brand-50 hover:bg-brand-100 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors`
- 删除操作：纯 link，无背景
  - 推荐：`cursor-pointer text-sm font-medium text-red-500 hover:text-red-600 transition-colors`
- 删除必须二次确认：点击删除后弹出确认弹窗，确认后才执行删除逻辑

## 5. 弹窗（Modal）推荐标准

用于“新增/编辑”这类表单：

- 遮罩：`bg-slate-900/35 backdrop-blur-sm`
- 容器：`bg-white rounded-3xl shadow-2xl border border-slate-200`
- 标题区：左标题+说明，右侧关闭按钮（胶囊按钮）
- 表单两列：`grid grid-cols-1 md:grid-cols-2 gap-4`；第一行整行字段建议单独一行
- 底部按钮：右侧对齐，取消（次按钮）+ 确认（主按钮）

## 6. 实施建议

- 新页面默认从“常规表格页标准”起步，不在每个页面发明新样式
- 老页面逐步迁移：优先迁移筛选区/按钮/表格卡三块
- 组件示例页（UI 组件规范）作为落地参考：有争议以示例为准，再回写 DESIGN.md
