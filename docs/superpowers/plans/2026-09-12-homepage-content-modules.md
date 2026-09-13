# 首页专家解说与论文参考模块 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为镜片查询管理系统实现「专家解说」「论文参考」两个内容模块，包含 B 端运营后台两个独立管理页，以及 C 端小程序首页的「专业信息」展示区、内嵌全屏详情页、最新入库列表页。

**架构：** 采用统一 `ContentService` 按 `category` 区分两类内容，共享类型与 CRUD 逻辑；后台两个页面共用同一套 UI 模式（非组件化抽象，直接复制以避免过度设计）；小程序端在现有状态机中增加内容详情视图和 Markdown 轻量渲染器（不引入新依赖）。

**技术栈：** React 19 + TypeScript 5 + Tailwind CSS v4 + lucide-react 图标 + 项目现有 UI 组件库（Cards/Table/Modal/Form/Tabs/Tag/Input/Button/Textarea）

---

## 文件结构总览

### 新增文件（6 个）

| 路径 | 职责 |
|---|---|
| `src/types/content.ts` | 独立类型文件：`ContentCategory` / `ContentTagType` / `CONTENT_*_LABEL` / `ContentArticle` |
| `src/mocks/content.mock.ts` | 两类内容各 3~4 条 mock 数据 |
| `src/services/content.service.ts` | 统一 `ContentService`：list/get/create/update/remove/toggleEnabled/togglePinned/move/incView |
| `src/pages/Operation/ExpertArticleList.tsx` | 后台专家解说管理页（列表 + 搜索 + 新增/编辑 Modal + 排序） |
| `src/pages/Operation/PaperReferenceList.tsx` | 后台论文参考管理页（结构同上，文案/字段显隐微调） |
| `src/utils/markdown-renderer.tsx` | 极简 Markdown 渲染组件（H1~H3 / 粗体 / 列表 / 引用 / 分段） |

### 修改文件（5 个）

| 路径 | 改动点 |
|---|---|
| `src/types/system.ts` | `MENU_PERMISSIONS` 追加两条；`OPERATION_MODULES` 追加「专家解说」「论文参考」 |
| `src/router/index.tsx` | 新增 2 条路由 + 2 个 lazy import |
| `src/components/business/Sidebar.tsx` | 运营管理子菜单追加「专家解说管理」「论文参考管理」 |
| `src/pages/MiniProgram/index.tsx` | ① 首页 `renderHomePage()` 中插入「专业信息」Section；② 状态机从 `detailLensId` 升级为 `DetailView` 联合；③ 新增内容详情页渲染；④ 新增「最新入库」列表视图渲染；⑤ 详情页打开时 `viewCount +1` |
| `src/mocks/index.ts` | 若有 barrel 导出，追加 `export * from './content.mock'` |

---

## 任务 1：类型与常量定义

**文件：**
- 创建：`src/types/content.ts`

- [ ] **步骤 1：创建内容类型文件**

```typescript
import type { BaseEntity } from './common';

export type ContentCategory = 'expert_article' | 'paper_reference';

export const CONTENT_CATEGORY_LABEL: Record<ContentCategory, string> = {
  expert_article: '专家解说',
  paper_reference: '论文参考',
};

export type ContentTagType =
  | 'clinical_experience'
  | 'fitting_reference'
  | 'academic_literature'
  | 'data_traceability';

export const CONTENT_TAG_LABEL: Record<ContentTagType, string> = {
  clinical_experience: '临床经验',
  fitting_reference: '验配参考',
  academic_literature: '学术文献',
  data_traceability: '数据溯源',
};

export const CONTENT_TAG_DEFAULTS: Record<ContentCategory, ContentTagType[]> = {
  expert_article: ['clinical_experience', 'fitting_reference'],
  paper_reference: ['academic_literature', 'data_traceability'],
};

export interface ContentArticle extends BaseEntity {
  category: ContentCategory;
  title: string;
  summary: string;
  content: string;
  tags: ContentTagType[];
  coverImage?: string;
  source: string;
  relatedLensIds?: string[];
  sortWeight: number;
  isPinned: boolean;
  enabled: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **步骤 2：修改 `src/types/system.ts` 追加权限与模块**

在 `MENU_PERMISSIONS` 数组末尾追加：
```typescript
  { key: 'menu:content:expert:view', group: '运营管理', label: '查看专家解说' },
  { key: 'menu:content:expert:edit', group: '运营管理', label: '编辑专家解说' },
  { key: 'menu:content:paper:view', group: '运营管理', label: '查看论文参考' },
  { key: 'menu:content:paper:edit', group: '运营管理', label: '编辑论文参考' },
```

在 `OPERATION_MODULES` 元组末尾追加两个字符串：
```
  '专家解说',
  '论文参考',
```

- [ ] **步骤 3：类型检查**

运行：`npx tsc --noEmit -p tsconfig.app.json`
预期：无新增 TS 错误（现有项目中如果有其他错误与此无关）。

---

## 任务 2：Mock 数据与 ContentService

**文件：**
- 创建：`src/mocks/content.mock.ts`
- 创建：`src/services/content.service.ts`
- 修改：`src/mocks/index.ts`（如存在 barrel 导出）

- [ ] **步骤 1：创建 content.mock.ts（8 条示例数据）**

```typescript
import type { ContentArticle } from '../types/content';

export const CONTENT_MOCK: ContentArticle[] = [
  // 专家解说
  {
    id: 'art-exp-001',
    category: 'expert_article',
    title: '近视防控镜片验配要点：从选片到随访',
    summary: '临床经验表明，青少年近视控制的关键不只是选对镜片，还需要规范的验光流程与定期随访。本文从四个维度梳理验配要点。',
    content: `# 验配前评估要点

青少年近视防控患者的验配需要**全面的眼部检查**，包括：

- 散瞳前后屈光度对比
- 眼轴长度基线值测量
- 角膜地形图与角膜曲率
- 调节幅度与集合近点

## 镜片选择策略

> 临床经验：8 岁以下首次配镜建议优先选择离焦设计更温和的产品，逐步适应。

常见的选择路径：
1. 控制需求高（进展 > -0.75D/年）→ 多点离焦或环带微柱镜
2. 预算有限 → 周边离焦或国产多点离焦
3. 依从性差（佩戴时间 < 10h/d）→ 不建议强控制款

## 随访与微调

建议每 3 个月随访一次，重点观察眼轴增长速度。`,
    tags: ['clinical_experience', 'fitting_reference'],
    coverImage: '',
    source: '某三甲医院视光中心·李医生',
    relatedLensIds: ['L-ZEISS-XLY', 'L-HOYA-NEW'],
    sortWeight: 1,
    isPinned: true,
    enabled: true,
    viewCount: 1248,
    createdAt: '2026-08-15 09:00:00',
    updatedAt: '2026-09-05 14:30:00',
  },
  {
    id: 'art-exp-002',
    category: 'expert_article',
    title: '环带微柱镜 C.A.R.E. 技术临床应用指南',
    summary: '蔡司小乐圆采用的环带微柱镜技术，与传统多点离焦在设计逻辑上有本质差异。本文结合临床数据说明其适用人群与常见主诉处理。',
    content: `# C.A.R.E. 技术的核心原理

环带微柱镜通过**在光学区外围形成近视性散光离焦信号**来延缓眼轴增长。与多点离焦的点状离焦不同，它形成连续的环形离焦带。

## 适用人群

- 年龄 8~18 岁，近视球镜 -0.50D ~ -6.00D
- 顺规散光 ≤ -2.00D 时效果更佳
- 每日佩戴时长建议 ≥ 12 小时

## 常见主诉及处理

佩戴初期常见的**视觉疲劳**一般在 2 周内缓解。如持续超过 4 周，建议检查配镜参数，特别注意：

> 瞳距是否精准？瞳高是否在 4mm 以内偏差？`,
    tags: ['clinical_experience'],
    coverImage: '',
    source: '视光临床培训资料·王主任',
    relatedLensIds: ['L-ZEISS-XLY'],
    sortWeight: 2,
    isPinned: false,
    enabled: true,
    viewCount: 856,
    createdAt: '2026-08-02 10:00:00',
    updatedAt: '2026-08-28 11:00:00',
  },
  {
    id: 'art-exp-003',
    category: 'expert_article',
    title: '多点离焦镜片佩戴依从性管理',
    summary: '多项临床研究一致表明，佩戴时长与控制效果呈显著正相关。如何让孩子坚持佩戴每日 12 小时？这里有 5 条可操作建议。',
    content: `# 为什么依从性是关键

H.A.L.T. 研究事后分析显示，**每日佩戴 < 10 小时的组别，控制效果下降约 40%**。

## 5 条提高依从性的建议

1. 家长示范：全家形成戴镜（或护眼）仪式
2. 习惯锚定：起床后第一件事就是戴镜
3. 可视化追踪：日历贴纸记录每日佩戴
4. 定期反馈：让孩子参与每 3 个月验光，亲眼看到数据
5. 备用方案：户外运动日可配合备用太阳夹片

> 验配参考：建议每次随访时单独询问佩戴时长，并记录在病历中。`,
    tags: ['fitting_reference'],
    coverImage: '',
    source: '儿童视光门诊·陈医生',
    relatedLensIds: [],
    sortWeight: 3,
    isPinned: false,
    enabled: true,
    viewCount: 623,
    createdAt: '2026-07-20 16:00:00',
    updatedAt: '2026-08-30 10:00:00',
  },
  // 论文参考
  {
    id: 'art-pap-001',
    category: 'paper_reference',
    title: '离焦镜片与单光镜片对青少年近视控制的 3 年随机对照研究',
    summary: '纳入 298 名 8~13 岁儿童的多中心 RCT，3 年随访结果显示试验组等效球镜增长延缓 59%，眼轴增长延缓 52%。',
    content: `# 研究背景

近视已成为东亚地区重大公共卫生问题。2023 年我国青少年近视患病率已达 **76.5%**。

## 研究方法

- **研究设计**：多中心、随机、双盲、平行对照
- **样本量**：298 名受试者（试验组 149，对照组 149）
- **年龄**：8~13 岁
- **纳入标准**：近视球镜 -1.00D ~ -5.00D，散光 ≤ -1.50D
- **随访周期**：每 6 个月一次，共 36 个月

## 主要结果

### 等效球镜度数（SER）

- 试验组 3 年增长：**-1.23 ± 0.62 D**
- 对照组 3 年增长：**-2.99 ± 0.84 D**
- 控制率：**58.9%**（P < 0.001）

### 眼轴长度

- 试验组 3 年增长：**0.46 ± 0.21 mm**
- 对照组 3 年增长：**0.96 ± 0.29 mm**
- 控制率：**52.1%**（P < 0.001）

## 结论

与单光镜片相比，多点离焦镜片在 3 年随访中显著延缓青少年近视进展。`,
    tags: ['academic_literature', 'data_traceability'],
    coverImage: '',
    source: '中华眼科杂志 2024, 60(5): 342-350',
    relatedLensIds: ['L-HOYA-NEW', 'L-ZEISS-XLY'],
    sortWeight: 1,
    isPinned: false,
    enabled: true,
    viewCount: 2145,
    createdAt: '2026-09-01 08:00:00',
    updatedAt: '2026-09-01 08:00:00',
  },
  {
    id: 'art-pap-002',
    category: 'paper_reference',
    title: '周边离焦与中心离焦设计延缓近视进展的系统评价与 Meta 分析',
    summary: '纳入 14 项 RCT 共 4562 名受试者的 Meta 分析，对比不同离焦设计的临床疗效。',
    content: `# 目的

系统评估不同离焦设计光学镜片（**周边离焦** vs **中心多点离焦** vs **环带微柱镜**）对青少年近视控制的相对疗效。

## 方法

检索 Pubmed、CNKI、万方、IOVS 摘要集，截止日期 2024 年 12 月。

纳入标准：
- 随机对照试验
- 受试者年龄 6~18 岁
- 随访时长 ≥ 12 个月
- 主要结局指标为 SER 和/或眼轴

## 结果

共纳入 **14 项 RCT，4562 名**受试者。

| 设计类型 | 纳入研究数 | SER 延缓（MD, 95%CI） | 眼轴延缓（MD, 95%CI） |
|---|---|---|---|
| 周边离焦 | 5 | -0.41D (-0.56, -0.26) | -0.15mm (-0.22, -0.08) |
| 中心多点离焦 | 6 | -0.89D (-1.05, -0.73) | -0.32mm (-0.38, -0.26) |
| 环带微柱镜 | 3 | -0.76D (-0.92, -0.60) | -0.28mm (-0.36, -0.20) |

## 结论

**中心区域离焦设计（多点/环带）疗效显著优于周边离焦设计**，但对验光与佩戴位置要求更高。`,
    tags: ['academic_literature'],
    coverImage: '',
    source: '国际眼科杂志 2025, 25(2): 220-231',
    relatedLensIds: ['L-ESSIL-ST'],
    sortWeight: 2,
    isPinned: false,
    enabled: true,
    viewCount: 1678,
    createdAt: '2026-08-20 08:00:00',
    updatedAt: '2026-08-20 08:00:00',
  },
  {
    id: 'art-pap-003',
    category: 'paper_reference',
    title: '国产多点离焦镜片的多中心 12 个月临床验证',
    summary: '明月轻松控 Pro 的多中心 RCT，等效球镜延缓 54%，眼轴延缓 48%，非劣效于进口同类产品。',
    content: `# 研究目的

评估一款**国产多点离焦镜片（明月轻松控 Pro）**对中国青少年近视进展的控制效果，并与进口产品进行非劣效性比较。

## 方法

- **多中心 RCT**：全国 6 家三甲医院视光中心
- **样本量**：试验组 180 人，对照组（进口同原理）180 人
- **年龄**：8~16 岁，屈光度 -1.00D ~ -6.00D
- **观察指标**：SER、眼轴、角膜地形图、不良事件

## 12 个月结果

**SER 变化：**
- 国产组：**-0.78 ± 0.42 D**
- 进口组：**-0.73 ± 0.40 D**
- 非劣效 P < 0.001

**眼轴变化：**
- 国产组：**0.27 ± 0.16 mm**
- 进口组：**0.26 ± 0.15 mm**

> 两组均无严重不良事件；轻度异物感与视觉疲劳发生率差异无统计学意义。

## 结论

国产多点离焦镜片在 12 个月内对青少年近视控制效果非劣于进口对照产品。`,
    tags: ['academic_literature', 'data_traceability'],
    coverImage: '',
    source: '眼视光学与视觉科学学报 2025, 10(3): 188-197',
    relatedLensIds: ['L-MOON-LEX'],
    sortWeight: 3,
    isPinned: false,
    enabled: true,
    viewCount: 982,
    createdAt: '2026-08-10 08:00:00',
    updatedAt: '2026-08-10 08:00:00',
  },
  {
    id: 'art-pap-004',
    category: 'paper_reference',
    title: '离焦镜片佩戴时长与控制效果的剂量-反应关系',
    summary: '基于真实世界数据的回顾性研究，N=1243，发现每日佩戴 10h 是控制效果的阈值，12h 以上达到平台期。',
    content: `# 背景

佩戴时长被普遍认为是离焦镜片效果的关键影响因素，但**具体阈值与平台期**仍缺乏真实世界大样本证据。

## 方法

- **设计**：回顾性队列研究
- **样本**：1243 名佩戴多点离焦镜片患者
- **数据来源**：视光中心电子病历 + 佩戴时长自评问卷（验证子集与佩戴监测仪相关系数 0.86）
- **主要分析**：限制性立方样条（RCS）拟合剂量-反应曲线

## 结果

### 阈值效应

RCS 分析显示：
- **< 8 小时/天**：控制效果微弱（SER 延缓约 15%）
- **8~10 小时/天**：控制效果快速提升
- **≥ 10 小时/天**：SER 延缓达到 50% 以上
- **≥ 12 小时/天**：平台期（边际增益 < 3%）

## 建议

> 临床处方时，建议明确告知家长"10 小时"这一关键阈值，并提供提高依从性的具体策略。`,
    tags: ['data_traceability'],
    coverImage: '',
    source: 'IOVS 2024, 65(12): 2863 摘要',
    relatedLensIds: [],
    sortWeight: 4,
    isPinned: false,
    enabled: false,
    viewCount: 452,
    createdAt: '2026-07-28 08:00:00',
    updatedAt: '2026-08-15 09:00:00',
  },
];
```

- [ ] **步骤 2：创建 ContentService（content.service.ts）**

```typescript
import { ok, err, type ListQuery } from './request';
import type { ApiResponse } from '../types/common';
import type { ContentArticle, ContentCategory } from '../types/content';
import { CONTENT_MOCK } from '../mocks/content.mock';

const delay = <T>(data: T, ms = 220): Promise<T> =>
  new Promise((r) => setTimeout(() => r(data), ms));

const items: ContentArticle[] = [...CONTENT_MOCK];

const sortByCategory = (category: ContentCategory, list: ContentArticle[]): ContentArticle[] => {
  const arr = [...list];
  if (category === 'expert_article') {
    arr.sort((a, b) =>
      Number(b.isPinned) - Number(a.isPinned)
      || a.sortWeight - b.sortWeight
      || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
    );
  } else {
    arr.sort((a, b) =>
      (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
      || a.sortWeight - b.sortWeight,
    );
  }
  return arr;
};

export const ContentService = {
  async list(
    category: ContentCategory,
    opts?: { includeDisabled?: boolean; keyword?: string }
  ): Promise<ApiResponse<ContentArticle[]>> {
    let list = items.filter((r) => r.category === category);
    if (!opts?.includeDisabled) list = list.filter((r) => r.enabled);
    if (opts?.keyword) {
      const kw = opts.keyword.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(kw) ||
          r.source.toLowerCase().includes(kw) ||
          r.summary.toLowerCase().includes(kw),
      );
    }
    return delay(ok(sortByCategory(category, list)));
  },

  async listForHomepage(): Promise<
    ApiResponse<{ expert: ContentArticle[]; paper: ContentArticle[] }>
  > {
    const allExp = items.filter((r) => r.category === 'expert_article' && r.enabled);
    const allPap = items.filter((r) => r.category === 'paper_reference' && r.enabled);
    const expert = sortByCategory('expert_article', allExp).slice(0, 2);
    const paper = sortByCategory('paper_reference', allPap).slice(0, 2);
    return delay(ok({ expert, paper }));
  },

  async get(id: string): Promise<ApiResponse<ContentArticle>> {
    const r = items.find((x) => x.id === id);
    if (!r) return delay(err('内容不存在'));
    return delay(ok(r));
  },

  async create(
    payload: Omit<ContentArticle, 'id' | 'createdAt' | 'updatedAt' | 'sortWeight' | 'viewCount'> & {
      sortWeight?: number;
    }
  ): Promise<ApiResponse<ContentArticle>> {
    const siblings = items.filter((r) => r.category === payload.category);
    const maxW = siblings.reduce((m, r) => Math.max(m, r.sortWeight), 0);
    const item: ContentArticle = {
      ...payload,
      id: 'art_' + Date.now().toString(36),
      sortWeight: payload.sortWeight ?? maxW + 1,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(item);
    return delay(ok(item));
  },

  async update(
    id: string,
    payload: Partial<Omit<ContentArticle, 'id' | 'category' | 'createdAt'>>
  ): Promise<ApiResponse<ContentArticle>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('内容不存在'));
    items[idx] = { ...items[idx], ...payload, updatedAt: new Date().toISOString() };
    return delay(ok(items[idx]));
  },

  async remove(id: string): Promise<ApiResponse<{ affected: number }>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('内容不存在'));
    items.splice(idx, 1);
    return delay(ok({ affected: 1 }));
  },

  async toggleEnabled(id: string): Promise<ApiResponse<ContentArticle>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('内容不存在'));
    items[idx] = { ...items[idx], enabled: !items[idx].enabled, updatedAt: new Date().toISOString() };
    return delay(ok(items[idx]));
  },

  async togglePinned(id: string): Promise<ApiResponse<ContentArticle>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('内容不存在'));
    const category = items[idx].category;
    const siblings = items.filter((r) => r.category === category);
    let minW = siblings.reduce((m, r) => Math.min(m, r.sortWeight), 0);
    const newPinned = !items[idx].isPinned;
    if (newPinned) minW = minW - 1000;
    items[idx] = {
      ...items[idx],
      isPinned: newPinned,
      sortWeight: newPinned ? minW : items[idx].sortWeight,
      updatedAt: new Date().toISOString(),
    };
    return delay(ok(items[idx]));
  },

  async move(
    id: string,
    direction: 'up' | 'down' | 'top'
  ): Promise<ApiResponse<{ affected: number }>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('内容不存在'));
    const category = items[idx].category;
    const siblings = items
      .map((r, i) => ({ r, i }))
      .filter((x) => x.r.category === category);
    const sorted = [...siblings].sort((a, b) => a.r.sortWeight - b.r.sortWeight);
    const pos = sorted.findIndex((x) => x.i === idx);
    if (pos === -1) return delay(err('内容不存在'));

    if (direction === 'top' && pos > 0) {
      const firstW = sorted[0].r.sortWeight;
      items[idx].sortWeight = firstW - 1;
    } else if (direction === 'up' && pos > 0) {
      const prev = sorted[pos - 1];
      const tmp = items[idx].sortWeight;
      items[idx].sortWeight = prev.r.sortWeight;
      items[prev.i].sortWeight = tmp;
    } else if (direction === 'down' && pos < sorted.length - 1) {
      const next = sorted[pos + 1];
      const tmp = items[idx].sortWeight;
      items[idx].sortWeight = next.r.sortWeight;
      items[next.i].sortWeight = tmp;
    } else {
      return delay(err('无法继续移动'));
    }
    items[idx].updatedAt = new Date().toISOString();
    return delay(ok({ affected: 1 }));
  },

  async incView(id: string): Promise<ApiResponse<{ viewCount: number }>> {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return delay(err('内容不存在'));
    items[idx] = { ...items[idx], viewCount: items[idx].viewCount + 1 };
    return delay(ok({ viewCount: items[idx].viewCount }));
  },
};
```

- [ ] **步骤 3：如有 barrel 导出则修改 src/mocks/index.ts**

检查 `src/mocks/index.ts` 内容；如果存在集中导出，添加：
```
export * from './content.mock';
```

- [ ] **步骤 4：编译检查**

运行：`npx tsc --noEmit -p tsconfig.app.json`
预期：ContentService 类型通过，无 TS 错误。

---

## 任务 3：极简 Markdown 渲染器

**文件：**
- 创建：`src/utils/markdown-renderer.tsx`

- [ ] **步骤 1：实现 MarkdownRenderer 组件（不引入依赖）**

```tsx
import React from 'react';

const renderInlineBold = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    parts.push(
      <strong key={key++} className="font-semibold text-brand-700">
        {match[1]}
      </strong>
    );
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }
  return parts.length ? parts : [text];
};

interface MarkdownRendererProps {
  source: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ source, className = '' }) => {
  const blocks = source.split(/\n\n+/).filter((b) => b.trim().length > 0);
  return (
    <div className={`prose-none text-sm leading-7 text-slate-700 space-y-4 ${className}`}>
      {blocks.map((block, idx) => {
        const lines = block.split('\n').map((l) => l.trimEnd());
        const firstLine = lines[0] ?? '';

        // H1
        if (/^#\s+/.test(firstLine)) {
          return (
            <h1 key={idx} className="text-xl font-bold text-slate-900 mt-5 mb-3 leading-snug">
              {renderInlineBold(firstLine.replace(/^#\s+/, ''))}
            </h1>
          );
        }
        // H2
        if (/^##\s+/.test(firstLine)) {
          return (
            <h2 key={idx} className="text-lg font-bold text-slate-900 mt-4 mb-2 leading-snug">
              {renderInlineBold(firstLine.replace(/^##\s+/, ''))}
            </h2>
          );
        }
        // H3
        if (/^###\s+/.test(firstLine)) {
          return (
            <h3 key={idx} className="text-base font-bold text-slate-800 mt-3 mb-2 leading-snug">
              {renderInlineBold(firstLine.replace(/^###\s+/, ''))}
            </h3>
          );
        }
        // 引用块（仅首行以 > 开头时，整个 block 视为引用）
        if (/^>\s?/.test(firstLine)) {
          const quoteText = lines.map((l) => l.replace(/^>\s?/, '')).join(' ');
          return (
            <blockquote
              key={idx}
              className="border-l-4 border-brand-300 bg-brand-50 pl-4 pr-3 py-2 my-3 italic text-slate-600 rounded-r-lg"
            >
              {renderInlineBold(quoteText)}
            </blockquote>
          );
        }
        // 列表（首行以 "- " 开头）
        if (/^-\s+/.test(firstLine)) {
          return (
            <ul key={idx} className="list-disc pl-6 space-y-1.5 my-3">
              {lines.map((l, li) => {
                if (!/^-\s+/.test(l)) {
                  return (
                    <li key={li} className="marker:text-brand-400">
                      {renderInlineBold(l)}
                    </li>
                  );
                }
                return (
                  <li key={li} className="marker:text-brand-400">
                    {renderInlineBold(l.replace(/^-\s+/, ''))}
                  </li>
                );
              })}
            </ul>
          );
        }
        // 表格（粗略：包含 | 且至少两行）
        if (lines.length >= 2 && firstLine.includes('|') && lines[1]?.includes('---')) {
          const headerCells = firstLine.split('|').map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1 ? true : (i === 0 && c => c.trim().length > 0));
          // 简化：直接过滤空
          const hdr = firstLine.split('|').map((c) => c.trim()).filter(Boolean);
          const body = lines.slice(2).filter((l) => l.includes('|')).map((l) =>
            l.split('|').map((c) => c.trim()).filter(Boolean)
          );
          return (
            <div key={idx} className="my-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {hdr.map((h, i) => (
                      <th key={i} className="px-3 py-2 font-bold text-slate-700 text-left border-b border-slate-200">
                        {renderInlineBold(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, ri) => (
                    <tr key={ri} className="border-b border-slate-100 last:border-b-0">
                      {hdr.map((_, ci) => (
                        <td key={ci} className="px-3 py-1.5 text-slate-600">
                          {renderInlineBold(row[ci] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        // 普通段落
        const paragraph = lines.join(' ');
        return (
          <p key={idx} className="my-2">
            {renderInlineBold(paragraph)}
          </p>
        );
      })}
    </div>
  );
};
```

- [ ] **步骤 2：TS 类型检查**

运行：`npx tsc --noEmit -p tsconfig.app.json`
预期：无 TS 错误。

---

## 任务 4：路由与侧边栏菜单

**文件：**
- 修改：`src/router/index.tsx`
- 修改：`src/components/business/Sidebar.tsx`

- [ ] **步骤 1：修改 router/index.tsx（新增 2 条路由与 import）**

在顶部 lazy import 块中追加：
```typescript
const ExpertArticleListPage = lazy(() => import('../pages/Operation/ExpertArticleList'));
const PaperReferenceListPage = lazy(() => import('../pages/Operation/PaperReferenceList'));
```

在 children 数组中，在 `/operation/recommend` 路由之后追加：
```typescript
      {
        path: 'operation/expert-articles',
        element: (
          <PageSuspense>
            <ExpertArticleListPage />
          </PageSuspense>
        ),
      },
      {
        path: 'operation/paper-references',
        element: (
          <PageSuspense>
            <PaperReferenceListPage />
          </PageSuspense>
        ),
      },
```

- [ ] **步骤 2：修改 Sidebar.tsx（运营管理子菜单追加 2 项）**

在 import 中引入两个新图标（从 lucide-react）：
```
MessageSquareText, BookOpen,
```

在 `subMenuGroups` 中 `operation` 分组的 `children` 数组，在 `op-compare` 之前追加：
```typescript
      { key: 'op-expert', label: '专家解说管理', icon: MessageSquareText, path: '/operation/expert-articles' },
      { key: 'op-paper', label: '论文参考管理', icon: BookOpen, path: '/operation/paper-references' },
```

- [ ] **步骤 3：编译检查**

运行：`npx tsc --noEmit -p tsconfig.app.json`
预期：无 TS 错误。

---

## 任务 5：后台专家解说管理页

**文件：**
- 创建：`src/pages/Operation/ExpertArticleList.tsx`

该页面结构参照 `RecommendList.tsx`。为保持代码直接可用，提供完整实现。

- [ ] **步骤 1：创建 ExpertArticleList.tsx（完整代码）**

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, ArrowUp, ArrowDown, Pin, Edit2, Trash2, X, RefreshCw,
  MessageSquareText, Save,
} from 'lucide-react';
import { SpecCard, ToolbarCard, ToolbarDivider } from '../../components/ui/Cards';
import { InputSearch, Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Tag } from '../../components/ui/Tag';
import { Table, ActionEditBtn, ActionDeleteBtn } from '../../components/ui/Table';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Switch } from '../../components/ui/Form';
import { Select } from '../../components/ui/Select';
import type { Lens } from '../../types/lens';
import type { ContentArticle, ContentTagType } from '../../types/content';
import {
  CONTENT_TAG_LABEL,
  CONTENT_TAG_DEFAULTS,
  CONTENT_CATEGORY_LABEL,
} from '../../types/content';
import { ContentService } from '../../services/content.service';
import { mockLensList } from '../../mocks/lens.mock';
import { nameOfBrand } from '../../services/lens.service';

const CATEGORY: 'expert_article' = 'expert_article';
const CATEGORY_LABEL = CONTENT_CATEGORY_LABEL[CATEGORY];
const TAG_OPTIONS = Object.entries(CONTENT_TAG_LABEL) as [ContentTagType, string][];

interface FormState {
  title: string;
  summary: string;
  content: string;
  tags: ContentTagType[];
  coverImage: string;
  source: string;
  relatedLensIds: string[];
  isPinned: boolean;
  enabled: boolean;
}

const emptyForm = (): FormState => ({
  title: '',
  summary: '',
  content: '',
  tags: [...CONTENT_TAG_DEFAULTS[CATEGORY]],
  coverImage: '',
  source: '',
  relatedLensIds: [],
  isPinned: false,
  enabled: true,
});

export default function ExpertArticleListPage() {
  const [list, setList] = useState<ContentArticle[]>([]);
  const [loading, setLoading] = useState(false);

  const [kw, setKw] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContentArticle | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const [pickOpen, setPickOpen] = useState(false);
  const [pickKw, setPickKw] = useState('');
  const [pickedIds, setPickedIds] = useState<string[]>([]);

  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ContentArticle | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);
  const ok = (m: string) => setToast({ type: 'success', msg: m });
  const err = (m: string) => setToast({ type: 'error', msg: m });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ContentService.list(CATEGORY, { includeDisabled: true });
      if (res.code === 0) setList(res.data);
      else err(res.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredList = list.filter((r) => {
    if (statusFilter === 'enabled' && !r.enabled) return false;
    if (statusFilter === 'disabled' && r.enabled) return false;
    if (kw.trim()) {
      const q = kw.trim().toLowerCase();
      if (
        !r.title.toLowerCase().includes(q) &&
        !r.summary.toLowerCase().includes(q) &&
        !r.source.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };
  const openEdit = (item: ContentArticle) => {
    setEditing(item);
    setForm({
      title: item.title,
      summary: item.summary,
      content: item.content,
      tags: [...item.tags],
      coverImage: item.coverImage ?? '',
      source: item.source,
      relatedLensIds: [...(item.relatedLensIds ?? [])],
      isPinned: item.isPinned,
      enabled: item.enabled,
    });
    setModalOpen(true);
  };

  const validate = (): string | null => {
    if (form.title.trim().length === 0) return '请填写标题';
    if (form.title.trim().length > 60) return '标题不得超过 60 字';
    if (form.summary.trim().length === 0) return '请填写摘要';
    if (form.summary.trim().length > 100) return '摘要不得超过 100 字';
    if (form.content.trim().length === 0) return '请填写正文';
    if (form.tags.length === 0) return '请至少选择一个标签';
    if (form.source.trim().length === 0) return '请填写来源';
    if (form.source.trim().length > 40) return '来源不得超过 40 字';
    if ((form.relatedLensIds?.length ?? 0) > 5) return '关联镜片最多 5 个';
    return null;
  };

  const submit = async () => {
    const v = validate();
    if (v) { err(v); return; }
    setSubmitting(true);
    try {
      if (editing) {
        const res = await ContentService.update(editing.id, {
          title: form.title.trim(),
          summary: form.summary.trim(),
          content: form.content.trim(),
          tags: form.tags,
          coverImage: form.coverImage.trim() || undefined,
          source: form.source.trim(),
          relatedLensIds: form.relatedLensIds,
          isPinned: form.isPinned,
          enabled: form.enabled,
        });
        if (res.code === 0) {
          ok('已更新');
          setModalOpen(false);
          void load();
        } else err(res.message);
      } else {
        const res = await ContentService.create({
          category: CATEGORY,
          title: form.title.trim(),
          summary: form.summary.trim(),
          content: form.content.trim(),
          tags: form.tags,
          coverImage: form.coverImage.trim() || undefined,
          source: form.source.trim(),
          relatedLensIds: form.relatedLensIds,
          isPinned: form.isPinned,
          enabled: form.enabled,
        });
        if (res.code === 0) {
          ok('已新增');
          setModalOpen(false);
          void load();
        } else err(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEnabled = async (item: ContentArticle) => {
    const res = await ContentService.toggleEnabled(item.id);
    if (res.code === 0) {
      ok(res.data.enabled ? '已启用展示' : '已暂停展示');
      void load();
    } else err(res.message);
  };
  const togglePinned = async (item: ContentArticle) => {
    const res = await ContentService.togglePinned(item.id);
    if (res.code === 0) {
      ok(res.data.isPinned ? '已置顶' : '已取消置顶');
      void load();
    } else err(res.message);
  };
  const move = async (item: ContentArticle, dir: 'up' | 'down' | 'top') => {
    const res = await ContentService.move(item.id, dir);
    if (res.code === 0) void load();
    else err(res.message);
  };

  const openRemove = (item: ContentArticle) => {
    setRemoveTarget(item);
    setRemoveOpen(true);
  };
  const submitRemove = async () => {
    if (!removeTarget) return;
    const res = await ContentService.remove(removeTarget.id);
    if (res.code === 0) {
      ok('已删除');
      setRemoveOpen(false);
      setRemoveTarget(null);
      void load();
    } else err(res.message);
  };

  const openPickLens = () => {
    setPickedIds([...form.relatedLensIds]);
    setPickKw('');
    setPickOpen(true);
  };
  const confirmPickLens = () => {
    setForm({ ...form, relatedLensIds: pickedIds });
    setPickOpen(false);
  };
  const toggleTag = (t: ContentTagType) => {
    setForm({
      ...form,
      tags: form.tags.includes(t) ? form.tags.filter((x) => x !== t) : [...form.tags, t],
    });
  };

  const lensById = (id: string) => mockLensList.find((l) => l.id === id);
  const pickCandidateList = mockLensList.filter((l) => !l.management.softDeleted).filter((l) => {
    if (!pickKw.trim()) return true;
    const q = pickKw.trim().toLowerCase();
    return l.baseInfo.fullName.toLowerCase().includes(q)
      || nameOfBrand(l.baseInfo.brandId).toLowerCase().includes(q);
  });

  return (
    <div className="p-8 space-y-6 bg-slate-50/50 min-h-full">
      <SpecCard
        title={`${CATEGORY_LABEL} · 操作规范`}
        items={[
          `「${CATEGORY_LABEL}」建议 3~6 条，置顶配合 sortWeight 排序；首页卡片置顶项优先展示。`,
          '暂停展示只会在 C 端隐藏，不会删除记录；删除操作不可逆，建议优先使用暂停。',
          '关联镜片最多 5 个，详情页底部展示"推荐相关镜片"。',
        ]}
      />

      <ToolbarCard>
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <MessageSquareText className="w-4 h-4 text-brand-600" />
            当前板块：
            <Tag color="brand" size="md">
              {CATEGORY_LABEL} · {filteredList.length}项
            </Tag>
          </div>
          <ToolbarDivider />
          <span className="text-xs text-slate-500">
            已启用展示：
            <span className="font-bold text-emerald-600 ml-1">
              {list.filter((r) => r.enabled).length}
            </span>
            {' / '}
            暂停：
            <span className="font-bold text-slate-500 ml-1">
              {list.filter((r) => !r.enabled).length}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="icon" onClick={() => void load()} title="刷新">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openAdd}>
            新增内容
          </Button>
        </div>
      </ToolbarCard>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="w-72 shrink-0">
          <InputSearch
            placeholder={`搜索${CATEGORY_LABEL}标题/摘要/来源`}
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            onSearch={load}
          />
        </div>
        <div className="w-40 shrink-0">
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as any)}
            options={[
              { label: '全部状态', value: 'all' },
              { label: '仅启用', value: 'enabled' },
              { label: '仅暂停', value: 'disabled' },
            ]}
          />
        </div>
        <div className="flex-1" />
        <Button variant="default" onClick={load}>筛选</Button>
      </div>

      <Table<ContentArticle>
        size="sm"
        rowKey="id"
        dataSource={filteredList}
        loading={loading}
        columns={[
          {
            key: 'index',
            title: '#',
            width: 52,
            align: 'center',
            render: (_v, _r, i) => (
              <span className={`font-bold text-sm ${i === 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                {i + 1}
              </span>
            ),
          },
          {
            key: 'title',
            title: '标题与摘要',
            width: 420,
            render: (_v, r) => (
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  {r.isPinned && (
                    <Tag color="amber" size="sm">
                      <Pin className="w-3 h-3 mr-1 inline" /> TOP
                    </Tag>
                  )}
                  {!r.enabled && <Tag color="slate" size="sm">暂停</Tag>}
                  <span className="font-bold text-slate-800 text-sm truncate inline-block max-w-[260px]">
                    {r.title}
                  </span>
                </div>
                <div className="text-xs text-slate-500 leading-5 line-clamp-2">
                  {r.summary}
                </div>
              </div>
            ),
          },
          {
            key: 'tags',
            title: '标签',
            width: 200,
            render: (_v, r) => (
              <div className="flex flex-wrap gap-1">
                {r.tags.map((t) => (
                  <Tag key={t} color="brand" size="sm">
                    {CONTENT_TAG_LABEL[t]}
                  </Tag>
                ))}
              </div>
            ),
          },
          {
            key: 'source',
            title: '来源',
            width: 160,
            render: (_v, r) => (
              <span className="text-xs text-slate-600 truncate block max-w-[150px]" title={r.source}>
                {r.source}
              </span>
            ),
          },
          {
            key: 'pinned',
            title: '置顶',
            width: 72,
            align: 'center',
            render: (_v, r) => (
              <Switch checked={r.isPinned} onChange={() => togglePinned(r)} size="sm" />
            ),
          },
          {
            key: 'enabled',
            title: '状态',
            width: 72,
            align: 'center',
            render: (_v, r) => (
              <Switch checked={r.enabled} onChange={() => toggleEnabled(r)} size="sm" />
            ),
          },
          {
            key: 'updatedAt',
            title: '更新时间',
            width: 150,
            render: (_v, r) => (
              <span className="text-xs text-slate-500">
                {r.updatedAt?.slice(0, 16).replace('T', ' ')}
              </span>
            ),
          },
          {
            key: 'actions',
            title: '操作',
            width: 260,
            render: (_v, r, i) => {
              const first = i === 0;
              const last = i === filteredList.length - 1;
              return (
                <div className="flex flex-wrap items-center gap-1">
                  <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-0.5">
                    <Button variant="ghost" size="sm" onClick={() => move(r, 'top')} disabled={first}>
                      <Pin className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => move(r, 'up')} disabled={first}>
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => move(r, 'down')} disabled={last}>
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                  <ActionEditBtn onClick={() => openEdit(r)} />
                  <ActionDeleteBtn onClick={() => openRemove(r)} />
                </div>
              );
            },
          },
        ]}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="2xl"
        title={editing ? `编辑${CATEGORY_LABEL} · ${editing.title}` : `新增${CATEGORY_LABEL}`}
        description="表单中标题、摘要、正文、标签、来源为必填项"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="default" onClick={() => setModalOpen(false)}>取消</Button>
            <Button variant="primary" loading={submitting} leftIcon={<Save className="w-4 h-4" />} onClick={submit}>
              {editing ? '保存修改' : '确认新增'}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">
                分类
                <Tag color="brand" size="sm" className="ml-2">{CATEGORY_LABEL}</Tag>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">
                标题 * <span className="text-slate-400 font-normal">({form.title.length}/60)</span>
              </div>
              <Input
                placeholder="不超过 60 字，如：近视防控镜片验配四要点"
                value={form.title}
                maxLength={60}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">
                摘要 * <span className="text-slate-400 font-normal">({form.summary.length}/100)</span>
              </div>
              <Textarea
                rows={2}
                placeholder="首页卡片展示的摘要，100 字内，突出核心观点"
                value={form.summary}
                maxLength={100}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">标签 *</div>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map(([val, label]) => {
                  const checked = form.tags.includes(val);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => toggleTag(val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        checked
                          ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">封面图 URL（可选）</div>
              <Input
                placeholder="https://..."
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">
                来源 * <span className="text-slate-400 font-normal">({form.source.length}/40)</span>
              </div>
              <Input
                placeholder="如：某三甲医院视光中心·张主任"
                value={form.source}
                maxLength={40}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5">
                关联镜片 <span className="text-slate-400 font-normal">（最多 5 个，可选）</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                {form.relatedLensIds.length === 0 ? (
                  <div className="text-xs text-slate-400">尚未关联镜片</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {form.relatedLensIds.map((id) => {
                      const lens = lensById(id);
                      return (
                        <div key={id} className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs">
                          <span className="font-semibold text-slate-700 truncate max-w-[160px]">
                            {lens?.baseInfo.fullName ?? '（镜片已删除）'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setForm({
                              ...form,
                              relatedLensIds: form.relatedLensIds.filter((x) => x !== id),
                            })}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <Button
                    variant="default"
                    size="sm"
                    leftIcon={<Plus className="w-3 h-3" />}
                    onClick={openPickLens}
                  >
                    选择镜片
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.isPinned} onChange={(v) => setForm({ ...form, isPinned: v })} size="sm" />
                <span className="text-xs font-bold text-slate-600">置顶展示</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} size="sm" />
                <span className="text-xs font-bold text-slate-600">立即启用</span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                <span>正文 * (Markdown)</span>
                <span className="text-slate-400 font-normal">
                  支持 # / ## / **粗体** / - 列表 / &gt; 引用 / 表格
                </span>
              </div>
              <Textarea
                rows={14}
                placeholder="# 标题\n\n正文段落...\n\n- 要点一\n- 要点二"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="font-mono text-xs leading-5"
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        size="lg"
        title={`选择关联镜片（${pickedIds.length}/5）`}
        description="多选，最多 5 个；已在详情页展示相关推荐"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <div className="text-xs text-slate-500 mr-auto">已选 {pickedIds.length} 个</div>
            <Button variant="default" onClick={() => setPickOpen(false)}>取消</Button>
            <Button variant="primary" onClick={confirmPickLens} leftIcon={<Save className="w-4 h-4" />}>
              确认选择
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <InputSearch
                placeholder="搜索镜片名/品牌"
                value={pickKw}
                onChange={(e) => setPickKw(e.target.value)}
              />
            </div>
          </div>
          <Table<Lens>
            size="sm"
            rowKey="id"
            dataSource={pickCandidateList.slice(0, 30)}
            columns={[
              {
                key: 'pick',
                title: '选择',
                width: 56,
                align: 'center',
                render: (_v, r) => {
                  const checked = pickedIds.includes(r.id);
                  const disabled = !checked && pickedIds.length >= 5;
                  return (
                    <input
                      type="checkbox"
                      className="accent-brand-600 w-4 h-4 cursor-pointer"
                      checked={checked}
                      disabled={disabled}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPickedIds((prev) => [...prev, r.id]);
                        } else {
                          setPickedIds((prev) => prev.filter((x) => x !== r.id));
                        }
                      }}
                    />
                  );
                },
              },
              {
                key: 'name',
                title: '镜片名称',
                render: (_v, r) => (
                  <div className="font-bold text-slate-800 truncate max-w-xs">{r.baseInfo.fullName}</div>
                ),
              },
              {
                key: 'brand',
                title: '品牌',
                width: 120,
                render: (_v, r) => nameOfBrand(r.baseInfo.brandId),
              },
              {
                key: 'rate',
                title: '控制率',
                width: 100,
                align: 'right',
                render: (_v, r) => r.coreParams.myopiaControlRate ?? '—',
              },
            ]}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={removeOpen}
        type="danger"
        title="确认删除该内容？"
        description={removeTarget ? (
          <>
            将删除
            <span className="font-bold text-slate-700 mx-1">「{removeTarget.title}」</span>
            ，操作不可逆。建议使用"暂停展示"替代。
          </>
        ) : ''}
        confirmText="确认删除"
        cancelText="再想想"
        loading={submitting}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          setSubmitting(true);
          void submitRemove().finally(() => setSubmitting(false));
        }}
      />

      {toast && (
        <div
          className={`fixed top-6 right-6 z-[2000] min-w-[200px] px-4 py-3 rounded-xl shadow-lg border text-sm font-bold animate-in slide-in-from-right ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
```

- [ ] **步骤 2：TS 类型检查**

运行：`npx tsc --noEmit -p tsconfig.app.json`
预期：无 TS 错误。

---

## 任务 6：后台论文参考管理页

**文件：**
- 创建：`src/pages/Operation/PaperReferenceList.tsx`

该页面**结构复制**自 ExpertArticleList，区别：`CATEGORY = 'paper_reference'`、隐藏列级置顶操作、`openAdd` 时 `isPinned` 默认 false、图标换成 `BookOpen`、SpecCard 文案微调。

- [ ] **步骤 1：创建 PaperReferenceList.tsx（基于 ExpertArticleList 复制并微调）**

复制整个 ExpertArticleList 内容，改动以下几点：
1. 组件名改为 `PaperReferenceListPage`
2. `CATEGORY = 'paper_reference' as const`
3. 顶部图标从 `MessageSquareText` 改为 `BookOpen`
4. `SpecCard` 文案改为：
```
  - 「论文参考」建议 4~8 条，按录入时间倒序展示在首页；如需人工干预可使用上下移/置顶。
  - 暂停展示只会在 C 端隐藏，不会删除记录；删除操作不可逆。
  - 关联镜片最多 5 个，详情页底部展示"推荐相关镜片"。
```
5. `emptyForm` 中 `isPinned` 默认为 `false`
6. **Table 列中隐藏「置顶」列**（把 pinned 列整个对象删除），同时「操作列」中的 `Pin / ArrowUp top / ArrowDown` 改为仅保留上移/下移（去掉 top pin 按钮，即操作列中整个 rounded-lg 组内只保留 ArrowUp 和 ArrowDown 两个按钮，或去掉该组，然后在操作列外单独加个更简单的移序按钮区，参考 RecommendList 的方式。推荐方案：**操作列只保留编辑和删除按钮**，并新增一列「排序」宽 ~200px，放 移序 + 置顶 switch）
7. 表单中的 `分类` Tag 正确显示「论文参考」
8. `placeholder` 文案调整：摘要 placeholder 改为「如：纳入 298 名儿童的多中心 RCT，3 年结果显示…」；来源 placeholder 改为「如：中华眼科杂志 2024, 60(5): 342-350」

- [ ] **步骤 2：TS 类型检查**

运行：`npx tsc --noEmit -p tsconfig.app.json`
预期：无 TS 错误。

---

## 任务 7：小程序首页插入「专业信息」Section

**文件：**
- 修改：`src/pages/MiniProgram/index.tsx`

- [ ] **步骤 1：引入依赖与类型**

在 MiniProgram/index.tsx 顶部 import 块中追加：
```
import { MessageSquareText, BookOpen, ChevronRight, Eye } from 'lucide-react';
import { ContentService } from '../../services/content.service';
import { MarkdownRenderer } from '../../utils/markdown-renderer';
import type { ContentArticle, ContentCategory } from '../../types/content';
import { CONTENT_CATEGORY_LABEL, CONTENT_TAG_LABEL } from '../../types/content';
```

- [ ] **步骤 2：升级状态机（detailLensId → DetailView）**

把原：
```typescript
const [detailLensId, setDetailLensId] = useState<string | null>(null);
const [detail, setDetail] = useState<Lens | null>(null);
```

替换为：
```typescript
type DetailView =
  | { type: 'none' }
  | { type: 'lens'; lensId: string }
  | { type: 'content'; articleId: string }
  | { type: 'contentList' };

const [detailView, setDetailView] = useState<DetailView>({ type: 'none' });
const [detail, setDetail] = useState<Lens | null>(null);
const [detailArticle, setDetailArticle] = useState<ContentArticle | null>(null);
```

- [ ] **步骤 3：新增专业信息列表状态**

在其他 `useState` 旁追加：
```typescript
const [homeExpert, setHomeExpert] = useState<ContentArticle[]>([]);
const [homePaper, setHomePaper] = useState<ContentArticle[]>([]);
const [contentListTab, setContentListTab] = useState<ContentCategory>('expert_article');
const [contentListFilter, setContentListFilter] = useState<{ tag?: string; kw?: string }>({});
```

在 `useEffect` 中，页面初始化时加载：
```typescript
useEffect(() => {
  void (async () => {
    const res = await ContentService.listForHomepage();
    if (res.code === 0) {
      setHomeExpert(res.data.expert);
      setHomePaper(res.data.paper);
    }
  })();
}, []);
```

- [ ] **步骤 4：替换所有 detailLensId 引用**

全局替换：
- `setDetailLensId(null)` → `setDetailView({ type: 'none' })`
- `setDetailLensId(x)` → 原赋值非空时，`setDetailView({ type: 'lens', lensId: x })`
- `!detailLensId` 判断 → `detailView.type !== 'lens'`

原 `useEffect` 依赖 `detailLensId`，改为依赖 `detailView`：
```typescript
useEffect(() => {
  if (detailView.type !== 'lens') {
    setDetail(null);
    return;
  }
  void (async () => {
    const res = await LensService.get(detailView.lensId);
    if (res.code === 0) setDetail(res.data);
  })();
}, [detailView]);
```

原 `renderHeader()` 中条件从 `if (detailLensId)` 改为 `if (detailView.type !== 'none')`，返回按钮的点击逻辑从 `setDetailLensId(null)` 改为 `setDetailView({ type: 'none' })`；中间标题改为：
```typescript
detailView.type === 'lens'
  ? (detail?.baseInfo.fullName ?? '镜片详情')
  : detailView.type === 'content'
  ? (CONTENT_CATEGORY_LABEL[detailArticle?.category ?? 'expert_article'] ?? '内容详情')
  : '专业信息 · 全部内容'
```

- [ ] **步骤 5：新增内容详情 effect**

```typescript
useEffect(() => {
  if (detailView.type !== 'content') {
    setDetailArticle(null);
    return;
  }
  void (async () => {
    const res = await ContentService.get(detailView.articleId);
    if (res.code === 0) {
      setDetailArticle(res.data);
      await ContentService.incView(detailView.articleId).catch(() => {});
    }
  })();
}, [detailView]);
```

- [ ] **步骤 6：renderHomePage() 中插入「专业信息」Section**

在原有 `p-4 space-y-3` 的镜片列表容器 div **内部顶部**，插入：

```tsx
      {(() => {
        const articles = [...homeExpert, ...homePaper];
        if (homeExpert.length === 0 && homePaper.length === 0) return null;
        const toneExpert = { icon: MessageSquareText, badge: 'bg-teal-50 text-teal-700 border-teal-200', accent: 'text-teal-600', title: '专家解说' };
        const tonePaper = { icon: BookOpen, badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', accent: 'text-indigo-600', title: '论文参考' };
        const renderCard = (a: ContentArticle, tone: typeof toneExpert) => {
          const Icon = tone.icon;
          return (
            <div
              key={a.id}
              onClick={() => setDetailView({ type: 'content', articleId: a.id })}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 relative overflow-hidden active:scale-[0.995] cursor-pointer"
            >
              <div
                className={`absolute right-0 top-0 w-10 h-10 ${tone.badge} border-l border-b rounded-bl-2xl flex items-center justify-center`}
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
              >
                <ChevronRight className="w-3.5 h-3.5 relative left-1 -top-1 opacity-70" />
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${tone.badge}`}>
                  <Icon className="w-3 h-3" />
                  {tone.title}
                </div>
                {a.isPinned && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Pin className="w-3 h-3" /> 置顶
                  </div>
                )}
              </div>
              <div className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-1 mb-1 pr-8">
                {a.title}
              </div>
              <div className="text-[11px] text-slate-500 leading-5 line-clamp-2 mb-2 pr-2">
                {a.summary}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 justify-between">
                <div className="flex flex-wrap gap-1">
                  {a.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold border ${tone.badge}`}
                    >
                      {CONTENT_TAG_LABEL[t]}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {a.source}
                </span>
              </div>
            </div>
          );
        };
        return (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-sm">
                  <BookOpen className="w-3.5 h-3.5" /> 专业信息
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">
                  共 {articles.length} 篇
                </span>
              </div>
              <div
                className="text-[11px] font-bold text-brand-600 flex items-center gap-1 cursor-pointer active:opacity-70"
                onClick={() => setDetailView({ type: 'contentList' })}
              >
                最新入库 <ChevronRight className="w-3 h-3" />
              </div>
            </div>
            <div className="space-y-2.5">
              {homeExpert.slice(0, 2).map((a) => renderCard(a, toneExpert))}
              {homePaper.slice(0, 2).map((a) => renderCard(a, tonePaper))}
            </div>
          </div>
        );
      })()}
```

- [ ] **步骤 7：新增内容详情页渲染函数 renderContentDetail()**

```typescript
  const renderContentDetail = () => {
    const a = detailArticle;
    if (!a) {
      return (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">加载中...</div>
      );
    }
    const cat = a.category;
    const tone = cat === 'expert_article'
      ? { badge: 'bg-teal-50 text-teal-700 border-teal-200', accent: 'text-teal-600' }
      : { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', accent: 'text-indigo-600' };
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 pb-8">
        {a.coverImage ? (
          <div className="aspect-video w-full bg-slate-200 overflow-hidden">
            <img src={a.coverImage} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className={`px-4 pt-5 pb-4 bg-gradient-to-br ${cat === 'expert_article' ? 'from-teal-50 to-white' : 'from-indigo-50 to-white'}`}>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border mb-2 ${tone.badge}`}>
              {cat === 'expert_article' ? <MessageSquareText className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
              {CONTENT_CATEGORY_LABEL[cat]}
            </div>
            <h1 className="text-[17px] font-extrabold text-slate-900 leading-snug">
              {a.title}
            </h1>
          </div>
        )}
        <div className="px-4 py-3 border-b border-slate-100 bg-white">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {a.tags.map((t) => (
              <span key={t} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${tone.badge}`}>
                {CONTENT_TAG_LABEL[t]}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
            <span className="truncate max-w-[180px]">{a.source}</span>
            <span className="text-slate-300">·</span>
            <span>{a.updatedAt?.slice(0, 10)}</span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              {a.viewCount.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="px-4 py-5 bg-white">
          <MarkdownRenderer source={a.content} />
        </div>
        {(a.relatedLensIds ?? []).length > 0 && (
          <div className="mt-3 px-4 py-3 bg-white border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-1 h-4 rounded-full bg-brand-500" />
                推荐相关镜片
              </div>
              <span className="text-[11px] text-brand-600 font-bold flex items-center gap-0.5 cursor-pointer"
                onClick={() => { setDetailView({ type: 'none' }); setBottomTab('home'); }}>
                查看全部 <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(a.relatedLensIds ?? [])
                .map((id) => mockLensList.find((l) => l.id === id))
                .filter(Boolean)
                .map((lens) => (
                  <div
                    key={lens!.id}
                    onClick={() => setDetailView({ type: 'lens', lensId: lens!.id })}
                    className="shrink-0 w-[180px] rounded-xl border border-slate-100 bg-slate-50 p-2.5 cursor-pointer active:bg-slate-100"
                  >
                    <div className="text-[9.5px] text-slate-500 font-bold mb-0.5 truncate">
                      {nameOfBrand(lens!.baseInfo.brandId)}
                    </div>
                    <div className="text-[11.5px] font-bold text-slate-800 leading-snug line-clamp-2 mb-1 min-h-[32px]">
                      {lens!.baseInfo.fullName}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-bold">
                      {formatPrice(lens!.management.suggestedRetailPrice)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };
```

- [ ] **步骤 8：新增「最新入库」列表视图 renderContentList()**

```typescript
  const renderContentList = () => {
    const [list, setList] = React.useState<ContentArticle[]>([]);
    React.useEffect(() => {
      void (async () => {
        const e = await ContentService.list('expert_article');
        const p = await ContentService.list('paper_reference');
        if (e.code === 0 && p.code === 0) {
          setList(contentListTab === 'expert_article' ? e.data : p.data);
        }
      })();
    }, [contentListTab]);
    const kw = contentListFilter.kw?.trim().toLowerCase() ?? '';
    const tag = contentListFilter.tag;
    const filtered = list.filter((a) => {
      if (kw && !a.title.toLowerCase().includes(kw) && !a.summary.toLowerCase().includes(kw)) return false;
      if (tag && !a.tags.includes(tag as any)) return false;
      return true;
    });
    const tagOptions = (Object.keys(CONTENT_TAG_LABEL) as (keyof typeof CONTENT_TAG_LABEL)[]);
    return (
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        <Tabs
          variant="primary"
          value={contentListTab}
          onChange={(v) => setContentListTab(v as any)}
          size="sm"
          className="shrink-0 bg-white border-b border-slate-100"
        >
          <TabItem label={CONTENT_CATEGORY_LABEL['expert_article']} value="expert_article" />
          <TabItem label={CONTENT_CATEGORY_LABEL['paper_reference']} value="paper_reference" />
        </Tabs>
        <div className="shrink-0 px-3 py-2 bg-white border-b border-slate-100 space-y-1.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              className="w-full h-8 pl-8 pr-3 bg-slate-50 rounded-lg text-[11.5px] outline-none border border-transparent focus:border-brand-200"
              placeholder="搜索标题/摘要"
              onChange={(e) => setContentListFilter({ ...contentListFilter, kw: e.target.value })}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setContentListFilter({ ...contentListFilter, tag: undefined })}
              className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${!tag ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              全部
            </button>
            {tagOptions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setContentListFilter({ ...contentListFilter, tag: t })}
                className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${tag === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {CONTENT_TAG_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center text-slate-400 text-xs py-12">暂无内容</div>
          ) : (
            filtered.map((a) => {
              const tone = a.category === 'expert_article'
                ? { icon: MessageSquareText, badge: 'bg-teal-50 text-teal-700 border-teal-200', accent: 'text-teal-600', title: '专家解说' }
                : { icon: BookOpen, badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', accent: 'text-indigo-600', title: '论文参考' };
              const Icon = tone.icon;
              return (
                <div
                  key={a.id}
                  onClick={() => setDetailView({ type: 'content', articleId: a.id })}
                  className="bg-white rounded-xl border border-slate-100 p-3 cursor-pointer active:bg-slate-50"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${tone.badge}`}>
                      <Icon className="w-3 h-3" />
                      {tone.title}
                    </div>
                    {a.isPinned && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Pin className="w-3 h-3" /> 置顶
                      </div>
                    )}
                  </div>
                  <div className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2 mb-1">
                    {a.title}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-5 line-clamp-3 mb-2">
                    {a.summary}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 justify-between">
                    <div className="flex flex-wrap gap-1">
                      {a.tags.slice(0, 3).map((t) => (
                        <span key={t} className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold border ${tone.badge}`}>
                          {CONTENT_TAG_LABEL[t]}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {a.source}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };
```

注意：上面 `renderContentList` 函数体内部调用 `React.useState` 和 `React.useEffect` 不能直接写在**非 Hook 函数体内**。正确做法是：**把该函数内使用的 state 提升到 MiniProgramPreviewPage 组件顶层**。因此本步骤实际需要：

在 MiniProgramPreviewPage 顶层 state 再追加：
```typescript
const [contentList, setContentList] = useState<ContentArticle[]>([]);
```
然后写一个 effect 监听 `contentListTab` 变更加载：
```typescript
useEffect(() => {
  if (detailView.type !== 'contentList') return;
  void (async () => {
    const res = await ContentService.list(contentListTab);
    if (res.code === 0) setContentList(res.data);
  })();
}, [contentListTab, detailView.type]);
```
renderContentList 内部就直接用 `contentList` 而不自己 useState。

- [ ] **步骤 9：在主渲染中加入判断**

找到原有主容器内的分支：原 `detailLensId` 时渲染镜片详情，否则 渲染 底部 Tab 的内容。改为：

```typescript
// 主容器（原来包含 renderHeader + 根据 bottomTab 渲染内容）
// ... renderHeader 已在上面改好
// 中间内容区域：
<div className="flex-1 min-h-0 overflow-hidden">
  {detailView.type === 'lens' && renderLensDetail()}
  {detailView.type === 'content' && renderContentDetail()}
  {detailView.type === 'contentList' && renderContentList()}
  {detailView.type === 'none' && (
    <>
      {bottomTab === 'home' && renderHomePage()}
      {bottomTab === 'compare' && renderComparePage()}
      {bottomTab === 'me' && renderMePage()}  // 如果不存在则仅 home/compare
    </>
  )}
</div>
```

（如果 renderLensDetail/renderMePage 原项目中不存在，根据现状：原项目 `detailLensId` 非空时有一套详情渲染逻辑——根据实际代码将该逻辑抽取或合并即可。）

- [ ] **步骤 10：TS 类型检查**

运行：`npx tsc --noEmit -p tsconfig.app.json`
预期：无 TS 错误。

---

## 任务 8：编译、Lint 与手动联调验证

- [ ] **步骤 1：运行 TypeScript 类型检查**

```bash
cd /Users/luffyzh/luffyzh/github/glasses-database
npx tsc --noEmit -p tsconfig.app.json
```
预期：0 个 error（warning 可忽略）

- [ ] **步骤 2：运行 ESLint**

```bash
cd /Users/luffyzh/luffyzh/github/glasses-database
npx eslint src --ext .ts,.tsx --max-warnings 0
```
（如项目未配置 max-warnings，运行 `npm run lint`）

- [ ] **步骤 3：启动 dev 服务手动联调 B 端**

```bash
npm run dev
```
手动点击侧边栏：
- 运营管理 → 专家解说管理：能看到 3 条示例数据，新增/编辑/删除/排序 均可用
- 运营管理 → 论文参考管理：能看到 4 条示例，表单校验生效（标题超 60 字阻止提交）

- [ ] **步骤 4：手动联调 C 端小程序预览页**

访问「小程序 Demo 预览」
- 首页搜索框下方出现「专业信息」Section，2 专家 + 2 论文卡片
- 点击卡片进入详情页：标题、标签、来源、浏览量、Markdown 正文（标题/粗体/列表/引用/表格）正确渲染
- 有 relatedLensIds 的卡片底部"推荐相关镜片"出现，点击跳镜片详情
- 首页点击「最新入库 ▶」打开列表，Tabs 切换专家/论文；标签筛选生效；搜索生效
- 镜片详情页的返回按钮可以回到上一级（首页或内容详情的「推荐相关镜片」链路）

- [ ] **步骤 5：执行项目现有测试（如存在）**

```bash
cd /Users/luffyzh/luffyzh/github/glasses-database
npm test  # 或 npm run test
```
如果没有测试脚本，跳过。

---

## 自检

### 1. 规格覆盖度

- ✅ 数据模型（ContentArticle / 排序规则）→ 任务 1、任务 2
- ✅ Service 层 CRUD（create/update/remove/toggle/move/list/listForHomepage/get/incView）→ 任务 2
- ✅ 后台两独立页面（路由+侧边栏+SpecCard+列表+新增编辑 Modal+关联镜片选择器+删除确认）→ 任务 4、5、6
- ✅ 小程序首页专业信息 Section（位置/卡片样式/数量/分类色调）→ 任务 7 步骤 6
- ✅ 内嵌全屏详情页（Markdown 渲染器 + 相关镜片推荐 + 浏览量 + 返回）→ 任务 3 + 任务 7 步骤 7
- ✅ 最新入库列表页（Tabs / 搜索 / 标签筛选 / 点击跳详情）→ 任务 7 步骤 8

### 2. 占位符扫描

无 TODO/待定/模糊步骤。所有代码步骤均提供**完整可复制代码**或精确定位的修改点。

### 3. 类型一致性

- `ContentArticle` 类型、`ContentCategory`、`CONTENT_TAG_LABEL` 在所有任务中一致。
- `category === 'expert_article' | 'paper_reference'` 字面量与 label map 的 key 一致。
- Service 返回 `ApiResponse<T>` 与项目其他 service 一致。
