# 首页专家解说与论文参考模块设计规格

> 日期：2026-09-12  
> 范围：B 端后台管理（运营管理新增两页） + C 端小程序首页（插入「专业信息」Section + 内嵌详情页 + 最新入库列表）

---

## 1. 背景与目标

### 1.1 现状
小程序首页目前只有「搜索框 + 筛选 Chip + 三段切换 + 镜片卡片瀑布流」，缺少**内容引流层**。行业案例（懂车帝、好大夫等）通常会在列表上方放置 2~3 条人工精选的专业内容，既提升首页信息密度，也为镜片产品赋予临床可信度。

### 1.2 目标
- 在小程序首页搜索框下方、镜片列表上方，插入「专业信息」Section，包含 **专家解说** 与 **论文参考** 两类内容卡片
- 后台「运营管理」菜单下新增两个独立管理页，支持内容的增删改查、置顶/排序、启停展示
- 点击卡片进入**内嵌全屏详情页**（Markdown 轻量渲染，不引入新依赖）
- 详情页支持可选关联镜片，在底部展示"推荐相关镜片"

### 1.3 非目标（本期不做）
- 不引入富文本编辑器（仅 Markdown + 预览）
- 不做图片上传（封面图仅支持 URL 输入）
- 不做内容点赞/评论/收藏交互（如有后续再加）

---

## 2. 数据模型

### 2.1 类型定义（追加到 `src/types/system.ts`）

```typescript
// ===== 内容分类 =====
export type ContentCategory = 'expert_article' | 'paper_reference';

export const CONTENT_CATEGORY_LABEL: Record<ContentCategory, string> = {
  expert_article: '专家解说',
  paper_reference: '论文参考',
};

// ===== 内容标签（首页卡片底部 tag）=====
export type ContentTagType =
  | 'clinical_experience'   // 临床经验
  | 'fitting_reference'     // 验配参考
  | 'academic_literature'   // 学术文献
  | 'data_traceability';    // 数据溯源

export const CONTENT_TAG_LABEL: Record<ContentTagType, string> = {
  clinical_experience: '临床经验',
  fitting_reference: '验配参考',
  academic_literature: '学术文献',
  data_traceability: '数据溯源',
};

// 默认推荐映射（创建表单时可根据 category 默认勾选部分 tag）
export const CONTENT_TAG_DEFAULTS: Record<ContentCategory, ContentTagType[]> = {
  expert_article: ['clinical_experience', 'fitting_reference'],
  paper_reference: ['academic_literature', 'data_traceability'],
};

// ===== 核心内容实体 =====
export interface ContentArticle extends BaseEntity {
  category: ContentCategory;
  title: string;             // 标题，必填，≤60 字
  summary: string;           // 摘要，必填，≤100 字（首页卡片展示）
  content: string;           // 正文，Markdown 字符串，必填
  tags: ContentTagType[];    // 内容标签，至少 1 个
  coverImage?: string;       // 封面图 URL，可选
  source: string;            // 来源，必填，≤40 字（"某医院·张小明医生"/"中华眼科杂志 2024"）
  relatedLensIds?: string[]; // 关联镜片 ID，可选，最多 5 个
  sortWeight: number;        // 排序权重
  isPinned: boolean;         // 是否置顶（专家解说需要手动置顶机制）
  enabled: boolean;          // 是否启用展示
  viewCount: number;         // 浏览量（Demo 可模拟递增）
  createdAt: string;
  updatedAt: string;
}
```

### 2.2 排序规则

| 分类 | 排序规则 |
|---|---|
| `expert_article` 专家解说 | `isPinned` 真优先 → `sortWeight` 升序 → `createdAt` 倒序 |
| `paper_reference` 论文参考 | `createdAt` 倒序（录入时间） → `sortWeight` 升序 |

两类列表查询时均只返回 `enabled === true` 的记录用于 C 端展示；后台管理页返回全部（含暂停），以便管理。

---

## 3. 服务层设计

### 3.1 新增文件 `src/services/content.service.ts`

统一 `ContentService`，内部以 `category` 区分：

```typescript
export const ContentService = {
  // 列出某分类（C 端仅启用；后台全量，按排序规则返回）
  async list(
    category: ContentCategory,
    opts?: { includeDisabled?: boolean; keyword?: string }
  ): Promise<ApiResponse<ContentArticle[]>>;

  // 同一次请求取两类（C 端首页用）
  async listForHomepage(): Promise<
    ApiResponse<{ expert: ContentArticle[]; paper: ContentArticle[] }>
  >;

  // 获取单条（详情页）
  async get(id: string): Promise<ApiResponse<ContentArticle>>;

  // 新增
  async create(
    payload: Omit<ContentArticle, 'id' | 'createdAt' | 'updatedAt' | 'sortWeight' | 'viewCount'> & {
      sortWeight?: number;
    }
  ): Promise<ApiResponse<ContentArticle>>;

  // 编辑
  async update(id: string, payload: Partial<Omit<ContentArticle, 'id' | 'category' | 'createdAt'>>): Promise<ApiResponse<ContentArticle>>;

  // 删除
  async remove(id: string): Promise<ApiResponse<{ affected: number }>>;

  // 启停
  async toggleEnabled(id: string): Promise<ApiResponse<ContentArticle>>;

  // 置顶切换（仅 expert 有意义；paper 也允许但排序规则里优先级低）
  async togglePinned(id: string): Promise<ApiResponse<ContentArticle>>;

  // 移动顺序：置顶(1) / 上移 / 下移
  async move(id: string, dir: 'up' | 'down' | 'top'): Promise<ApiResponse<{ affected: number }>>;

  // 浏览量 +1（详情页打开时静默调用）
  async incView(id: string): Promise<ApiResponse<{ viewCount: number }>>;
};
```

### 3.2 Mock 数据 `src/mocks/content.mock.ts`

- 专家解说：3~4 条，覆盖不同镜片类型（多点离焦 / 环带微柱镜 / 周边离焦 / 离焦软镜），1 条置顶
- 论文参考：3~4 条，覆盖不同期刊（中华眼科杂志 / 国际眼科杂志 / IOVS 等），1 条关联蔡司小乐圆

---

## 4. B 端后台管理

### 4.1 路由与菜单（4 处改动）

**`src/router/index.tsx`** 追加 2 条路由：
```
/operation/expert-articles  → ExpertArticleListPage
/operation/paper-references → PaperReferenceListPage
```

**`src/components/business/Sidebar.tsx`** 运营管理分组下追加子菜单：
```
- 首页推荐位        （不变）
- 专家解说管理       新，icon=MessageSquareText
- 论文参考管理       新，icon=BookOpen
```

**`src/types/system.ts`** 的 `MENU_PERMISSIONS` 和 `OPERATION_MODULES` 追加对应条目。

### 4.2 页面组件

新增两个页面文件：
- `src/pages/Operation/ExpertArticleList.tsx`
- `src/pages/Operation/PaperReferenceList.tsx`

两个页面共享同一套 UI 模式（代码结构几乎一致，差别主要是文案、默认值和部分操作），但**不做抽象复用组件**（避免过度设计），直接复制修改。

#### 4.2.1 页面骨架（对齐 `RecommendList.tsx` 风格）

```
SpecCard 操作规范
  · 专家解说建议 3~6 条，置顶 + sortWeight 配合排序；
  · 论文参考建议 4~8 条，按录入时间倒序；
  · 暂停展示仅 C 端隐藏，不删除记录。

ToolbarCard
  左：当前板块徽标 + 已启用/暂停数统计
  右：刷新 + [+ 新增内容]

搜索栏
  [关键词搜索（标题/来源）] [搜索]   状态：[全部 ▼]

Table（紧凑 size="sm"）
  列：# ｜ 标题+摘要 ｜ 标签 ｜ 来源 ｜ 置顶 ｜ 状态 ｜ 更新时间 ｜ 操作
  操作列：置顶｜上移｜下移｜启/停｜编辑｜删除
  —— 论文参考可隐藏"置顶"按钮（因为排序规则以录入时间为主）

Pagination
```

#### 4.2.2 新增/编辑 Modal 表单

打开方式：点击「+ 新增内容」或列表行「编辑」按钮。

字段：

| 字段 | 控件 | 必填 | 限制 |
|---|---|---|---|
| 分类 | 只读 Tag（根据页面固定显示） | ✅ | 不可改 |
| 标题 | `<Input>` | ✅ | ≤60 字，计数提示 |
| 摘要 | `<Textarea rows={2}>` | ✅ | ≤100 字，计数提示 |
| 正文 | `<Textarea rows={10}>` + 右侧预览面板 | ✅ | 两栏布局，左编辑右预览 |
| 标签 | Checkbox 组（每行 4 个） | ✅（至少 1 个） | 来自 `CONTENT_TAG_LABEL` |
| 封面图 URL | `<Input>` | ❌ | 空字符串则不展示 |
| 来源 | `<Input>` | ✅ | ≤40 字 |
| 关联镜片 | 模态选择器（复用 `RecommendList.tsx` 中的镜片选择 Table，多选、最多 5 个） | ❌ | 显示已选数量，支持清空 |
| 置顶 | `<Switch>` | ❌ | 默认 false（专家解说默认可 true） |
| 启用 | `<Switch>` | ❌ | 默认 true |

#### 4.2.3 操作规范与交互

- **置顶切换**：`togglePinned`，如果从 false→true，则同分类内 `sortWeight` 改为最小（-1000）或当前最小值-1
- **上移/下移**：调整同分类 `sortWeight`，同 `RecommendService.move` 逻辑
- **启停**：`toggleEnabled`
- **删除**：`ConfirmModal` 二次确认，红色危险操作

---

## 5. C 端小程序首页

### 5.1 插入位置

`MiniProgram/index.tsx` 的 `renderHomePage()`：

```diff
 [顶部搜索框]
 [筛选 Chip 行]
 [推荐/热门/最新 三段切换]
+
+─────── 「专业信息」 Section ────────
+[专业信息 · 共 N 篇]  [最新入库 ▶]
+   专家解说卡片 × 2（置顶前 2 条 + 最新 1 条，如不足则降级）
+   论文参考卡片 × 2（按录入时间倒序前 2 条）
+────────────────────────────────────

 [p-4 的镜片卡片列表]
```

具体位置：在 `p-4 space-y-3`（镜片卡片列表外层 div）的**顶部**插入。

### 5.2 专业信息 Section 详情

```
标题栏：
  左：加粗"专业信息" + 徽标"共 N 篇"
  右：青色文字"最新入库 ▶" → 点击打开 content-list 内嵌视图
```

卡片样式：

```
┌──────────────────────────────────────────────────────────┐
│ [图标] 专家解说            右上角角标（青色斜切）           │
│   近视防控镜片验配要点                                     │
│   简洁专业的开头摘要（约 2 行，截断）…                     │
│   [临床经验] [验配参考]      某医院·张小明医生              │
└──────────────────────────────────────────────────────────┘
```

- 两卡片间距 `gap-2`，整体背景为白色，`rounded-2xl shadow-sm`
- 专家解说主色：青色 `#0D9488` 系（teal）
- 论文参考主色：靛蓝 `#4F46E5` 系（indigo）

### 5.3 内嵌全屏详情页

**状态机改造**：原 `detailLensId: string | null` 升级为联合：

```typescript
type DetailView =
  | { type: 'none' }
  | { type: 'lens'; lensId: string }
  | { type: 'content'; articleId: string };
```

详情页结构（类似镜片详情，顶栏带返回 + 分享）：

```
[品牌色顶栏]  [← 返回]    {专家解说/论文参考}    [分享]

[封面图，如有则满宽 aspect-video，否则大标题区]
  大标题（font-bold text-lg）
  [标签 Chip 行]
  来源 · 更新时间 · 👁 浏览量

[正文区]
  极简 Markdown 渲染：
    #  → text-xl font-bold mt-4 mb-2
    ## → text-lg  font-bold mt-3 mb-2
    **text** → font-semibold text-brand-700
    - 列表  → list-disc pl-5 my-2
    > 引用  → border-l-4 border-brand-300 bg-brand-50 pl-3 italic my-3
    段落空行 → my-2

[如果 relatedLensIds 非空]
  "相关镜片推荐" 标题
  横滑卡片行（3~4 张，复用 renderLensCard 紧凑版）
  右侧 "查看全部镜片 →"
```

#### 5.3.1 极简 Markdown 渲染器（`src/utils/markdown-renderer.tsx`）

**不引入任何依赖**，手动处理以下子集：

```
# H1 标题
## H2 标题
### H3 标题
**粗体文字**
- 列表项1
- 列表项2
> 引用块
换行空行 → <p> 分段
```

实现方式：
- 按 `\n\n` 分段
- 每段扫描前缀识别
- 行内 `**bold**` 用正则替换

### 5.4 最新入库列表页（点击"最新入库 ▶"打开）

另一个内嵌全屏视图 `contentList`：

```
[顶栏]  [← 返回]  专业信息 · 全部内容

[Tabs]  [专家解说 · 4]  [论文参考 · 3]

[搜索框：标题/来源]
[标签筛选 Chip：全部 / 临床经验 / 验配参考 / 学术文献 / 数据溯源]

[卡片瀑布流，完整摘要 + 略缩信息，点击进入详情页]
```

---

## 6. 改动清单（文件级）

### 新增文件（共 6 个）
| 路径 | 说明 |
|---|---|
| `src/types/content.ts` | 内容类型定义（或追加到 system.ts） |
| `src/services/content.service.ts` | 统一内容 Service |
| `src/mocks/content.mock.ts` | Mock 数据 |
| `src/pages/Operation/ExpertArticleList.tsx` | 后台：专家解说管理 |
| `src/pages/Operation/PaperReferenceList.tsx` | 后台：论文参考管理 |
| `src/utils/markdown-renderer.tsx` | 极简 Markdown 渲染组件 |

### 修改文件（共 5 个）
| 路径 | 改动点 |
|---|---|
| `src/types/system.ts` | 追加权限项、模块枚举、（或迁移到 content.ts） |
| `src/router/index.tsx` | 新增 2 条路由 + lazy import |
| `src/components/business/Sidebar.tsx` | 运营管理子菜单追加 2 项 |
| `src/pages/MiniProgram/index.tsx` | 首页插入「专业信息」Section + 详情页 + 最新入库列表 |
| `src/mocks/index.ts` | 若有 mock 导出 barrel，追加 content.mock |

---

## 7. 验收标准

### B 端
1. 侧边栏「运营管理」下可见「专家解说管理」「论文参考管理」两个子菜单，路由跳转正确
2. 两个列表页均支持增（带表单校验）、删（二次确认）、改、启停、排序
3. 表单中标题/摘要超出字数有实时计数并阻止提交
4. 关联镜片选择器支持多选最多 5 个，已选镜片可移除
5. 内容新增后，C 端首页"专业信息"Section 中可见（如果 enabled=true）

### C 端（小程序预览页）
1. 首页搜索框下方、镜片列表上方出现「专业信息」Section，标题+数量徽标+最新入库入口
2. 专家解说卡片至少 1 张显示「置顶」角标（如果有 isPinned 记录）
3. 论文参考卡片按录入时间倒序
4. 点击卡片进入全屏详情页，返回按钮可回到首页
5. 详情页 Markdown 至少能正确渲染：标题、分段、粗体、列表、引用
6. 如有 `relatedLensIds`，详情页底部出现"相关镜片推荐"卡片
7. 点击"最新入库 ▶"打开内容瀑布流列表页，Tabs 切换正确，搜索/标签筛选生效

---

## 8. 风险与后续

- **正文字段长度**：Mock 与 Service 均未限制长度，文本域以 `<Textarea>` 接受，后续接入真后端再限制（2~5KB 合理）
- **Markdown 渲染子集**：当前子集能覆盖 90% 临床解说/学术摘要场景；后续如需表格/公式/图片，升级引入 `marked`
- **浏览量计数**：Demo 阶段 Service 端用内存变量递增，刷新丢失
