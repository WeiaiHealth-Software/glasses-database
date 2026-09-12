# C 端小程序对比模块重构 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 重写 MiniProgram Preview 的对比 Tab，对齐懂车帝汽车软件对比流程：详情页首次加入自动跳对比页、品牌二级选择器、4槽位+同级推荐、双 sticky 参数对比表（2列不滚/≥3列横滚）、综合对比概要、landscape 横屏全屏模式。

**架构：** 全部改动集中在 `src/pages/MiniProgram/index.tsx` 一个文件，重写 `renderComparePage()` 并新增 4 个渲染子函数 + 9 个状态字段。`compare.service.ts` 的 `buildDoctorSections` + `compareBestInGroup` 直接复用，不做任何修改。B 端 Compare 页 / AdminLayout / 侧边栏等完全不动。

**技术栈：** React 19 + TypeScript + Tailwind CSS v4（className 内联）+ 现有 UI 组件库的 `Tabs/TabItem/Tag/Chip/Tooltip` 等。

---

## 文件结构

| 文件 | 职责 | 改动方式 |
|---|---|---|
| `src/pages/MiniProgram/index.tsx` | C 端小程序预览唯一入口 | ✅ 主要修改：新增状态、重写 `renderComparePage()`，新增 `renderCompareResultView`、`renderCompareTable`、`renderSummaryCompare`、`renderBrandPickerModal`、`renderLandscapeCompare` |
| `src/services/compare.service.ts` | 对比指标/分组/最优计算 | 🔒 仅读取：调用 `buildDoctorSections(selectedRows)` 获取 sections 结构 |
| `src/mocks/lens.mock.ts` | 镜片 mock 数据 | 🔒 仅读取：按 `baseInfo.brandId` 做 groupBy 生成品牌列表 |
| `src/components/ui/*` | UI 原子组件（Tabs/Tag/Chip/Modal 等） | 🔒 仅读取：已有的 Tabs/TabItem/Tag 直接 import 使用 |
| `.gitignore` | 忽略 .superpowers/ | ✅ 已在规格阶段加好 |

## 小步骤任务拆解

### 任务 1：状态 & setter 基础搭建

**文件：** `src/pages/MiniProgram/index.tsx`（找到原 `const [bottomTab, ...]` 的 useState 组附近插入）

- [ ] **步骤 1：在组件里新增 9 个 useState**

```tsx
// 对比视图子模式：选镜 / 结果对比
const [compareView, setCompareView] = useState<'select' | 'result'>('select');
// 结果对比 Tabs：综合对比(summary) / 参数对比(doctorParams)，默认参数对比
const [compareTab, setCompareTab] = useState<'summary' | 'doctorParams'>('doctorParams');
// 横屏 landscape 全屏模式
const [compareLandscapeMode, setCompareLandscapeMode] = useState(false);
// 品牌选择器弹层
const [brandPickerOpen, setBrandPickerOpen] = useState(false);
const [brandPickerStep, setBrandPickerStep] = useState<'list' | 'detail'>('list');
const [brandPickerBrandId, setBrandPickerBrandId] = useState<string | null>(null);
const [pickedInPicker, setPickedInPicker] = useState<string[]>([]);
// 编辑模式（单条删除 / 清空全部）
const [compareEditMode, setCompareEditMode] = useState(false);
// 对比表过滤开关
const [compareDiffOnly, setCompareDiffOnly] = useState(false);
const [compareBestOnly, setCompareBestOnly] = useState(false);
const [compareKeyword, setCompareKeyword] = useState('');
```

- [ ] **步骤 2：新增 helper：品牌→镜片列表 & 品牌 A→Z 分组（独立 const，组件内）**

```tsx
// 品牌 -> 镜片 分组
const lensByBrand = useMemo(() => {
  const map = new Map<string, LensItem[]>();
  (mockLensList || []).forEach(l => {
    const k = l.baseInfo?.brandId || 'unknown';
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(l);
  });
  return map;
}, []);

// 品牌 A-Z 索引用的拼音首字母映射（硬编码覆盖主流品牌，不在列表里的默认 #）
const brandPinYinPrefix: Record<string, string> = {
  'zeiss': 'Z', 'essilor': 'Y', 'hoya': 'H', 'nikon': 'N', 'rodenstock': 'R',
  'seiko': 'J', 'essilor-sunseeker': 'X', 'mingyue': 'M', 'wanxin': 'W',
  'conant': 'K', 'other': '#',
};

const getBrandPrefix = (brandId: string) => brandPinYinPrefix[brandId] || '#';
```

- [ ] **步骤 3：编译检查**
运行：`npm run build` 或 `npx tsc --noEmit -p tsconfig.app.json 2>&1 | head -40`
预期：新增的 state 没有类型/引用错误（还没用到的变量会是 unused warning，这没关系，后续任务会用）

---

### 任务 2：重写 renderComparePage - 选镜视图（槽位 + 同级推荐 + 底部按钮）

**文件：** `src/pages/MiniProgram/index.tsx`（找到原 `renderComparePage()` 方法整体替换）

- [ ] **步骤 1：替换 renderComparePage 的 switch，先处理选镜视图**

原 renderComparePage 返回结构要整体替换。新的结构：

```tsx
const renderComparePage = () => {
  // 如果当前是结果对比视图 -> 交给 renderCompareResultView()
  if (compareView === 'result') {
    return renderCompareResultView();
  }
  // compareView === 'select' 选镜视图
  const selectedLenses = compareIds
    .map(id => mockLensList.find(l => l.id === id))
    .filter(Boolean) as LensItem[];
  const slots = [0, 1, 2, 3].map(i => selectedLenses[i] || null);
  const canCompare = selectedLenses.length >= 2;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[15px] text-gray-900">镜片横向对比</span>
          <span className="text-[11px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
            已选 {selectedLenses.length}/4
          </span>
        </div>
        <button
          className="text-[12.5px] text-brand-600 font-semibold"
          onClick={() => setCompareEditMode(v => !v)}
        >
          {compareEditMode ? '完成' : '编辑'}
        </button>
      </div>

      {/* 主体滚动区 */}
      <div className="flex-1 overflow-y-auto">
        {/* 顶部操作栏 */}
        <div className="px-3 pt-3 pb-2 flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setPickedInPicker([]);
              setBrandPickerStep('list');
              setBrandPickerBrandId(null);
              setBrandPickerOpen(true);
            }}
            className="shrink-0 px-3 py-2 bg-brand-600 text-white rounded-lg text-[12.5px] font-semibold flex items-center gap-1"
          >
            <span className="text-[15px] leading-none">+</span>
            添加镜片
          </button>
          <div className="flex-1 relative">
            <input
              className="w-full h-8 pl-7 pr-3 bg-gray-50 rounded-lg text-[12px] text-gray-700 outline-none border border-transparent focus:border-brand-300"
              placeholder="搜索镜片 / 品牌 / 系列"
              value={compareKeyword}
              onChange={e => setCompareKeyword(e.target.value)}
            />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]">🔍</span>
          </div>
        </div>

        {/* 4 格槽位 */}
        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
          {slots.map((lens, i) => (
            <div
              key={`slot-${i}`}
              className={
                lens
                  ? 'relative rounded-xl border border-gray-200 bg-white p-2.5 min-h-[96px]'
                  : 'rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-2.5 min-h-[96px] flex flex-col items-center justify-center text-center'
              }
            >
              {lens ? (
                <>
                  {compareEditMode && (
                    <button
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] leading-none flex items-center justify-center z-10 shadow"
                      onClick={() => setCompareIds(prev => prev.filter(id => id !== lens.id))}
                    >×</button>
                  )}
                  <div className="flex items-start gap-2">
                    <span
                      className="shrink-0 mt-0.5 w-2 h-2 rounded-full"
                      style={{ background: brandColor(lens.baseInfo?.brandId) }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10.5px] text-gray-500 leading-none mb-1">
                        {brandName(lens.baseInfo?.brandId)}
                      </div>
                      <div className="text-[12.5px] font-bold text-gray-900 leading-snug line-clamp-2 mb-1">
                        {lens.baseInfo?.modelName}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {lens.controlAbility?.rate && (
                          <span className="text-[9.5px] px-1 py-0.5 rounded bg-green-50 text-green-700 font-semibold">
                            控制率 {formatRate(lens.controlAbility.rate)}
                          </span>
                        )}
                        <Tag
                          tone={lens.supply?.type === '现货' ? 'green' : 'amber'}
                          size="xs"
                        >
                          {lens.supply?.type || '现货'}
                        </Tag>
                      </div>
                      <div className="text-[12px] font-bold text-emerald-600">
                        ¥ {lens.commercial?.retailPriceRange || '—'}
                      </div>
                    </div>
                  </div>
                  {!compareEditMode && (
                    <button
                      className="absolute bottom-1.5 right-2 text-[10.5px] text-gray-400 hover:text-brand-600"
                      onClick={() => {
                        setCompareIds(prev => prev.filter(id => id !== lens.id));
                        setPickedInPicker([]);
                        setBrandPickerStep('list');
                        setBrandPickerBrandId(null);
                        setBrandPickerOpen(true);
                      }}
                    >
                      更换 ⇅
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="text-[20px] text-gray-300 leading-none mb-1">+</div>
                  <div className="text-[11px] text-gray-400">添加镜片进行对比</div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* 编辑模式清空按钮 */}
        {compareEditMode && selectedLenses.length > 0 && (
          <div className="mx-3 mb-3">
            <button
              onClick={() => {
                if (confirm(`确认清空全部 ${selectedLenses.length} 款对比镜片？`)) {
                  setCompareIds([]);
                  setCompareEditMode(false);
                }
              }}
              className="w-full py-2 rounded-lg bg-red-50 text-red-600 text-[12.5px] font-semibold"
            >
              清空全部 {selectedLenses.length} 款
            </button>
          </div>
        )}

        {/* 同级推荐：按品牌分组 */}
        <div className="px-3 pb-28">
          {Array.from(lensByBrand.entries()).map(([brandId, list]) => {
            const filtered = list.filter(l => {
              if (!compareKeyword) return true;
              const kw = compareKeyword.toLowerCase();
              return (
                (l.baseInfo?.seriesName || '').toLowerCase().includes(kw) ||
                (l.baseInfo?.modelName || '').toLowerCase().includes(kw) ||
                (brandName(brandId) || '').toLowerCase().includes(kw)
              );
            });
            if (filtered.length === 0) return null;
            const disabled = selectedLenses.length >= 4;
            return (
              <div key={brandId} className="mb-3">
                <div className="px-1 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-50/70 -mx-3 pl-4 mb-1 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: brandColor(brandId) }}
                  />
                  {brandName(brandId)} 系列
                </div>
                {filtered.map(lens => {
                  const checked = compareIds.includes(lens.id);
                  const rowDisabled = disabled && !checked;
                  return (
                    <label
                      key={lens.id}
                      className={
                        'flex items-center gap-2.5 px-1.5 py-2 rounded-lg cursor-pointer ' +
                        (rowDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-50/50')
                      }
                    >
                      <input
                        type="checkbox"
                        className="shrink-0 w-4 h-4 accent-brand-600"
                        checked={checked}
                        disabled={rowDisabled}
                        onChange={() => toggleCompare(lens.id)}
                      />
                      <span
                        className="shrink-0 w-2 h-2 rounded-full"
                        style={{ background: brandColor(lens.baseInfo?.brandId) }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-semibold text-gray-900 truncate">
                          {lens.baseInfo?.modelName}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {lens.controlAbility?.rate && (
                            <span className="text-[9.5px] px-1 py-0.5 rounded bg-green-50 text-green-700 font-semibold">
                              {formatRate(lens.controlAbility.rate)}
                            </span>
                          )}
                          <Tag tone={lens.supply?.type === '现货' ? 'green' : 'amber'} size="xs">
                            {lens.supply?.type || '现货'}
                          </Tag>
                        </div>
                      </div>
                      <div className="shrink-0 text-[12px] font-bold text-emerald-600">
                        ¥ {lens.commercial?.retailPriceRange || '—'}
                      </div>
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部固定按钮（TabBar 之上） */}
      <div className="shrink-0 px-3 py-2.5 border-t border-gray-100 bg-white/95 backdrop-blur">
        <button
          disabled={!canCompare}
          onClick={() => canCompare && setCompareView('result')}
          className={
            'w-full py-2.5 rounded-xl font-semibold text-[13px] ' +
            (canCompare
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed')
          }
        >
          {canCompare
            ? `开始对比这 ${selectedLenses.length} 款`
            : `请至少选择 2 款镜片（当前 ${selectedLenses.length} 款）`}
        </button>
      </div>
    </div>
  );
};
```

- [ ] **步骤 2：编译检查**（`npx tsc --noEmit -p tsconfig.app.json`）
预期：只存在 `renderCompareResultView 未定义` 的错误，因为还没写，这是预期的。选中镜片的 checkbox 切换逻辑依赖的 `toggleCompare` 原有方法已经存在，如果未定义后续任务 4 补上。

---

### 任务 3：品牌选择器弹层（Step1 品牌列表 A-Z / Step2 品牌下镜片）

**文件：** `src/pages/MiniProgram/index.tsx`

- [ ] **步骤 1：在组件 render 主树底部（小程序外壳外 / 或外壳内 overlay）加 Modal。优先加在小程序 Preview 容器内的一个绝对定位覆盖层（和 disclaimer 的 style 叠加写法一致）。**

在主返回 JSX 中，找 disclaimer 的 overlay 渲染位置附近新增：

```tsx
{brandPickerOpen && (
  <div className="absolute inset-0 z-40 flex items-end">
    <div
      className="absolute inset-0 bg-black/50"
      onClick={() => setBrandPickerOpen(false)}
    />
    <div className="relative w-full bg-white rounded-t-2xl overflow-hidden animate-[slideUp_.25s_ease-out]"
         style={{ maxHeight: '82%' }}>
      {brandPickerStep === 'list' ? renderBrandListPicker() : renderBrandLensPicker()}
    </div>
  </div>
)}
```

- [ ] **步骤 2：写 renderBrandListPicker() —— 品牌列表 + A-Z 索引条**

```tsx
const renderBrandListPicker = () => {
  // 品牌列表：每个品牌 + 镜片数量
  const brands = Array.from(lensByBrand.entries())
    .map(([brandId, lenses]) => ({
      brandId,
      brandName: brandName(brandId) || brandId,
      lensCount: lenses.length,
      prefix: getBrandPrefix(brandId),
    }))
    .sort((a, b) => a.prefix.localeCompare(b.prefix, 'zh'));

  const groups: Record<string, typeof brands> = {};
  brands.forEach(b => {
    if (!groups[b.prefix]) groups[b.prefix] = [];
    groups[b.prefix].push(b);
  });
  const prefixList = Object.keys(groups).sort();
  const existingCount = compareIds.length;
  const cap = 4;

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-3.5 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="text-[14px] font-bold text-gray-900">选择品牌</div>
        <button
          className="text-gray-500 text-[18px] leading-none"
          onClick={() => setBrandPickerOpen(false)}
        >×</button>
      </div>
      <div className="shrink-0 px-3 pb-2.5 pt-1.5 border-b border-gray-50">
        <input
          className="w-full h-8 pl-7 pr-3 bg-gray-50 rounded-lg text-[12px] outline-none"
          placeholder="搜索品牌"
        />
      </div>
      <div className="flex-1 overflow-y-auto relative pr-7">
        {prefixList.map(prefix => (
          <div key={prefix}>
            <div className="px-4 py-1.5 bg-gray-50 text-[11px] font-bold text-gray-500 sticky top-0">
              {prefix}
            </div>
            {groups[prefix].map(b => (
              <button
                key={b.brandId}
                className="w-full px-4 py-3 flex items-center gap-3 border-b border-gray-50 active:bg-brand-50/60"
                onClick={() => {
                  setBrandPickerBrandId(b.brandId);
                  setBrandPickerStep('detail');
                }}
              >
                <div
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                  style={{ background: brandColor(b.brandId) }}
                >
                  {b.brandName.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-[13px] font-semibold text-gray-900">{b.brandName}</div>
                  <div className="text-[10.5px] text-gray-500 mt-0.5">{b.lensCount} 款镜片</div>
                </div>
                <span className="text-gray-300 text-[14px]">›</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 text-[9.5px] text-brand-600 font-bold">
        {prefixList.map(p => (
          <span
            key={p}
            className="w-4 h-3.5 flex items-center justify-center rounded hover:bg-brand-50 cursor-pointer"
          >{p}</span>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **步骤 3：写 renderBrandLensPicker() —— 品牌下镜片 + 过滤 chips + 暂存勾选 + 确认加入**

```tsx
const renderBrandLensPicker = () => {
  const brandId = brandPickerBrandId!;
  const list = lensByBrand.get(brandId) || [];
  const existing = compareIds.length;
  const cap = 4;

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-3.5 py-3 border-b border-gray-100 flex items-center justify-between">
        <button
          className="text-[12.5px] text-gray-600"
          onClick={() => {
            setBrandPickerStep('list');
            setBrandPickerBrandId(null);
          }}
        >← 返回品牌</button>
        <div className="text-[14px] font-bold text-gray-900">{brandName(brandId)}</div>
        <button
          className="text-gray-500 text-[18px] leading-none"
          onClick={() => setBrandPickerOpen(false)}
        >×</button>
      </div>
      <div className="shrink-0 px-3 pb-2 pt-2 border-b border-gray-50 space-y-1.5">
        <input
          className="w-full h-8 pl-7 pr-3 bg-gray-50 rounded-lg text-[12px] outline-none"
          placeholder={`搜索${brandName(brandId)}系列/型号`}
        />
        <div className="flex gap-1.5 overflow-x-auto">
          {['全部类型','多点离焦','环带微柱镜','周边离焦','现货','定制'].map(c => (
            <span key={c} className="shrink-0 text-[10.5px] px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {list.map(lens => {
          const alreadyInCompare = compareIds.includes(lens.id);
          const inPicked = pickedInPicker.includes(lens.id);
          const checked = alreadyInCompare || inPicked;
          const disabled = !checked && (existing + pickedInPicker.length >= cap);
          return (
            <label
              key={lens.id}
              className={
                'flex items-center gap-2.5 px-3.5 py-2.5 border-b border-gray-50 cursor-pointer ' +
                (disabled ? 'opacity-50 cursor-not-allowed' : 'active:bg-brand-50/60') +
                (alreadyInCompare ? ' bg-brand-50/40' : '')
              }
            >
              <input
                type="checkbox"
                className="shrink-0 w-4 h-4 accent-brand-600"
                checked={checked}
                disabled={alreadyInCompare || disabled}
                onChange={e => {
                  if (alreadyInCompare) return;
                  if (e.target.checked) {
                    setPickedInPicker(prev => [...prev, lens.id]);
                  } else {
                    setPickedInPicker(prev => prev.filter(x => x !== lens.id));
                  }
                }}
              />
              <span
                className="shrink-0 w-2 h-2 rounded-full"
                style={{ background: brandColor(brandId) }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-gray-900 truncate">
                  {lens.baseInfo?.modelName}
                </div>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {lens.controlAbility?.rate && (
                    <span className="text-[9.5px] px-1 py-0.5 rounded bg-green-50 text-green-700 font-semibold">
                      {formatRate(lens.controlAbility.rate)}
                    </span>
                  )}
                  <Tag tone={lens.supply?.type === '现货' ? 'green' : 'amber'} size="xs">
                    {lens.supply?.type || '现货'}
                  </Tag>
                  {alreadyInCompare && (
                    <Tag tone="brand" size="xs">已在清单</Tag>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-[12px] font-bold text-emerald-600">
                ¥ {lens.commercial?.retailPriceRange || '—'}
              </div>
            </label>
          );
        })}
      </div>
      <div className="shrink-0 px-3 py-2.5 border-t border-gray-100 bg-white">
        <button
          disabled={pickedInPicker.length === 0}
          onClick={() => {
            // 合并并去重
            const merged = Array.from(new Set([...compareIds, ...pickedInPicker]));
            const truncated = merged.slice(0, 4);
            if (merged.length > 4) {
              // toast
              setToast({ type: 'warn', text: `对比数量已满，仅保留前 4 款` });
            } else {
              setToast({ type: 'success', text: `已加入 ${pickedInPicker.length} 款镜片到对比` });
            }
            setCompareIds(truncated);
            setPickedInPicker([]);
            setBrandPickerOpen(false);
            setBrandPickerStep('list');
            setBrandPickerBrandId(null);
          }}
          className={
            'w-full py-2.5 rounded-xl font-semibold text-[13px] ' +
            (pickedInPicker.length > 0
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed')
          }
        >
          {pickedInPicker.length > 0
            ? `确认加入对比（已选 ${pickedInPicker.length} 款）`
            : `请勾选镜片（最多 ${4 - compareIds.length} 款）`}
        </button>
      </div>
    </div>
  );
};
```

- [ ] **步骤 4：编译检查**
预期：所有新增 import（Tag 组件如果之前未在 MiniProgram/index 里 import，要补上）。检查 `formatRate` / `brandColor` / `brandName` / `Tag` 未导入时要添加到文件顶部 import。

---

### 任务 4：toggleCompare 首次加入跳转逻辑 + 编辑模式验证

**文件：** `src/pages/MiniProgram/index.tsx`（找到原有 `toggleCompare` 函数，若没有则新增）

- [ ] **步骤 1：改造 / 新增 toggleCompare**

```tsx
const toggleCompare = (id: string) => {
  setCompareIds(prev => {
    const existed = prev.includes(id);
    const next = existed ? prev.filter(x => x !== id) : prev.concat(id).slice(0, 4);
    // 首次加入（从 0 -> 1）：自动切到对比 Tab
    if (prev.length === 0 && next.length === 1) {
      setBottomTab('compare');
      setCompareView('select');
    }
    // Toast
    setToast(existed
      ? { type: 'info', text: '已从对比中移除' }
      : next.length > prev.length
        ? { type: 'success', text: '已加入对比' }
        : { type: 'warn', text: '对比数量已满（最多 4 款）' });
    return next;
  });
};
```

- [ ] **步骤 2：确保详情页底部按钮正确调用 toggleCompare + 文案随状态切换**

在 `renderDetailPage()` 的底部按钮位置（现有的「加入对比」按钮处），把固定文案改成状态感知：

```tsx
const detailLens = mockLensList.find(l => l.id === detailLensId);
const inCompare = detailLens ? compareIds.includes(detailLens.id) : false;

// 替换原加入对比按钮的 className + 文案：
<button
  onClick={() => detailLens && toggleCompare(detailLens.id)}
  className={
    'w-full py-2.5 rounded-xl font-semibold text-[13px] ' +
    (inCompare
      ? 'bg-white border border-brand-500 text-brand-600'
      : 'bg-brand-600 text-white')
  }
>
  {inCompare ? `已加入对比（${compareIds.length}/4）` : '加入对比'}
</button>
```

- [ ] **步骤 3：编译检查**

---

### 任务 5：对比视图 renderCompareResultView + 双 sticky 参数对比表

**文件：** `src/pages/MiniProgram/index.tsx`

- [ ] **步骤 1：确认 buildDoctorSections 签名 & sections 结构已导入正确**

组件顶部 import 中确保有：
```tsx
import { buildDoctorSections, compareBestInGroup, formatRate } from '../../services/compare.service';
```

- [ ] **步骤 2：写 renderCompareResultView（包含综合对比 Tab 入口 + 参数对比主体）**

```tsx
const renderCompareResultView = () => {
  const selectedLenses = (compareIds
    .map(id => mockLensList.find(l => l.id === id))
    .filter(Boolean) as LensItem[]);

  // landscape 横屏模式：单独渲染
  if (compareLandscapeMode) {
    return renderLandscapeCompare(selectedLenses);
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* 对比视图顶栏 */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
        <button
          className="text-[12.5px] text-gray-600 flex items-center gap-1"
          onClick={() => setCompareView('select')}
        >← 返回选镜片</button>
        <div className="flex-1 flex items-center justify-center">
          <Tabs
            value={compareTab}
            onChange={v => setCompareTab(v as any)}
            items={[
              { value: 'summary', label: '综合对比' },
              { value: 'doctorParams', label: '参数对比' },
            ]}
            size="xs"
          />
        </div>
        <button
          className="text-[12.5px] text-brand-600 flex items-center gap-1"
          onClick={() => setCompareLandscapeMode(true)}
        >⛶ 横屏</button>
      </div>

      {compareTab === 'summary'
        ? renderSummaryCompare(selectedLenses)
        : renderCompareTable(selectedLenses)}
    </div>
  );
};
```

- [ ] **步骤 3：写 renderCompareTable（核心双 sticky 表格）**

```tsx
const renderCompareTable = (selectedLenses: LensItem[]) => {
  // 构造 LensRow 形式（和 B 端 useCompareRows 输出一致即可传入 buildDoctorSections）
  const rows: LensRow[] = selectedLenses.map(l => ({
    id: l.id,
    lensId: l.id,
    brandId: l.baseInfo?.brandId || '',
    brandName: brandName(l.baseInfo?.brandId) || '',
    seriesName: l.baseInfo?.seriesName || '',
    modelName: l.baseInfo?.modelName || '',
    technologyType: l.technical?.type || '',
    opticalStructure: l.technical?.opticalStructure || '',
    controlRate: l.controlAbility?.rate || null,
    suggestedAgeMin: l.targetUser?.suggestedAge?.min || null,
    suggestedAgeMax: l.targetUser?.suggestedAge?.max || null,
    material: l.technical?.material || '',
    retailPrice: l.commercial?.retailPriceRange || '',
    supplyType: l.supply?.type || '',
    productionCycle: l.supply?.productionCycle || '',
    marketLaunchTime: l.supply?.marketLaunchTime || '',
    clinicalTrialSize: l.clinicalEvidence?.trialSize || null,
    followUpMonths: l.clinicalEvidence?.followUpMonths || null,
    controlRateYear1: l.clinicalEvidence?.controlRate?.year1 || null,
    controlRateYear2: l.clinicalEvidence?.controlRate?.year2 || null,
    adverseReactionRate: l.clinicalEvidence?.adverseReactionRate || null,
    regulatory: l.regulation?.regulatory || '',
    medicalDeviceRegistration: l.regulation?.medicalDeviceRegistration || '',
    insuranceCoverage: l.commercial?.insuranceCoverage || '',
    warranty: l.commercial?.warranty || '',
    replacementCycle: l.supply?.replacementCycle || '',
    coating: l.technical?.coating || '',
    designPrinciple: l.controlAbility?.principle || '',
    microLensCount: l.technical?.microLensCount || null,
    addPowerDistribution: l.technical?.addPowerDistribution || '',
    defocusArea: l.technical?.defocusArea || '',
    pupilDesign: l.technical?.pupilDesign || '',
    clinicalStudyDesign: l.clinicalEvidence?.studyDesign || '',
    indications: l.regulation?.indications || '',
    contraindications: l.regulation?.contraindications || '',
    precautions: l.regulation?.precautions || '',
    professionalFittingRequirement: l.regulation?.professionalFittingRequirement || '',
    peerReviewed: l.clinicalEvidence?.peerReviewed || false,
    multiCenter: l.clinicalEvidence?.multiCenter || false,
    realWorldData: l.clinicalEvidence?.realWorldData || false,
    controlConfidence: l.controlAbility?.confidence || '',
    suitableDiopterRange: l.targetUser?.suitableDiopterRange || '',
    suitableAstigmatismRange: l.targetUser?.suitableAstigmatismRange || '',
    suitableMyopiaProgression: l.targetUser?.suitableMyopiaProgression || '',
  }));
  const sections = buildDoctorSections(rows);

  // 应用过滤
  const visibleSections = sections
    .map(sec => {
      const rows = sec.rows.filter(row => {
        if (compareDiffOnly && !row.hasDiff) return false;
        if (compareKeyword) {
          const kw = compareKeyword.toLowerCase();
          return (row.label || '').toLowerCase().includes(kw) ||
                 (row.hint || '').toLowerCase().includes(kw);
        }
        return true;
      });
      return { ...sec, rows };
    })
    .filter(s => s.rows.length > 0);

  const colCount = selectedLenses.length;
  const canScrollX = colCount >= 3;
  const colWidth = canScrollX ? '140px' : '50%';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 过滤条 */}
      <div className="shrink-0 px-3 py-2 border-b border-gray-100 flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            className="w-full h-7 pl-6 pr-3 bg-gray-50 rounded-lg text-[11.5px] outline-none"
            placeholder="搜索参数名称"
            value={compareKeyword}
            onChange={e => setCompareKeyword(e.target.value)}
          />
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]">🔍</span>
        </div>
        <Chip
          size="xs"
          tone={compareDiffOnly ? 'brand' : 'gray'}
          active={compareDiffOnly}
          onClick={() => setCompareDiffOnly(v => !v)}
        >仅看差异</Chip>
        <Chip
          size="xs"
          tone={compareBestOnly ? 'amber' : 'gray'}
          active={compareBestOnly}
          onClick={() => setCompareBestOnly(v => !v)}
        >仅高亮最优</Chip>
      </div>

      {/* 镜片 Header（纵向 sticky 顶部） */}
      <div
        className="shrink-0 border-b border-gray-200 bg-gray-50/80 flex overflow-hidden"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}
      >
        <div
          className="shrink-0 border-r border-gray-200 px-2 py-2 bg-gray-50/95 z-10"
          style={{
            width: '92px',
            position: 'sticky',
            left: 0,
          }}
        >
          <div className="text-[9.5px] text-gray-500 font-semibold mb-1">仅看差异 / 最优</div>
          <div className="flex gap-1">
            <span className="inline-block w-7 h-3.5 rounded-sm bg-gray-200" />
            <span className="inline-block w-5 h-3.5 rounded-sm bg-amber-100" />
          </div>
        </div>
        <div
          className={canScrollX ? 'overflow-x-auto flex' : 'flex w-full'}
        >
          {selectedLenses.map(l => (
            <div
              key={l.id}
              className="shrink-0 px-2 py-2 border-r border-gray-200 bg-white"
              style={{ minWidth: canScrollX ? colWidth : '50%', width: colWidth }}
            >
              <div className="flex items-start gap-1">
                <span
                  className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: brandColor(l.baseInfo?.brandId) }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[9.5px] text-gray-500 leading-none mb-0.5">
                    {brandName(l.baseInfo?.brandId)}
                  </div>
                  <div className="text-[11.5px] font-bold text-gray-900 leading-snug line-clamp-2 mb-0.5">
                    {l.baseInfo?.modelName}
                  </div>
                  <div className="text-[10.5px] text-emerald-600 font-bold">
                    ¥ {l.commercial?.retailPriceRange || '—'}
                  </div>
                  {l.controlAbility?.rate && (
                    <div className="mt-0.5 text-[9.5px] text-green-700 bg-green-50 px-1 py-0.5 rounded inline-block">
                      控制率 {formatRate(l.controlAbility.rate)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 对比表主体 */}
      <div className="flex-1 overflow-y-auto">
        <div className={`min-w-full ${canScrollX ? 'inline-flex' : 'flex'}`}>
          {/* 左列：参数名（横向 sticky） */}
          <div
            className="shrink-0 bg-gray-50/95 z-10"
            style={{ width: '92px', position: 'sticky', left: 0 }}
          >
            {visibleSections.map(sec => (
              <div key={sec.key}>
                <div className="px-2 py-1 bg-gray-200/80 text-[10px] font-bold text-gray-700 sticky top-0 z-20">
                  {sec.title} ▾
                </div>
                {sec.rows.map(row => (
                  <div
                    key={row.key}
                    className="px-2 py-1.5 border-b border-gray-100 text-[10.5px] font-semibold text-gray-700 leading-snug min-h-[36px] flex items-center"
                    title={row.hint}
                  >
                    {row.label}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* 右列：数据（≥3 列时横向滚动） */}
          <div
            className={canScrollX ? 'overflow-x-auto flex' : 'flex w-full'}
            style={{ minWidth: canScrollX ? undefined : 0 }}
          >
            {selectedLenses.map((lens, li) => (
              <div
                key={lens.id}
                className="shrink-0 bg-white"
                style={{ minWidth: canScrollX ? colWidth : '50%', width: colWidth }}
              >
                {visibleSections.map(sec => (
                  <div key={sec.key}>
                    <div className="px-2 py-1 bg-gray-100/80 text-[10px] sticky top-0" />
                    {sec.rows.map(row => {
                      const cell = row.values[li];
                      const isBest = row.bestIndices?.includes(li);
                      const shouldGray = compareBestOnly && !isBest;
                      const bg = isBest ? 'bg-amber-50' :
                                 row.hasDiff ? 'bg-white' : 'bg-white';
                      return (
                        <div
                          key={row.key}
                          className={
                            'px-2 py-1.5 border-b border-gray-100 text-[10.5px] leading-snug min-h-[36px] flex items-center justify-center text-center ' + bg +
                            (shouldGray ? ' text-gray-300' : isBest ? ' text-amber-700 font-bold' : ' text-gray-800 font-medium')
                          }
                        >
                          {shouldGray
                            ? '—'
                            : Array.isArray(cell) && typeof cell[0] === 'object'
                              ? (cell as any[]).map((c: any, i: number) => (
                                  <span key={i} className="mr-1">
                                    <Tag tone={c.tone as any} size="xs">{c.text}</Tag>
                                  </span>
                                ))
                              : cell as any}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **步骤 4：编译检查**
预期：Tag/Chip/Tabs 组件的 size 属性和现有实现匹配；若 `LensRow` 未 import，要从 `services/compare.service` 或 `types/lens.types.ts`（如有）加 import。

---

### 任务 6：横屏 landscape 全屏对比模式

**文件：** `src/pages/MiniProgram/index.tsx`

- [ ] **步骤 1：在 renderBottomTabBar 隐藏逻辑里加 compareLandscapeMode**

找到原隐藏 TabBar 的判断：

```tsx
// 原：detailLensId != null 时隐藏（详情页沉浸）
if (detailLensId != null) return null;
```
改为：
```tsx
if (detailLensId != null || compareLandscapeMode) return null;
```

- [ ] **步骤 2：写 renderLandscapeCompare（模拟 iPhone 横屏）**

```tsx
const renderLandscapeCompare = (selectedLenses: LensItem[]) => {
  // 复用 renderCompareTable 里构造 rows+sections 的逻辑（抽个 helper 避免重复）
  const rows: LensRow[] = selectedLenses.map(l => ({ /* 同任务5步骤3，相同字段 */ }));
  const sections = buildDoctorSections(rows);
  const visibleSections = sections
    .map(sec => ({ ...sec, rows: sec.rows.filter(row => {
      if (compareDiffOnly && !row.hasDiff) return false;
      if (compareKeyword) {
        const kw = compareKeyword.toLowerCase();
        return (row.label || '').toLowerCase().includes(kw) || (row.hint || '').toLowerCase().includes(kw);
      }
      return true;
    }) }))
    .filter(s => s.rows.length > 0);
  const colWidth = '150px';
  const labelColWidth = '100px';

  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-900/95 p-3">
      <div
        className="w-full h-full max-w-full max-h-full rounded-xl bg-white overflow-hidden shadow-2xl flex flex-col"
        style={{ transform: 'rotate(0)' }}
      >
        <div className="shrink-0 px-3 py-1.5 border-b border-gray-100 flex items-center justify-between bg-white">
          <button
            className="text-[11.5px] text-brand-600 font-semibold"
            onClick={() => setCompareLandscapeMode(false)}
          >↺ 返回竖屏</button>
          <Tabs
            value={compareTab}
            onChange={v => setCompareTab(v as any)}
            items={[
              { value: 'summary', label: '综合对比' },
              { value: 'doctorParams', label: '参数对比' },
            ]}
            size="xs"
          />
          <div className="flex items-center gap-1.5 text-[10.5px] text-gray-500">
            <Chip size="xs" tone={compareDiffOnly ? 'brand' : 'gray'} active={compareDiffOnly} onClick={()=>setCompareDiffOnly(v=>!v)}>仅看差异</Chip>
            <span>🔍 参数搜索</span>
          </div>
        </div>
        {/* Header */}
        <div className="shrink-0 border-b border-gray-200 bg-gray-50/80 flex overflow-hidden">
          <div
            className="shrink-0 border-r border-gray-200 px-2 py-1.5 bg-gray-50 z-10 text-[10px] text-gray-500 font-bold"
            style={{ width: labelColWidth, position: 'sticky', left: 0 }}
          >已选 {selectedLenses.length}/4</div>
          <div className="flex overflow-x-auto">
            {selectedLenses.map(l => (
              <div key={l.id} className="shrink-0 px-2 py-1.5 border-r border-gray-200 bg-white" style={{ width: colWidth, minWidth: colWidth }}>
                <div className="flex items-start gap-1">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ background: brandColor(l.baseInfo?.brandId) }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] text-gray-500">{brandName(l.baseInfo?.brandId)}</div>
                    <div className="text-[10.5px] font-bold text-gray-900 truncate">{l.baseInfo?.modelName}</div>
                    <div className="text-[10px] text-emerald-600 font-bold">¥ {l.commercial?.retailPriceRange || '—'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-w-max flex">
            <div className="shrink-0 bg-gray-50/95 z-10 border-r border-gray-200" style={{ width: labelColWidth, position: 'sticky', left: 0 }}>
              {visibleSections.map(sec => (
                <div key={sec.key}>
                  <div className="px-2 py-1 bg-gray-200/80 text-[10px] font-bold text-gray-700 sticky top-0">{sec.title} ▾</div>
                  {sec.rows.map(row => (
                    <div key={row.key} className="px-2 py-1 border-b border-gray-100 text-[10px] font-semibold text-gray-700 min-h-[28px] flex items-center">
                      {row.label}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex overflow-x-auto">
              {selectedLenses.map((l, li) => (
                <div key={l.id} className="shrink-0 bg-white border-r border-gray-200" style={{ width: colWidth, minWidth: colWidth }}>
                  {visibleSections.map(sec => (
                    <div key={sec.key}>
                      <div className="px-2 py-1 bg-gray-100/80 sticky top-0" />
                      {sec.rows.map(row => {
                        const cell = row.values[li];
                        const isBest = row.bestIndices?.includes(li);
                        const shouldGray = compareBestOnly && !isBest;
                        return (
                          <div key={row.key} className={
                            'px-2 py-1 border-b border-gray-100 text-[10px] min-h-[28px] flex items-center justify-center text-center ' +
                            (shouldGray ? 'text-gray-300' : isBest ? 'bg-amber-50 text-amber-700 font-bold' : 'text-gray-800')
                          }>
                            {shouldGray ? '—' : Array.isArray(cell) && typeof cell[0] === 'object'
                              ? (cell as any[]).map((c: any, i: number) => <Tag key={i} tone={c.tone as any} size="xs">{c.text}</Tag>)
                              : cell as any}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0 px-3 py-1 border-t border-gray-100 bg-gray-50 text-[9.5px] text-gray-500 flex items-center justify-between">
          <span>💡 横屏模式下对比数据更直观</span>
          <span>landscape · {selectedLenses.length} 款对比中</span>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **步骤 3：编译检查**

---

### 任务 7：综合对比概要 Tab 卡片

**文件：** `src/pages/MiniProgram/index.tsx`

- [ ] **步骤 1：写 renderSummaryCompare**

```tsx
const renderSummaryCompare = (selectedLenses: LensItem[]) => {
  const rows: LensRow[] = selectedLenses.map(l => ({ /* 同上，避免重复可抽 shared helper */ }));

  // 计算最优指标：1) 控制率最高 2) 价格最低 3) 年龄范围最广
  const bestByRate = [...selectedLenses].sort((a, b) =>
    Number(b.controlAbility?.rate || 0) - Number(a.controlAbility?.rate || 0))[0];
  const priceNum = (s: string) => Number((s || '').replace(/[^\d.]/g, '').match(/^[\d.]+/)?.[0] || 0);
  const bestByPrice = [...selectedLenses].sort((a, b) =>
    priceNum(a.commercial?.retailPriceRange || '') - priceNum(b.commercial?.retailPriceRange || ''))[0];
  const ageRange = (l: LensItem) => {
    const a = l.targetUser?.suggestedAge;
    if (!a) return 0;
    return Number(a.max || 0) - Number(a.min || 0);
  };
  const bestByAge = [...selectedLenses].sort((a, b) => ageRange(b) - ageRange(a))[0];

  const summaryCards = [
    { title: '近视控制率最高', lens: bestByRate, tone: 'emerald', val: bestByRate?.controlAbility?.rate ? formatRate(bestByRate.controlAbility.rate) : '—' },
    { title: '建议零售价最友好', lens: bestByPrice, tone: 'blue', val: `¥ ${bestByPrice?.commercial?.retailPriceRange || '—'}` },
    { title: '适配年龄范围最广', lens: bestByAge, tone: 'amber', val: bestByAge?.targetUser?.suggestedAge
        ? `${bestByAge.targetUser.suggestedAge.min || '?'}-${bestByAge.targetUser.suggestedAge.max || '?'}岁`
        : '—' },
  ];

  // 差异统计
  const sections = buildDoctorSections(rows);
  let totalRows = 0;
  let diffRows = 0;
  sections.forEach(s => s.rows.forEach(r => { totalRows++; if (r.hasDiff) diffRows++; }));
  const sameRows = totalRows - diffRows;

  const toneBg = { emerald: 'bg-emerald-50 text-emerald-700', blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700' } as const;
  const toneAccent = { emerald: 'bg-emerald-500', blue: 'bg-blue-500', amber: 'bg-amber-500' } as const;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-3 pt-3 space-y-2.5">
        {summaryCards.map(c => c.lens && (
          <div key={c.title} className="rounded-xl border border-gray-200 p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-4 rounded-full ${toneAccent[c.tone as keyof typeof toneAccent]}`} />
                <span className="text-[12px] font-bold text-gray-800">{c.title}</span>
              </div>
              <span className={`text-[10.5px] px-1.5 py-0.5 rounded font-semibold ${toneBg[c.tone as keyof typeof toneBg]}`}>
                🏆 最优
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span
                className="shrink-0 mt-1 w-2 h-2 rounded-full"
                style={{ background: brandColor(c.lens.baseInfo?.brandId) }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[10.5px] text-gray-500">{brandName(c.lens.baseInfo?.brandId)}</div>
                <div className="text-[13px] font-bold text-gray-900 leading-snug mb-1">
                  {c.lens.baseInfo?.modelName}
                </div>
                <div className={`text-[14px] font-extrabold ${toneBg[c.tone as keyof typeof toneBg]} inline-block px-2 py-0.5 rounded`}>
                  {c.val}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* 差异统计 */}
        <div className="rounded-xl border border-gray-200 p-3 bg-white">
          <div className="text-[12px] font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-4 rounded-full bg-brand-500" />
            差异统计
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mb-2">
            <div className="rounded-lg bg-gray-50 py-2">
              <div className="text-[15px] font-extrabold text-gray-900">{totalRows}</div>
              <div className="text-[10px] text-gray-500">对比参数</div>
            </div>
            <div className="rounded-lg bg-red-50 py-2">
              <div className="text-[15px] font-extrabold text-red-600">{diffRows}</div>
              <div className="text-[10px] text-red-500">存在差异</div>
            </div>
            <div className="rounded-lg bg-green-50 py-2">
              <div className="text-[15px] font-extrabold text-green-600">{sameRows}</div>
              <div className="text-[10px] text-green-500">完全一致</div>
            </div>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-red-400" style={{ width: `${totalRows ? (diffRows / totalRows) * 100 : 0}%` }} />
            <div className="h-full bg-green-400" style={{ width: `${totalRows ? (sameRows / totalRows) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-3 pt-3 pb-8 mt-2">
        <button
          onClick={() => setCompareTab('doctorParams')}
          className="w-full py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-[13px] shadow-sm shadow-brand-200"
        >
          查看完整参数对比表 →
        </button>
      </div>
    </div>
  );
};
```

- [ ] **步骤 2：编译检查**

---

### 任务 8：抽重复 helper + 编译 + 验收走查

**文件：** `src/pages/MiniProgram/index.tsx`

- [ ] **步骤 1：把 rows 构造逻辑抽成 getLensRows() 内部 helper，避免三处重复**

```tsx
const getLensRows = (selectedLenses: LensItem[]): LensRow[] => {
  return selectedLenses.map(l => ({ /* 同任务5步骤3的 LensRow 映射 */ }));
};
```
在 `renderCompareTable` / `renderLandscapeCompare` / `renderSummaryCompare` 三处统一用 `getLensRows(selectedLenses)`。

- [ ] **步骤 2：编译检查**
运行：`npx tsc --noEmit -p tsconfig.app.json 2>&1 | tail -30`
预期：0 个 error

- [ ] **步骤 3：启动 dev server 并走查验收标准 1–6**
运行：`npm run dev`（项目里已有 vite dev 脚本）
按规格第 8 节 6 条逐一验证：
1. 首页详情 → 首次加 → 跳选镜视图 → 勾选第二款 → 按钮变蓝 → 点开始对比 → 展开参数对比表 → 加第3款测试横滚
2. +添加镜片 → 品牌列表 → 点品牌进 Step2 → 勾 2 款 → 确认 → compareIds 更新
3. ⛶ 横屏 → TabBar 消失 + 横屏表 → ↺ 返回竖屏 恢复
4. 编辑 → X 单条删；清空全部 + 二次确认 → 底部按钮禁用
5. 综合对比 Tab：3 张最优卡 + 差异统计 + CTA 跳参数对比
6. B 端 Compare 页（侧边栏「运营管理→镜片横向对比工具」）打开，原功能未动
