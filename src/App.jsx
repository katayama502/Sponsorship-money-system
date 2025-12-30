import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Coins, 
  TrendingDown, 
  Settings2, 
  Calculator,
  Info,
  ChevronRight,
  CheckCircle2,
  ArrowDownCircle,
  Layers,
  FileText,
  Printer,
  X,
  Save,
  RotateCcw,
  Loader2
} from 'lucide-react';

const COURSE_BASES = [
  { id: 'premium', label: 'コースA', price: 12000 },
  { id: 'standard', label: 'コースB', price: 10000 },
  { id: 'basic', label: 'コースC', price: 8000 },
  { id: 'entry', label: 'コースD', price: 5000 },
];

const App = () => {
  // --- Initial States ---
  const initialCosts = {
    rent: 150000,
    utilities: 30000,
    instructor: 200000,
    curriculum: 50000,
    supplies: 20000,
  };

  const initialStudentCounts = {
    premium: 5,
    standard: 10,
    basic: 5,
    entry: 0
  };

  // --- State ---
  const [costs, setCosts] = useState(initialCosts);
  const [sponsorship, setSponsorship] = useState(250000);
  const [studentCounts, setStudentCounts] = useState(initialStudentCounts);
  const [showReport, setShowReport] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // --- Persistence (Local Storage) ---
  useEffect(() => {
    const savedData = localStorage.getItem('tuition_optimizer_data');
    if (savedData) {
      try {
        const { costs: sCosts, sponsorship: sSponsorship, studentCounts: sCounts } = JSON.parse(savedData);
        if (sCosts) setCosts(sCosts);
        if (sSponsorship) setSponsorship(sSponsorship);
        if (sCounts) setStudentCounts(sCounts);
      } catch (e) {
        console.error("Failed to load local data", e);
      }
    }
  }, []);

  const saveToLocal = () => {
    const data = { costs, sponsorship, studentCounts };
    localStorage.setItem('tuition_optimizer_data', JSON.stringify(data));
    setSaveMessage('ブラウザに保存しました');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const resetData = () => {
    setCosts(initialCosts);
    setSponsorship(250000);
    setStudentCounts(initialStudentCounts);
    localStorage.removeItem('tuition_optimizer_data');
    setSaveMessage('設定をリセットしました');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // --- Calculations ---
  const totalOperatingCost = useMemo(() => {
    return Object.values(costs).reduce((acc, curr) => acc + curr, 0);
  }, [costs]);

  const totalStudents = useMemo(() => {
    return Object.values(studentCounts).reduce((acc, curr) => acc + curr, 0);
  }, [studentCounts]);

  const totalBaseRevenue = useMemo(() => {
    return COURSE_BASES.reduce((acc, course) => {
      return acc + (course.price * (studentCounts[course.id] || 0));
    }, 0);
  }, [studentCounts]);

  const reductionPerStudent = useMemo(() => {
    if (totalStudents === 0) return 0;
    const surplus = (totalBaseRevenue + sponsorship) - totalOperatingCost;
    return Math.max(0, Math.floor(surplus / totalStudents / 100) * 100);
  }, [totalBaseRevenue, sponsorship, totalOperatingCost, totalStudents]);

  const coverageRate = Math.min(100, Math.round((sponsorship / totalOperatingCost) * 100));

  // --- Handlers ---
  const handleCostChange = (key, value) => {
    setCosts(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
  };

  const handleStudentChange = (id, value) => {
    setStudentCounts(prev => ({ ...prev, [id]: parseInt(value) || 0 }));
  };

  // --- Report Component ---
  const ReportModal = () => (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl print:shadow-none print:max-h-full print:rounded-none">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 print:hidden">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <FileText className="text-indigo-600" />
            協賛活動報告書 プレビュー
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95">
              <Printer size={18} /> PDF出力
            </button>
            <button onClick={() => setShowReport(false)} className="bg-white border border-slate-200 p-2 rounded-xl text-slate-500 hover:bg-slate-50">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-12 print:p-8 space-y-8 text-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black mb-2">協賛活動報告書</h2>
              <p className="text-slate-500 font-medium tracking-wide">Report on Education Support & Impact</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold">発行日: {new Date().toLocaleDateString('ja-JP')}</p>
              <p className="text-slate-400">クリエット教育支援プロジェクト</p>
            </div>
          </div>

          <hr className="border-slate-100" />

          <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-l-4 border-indigo-600 pl-3">支援によるインパクト</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-indigo-50 p-6 rounded-2xl">
                <p className="text-xs text-indigo-600 font-bold mb-1">一人あたりの月額軽減額</p>
                <p className="text-3xl font-black text-indigo-900">¥{reductionPerStudent.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-2xl">
                <p className="text-xs text-emerald-600 font-bold mb-1">支援対象生徒数</p>
                <p className="text-3xl font-black text-emerald-900">{totalStudents} 名</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-2xl">
                <p className="text-xs text-amber-600 font-bold mb-1">運営費カバー率</p>
                <p className="text-3xl font-black text-amber-900">{coverageRate}%</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-lg font-bold mb-4">協賛金の使途内訳</h3>
              <div className="space-y-4">
                {Object.entries(costs).map(([key, value]) => {
                  const labels = { rent: '家賃', utilities: '光熱費', instructor: '講師費用', curriculum: '教材費', supplies: '備品費' };
                  const coveredPart = Math.min(value, (sponsorship * (value / totalOperatingCost)));
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1 font-medium">
                        <span>{labels[key]}</span>
                        <span className="text-slate-400">¥{value.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${(coveredPart / value) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-slate-50 rounded-3xl p-6 flex flex-col items-center justify-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-200" strokeWidth="3" />
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-indigo-600" strokeWidth="3" strokeDasharray={`${coverageRate} 100`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-indigo-600">{coverageRate}%</span>
                </div>
              </div>
              <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                Total Operating Cost<br/>Funded by Sponsors
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-4 text-slate-700">受講料への影響実績</h3>
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="p-4 font-bold text-slate-600">コース</th>
                    <th className="p-4 font-bold text-slate-600">通常価格</th>
                    <th className="p-4 font-bold text-indigo-600">支援後価格</th>
                    <th className="p-4 font-bold text-emerald-600 text-right">支援効果</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {COURSE_BASES.map(course => (
                    <tr key={course.id}>
                      <td className="p-4 font-medium">{course.label}</td>
                      <td className="p-4 text-slate-400 line-through">¥{course.price.toLocaleString()}</td>
                      <td className="p-4 font-black">¥{Math.max(0, course.price - reductionPerStudent).toLocaleString()}</td>
                      <td className="p-4 text-emerald-600 font-bold text-right">-¥{Math.min(course.price, reductionPerStudent).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 print:bg-white transition-opacity duration-500">
      <div className="max-w-6xl mx-auto print:hidden">
        
        {/* Top Utility Bar */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={saveToLocal}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
            >
              <Save className="w-4 h-4 text-indigo-600" />
              現在の設定を保存
            </button>
            <button 
              onClick={resetData}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              リセット
            </button>
            {saveMessage && (
              <span className="text-xs font-bold text-indigo-600 animate-pulse bg-indigo-50 px-3 py-1 rounded-full">
                {saveMessage}
              </span>
            )}
          </div>
          <button 
            onClick={() => setShowReport(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            <FileText size={18} />
            報告資料プレビュー
          </button>
        </div>

        <header className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-black text-slate-800 flex flex-wrap justify-center md:justify-start items-center gap-3 tracking-tight">
            <Calculator className="text-indigo-600 w-9 h-9" />
            TUITION OPTIMIZER <span className="hidden md:inline text-slate-300 font-light">|</span> クリエット
          </h1>
          <p className="text-slate-400 mt-2 font-medium">企業協賛による受講料引き下げシミュレーション</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Settings Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6 font-bold text-slate-700 uppercase tracking-widest text-xs">
                <Settings2 className="w-4 h-4 text-indigo-500" />
                Operating Costs
              </div>
              <div className="space-y-4">
                {Object.entries(costs).map(([key, value]) => {
                  const labels = { rent: '家賃', utilities: '光熱費', instructor: '講師費用', curriculum: '教材・開発費', supplies: '備品・消耗品' };
                  return (
                    <div key={key}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{labels[key]}</label>
                      <div className="relative group">
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => handleCostChange(key, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                        />
                        <span className="absolute right-3 top-2 text-slate-300 text-xs">JPY</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-dashed flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
                <span className="text-lg font-black text-rose-500">¥{totalOperatingCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6 font-bold text-slate-700 uppercase tracking-widest text-xs">
                <Users className="w-4 h-4 text-blue-500" />
                Student Distribution
              </div>
              <div className="space-y-4">
                {COURSE_BASES.map((course) => (
                  <div key={course.id} className="flex items-center justify-between gap-4">
                    <label className="text-xs font-bold text-slate-500">{course.label}</label>
                    <div className="flex items-center gap-2 w-24">
                      <input
                        type="number"
                        min="0"
                        value={studentCounts[course.id]}
                        onChange={(e) => handleStudentChange(course.id, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-sm font-bold text-center"
                      />
                      <span className="text-[10px] text-slate-300 font-bold uppercase">Pax</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Simulation & Results */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Sponsorship Slider */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <Coins className="text-amber-50/50 w-32 h-32 transform rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Corporate Sponsorship</h3>
                    <p className="text-4xl font-black text-amber-600">¥{sponsorship.toLocaleString()}</p>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000000"
                  step="5000"
                  value={sponsorship}
                  onChange={(e) => setSponsorship(parseInt(e.target.value))}
                  className="w-full h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-300 mt-4 font-black uppercase tracking-widest">
                  <span>Start ¥0</span>
                  <span>Target ¥500k</span>
                  <span>Max ¥1M</span>
                </div>
              </div>
            </div>

            {/* Impact Banner */}
            <div className="bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-100 p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-[0.2em] mb-3">一律月額引き下げ額</p>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <ArrowDownCircle className="w-12 h-12 text-indigo-300 animate-bounce-slow" />
                  <span className="text-6xl font-black tracking-tighter">¥{reductionPerStudent.toLocaleString()}</span>
                  <span className="text-2xl font-bold opacity-60 self-end mb-2">/ Student</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 text-center min-w-[140px]">
                <p className="text-[10px] text-indigo-100 font-bold uppercase mb-1">Coverage</p>
                <p className="text-3xl font-black">{coverageRate}%</p>
              </div>
            </div>

            {/* Course Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COURSE_BASES.map((course) => {
                const discountedPrice = Math.max(0, course.price - reductionPerStudent);
                const isFree = discountedPrice === 0;
                return (
                  <div key={course.id} className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:border-indigo-200 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{course.label}</h4>
                        <span className="text-xs text-slate-300 font-bold line-through">¥{course.price.toLocaleString()}</span>
                      </div>
                      <Layers className="text-slate-100 w-8 h-8" />
                    </div>
                    <div className="flex items-end gap-1">
                      <span className={`text-3xl font-black ${isFree ? 'text-emerald-500' : 'text-slate-900'}`}>
                        {isFree ? 'FREE' : `¥${discountedPrice.toLocaleString()}`}
                      </span>
                      {!isFree && <span className="text-xs text-slate-400 font-bold mb-1.5 uppercase">/ mo</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info Tips */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 flex items-start gap-4 shadow-xl">
              <Info className="text-indigo-400 w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h5 className="font-bold text-sm mb-2 uppercase tracking-widest text-indigo-400 underline decoration-indigo-400/30 underline-offset-8">運営へのヒント</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Firebaseを使わないこのバージョンでは、データはあなたのブラウザ内にのみ保存されます。報告資料（PDF）を出力して共有することで、協賛企業様に結果を伝えることができます。
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <footer className="mt-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.5em] py-10 border-t border-slate-100">
          Clayette Education Transparency Dashboard
        </footer>
      </div>

      {showReport && <ReportModal />}
      
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:static { position: static !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:max-h-full { max-height: none !important; }
          .print\\:p-8 { padding: 2rem !important; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default App;