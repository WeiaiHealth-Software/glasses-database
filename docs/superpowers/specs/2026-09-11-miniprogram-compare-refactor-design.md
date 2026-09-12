# 规格：C 端小程序对比模块重构（懂车帝模式）

- 日期：2026-09-11
- 范围：**只改造 C 端小程序预览（`MiniProgram/index.tsx`）**；B 端 `Compare/index.tsx`、侧边栏、面包屑等管理后台模块 **完全不动**
- 参考产品：懂车帝 / 汽车之家 App「车型对比」流程

---

## 1. 背景 & 痛点

当前对比流程割裂：
1. 详情页「加入对比」仅弹 Toast，用户不知道接下来去哪里看
2. 对比 Tab / B 端对比页两套选择状态，互不连通
3. 添加镜片只有弹窗表格，没有「先选品牌 → 再选品牌下镜片」的二级心智模型
4. C 端小程序对比 Tab 只展示已选卡片，无法真正查看对比结果表格
5. 只有 B 端能看参数对比，家长/家长用户在小程序端用不了

## 2. 核心约束（来自用户澄清）

| 约束项 | 决策 |
|---|---|
| 对比状态 | **全局单例**：`compareIds: string[0..4]`，无论从卡片/详情页/品牌选择器加镜片都写同一份 |
| 改造范围 | **只改 C 端小程序** `MiniProgram/index.tsx`，B 端 Compare 页原封不动 |
| 加入跳转 | **首次加入**（从 0→1 款）时自动切换到 `bottomTab='compare'`；已有镜片后再加入只 Toast，不强制跳 |
| 弹窗勾选 | 暂存态，**点「确认加入对比」才合入 compareIds**；超 4 款时按顺序截断并 Toast 提示 |
| 对比表 Tabs | 只留 **综合对比 / 参数对比** 2 个，默认高亮 **参数对比**，去掉「通俗解读」 |
| 全屏按钮 | **⛶ 横屏** = landscape 宽屏模式，隐藏底部 TabBar 横向展示对比表 |
| 移除/清空 | 对比页 Header 提供「编辑」模式：槽位卡片 X 按钮移除 + 底部红色「清空全部」（二次确认） |

## 3. 信息架构 & 页面流程

```
bottomTab='compare' 对比 Tab（共用底部三 TabBar）
├─ 🅰️ 选镜视图（默认态）
│  ├─ Header：标题「镜片横向对比」+ 已选 N/4 + 右上角「编辑」
│  ├─ 顶部操作栏：「+ 添加镜片」蓝色主按钮 + 🔍搜索（展开搜镜片名/品牌/系列）
│  ├─ 4 格槽位区：
│  │   · 已选镜片卡片：品牌色块 + 型号 + 价格 + 控制率 Tag + 右下角「更换 ⇅」
│  │   · 未满时：虚线占位 + 引导文案
│  │   · 编辑态：卡片右上角 X 按钮 + 底部「清空全部 N 款」红按钮
│  ├─ 同级推荐区（按品牌分组）：
│  │   · 蔡司 / 依视路 / 豪雅 / … Sub Header
│  │   · 每行镜片 = 左侧勾选框 + 品牌小色块 + 型号 + 控制率 + 价格
│  │   · 达 4 款时未勾选行 checkbox 变灰 disabled
│  └─ 底部固定按钮（会被 TabBar 之上的位置固定）
│      · <2 款：灰色禁用「请至少选择 2 款镜片（当前 N 款）」
│      · ≥2 款：品牌蓝「开始对比这 N 款」→ 切换到对比视图
│
├─ 🅱️ 对比视图（点击「开始对比 N 款」后）
│  ├─ 顶栏：左「← 返回选镜片」+ 中双 Tabs + 右「⛶ 横屏」
│  │   · Tabs：综合对比 / <参数对比>（默认）
│  ├─ 过滤行：参数搜索框（搜参数名快速定位行）
│  ├─ 镜片列 Header（纵向 sticky）：
│  │   · 左列 sticky 区：「仅看差异」「仅高亮最优」开关
│  │   · 右列镜片卡片：品牌色点 + 品牌 + 型号 + 价格 + 控制率（≥3 款时横滚）
│  ├─ 对比表主体：
│  │   · 左列（参数名）：sticky left:0，纵向随主体滚动
│  │   · 右列（镜片数据）：≥3 款横向独立滚动，2 款填满不滚
│  │   · 分组 Header：核心参数 ▾ / 临床数据 ▾ / 安全合规 ▾ / 产品供应 ▾
│  │   · 行样式：最优值=琥珀色块+加粗；差异值=白边+浅蓝底；Tag=绿现货/黄定制
│  │   · 数据来源：复用 `compare.service.ts` 的 buildDoctorSections(rows)
│  ├─ 「综合对比」Tab 内容：
│  │   · 3 张最优概要卡：控制率最高 / 价格最友好 / 适配年龄最广（同 B 端 Summary）
│  │   · 差异统计卡：共 N 组参数，其中 X 项存在差异，Y 项完全一致
│  │   · CTA 大按钮：「查看完整参数对比表」→ 切到参数对比 Tab
│  └─ *横屏模式（点击「⛶ 横屏」触发）：
│      · 整个小程序预览容器内模拟旋转：landscape 布局（宽度 812 × 高度 375）
│      · 隐藏底部 TabBar（复用 `detailLensId!=null` 的隐藏逻辑，新增 `compareLandscapeMode` 状态联动）
│      · 左上角「↺ 返回竖屏」退出横屏，恢复对比视图
│      · 参数列宽扩展到 ~100px，镜片列宽 150-160px，充分利用横向空间
│
└─ 「+ 添加镜片」弹窗（选镜视图顶部按钮触发）
   ├─ Step 1：品牌列表
   │   · 顶栏：← 返回 不重要 关闭 + 标题「选择品牌」+ 搜索框（搜品牌中/英名）
   │   · 右侧 A-Z 字母索引条（点击跳转分组）
   │   · 按首字母分组 Sub Header：A / B / C / …
   │   · 每行品牌：品牌 Logo 占位（彩色圆/品牌首字母） + 中文名 +（英文名可选）
   │   · 点击品牌 → 进入该品牌下镜片列表
   │
   └─ Step 2：品牌下镜片列表
       · 顶栏：← 返回品牌 + 标题「蔡司 Zeiss」+ 关闭
       · 搜索框：搜该品牌下系列/型号
       · 过滤 Chips（横向滚动）：全部类型 / 多点离焦 / 环带微柱镜 / 周边离焦 / 现货片 / 定制片
       · 系列分组（可选）：多点离焦系列 / 常规单光系列
       · 每行镜片：左暂存勾选框 + 品牌色块 + 型号 + 技术类型+控制率 Tags + 右价格
       · 勾选上限：已选 compareIds.length + 暂存 pickedInPicker.length ≥4 → 其他行勾选框 disabled
       · 底部蓝色按钮：「确认加入对比（已选 N 款）」→ dedup 合入 compareIds + 关弹窗 + Toast
```

## 4. 数据 & 状态模型

全部状态位于 `MiniProgramPreviewPage` 内部：

```ts
interface MiniProgramPreviewPageState {
  // === 原有状态，保留不动 ===
  bottomTab: 'home' | 'compare' | 'me';
  detailLensId: string | null;     // 详情页激活时隐藏 TabBar
  compareIds: string[];            // ✅ 全局单例：0~4 个镜片 id
  favoriteIds: string[];
  // ... 其他原有（toast/disclaimer/filterOpen 等）

  // === 新增对比相关状态 ===
  // 选镜视图 vs 对比视图
  compareView: 'select' | 'result'; // 默认 select
  // 对比视图 Tabs 选择 (综合对比/参数对比)，默认 'doctorParams'
  compareTab: 'summary' | 'doctorParams';
  // 参数对比表横屏模式
  compareLandscapeMode: boolean;    // true 时隐藏 TabBar + landscape
  // 品牌选择器弹窗
  brandPickerOpen: boolean;
  brandPickerStep: 'list' | 'detail'; // 品牌列表 / 某品牌镜片
  brandPickerBrandId: string | null; // Step 2 中选中的品牌
  pickedInPicker: string[];          // 弹窗内勾选的镜片 id 暂存
  // 编辑模式
  compareEditMode: boolean;          // Header「编辑」-> true
  // 对比表过滤
  compareDiffOnly: boolean;          // 仅看差异开关
  compareBestOnly: boolean;          // 仅高亮最优开关
  compareKeyword: string;            // 参数搜索关键字
}
```

## 5. 关键交互规则

### 5.1 加入对比的四处入口 & 跳转规则

| 入口 | 操作 | 行为 |
|---|---|---|
| 首页卡片 / 列表推荐区 | 点击（假设新增）卡片右下角悬浮 PK 按钮 | `toggleCompare(id)`<br/>→ 0→1 款时 `setBottomTab('compare')` 切到对比 Tab<br/>→ ≥1 款时只 Toast，停留原页面 |
| 镜片详情页 | 底部「加入对比」/「对比清单 (N/4)」按钮 | 同上（复用 toggleCompare）<br/>按钮状态：已加入 = 白底蓝字边框，未加入 = 默认白底灰边框 |
| 对比 Tab 同级推荐行 | 行内 checkbox 点击 | `toggleCompare(id)` 直接写 compareIds（立即生效）<br/>达上限 4 时未勾选行 disabled 灰 |
| 对比 Tab → 「+ 添加镜片」弹窗 | 勾选暂存 + 底部确认按钮 | 弹窗内勾选写入 pickedInPicker（不碰 compareIds）<br/>点击确认：`dedup([...compareIds, ...pickedInPicker])`，>4 按顺序截断 |

### 5.2 滚动行为（重点）

对比表 `compareView='result'` 时：
- 2 款镜片：每列 `width:50%`，无横向滚动条
- ≥3 款：每列 `min-width:140px`，镜片 Header 行 + 数据区 **联动横向滚动**
- 左列（参数列）`position: sticky; left: 0`，横向不动，纵向和主表同步滚动
- 分组 Sub Header（核心参数 ▾…）纵向 sticky 顶部

横屏模式：
- 容器内模拟 812(w) × 375(h) landscape（保持 iPhone 比例）
- 参数列宽扩到 ~100px，镜片列 150-160px
- `compareLandscapeMode === true` 时 `renderBottomTabBar()` 返回 null（和 `detailLensId!=null` 逻辑一致）

### 5.3 编辑模式 & 移除

- 点击 Header「编辑」：`compareEditMode = true`
  - 槽位卡片右上角新增圆形 X 按钮：点击 `compareIds = filter(id != x)`
  - 底部出现红色「清空全部 4 款」按钮：`ConfirmModal` 二次确认后置空
  - Header 按钮变「完成」：点击退出编辑态
- 非编辑态：槽位右下角「更换 ⇅」
  - 点击：`removeOne(id)` + 立即打开品牌选择器，替换为新选的镜片

### 5.4 参数对比表过滤开关

- **仅看差异**：`compareDiffOnly=true` 时，只渲染 sections.rows 中 `hasDiff === true` 的行
- **仅高亮最优**：`compareBestOnly=true` 时，非最优值改为「—」或浅灰色，最优值保留琥珀色高亮（默认 false：全部显示+最优高亮）
- **参数搜索**：关键字匹配参数 label/hint，匹配行才渲染

## 6. 数据复用方案（不造轮子）

- 镜片数据分组 → 品牌列表：`mockLensList` 按 `baseInfo.brandId` 做 `groupBy`
  - 品牌排序：按品牌中文名拼音首字母做 A→Z 分组（`nameOfBrand(id)` 拿中文名，硬编码拼音首字母映射即可）
- 对比表行 / 分组：**直接复用 `buildDoctorSections(rows)`**
  - `sections = useMemo(() => compareIds.length>=2 ? buildDoctorSections(selectedLensRows) : [], ...)`
  - 行的 `hasDiff`、最优判断、`label/hint/values` 结构已封装好，不用重写
- 横屏模式复用同一份 sections 数据，只是不同的渲染方式（更宽的列 + 隐藏外围 UI）
- 镜片详情页底部按钮：逻辑不动，只在 toggleCompare 里加「首次加入切 Tab」判断

## 7. 修改文件清单

| 文件 | 改动量 | 说明 |
|---|---|---|
| `src/pages/MiniProgram/index.tsx` | ✅ 主要 | 重写 `renderComparePage()`；新增 4 个渲染函数；新增 ~10 个 state；`toggleCompare()` 加跳转逻辑；`renderBottomTabBar()` 增加横屏模式隐藏 |
| `src/services/compare.service.ts` | 🔒 不改 | 仅读取 `buildDoctorSections` 返回结构 |
| `src/pages/Compare/index.tsx`（B 端） | 🔒 不改 | 完全保留 |
| `src/mocks/lens.mock.ts` | ⚪ 可不动 | 如果缺少品牌对应镜片，数据就缺着，不影响流程 |
| `src/components/ui/*` | 🔒 不改 | 用现有 Tabs / Modal / 按钮样式类 |

## 8. 验收标准

1. **流程通畅**：从详情页首次加入对比 → 自动跳对比 Tab → 槽位显示已加镜片 → 同级推荐勾选第 2 款 → 底部按钮变蓝可点 → 点「开始对比 2 款」→ 展开参数对比表 → 表格滚动正常，2 列不滚、加第 3 款时出现横滚
2. **品牌选择器**：「+ 添加镜片」→ 品牌列表 → 点品牌进详情 → 勾 2 款 → 确认加入 → compareIds 更新，槽位出现新镜片，最多不超过 4
3. **横屏模式**：参数对比视图点「⛶ 横屏」→ TabBar 隐藏，横屏表格展示 → ↺ 返回竖屏恢复
4. **编辑移除**：编辑 → 单条 X → 槽位更新；清空全部 → 确认弹窗 → compareIds=[]，底部按钮禁用
5. **综合对比 Tab**：3 张最优概要卡 + 差异统计 + CTA 跳参数对比 Tab
6. **无破坏性**：B 端 Compare 页、小程序详情页/首页/个人中心原来的功能均不受影响

## 9. 非目标（明确不做）

- B 端管理后台对比页的样式/交互重构 ❌
- 持久化存储 compareIds（不进 localStorage，重启预览就重置为默认空）❌
- 多组对比会话 ❌
- 真实 Fullscreen API / 设备方向事件（容器内模拟旋转样式实现即可）❌
- 分享对比结果海报 ❌
