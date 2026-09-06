import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Settings, 
  Smartphone,
  Search,
  Plus,
  Bell,
  ChevronDown,
  ChevronRight,
  Home,
  Scale,
  UserCircle,
  Filter,
  Glasses,
  Tags,
  Download,
  Users,
  Activity,
  MousePointerClick,
  TrendingUp,
  AlertCircle,
  Shield,
  UserCog,
  FileText,
  Bookmark
} from 'lucide-react';

// --- Mock Data ---
const lensTableData = [
  { id: 'L001', name: '小乐圆 (MyoCare)', brand: '蔡司', tech: '环带微柱镜', defocus: '+3.50D', stock: '现货', status: '已上架', updateTime: '2026-09-06 10:00' },
  { id: 'L002', name: '新乐学 (MiYOSMART)', brand: '豪雅', tech: '多点离焦', defocus: '+3.50D', stock: '现货', status: '已上架', updateTime: '2026-09-05 14:30' },
  { id: 'L003', name: '星趣控 (Stellest)', brand: '依视路', tech: '微透镜星环', defocus: '+3.50D', stock: '定制支持', status: '已上架', updateTime: '2026-09-04 09:15' },
  { id: 'L004', name: '轻松控 Pro', brand: '明月', tech: '多点离焦', defocus: '+3.00D', stock: '现货', status: '已下架', updateTime: '2026-09-03 16:45' },
  { id: 'L005', name: '蝶适 (DISC)', brand: '奥拉', tech: '同心环带离焦', defocus: '+4.00D', stock: '定制支持', status: '已上架', updateTime: '2026-09-01 11:20' },
];

const miniProgramLenses = [
  { id: 1, brand: '蔡司', name: '小乐圆', type: '环带微柱镜', defocus: '+3.50D', stock: '现货' },
  { id: 2, brand: '豪雅', name: '新乐学', type: '多点离焦', defocus: '+3.50D', stock: '现货' },
  { id: 3, brand: '依视路', name: '星趣控', type: '微透镜星环', defocus: '+3.50D', stock: '定制' },
  { id: 4, brand: '明月', name: '轻松控Pro', type: '多点离焦', defocus: '+3.00D', stock: '现货' },
];

export default function SystemPrototype() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [openMenus, setOpenMenus] = useState({ dict: true, sys: true });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const StatusTag = ({ status }) => {
    const styles = {
      '已上架': 'bg-emerald-50 text-emerald-600 border-emerald-200',
      '已下架': 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  // --- Views ---
  const renderDashboardView = () => (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-full">
      {/* 核心指标卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">累计授权用户</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">24,592</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span className="text-emerald-500 font-medium flex items-center"><TrendingUp className="w-3 h-3 mr-0.5"/> +12%</span> 较上月
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
            <span className="text-emerald-500 font-medium flex items-center"><TrendingUp className="w-3 h-3 mr-0.5"/> +5.2%</span> 较昨日
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">累计检索次数</span>
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
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
          <div className="text-2xl font-bold text-slate-800">156 <span className="text-sm font-normal text-slate-500">款</span></div>
          <div className="text-xs text-slate-400">覆盖 24 个主流品牌</div>
        </div>
      </div>

      {/* 图表与列表区域 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 热门检索排行榜 */}
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-blue-600" />
              近 30 天热门检索排行榜
            </h3>
            <span className="text-xs text-blue-600 cursor-pointer hover:underline">查看完整报告</span>
          </div>
          <div className="space-y-4">
            {[
              { rank: 1, name: '星趣控 (Stellest)', brand: '依视路', count: '12,453' },
              { rank: 2, name: '新乐学 (MiYOSMART)', brand: '豪雅', count: '11,201' },
              { rank: 3, name: '小乐圆 (MyoCare)', brand: '蔡司', count: '9,845' },
              { rank: 4, name: '轻松控 Pro', brand: '明月', count: '7,632' },
              { rank: 5, name: '蝶适 (DISC)', brand: '奥拉', count: '5,120' },
            ].map((item) => (
              <div key={item.rank} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${item.rank <= 3 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
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

        {/* 右侧：用户画像 & 快捷入口 */}
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
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '35%' }}></div>
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
              <button 
                onClick={() => setActiveMenu('lens-db')}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors border border-slate-100"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs font-medium">录入新镜片</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors border border-slate-100">
                <Bookmark className="w-5 h-5" />
                <span className="text-xs font-medium">新增品牌</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLensTableView = () => (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索镜片名称/品牌/技术类型" 
              className="w-full h-11 rounded-xl border border-slate-200 pl-9 pr-4 bg-slate-50 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select className="h-11 rounded-xl border border-slate-200 px-4 bg-slate-50 text-sm outline-none text-slate-600">
              <option>全部品牌</option>
              <option>蔡司</option>
              <option>豪雅</option>
              <option>依视路</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 text-sm font-bold flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出数据
          </button>
          <div className="h-8 w-px bg-slate-200 mx-1"></div>
          <button className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-sm">
            <Plus className="w-4 h-4" />
            录入新镜片
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">镜片名称</th>
                <th className="px-6 py-4 font-semibold">品牌</th>
                <th className="px-6 py-4 font-semibold">技术大类</th>
                <th className="px-6 py-4 font-semibold">离焦量</th>
                <th className="px-6 py-4 font-semibold">供货属性</th>
                <th className="px-6 py-4 font-semibold">状态</th>
                <th className="px-6 py-4 font-semibold">更新时间</th>
                <th className="px-6 py-4 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {lensTableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-normal min-w-xs">
                    <span className="font-bold text-slate-800 leading-snug">{row.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    <span className="px-2 py-1 bg-slate-100 rounded-md text-xs">{row.brand}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{row.tech}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{row.defocus}</td>
                  <td className="px-6 py-4 text-slate-600">{row.stock}</td>
                  <td className="px-6 py-4"><StatusTag status={row.status} /></td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{row.updateTime}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button className="cursor-pointer px-3 py-2 rounded-md bg-blue-50 hover:bg-blue-100 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPlaceholderView = (title, desc) => (
    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 bg-slate-50/50">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
        <Settings className="w-8 h-8 text-slate-300" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-slate-700 mb-1">{title}</h2>
        <p className="text-sm">{desc}</p>
      </div>
    </div>
  );

  const renderMiniProgramView = () => (
    <div className="p-6 flex justify-center items-center h-full bg-slate-100/50">
      <div className="bg-white rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden relative flex flex-col" style={{ width: '375px', height: '812px' }}>
        <div className="h-7 w-full flex justify-center absolute top-0 z-50">
          <div className="w-32 h-5 bg-slate-800 rounded-b-2xl"></div>
        </div>
        <div className="pt-12 pb-3 px-4 bg-blue-600 text-white flex items-center justify-center relative">
          <h1 className="font-bold text-lg">近视防控镜片查询</h1>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-50 pb-20">
          <div className="bg-white p-4 space-y-3 rounded-b-2xl shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="搜索品牌、镜片名称" className="w-full h-10 rounded-full border border-slate-200 pl-9 pr-4 bg-slate-50 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <span className="shrink-0 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold flex items-center gap-1">品牌 <ChevronDown className="w-3 h-3" /></span>
              <span className="shrink-0 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium flex items-center gap-1">技术类型 <ChevronDown className="w-3 h-3" /></span>
              <span className="shrink-0 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium flex items-center gap-1">更多筛选 <Filter className="w-3 h-3" /></span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="text-xs font-bold text-slate-500 flex justify-between items-center">
              <span>为您找到 156 款镜片</span>
              <span className="text-blue-600 flex items-center gap-1">医疗免责声明 <AlertCircle className="w-3 h-3" /></span>
            </div>
            {miniProgramLenses.map(lens => (
              <div key={lens.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">{lens.brand}</div>
                    <div className="font-bold text-slate-800 text-base">{lens.name}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100">{lens.type}</span>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold border border-emerald-100">{lens.stock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 w-full bg-white border-t border-slate-100 flex justify-around items-center pb-6 pt-3 px-4">
          <div className="flex flex-col items-center gap-1 text-blue-600"><Home className="w-6 h-6" /><span className="text-[10px] font-bold">首页</span></div>
          <div className="flex flex-col items-center gap-1 text-slate-400"><Scale className="w-6 h-6" /><span className="text-[10px] font-medium">对比 (0)</span></div>
          <div className="flex flex-col items-center gap-1 text-slate-400"><UserCircle className="w-6 h-6" /><span className="text-[10px] font-medium">我的</span></div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeMenu) {
      case 'dashboard': return renderDashboardView();
      case 'lens-db': return renderLensTableView();
      case 'dict-brand': return renderPlaceholderView('品牌管理', '此处用于维护镜片品牌字典数据，内容后续补齐。');
      case 'dict-tech': return renderPlaceholderView('技术标签', '此处用于维护镜片技术分类字典数据，内容后续补齐。');
      case 'sys-auth': return renderPlaceholderView('权限管理', '此处用于配置系统角色与菜单权限，内容后续补齐。');
      case 'sys-user': return renderPlaceholderView('用户管理', '此处用于管理后台登录账号，内容后续补齐。');
      case 'sys-log': return renderPlaceholderView('日志管理', '此处用于查看系统操作留痕，内容后续补齐。');
      case 'mp': return renderMiniProgramView();
      default: return renderDashboardView();
    }
  };

  const getHeaderTitle = () => {
    const titles = {
      'dashboard': 'Dashboard 仪表盘',
      'lens-db': '镜片数据库',
      'dict-brand': '品牌管理',
      'dict-tech': '技术标签',
      'sys-auth': '权限管理',
      'sys-user': '用户管理',
      'sys-log': '日志管理',
      'mp': '小程序 Demo 预览'
    };
    return titles[activeMenu] || '';
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            <Glasses className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-800 tracking-wide text-sm">镜片查询管理系统</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* Dashboard */}
          <div 
            onClick={() => setActiveMenu('dashboard')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${activeMenu === 'dashboard' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm">Dashboard 仪表盘</span>
          </div>
          
          {/* 镜片数据库 */}
          <div 
            onClick={() => setActiveMenu('lens-db')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors mt-2 ${activeMenu === 'lens-db' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}
          >
            <Database className="w-5 h-5" />
            <span className="text-sm">镜片数据库</span>
          </div>

          {/* 字典与标签管理 */}
          <div className="space-y-1 mt-2">
            <div 
              onClick={() => toggleMenu('dict')}
              className="flex items-center justify-between px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Tags className="w-5 h-5" />
                <span className="font-medium text-sm">字典与标签管理</span>
              </div>
              {openMenus.dict ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
            {openMenus.dict && (
              <div className="pl-11 pr-3 space-y-1">
                <div onClick={() => setActiveMenu('dict-brand')} className={`py-2 px-3 rounded-lg text-sm cursor-pointer ${activeMenu === 'dict-brand' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 font-medium hover:bg-slate-50'}`}>品牌管理</div>
                <div onClick={() => setActiveMenu('dict-tech')} className={`py-2 px-3 rounded-lg text-sm cursor-pointer ${activeMenu === 'dict-tech' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 font-medium hover:bg-slate-50'}`}>技术标签</div>
              </div>
            )}
          </div>

          {/* 系统与权限管理 */}
          <div className="space-y-1 mt-2">
            <div 
              onClick={() => toggleMenu('sys')}
              className="flex items-center justify-between px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                <span className="font-medium text-sm">系统与权限管理</span>
              </div>
              {openMenus.sys ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
            {openMenus.sys && (
              <div className="pl-11 pr-3 space-y-1">
                <div onClick={() => setActiveMenu('sys-auth')} className={`py-2 px-3 rounded-lg text-sm cursor-pointer flex items-center gap-2 ${activeMenu === 'sys-auth' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 font-medium hover:bg-slate-50'}`}><Shield className="w-3.5 h-3.5"/> 权限管理</div>
                <div onClick={() => setActiveMenu('sys-user')} className={`py-2 px-3 rounded-lg text-sm cursor-pointer flex items-center gap-2 ${activeMenu === 'sys-user' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 font-medium hover:bg-slate-50'}`}><UserCog className="w-3.5 h-3.5"/> 用户管理</div>
                <div onClick={() => setActiveMenu('sys-log')} className={`py-2 px-3 rounded-lg text-sm cursor-pointer flex items-center gap-2 ${activeMenu === 'sys-log' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 font-medium hover:bg-slate-50'}`}><FileText className="w-3.5 h-3.5"/> 日志管理</div>
              </div>
            )}
          </div>

          {/* 小程序 Demo */}
          <div 
            onClick={() => setActiveMenu('mp')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer mt-6 border border-transparent ${activeMenu === 'mp' ? 'bg-blue-50 text-blue-600 border-blue-100 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium bg-slate-50'}`}
          >
            <Smartphone className="w-5 h-5" />
            <span className="text-sm">小程序 Demo 预览</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-800">{getHeaderTitle()}</h1>
          </div>
          <div className="flex items-center gap-5">
            <button className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-800">Admin</div>
                <div className="text-xs text-slate-500">超级管理员</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                AD
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}