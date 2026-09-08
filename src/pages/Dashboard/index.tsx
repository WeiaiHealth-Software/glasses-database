import React from 'react';
import { Users, Activity, Search, Database, TrendingUp, MousePointerClick, Plus, Bookmark } from 'lucide-react';

const mockRankList = [
  { rank: 1, name: '星趣控 (Stellest)', brand: '依视路', count: '12,453' },
  { rank: 2, name: '新乐学 (MiYOSMART)', brand: '豪雅', count: '11,201' },
  { rank: 3, name: '小乐圆 (MyoCare)', brand: '蔡司', count: '9,845' },
  { rank: 4, name: '轻松控 Pro', brand: '明月', count: '7,632' },
  { rank: 5, name: '蝶适 (DISC)', brand: '奥拉', count: '5,120' },
];

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-full">
      <div className="grid grid-cols-4 gap-4">
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

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-brand-600" />
              近 30 天热门检索排行榜
            </h3>
            <span className="text-xs text-brand-600 cursor-pointer hover:underline">查看完整报告</span>
          </div>
          <div className="space-y-4">
            {mockRankList.map((item) => (
              <div
                key={item.rank}
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100"
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

        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-slate-800 mb-4 text-sm">用户身份分布</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">专业视光师 / 医生</span>
                  <span className="font-bold text-slate-800">35%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-brand-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">近视儿童家长 (大众)</span>
                  <span className="font-bold text-slate-800">65%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-slate-800 mb-4 text-sm">快捷操作</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-600 text-slate-600 transition-colors border border-slate-100">
                <Plus className="w-5 h-5" />
                <span className="text-xs font-medium">录入新镜片</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-600 text-slate-600 transition-colors border border-slate-100">
                <Bookmark className="w-5 h-5" />
                <span className="text-xs font-medium">新增品牌</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
