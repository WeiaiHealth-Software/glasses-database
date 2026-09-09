import React from 'react';
import { Users, Activity, Search, Database, TrendingUp, MousePointerClick, Plus, Bookmark, Tag, Sparkles } from 'lucide-react';

const mockRankList = [
  { rank: 1, name: '星趣控 (Stellest)', brand: '依视路', count: '12,453' },
  { rank: 2, name: '新乐学 (MiYOSMART)', brand: '豪雅', count: '11,201' },
  { rank: 3, name: '小乐圆 (MyoCare)', brand: '蔡司', count: '9,845' },
  { rank: 4, name: '轻松控 Pro', brand: '明月', count: '7,632' },
  { rank: 5, name: '蝶适 (DISC)', brand: '奥拉', count: '5,120' },
  { rank: 6, name: '贝视得 (Bestivue)', brand: '万新', count: '4,382' },
  { rank: 7, name: '菁控 (YouthPro)', brand: '依视路', count: '3,915' },
  { rank: 8, name: '控离焦 (Control+)', brand: '康耐特', count: '3,104' },
  { rank: 9, name: '多点离焦 MX', brand: '鸿晨', count: '2,768' },
  { rank: 10, name: '环焦 Pro', brand: '凯米', count: '2,150' },
];

const userDistribution = [
  { label: '专业视光师 / 医生', value: 35, color: '#3b82f6' },
  { label: '近视儿童家长 (大众)', value: 65, color: '#10b981' },
];

const quickActions = [
  { key: 'lens', label: '录入新镜片', icon: Plus, color: 'brand' },
  { key: 'brand', label: '新增品牌', icon: Bookmark, color: 'emerald' },
  { key: 'tech', label: '新增技术标签', icon: Tag, color: 'violet' },
  { key: 'recommend', label: '推荐位配置', icon: Sparkles, color: 'orange' },
];

const colorMap: Record<string, string> = {
  brand: 'hover:bg-brand-50 hover:text-brand-600',
  emerald: 'hover:bg-emerald-50 hover:text-emerald-600',
  violet: 'hover:bg-violet-50 hover:text-violet-600',
  orange: 'hover:bg-orange-50 hover:text-orange-600',
};

const DonutChart: React.FC<{ data: typeof userDistribution; size?: number; stroke?: number }> = ({
  data,
  size = 180,
  stroke = 22,
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={stroke}
          />
          {data.map((seg, i) => {
            const dashLen = (seg.value / 100) * circumference;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${dashLen} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dashLen;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-400">总用户</span>
          <span className="text-2xl font-bold text-slate-800 leading-none mt-1">24,592</span>
        </div>
      </div>
      <div className="flex flex-col gap-4 flex-1">
        {data.map((seg, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-slate-600 flex-1">{seg.label}</span>
              <span className="text-sm font-bold text-slate-800">{seg.value}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  return (
    <div className="p-6 bg-slate-50/50 h-full flex flex-col gap-5 overflow-hidden">
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">累计授权用户</span>
            <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">24,592</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span className="text-emerald-500 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +12%
            </span>
            较上月
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">小程序日活 (DAU)</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">3,105</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span className="text-emerald-500 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +5.2%
            </span>
            较昨日
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">累计检索次数</span>
            <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center text-violet-600">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">189,430</div>
          <div className="text-xs text-slate-400">本周新增 12,400 次</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">收录镜片总数</span>
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">
            156 <span className="text-sm font-normal text-slate-500">款</span>
          </div>
          <div className="text-xs text-slate-400">覆盖 24 个主流品牌</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 flex-1 min-h-0">
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-brand-600" />
              近 30 天热门检索排行榜
            </h3>
            <span className="text-xs text-brand-600 cursor-pointer hover:underline">查看完整报告</span>
          </div>
          <div className="space-y-2 flex-1 overflow-auto pr-1 min-h-0">
            {mockRankList.map((item) => (
              <div
                key={item.rank}
                className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      item.rank <= 3
                        ? 'bg-brand-100 text-brand-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.rank}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.brand}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-600">{item.count} 次</div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-5 min-h-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 shrink-0">
            <h3 className="font-bold text-slate-800 mb-4 text-sm">快捷操作</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((act) => {
                const Icon = act.icon;
                const hoverCls = colorMap[act.color] ?? colorMap.brand;
                return (
                  <button
                    key={act.key}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 text-slate-600 transition-colors border border-slate-100 ${hoverCls}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium text-center leading-tight">{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex-1 flex flex-col min-h-0">
            <h3 className="font-bold text-slate-800 mb-4 text-sm shrink-0">用户身份分布</h3>
            <div className="flex-1 flex items-center justify-center min-h-0">
              <DonutChart data={userDistribution} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
