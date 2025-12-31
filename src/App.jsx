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
  ShieldCheck,
  UserPlus,
  PieChart,
  BarChart3,
  History,
  TrendingUp,
  Calendar,
  Trash2,
  Edit2
} from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, collection, onSnapshot, query, serverTimestamp } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyArYfL-wE_F0OF3QNl5_jh_B7ZXr7Ev5fg",
  authDomain: "creatte-sponser-app.firebaseapp.com",
  projectId: "creatte-sponser-app",
  storageBucket: "creatte-sponser-app.firebasestorage.app",
  messagingSenderId: "753873131194",
  appId: "1:753873131194:web:496a6913a523139c7e1483",
  measurementId: "G-LVQ6WXT9L3"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'clayette-tuition-optimizer';

const COURSE_BASES = [
  { id: 'premium', label: '月4回コース', price: 12000 },
  { id: 'standard', label: '月3回コース', price: 10000 },
  { id: 'basic', label: '月2回コース', price: 8000 },
  { id: 'entry', label: '月1回コース', price: 5000 },
];

const App = () => {
  // --- 初期状態設定 ---
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

  // --- 状態管理 ---
  const [costs, setCosts] = useState(initialCosts);
  const [sponsorship, setSponsorship] = useState(300000);
  const [studentCounts, setStudentCounts] = useState(initialStudentCounts);
  const [bufferStudentTarget, setBufferStudentTarget] = useState(5); 
  const [showReport, setShowReport] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Firebase用
  const [user, setUser] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [recordMonth, setRecordMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isRecording, setIsRecording] = useState(false);

  // --- 認証とリアルタイムリスナー ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Rule 1: 厳格なパス使用
    const recordsCol = collection(db, 'artifacts', appId, 'public', 'data', 'monthly_records');
    const unsubscribeSnapshot = onSnapshot(recordsCol, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // メモリ内でソート（日付順）
      const sortedData = data.sort((a, b) => a.month.localeCompare(b.month));
      setHistoryRecords(sortedData);
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  // --- 計算ロジック ---
  const totalOperatingCost = useMemo(() => Object.values(costs).reduce((acc, curr) => acc + curr, 0), [costs]);
  const totalStudents = useMemo(() => Object.values(studentCounts).reduce((acc, curr) => acc + curr, 0), [studentCounts]);
  const totalBaseRevenue = useMemo(() => 
    COURSE_BASES.reduce((acc, c) => acc + (c.price * (studentCounts[c.id] || 0)), 0), [studentCounts]);

  const bufferAmount = useMemo(() => bufferStudentTarget * COURSE_BASES[0].price, [bufferStudentTarget]);

  const availableSurplus = useMemo(() => {
    return (totalBaseRevenue + sponsorship) - (totalOperatingCost + bufferAmount);
  }, [totalBaseRevenue, sponsorship, totalOperatingCost, bufferAmount]);

  const reductionPerStudent = useMemo(() => {
    if (totalStudents === 0) return 0;
    return Math.max(0, Math.floor(availableSurplus / totalStudents / 1000) * 1000);
  }, [availableSurplus, totalStudents]);

  const finalNetSurplus = useMemo(() => {
    return availableSurplus - (reductionPerStudent * totalStudents);
  }, [availableSurplus, reductionPerStudent, totalStudents]);

  const coverageRate = Math.min(100, Math.round((sponsorship / totalOperatingCost) * 100));

  const capacityPerCourse = useMemo(() => {
    const pool = finalNetSurplus + bufferAmount;
    return COURSE_BASES.map(course => ({
      ...course,
      count: Math.floor(pool / (course.price - reductionPerStudent || 1))
    }));
  }, [finalNetSurplus, bufferAmount, reductionPerStudent]);

  // --- ハンドラー ---
  const handleCostChange = (key, value) => setCosts(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
  const handleStudentChange = (id, value) => setStudentCounts(prev => ({ ...prev, [id]: parseInt(value) || 0 }));

  const resetData = () => {
    setCosts(initialCosts);
    setSponsorship(300000);
    setStudentCounts(initialStudentCounts);
    setBufferStudentTarget(5);
    setSaveMessage('初期化しました');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Firebaseへの月次記録保存（または上書き）
  const recordMonthlyStatus = async () => {
    if (!user) return;
    setIsRecording(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'monthly_records', recordMonth);
      await setDoc(docRef, {
        month: recordMonth,
        costs: costs,
        totalCost: totalOperatingCost,
        sponsorship: sponsorship,
        studentCounts: studentCounts,
        totalStudents: totalStudents,
        reductionAmount: reductionPerStudent,
        coverageRate: coverageRate,
        recordedAt: serverTimestamp()
      });
      setSaveMessage(`${recordMonth} の記録を保存しました`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setSaveMessage('保存に失敗しました');
    } finally {
      setIsRecording(false);
    }
  };

  // 記録の削除
  const deleteMonthlyRecord = async (id) => {
    if (!user || !window.confirm(`${id} のデータを削除してもよろしいですか？`)) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'monthly_records', id);
      await deleteDoc(docRef);
      setSaveMessage('削除しました');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setSaveMessage('削除に失敗しました');
    }
  };

  // 記録の読み込み（編集用）
  const loadRecordForEdit = (record) => {
    setCosts(record.costs || initialCosts);
    setSponsorship(record.sponsorship || 0);
    setStudentCounts(record.studentCounts || initialStudentCounts);
    setRecordMonth(record.month);
    setSaveMessage(`${record.month} のデータを読み込みました`);
    setTimeout(() => setSaveMessage(''), 3000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 推移グラフコンポーネント ---
  const TrendChart = () => {
    if (historyRecords.length < 2) {
      return (
        <div className="h-48 flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <p className="text-xs text-slate-400 font-bold">推移を表示するには2ヶ月分以上の記録が必要です</p>
        </div>
      );
    }

    const maxVal = Math.max(...historyRecords.map(r => Math.max(r.totalCost, r.sponsorship))) * 1.2;
    const width = 600;
    const height = 150;
    const padding = 20;

    const getX = (idx) => (idx / (historyRecords.length - 1)) * (width - padding * 2) + padding;
    const getY = (val) => height - ((val / maxVal) * (height - padding * 2) + padding);

    const costPoints = historyRecords.map((r, i) => `${getX(i)},${getY(r.totalCost)}`).join(' ');
    const sponsorPoints = historyRecords.map((r, i) => `${getX(i)},${getY(r.sponsorship)}`).join(' ');

    return (
      <div className="w-full bg-slate-900 rounded-3xl p-6 text-white shadow-xl overflow-hidden relative mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-orange-400" />
            <span className="text-xs font-bold tracking-widest uppercase">年間推移分析</span>
          </div>
          <div className="flex gap-4 text-[10px]">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div>協賛金</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div>運営費</div>
          </div>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <line x1={padding} y1={getY(0)} x2={width - padding} y2={getY(0)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <polyline fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={costPoints} />
          <polyline fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={sponsorPoints} />
          {historyRecords.map((r, i) => (
            <text key={i} x={getX(i)} y={height - 2} fill="#64748b" fontSize="8" textAnchor="middle" fontWeight="bold">
              {r.month.slice(5)}月
            </text>
          ))}
        </svg>
      </div>
    );
  };

  // --- 報告書モーダル ---
  const ReportModal = () => (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:max-h-[95vh] overflow-y-auto md:rounded-3xl shadow-2xl print:shadow-none print:max-h-full print:rounded-none">
        <div className="p-4 md:p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <FileText className="text-orange-600 w-5 h-5" />
            協賛成果報告書 プレビュー
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-100">
              <Printer size={18} /> <span className="text-sm font-bold">PDF出力</span>
            </button>
            <button onClick={() => setShowReport(false)} className="bg-white border border-slate-200 p-2 rounded-xl text-slate-500 hover:bg-slate-50">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-8 md:p-16 print:p-10 space-y-12 text-slate-800 bg-white text-left">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-2">
              <div className="bg-orange-600 text-white px-3 py-1 text-[10px] font-bold tracking-[0.3em] inline-block rounded-sm text-left">CONFIDENTIAL</div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 text-left">協賛活動成果報告書</h2>
              <p className="text-slate-500 font-medium text-left">教育機会の創出と持続可能な運営に関するインパクト報告</p>
            </div>
            <div className="text-left md:text-right space-y-1 border-l-2 md:border-l-0 md:border-r-2 border-orange-500 pl-4 md:pr-4">
              <p className="text-xs font-bold text-slate-400">作成日</p>
              <p className="text-sm font-black">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-xs font-bold text-orange-600 pt-2 tracking-widest uppercase">Clayette Project</p>
            </div>
          </div>

          <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1 flex flex-col items-center justify-center p-8 bg-orange-600 text-white rounded-[2rem] shadow-xl shadow-orange-100 relative overflow-hidden text-center">
               <p className="text-[10px] font-bold uppercase tracking-widest mb-4 opacity-80">運営費カバー率</p>
               <div className="relative w-32 h-32 mx-auto">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="white" strokeWidth="3" strokeDasharray={`${coverageRate} 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black leading-none">{coverageRate}<span className="text-sm">%</span></span>
                </div>
               </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-left">
                <p className="text-xs font-bold text-slate-400 mb-2">総協賛金額</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter">¥{sponsorship.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-left">
                <p className="text-xs font-bold text-slate-400 mb-2">一人あたりの還元額</p>
                <p className="text-4xl font-black text-orange-600 tracking-tighter">¥{reductionPerStudent.toLocaleString()}</p>
              </div>
            </div>
          </section>

          <section className="space-y-6 text-left">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-900 border-l-4 border-orange-500 pl-4">
              <BarChart3 className="text-orange-600" />
              資金使途の詳細内訳
            </div>
            <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-slate-100 space-y-8">
                {Object.entries(costs).map(([key, value]) => {
                  const labels = { rent: '家賃', utilities: '水道光熱費', instructor: '講師費用', curriculum: '教材・開発費', supplies: '備品・消耗品' };
                  const categoryWeight = value / totalOperatingCost;
                  const coveredAmount = sponsorship * categoryWeight;
                  const coverRatio = Math.min(100, Math.round((coveredAmount / value) * 100));
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1 font-bold text-slate-600">
                        <span>{labels[key]}</span>
                        <span>寄与率: {coverRatio}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: `${coverRatio}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 print:bg-white transition-opacity duration-500 overflow-x-hidden text-left">
      <div className="max-w-6xl mx-auto print:hidden">
        
        {/* 上部ツールバー */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4">
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 gap-2">
              <Calendar size={16} className="text-slate-400 ml-2" />
              <input 
                type="month" 
                value={recordMonth} 
                onChange={(e) => setRecordMonth(e.target.value)}
                className="py-2 text-sm font-bold bg-transparent outline-none text-slate-700"
              />
              <button 
                onClick={recordMonthlyStatus}
                disabled={isRecording || !user}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isRecording ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                月次記録を保存
              </button>
            </div>
            <button 
              onClick={resetData}
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs md:text-sm font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>初期化</span>
            </button>
            {saveMessage && (
              <span className="w-full sm:w-auto text-center text-[10px] font-bold text-orange-600 animate-pulse bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                {saveMessage}
              </span>
            )}
          </div>
          <button 
            onClick={() => setShowReport(true)}
            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-100 transition-all active:scale-95 text-sm"
          >
            <FileText size={18} />
            報告資料を作成
          </button>
        </div>

        <header className="mb-10 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex flex-wrap justify-center md:justify-start items-center gap-2 md:gap-3 tracking-tight">
            <Calculator className="text-orange-600 w-8 h-8 md:w-9 md:h-9" />
            月次：協賛金最適化 <span className="hidden sm:inline text-slate-300 font-light">|</span> <span className="text-orange-600 tracking-wider uppercase">株式会社クリエット</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium text-sm md:text-base italic">協賛金バッファと履歴管理を統合</p>
        </header>

        {/* トレンド & 履歴管理 */}
        <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div>
             <TrendChart />
           </div>
           <div className="bg-white rounded-3xl border border-slate-200 p-6 overflow-hidden flex flex-col h-[230px]">
             <div className="flex items-center gap-2 mb-4">
               <History size={18} className="text-slate-400" />
               <span className="text-sm font-bold text-slate-700">保存済み記録の一覧</span>
             </div>
             <div className="flex-1 overflow-y-auto space-y-2 pr-2">
               {historyRecords.length === 0 ? (
                 <p className="text-[10px] text-slate-300 italic text-center py-10">記録はまだありません</p>
               ) : (
                 historyRecords.map((r) => (
                   <div key={r.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:border-orange-200">
                     <div className="flex items-center gap-3">
                       <span className="text-sm font-black text-slate-700">{r.month}</span>
                       <div className="flex flex-col text-[10px] text-slate-400">
                         <span>協賛金: ¥{r.sponsorship.toLocaleString()}</span>
                         <span>還元: -¥{r.reductionAmount.toLocaleString()}</span>
                       </div>
                     </div>
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => loadRecordForEdit(r)}
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="読み込み/編集"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => deleteMonthlyRecord(r.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="削除"
                        >
                          <Trash2 size={14} />
                        </button>
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* 設定パネル */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* 運営コスト */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 md:p-6 text-left">
              <div className="flex items-center gap-2 mb-6 font-bold text-slate-700 uppercase tracking-widest text-[10px] md:text-xs">
                <Settings2 className="w-4 h-4 text-orange-500" />
                月間運営コスト設定
              </div>
              <div className="space-y-4">
                {Object.entries(costs).map(([key, value]) => {
                  const labels = { rent: '家賃', utilities: '水道光熱費', instructor: '講師費用', curriculum: '教材・開発費', supplies: '備品・消耗品' };
                  return (
                    <div key={key}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 text-left">{labels[key]}</label>
                      <div className="relative group">
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => handleCostChange(key, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all text-left"
                        />
                        <span className="absolute right-3 top-2 text-slate-300 text-[10px]">円</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-dashed flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-slate-400 text-left">合計コスト</span>
                <span className="text-base md:text-lg font-black text-orange-600">¥{totalOperatingCost.toLocaleString()}</span>
              </div>
            </div>

            {/* 生徒内訳 */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 md:p-6 text-left">
              <div className="flex items-center gap-2 mb-6 font-bold text-slate-700 uppercase tracking-widest text-[10px] md:text-xs">
                <Users className="w-4 h-4 text-orange-500" />
                生徒の内訳
              </div>
              <div className="space-y-4">
                {COURSE_BASES.map((course) => (
                  <div key={course.id} className="flex items-center justify-between gap-4">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 text-left">{course.label}</label>
                    <div className="flex items-center gap-2 w-20 md:w-24">
                      <input
                        type="number"
                        min="0"
                        value={studentCounts[course.id]}
                        onChange={(e) => handleStudentChange(course.id, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs md:text-sm font-bold text-center"
                      />
                      <span className="text-[10px] text-slate-300 font-bold">名</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* バッファ設定 */}
            <div className="bg-orange-600 text-white rounded-3xl shadow-sm p-6 text-left">
              <div className="flex items-center gap-2 mb-4 font-bold uppercase tracking-widest text-[10px]">
                <ShieldCheck className="w-4 h-4 text-orange-200" />
                協賛金バッファ設定
              </div>
              <p className="text-[10px] text-orange-100 mb-4 leading-relaxed font-medium text-left">
                不測の事態に備え、月4回コース(¥12,000)の生徒何人分の資金を「予備費」として除外しますか？
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={bufferStudentTarget}
                  onChange={(e) => setBufferStudentTarget(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-orange-400 rounded-full appearance-none cursor-pointer accent-white"
                />
                <span className="text-xl font-black w-10 text-right">{bufferStudentTarget}<span className="text-[10px] font-normal ml-0.5">名分</span></span>
              </div>
              <div className="mt-4 pt-4 border-t border-orange-500 flex justify-between items-center text-left">
                <span className="text-[10px] font-bold text-orange-200">確保資金額:</span>
                <span className="text-sm font-black text-white">¥{bufferAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* シミュレーション結果パネル */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 協賛金スライダー */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-10 text-left">
                <Coins className="text-orange-600 w-32 h-32" />
              </div>
              <div className="relative z-10 text-left">
                <div className="flex justify-between items-end mb-8 text-left">
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-black text-left">現在の企業協賛金 総額</h3>
                    <p className="text-4xl md:text-5xl font-black text-orange-600 tracking-tighter text-left">¥{sponsorship.toLocaleString()}</p>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1500000"
                  step="10000"
                  value={sponsorship}
                  onChange={(e) => setSponsorship(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-orange-600"
                />
                <div className="flex justify-between text-[10px] text-slate-300 mt-4 font-black uppercase tracking-widest text-left">
                  <span>開始 ¥0</span>
                  <span>目標 ¥50万</span>
                  <span>最大 ¥150万</span>
                </div>
              </div>
            </div>

            {/* インパクトバナー */}
            <div className="bg-orange-600 rounded-[2.5rem] shadow-2xl shadow-orange-100 p-8 md:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
              <div className="text-center sm:text-left text-left">
                <p className="text-orange-100 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-3 text-left">一律月額引き下げ額 (1,000円単位)</p>
                <div className="flex items-center justify-center sm:justify-start gap-3 md:gap-4 text-left">
                  <ArrowDownCircle className="w-10 h-10 md:w-12 md:h-12 text-orange-200 animate-bounce-slow" />
                  <span className="text-5xl md:text-7xl font-black tracking-tighter text-left">¥{reductionPerStudent.toLocaleString()}</span>
                  <span className="text-lg md:text-2xl font-bold opacity-60 self-end mb-1 md:mb-2 text-left">/ 名</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 text-center min-w-[140px]">
                <p className="text-[10px] text-orange-100 font-bold uppercase mb-1">運営費補填率</p>
                <p className="text-3xl font-black">{coverageRate}%</p>
              </div>
            </div>

            {/* 受入余力の可視化 */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 text-left">
              <div className="flex items-center justify-between mb-6 text-left">
                <div className="flex items-center gap-2 font-bold text-slate-700 text-sm text-left">
                  <UserPlus className="text-orange-500 w-5 h-5 text-left" />
                  現在の受入可能枠 (追加募集余力)
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                {capacityPerCourse.map((course) => (
                  <div key={course.id} className="relative group text-left">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:border-orange-200 hover:shadow-md text-left">
                      <p className="text-[10px] text-slate-400 font-bold mb-2 text-left">{course.label}</p>
                      <p className="text-2xl font-black text-orange-600 text-left">+{course.count} <span className="text-[10px] font-normal text-slate-400">名</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* コース別価格カード */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {COURSE_BASES.map((course) => {
                const discountedPrice = Math.max(0, course.price - reductionPerStudent);
                const isFree = discountedPrice === 0;
                return (
                  <div key={course.id} className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:border-orange-200 transition-all hover:shadow-md text-left">
                    <div className="flex justify-between items-start mb-4 text-left">
                      <div>
                        <h4 className="font-black text-slate-800 text-base md:text-lg tracking-tight text-left">{course.label}</h4>
                        <span className="text-[10px] md:text-xs text-slate-300 font-bold line-through text-left">定価 ¥{course.price.toLocaleString()}</span>
                      </div>
                      <Layers className="text-slate-100 w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-end gap-1 text-left">
                        <span className={`text-2xl md:text-3xl font-black ${isFree ? 'text-emerald-500' : 'text-slate-900'} text-left`}>
                          {isFree ? '無料' : `¥${discountedPrice.toLocaleString()}`}
                        </span>
                        {!isFree && <span className="text-[10px] text-slate-400 font-bold mb-1 md:mb-1.5 text-left">/ 月</span>}
                      </div>
                      <div className="mt-2 h-1 w-full bg-slate-50 rounded-full overflow-hidden text-left">
                        <div 
                          className="h-full bg-orange-500 transition-all duration-1000 text-left" 
                          style={{ width: `${Math.min(100, (reductionPerStudent / course.price) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
        
        <footer className="mt-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.5em] py-10 border-t border-slate-100">
          CLAYETTE EDUCATIONAL PLATFORM
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
          .print\\:p-10 { padding: 2.5rem !important; }
          body { overflow: visible !important; }
          .rounded-[2rem], .rounded-[2.5rem] { border-radius: 1rem !important; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #ea580c;
          cursor: pointer;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
      `}</style>
    </div>
  );
};

export default App;