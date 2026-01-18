
import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  FileText
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { DISTRIBUTION_DATA, COVERAGE_DATA } from '../constants';

interface DashboardProps {
  onViewProjects: () => void;
  onCreateProject: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewProjects, onCreateProject }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">System Overview</h2>
          <p className="text-slate-500 mt-1">Real-time insights into your engineering traceability.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm bg-white">
            Generate Report
          </button>
          <button 
            onClick={onViewProjects}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md"
          >
            View Projects <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Clock className="text-blue-500" size={20} />}
          title="Active Projects"
          value="3"
          subtextText="this week"
          subtextValue="+1"
          color="blue"
        />
        <StatCard 
          icon={<CheckCircle2 className="text-emerald-500" size={20} />}
          title="Requirements"
          value="1,240"
          subtextText="linked"
          subtextValue="98%"
          color="emerald"
        />
        <StatCard 
          icon={<ShieldCheck className="text-indigo-500" size={20} />}
          title="Test Coverage"
          value="78%"
          subtextText="increase"
          subtextValue="+4.2%"
          color="indigo"
        />
        <StatCard 
          icon={<AlertCircle className="text-rose-500" size={20} />}
          title="Missing Links"
          value="12"
          subtextText="Action required"
          subtextValue=""
          color="rose"
          alert
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800">Artifact Distribution</h3>
            <p className="text-sm text-slate-400">Breakdown of system elements across all active projects</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DISTRIBUTION_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#6366f1" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800">Coverage Trend</h3>
            <p className="text-sm text-slate-400">Traceability completeness over time</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={COVERAGE_DATA}>
                <defs>
                  <linearGradient id="colorCoverage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="coverage" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCoverage)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  subtextText: string;
  subtextValue: string;
  color: string;
  alert?: boolean;
}> = ({ icon, title, value, subtextText, subtextValue, alert }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative">
    {alert && <div className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full"></div>}
    <div className="flex flex-col gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
          <p className="text-[11px] text-slate-400">
            <span className={subtextValue.startsWith('+') ? 'text-emerald-500 font-medium' : ''}>
              {subtextValue}
            </span> {subtextText}
          </p>
        </div>
      </div>
    </div>
  </div>
);
