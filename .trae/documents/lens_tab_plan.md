# 新增镜片 Tab 及镜片分类页实现计划

## Repository Research

### 当前架构

* 小程序全部逻辑集中在单文件 [index.tsx](file:///Users/luffyzh/luffyzh/github/glasses-database/src/pages/MiniProgram/index.tsx)，通过 React state 驱动「单页多视图」模式

* 底部 Tab 当前为 3 个：`home`（首页）、`compare`（对比）、`me`（我的），类型定义 `BottomTab = 'home' | 'compare' | 'me'`（第 35 行）

* 首页镜片列表标题栏右侧有「医疗免责声明」链接（第 544-555 行），点击打开 `disclaimerOpen` Modal

* 品牌字典：[dictionary.mock.ts](file:///Users/luffyzh/luffyzh/github/glasses-database/src/mocks/dictionary.mock.ts) 中 `mockBrandList` 有 7 个品牌

* 技术类型字典：`mockTechTagList` 有 8 个技术分类 category=`tech_category`（多点离焦、环带微柱镜 等）

* 镜片数据：[lens.mock.ts](file:///Users/luffyzh/luffyzh/github/glasses-database/src/mocks/lens.mock.ts) 共 7 款镜片

* `renderBody()` 函数（第 2111-2118 行）根据 `bottomTab` 和 `detailView` 决定渲染哪个页面

* `renderBottomTabBar()` 函数（第 2120-2145 行）渲染底部导航

* Icon 库：`lucide-react`，当前引入了 Home、Scale、UserCircle 等；需要的"镜片"图标可以用 `CircleDot`（圆形带点）或 `Glasses`（如果有），或者用 `Circle` + 自定义组合

### 目标 UI 参考（截图 2「明月镜片」小程序结构）

镜片页结构：

1. **顶部**：页面标题（近视防控镜片）+ 搜索按钮
2. **顶部 Tabs（横向）**：千万人严选 / 孩子 / 成人 / 中年 / 天玑 ... （我们映射为：按适用人群或推荐维度切分）
3. **左侧 Tabs（竖向）**：轻松控 / PMC超亮 / 高折智薄 / 渐进多焦点 / 户外有色 ... （我们映射为：按技术类型 或 品牌 切分）
4. **右侧内容区**：顶部 Banner（当前左侧 Tab 选中项的大图推荐），下方图文卡片列表（镜片卡片，含图 + 标题 + 说明 + 标签 + 价格）

## Files and Modules

仅修改单文件：

* [index.tsx](file:///Users/luffyzh/luffyzh/github/glasses-database/src/pages/MiniProgram/index.tsx)：改动 BottomTab 类型、Tab 列表、首页标题栏链接、新增镜片页渲染函数

## Implementation Steps

### Step 1：扩展 BottomTab 类型 & 新增状态

* 修改 `type BottomTab = 'home' | 'lens' | 'compare' | 'me'`（新增 'lens'）

* 新增镜片页相关 state：

  * `lensTopTab`：顶部横向 Tab（推荐维度），枚举：`'all' | 'kid' | 'adult' | 'midage' | 'hot'`（千万人严选/孩子/成人/中年/热门），默认 `'all'`

  * `lensSideTab`：左侧竖向 Tab，映射为技术类型 ID，默认 `'t_md'`（多点离焦，镜片最多的技术）

* 从 lucide-react 新增 import：`Glasses`（如不可用则改用 `CircleDot` 作为镜片图标）

### Step 2：修改底部 Tab Bar

* 在 `renderBottomTabBar()` 的 tabs 数组中，在 `home` 和 `compare` 之间插入：

  ```ts
  { key: 'lens', label: '镜片', Icon: Glasses, active: bottomTab === 'lens' }
  ```

* 同步修改 `renderHeader()` 中的标题显示（第 377-385 行），增加 `bottomTab === 'lens'` 的分支标题：`'镜片分类导航'`

### Step 3：替换首页「医疗免责声明」为「全部镜片」链接

* 找到 `renderHomePage()` 中第 544-555 行右侧 `<span>` 区块（医疗免责声明）

* 替换为：

  * 文案：`全部镜片`，图标：`ChevronRight`（与其他「查看全部」风格一致）

  * 点击行为：`setBottomTab('lens')`，跳转到镜片 Tab

* 保留 `disclaimerOpen` Modal 功能（启动免责弹窗逻辑不变），只是移除首页标题栏的快捷入口链接

### Step 4：在「我的」个人中心新增「医疗免责声明」入口

* 在 `renderMePage()` 中，当前已有列表项：使用说明 / 关于我们 / 分享给好友 / 分享到朋友圈

* 在「分享到朋友圈」之后、「我的收藏」之前，新增一条列表项：

  * 图标：`AlertTriangle`（黄色/琥珀色 tone bg）

  * 标题：`医疗免责声明`

  * 副标题：`已阅读并同意，点击查看原文`

  * 点击行为：`setDisclaimerOpen(true)`

* 调整 `disclaimerOpen` Modal 的渲染逻辑：**当** **`disclaimerAccepted === true`** **时**（即用户是从「我的」入口点击查看）：

  * 底部移除「不同意 / 我已阅读并同意」双按钮

  * 改为单按钮「关闭」或直接无底部按钮（点击遮罩层关闭，保留右上角 `X` 关闭按钮）

  * Modal 内容不变（免责声明正文 4 条清单完整展示）

* **首次启动弹窗保持不变**：`disclaimerAccepted === false` 时仍必须显示双按钮，用户必须同意后才能使用（合规要求不变）

### Step 5：实现镜片分类页 `renderLensPage()`

仿照参考截图的三段式布局：

**5.1 顶部区域（page header）**

* 蓝色标题栏由 `renderHeader()` 统一处理（已在 Step 2 加标题）

* 页面内部顶部：搜索框（复用首页样式，调用 `setBottomTab('home')` 跳回首页真正搜索）+ 可选搜索按钮图标

**5.2 顶部横向 Tabs（适用人群/推荐维度）**

* 横向可滚动 Tabs，项：千万人严选 / 孩子 / 成人 / 中年 / 热门

* 选中项：左侧红色/品牌色下划线 + 加粗字体（参考截图的「千万人严选」红色选中态）

* 切换时更新 `lensTopTab`，在右侧列表过滤 `recommendedAgeMin/Max` 对应区间

**5.3 主体：左右分栏**

* 容器：`flex h-full`

* **左侧栏**（宽度 \~ 96px，`shrink-0 bg-slate-50 border-r border-slate-100 overflow-y-auto`）：

  * 技术类型列表（从 `mockTechTagList` 过滤 `category === 'tech_category'`）

  * 每一项：14-15px 字号，选中项背景为白色 + 左侧 3px 品牌色竖条 + 加粗文字（参考截图「轻松控」的红色竖条选中态）

  * 点击切换 `lensSideTab`，同时过滤右侧列表按 `techCategoryId`

* **右侧内容区**（`flex-1 overflow-y-auto min-w-0`）：

  * **顶部 Banner 卡片**：展示当前 `lensSideTab` 技术类型的介绍图（用 text\_to\_image 占位图生成，prompt 描述对应技术特点）+ 技术名称 + 简短说明 + 镜片数量

  * **镜片图文卡片列表**：过滤 `techCategoryId === lensSideTab` 且满足顶部 Tab 年龄区间的镜片，展示为卡片：

    * 左侧：镜片占位图（小尺寸方形/圆角）

    * 右上：镜片名（品牌/系列名/型号）+ 年龄标签（如"3-10岁"）

    * 右下：简介文字（2 行截断）+ 价格

    * 点击卡片 → `setDetailView({ type: 'lens', lensId })`，复用已有镜片详情

**5.4 过滤逻辑**

* 顶部 Tab 与左侧 Tab 叠加过滤：

  * `lensTopTab === 'kid'` → `recommendedAgeMin <= 12`

  * `lensTopTab === 'adult'` → `recommendedAgeMax >= 14`

  * `lensTopTab === 'midage'` → 渐进多焦点等特殊类型或放宽

  * `lensTopTab === 'hot'` → `isHomepageRecommended === true`

  * `lensTopTab === 'all'` → 不按年龄过滤

### Step 6：在 renderBody 中接入镜片页

* 第 2115 行左右插入：`if (bottomTab === 'lens') return renderLensPage();`

## Dependencies and Considerations

* **图标**：lucide-react 中 `Glasses` 组件是否存在？如果不存在，用 `CircleDot`（圆形+点，可代表镜片截面）或 `Eye` 替代，风格统一

* **占位图片**：使用标准 SDXL 占位 URL（带 prompt）作为右侧卡片的镜片图和 Banner 图

  * 镜片卡片图：`landscape_4_3` size，prompt 描述该品牌/系列/技术特点的镜片产品特写

  * Banner 图：`landscape_16_9` size，prompt 描述对应技术类型（多点离焦/环带微柱镜等）+ 青少年佩戴场景

* **复用现有组件**：`Tag`、`formatPrice`、`formatAge`、`brandColor`、`nameOfBrand`、`nameOfTech`、`renderLensCard` 逻辑、镜片详情页（`renderDetailPage`）全部复用

* **横屏/详情兼容**：镜片页本身不涉及横屏，`compareLandscapeMode` 不影响；`detailView !== 'none'` 时底部 TabBar 自动隐藏（已有逻辑）

* **状态初始化**：`lensSideTab` 默认选镜片数最多的技术（目前 `'t_md'` 多点离焦，mock 数据中 2 款），保证进入镜片页默认有内容展示，不空列表

## Validation

1. **编译检查**：`npm run typecheck` 或 `npx tsc --noEmit`（按项目实际命令），无 TS 报错
2. **底部 Tab**：预览模式下底部显示 4 个 Tab（首页/镜片/对比/我的），中间镜片 Tab 图标正常，点击切换正确高亮
3. **首页链接**：首页镜片列表标题栏右侧显示「全部镜片 ›」而非「医疗免责声明」，点击切换到底部镜片 Tab
4. **我的页面 - 免责声明入口**：

   * 「我的」页面功能列表中显示「医疗免责声明」项（AlertTriangle 图标 + 琥珀色 tone）

   * 副标题显示「已阅读并同意，点击查看原文」

   * 点击打开免责声明 Modal

   * Modal 底部**无同意/不同意按钮**（仅显示「关闭」或无按钮，靠右上角 X 和遮罩层关闭），因为状态已是已同意
5. **首次启动免责弹窗**：首次进入时仍正常弹出双按钮免责声明 Modal，必须点击「我已阅读并同意」才能使用主功能（合规逻辑不变）
6. **镜片页结构**：

   * 进入镜片 Tab，顶部有横向 Tab 条（千万人严选/孩子/成人/中年/热门），默认选中第一个

   * 左侧有技术类型竖向列表，默认第一项高亮（有左侧彩色竖条），可点击切换

   * 右侧内容区顶部有 Banner 卡片，下方有镜片图文列表（至少 1 款）
7. **交互联动**：

   * 切换顶部横向 Tab，右侧列表按年龄区间过滤变化

   * 切换左侧竖向 Tab，右侧 Banner 和列表按技术类型更新

   * 点击任一镜片卡片，跳转到镜片详情页（`renderDetailPage`），返回后回到镜片页原筛选状态

## Risks

* **mock 数据量小**：7 款镜片 × 8 技术类型 → 部分技术类型下可能 0 款 → 处理：空列表展示"暂无该分类镜片"占位 UI

* **年龄区间过滤**：mock 数据中大多推荐年龄 6-18 岁，`adult`/`midage` Tab 下可能无匹配 → 处理：展示"成人镜片参数筹备中"占位 + 推荐切换到「千万人严选」

* **占位图加载失败**：text\_to\_image 接口偶尔不可用 → 保持 `bg-brand-50` 渐变背景 + 品牌首字母大字兜底（无图也美观）

