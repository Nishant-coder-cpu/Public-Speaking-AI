'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

// Type definitions for visualization data
export interface MismatchTimelineData {
  time: string;
  timeSeconds: number;
  expected: number;
  actual: number;
  gap: number;
  status: 'aligned' | 'weak_gap' | 'mismatch';
  transcript: string;
}

export interface EnergyFusionData {
  time: string;
  timeSeconds: number;
  audioEnergy: number;
  bodyEnergy: number;
  faceEnergy: number;
  handEnergy: number;
}

export interface OpportunityMapData {
  time: string;
  expected: number;
  actual: number;
  gap: number;
  status: 'aligned' | 'weak_gap' | 'mismatch';
  quadrant: string;
  transcript: string;
}

export interface VisualizationData {
  mismatchTimeline: MismatchTimelineData[];
  energyFusion: EnergyFusionData[];
  opportunityMap: OpportunityMapData[];
  interpretation: string;
}

interface VisualizationChartsProps {
  data: VisualizationData;
}

// Color mapping for status
const STATUS_COLORS = {
  aligned: '#10b981', // green-500
  weak_gap: '#f59e0b', // amber-500
  mismatch: '#ef4444', // red-500
};

// Custom tooltip for mismatch timeline
const MismatchTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold mb-1">{data.time}</p>
        <p className="text-slate-300 text-sm mb-2">"{data.transcript}"</p>
        <div className="space-y-1 text-sm">
          <p className="text-blue-400">Expected: {(data.expected * 100).toFixed(0)}%</p>
          <p className="text-purple-400">Actual: {(data.actual * 100).toFixed(0)}%</p>
          <p className={`font-semibold ${
            data.status === 'aligned' ? 'text-green-400' :
            data.status === 'weak_gap' ? 'text-amber-400' :
            'text-red-400'
          }`}>
            Gap: {(data.gap * 100).toFixed(0)}% ({data.status.replace('_', ' ')})
          </p>
        </div>
      </div>
    );
  }
  return null;
};

// Custom tooltip for energy fusion
const EnergyTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold mb-2">{data.time}</p>
        <div className="space-y-1 text-sm">
          <p className="text-blue-400">Audio: {(data.audioEnergy * 100).toFixed(0)}%</p>
          <p className="text-purple-400">Body: {(data.bodyEnergy * 100).toFixed(0)}%</p>
          <p className="text-cyan-400">Face: {(data.faceEnergy * 100).toFixed(0)}%</p>
          <p className="text-pink-400">Hand: {(data.handEnergy * 100).toFixed(0)}%</p>
        </div>
      </div>
    );
  }
  return null;
};

// Custom tooltip for opportunity map
const OpportunityTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl max-w-xs">
        <p className="text-white font-semibold mb-1">{data.time}</p>
        <p className="text-slate-300 text-sm mb-2">"{data.transcript}"</p>
        <div className="space-y-1 text-sm">
          <p className="text-blue-400">Expected: {(data.expected * 100).toFixed(0)}%</p>
          <p className="text-purple-400">Actual: {(data.actual * 100).toFixed(0)}%</p>
          <p className="text-amber-400 font-semibold">{data.quadrant}</p>
        </div>
      </div>
    );
  }
  return null;
};

export default function VisualizationCharts({ data }: VisualizationChartsProps) {
  return (
    <div className="space-y-8">
      {/* Chart 1: Mismatch Timeline Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg"
      >
        <h4 className="text-xl font-semibold text-slate-200 mb-4 flex items-center space-x-2">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
          <span>Mismatch Timeline</span>
        </h4>
        <p className="text-slate-400 text-sm mb-6">
          Shows alignment between expected and actual impact over time
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.mismatchTimeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip content={<MismatchTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar dataKey="expected" fill="#3b82f6" name="Expected Impact" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" fill="#8b5cf6" name="Actual Impact" radius={[4, 4, 0, 0]}>
              {data.mismatchTimeline.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Status legend */}
        <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-slate-300">Aligned</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-slate-300">Weak Gap</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-300">Mismatch</span>
          </div>
        </div>
      </motion.div>

      {/* Chart 2: Energy Fusion - 4 Subplots */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg"
      >
        <h4 className="text-xl font-semibold text-slate-200 mb-4 flex items-center space-x-2">
          <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-cyan-500 rounded-full"></div>
          <span>Energy Fusion Over Time</span>
        </h4>
        <p className="text-slate-400 text-sm mb-6">
          Individual energy tracks for audio, body, face, and hand throughout your presentation
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Audio Energy Subplot */}
          <div className="bg-white/5 rounded-lg p-4 border border-blue-500/20">
            <h5 className="text-sm font-semibold text-blue-400 mb-3">Audio Energy</h5>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.energyFusion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#3b82f6' }}
                  formatter={(value: any) => `${(value * 100).toFixed(1)}%`}
                />
                <Line
                  type="monotone"
                  dataKey="audioEnergy"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 5 }}
                  name="Audio"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Body Energy Subplot */}
          <div className="bg-white/5 rounded-lg p-4 border border-purple-500/20">
            <h5 className="text-sm font-semibold text-purple-400 mb-3">Body Energy</h5>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.energyFusion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#8b5cf6' }}
                  formatter={(value: any) => `${(value * 100).toFixed(1)}%`}
                />
                <Line
                  type="monotone"
                  dataKey="bodyEnergy"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#8b5cf6' }}
                  activeDot={{ r: 5 }}
                  name="Body"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Face Energy Subplot */}
          <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
            <h5 className="text-sm font-semibold text-cyan-400 mb-3">Face Energy</h5>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.energyFusion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#06b6d4' }}
                  formatter={(value: any) => `${(value * 100).toFixed(1)}%`}
                />
                <Line
                  type="monotone"
                  dataKey="faceEnergy"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#06b6d4' }}
                  activeDot={{ r: 5 }}
                  name="Face"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Hand Energy Subplot */}
          <div className="bg-white/5 rounded-lg p-4 border border-pink-500/20">
            <h5 className="text-sm font-semibold text-pink-400 mb-3">Hand Energy</h5>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.energyFusion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#ec4899' }}
                  formatter={(value: any) => `${(value * 100).toFixed(1)}%`}
                />
                <Line
                  type="monotone"
                  dataKey="handEnergy"
                  stroke="#ec4899"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#ec4899' }}
                  activeDot={{ r: 5 }}
                  name="Hand"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Chart 3: Improvement Opportunity Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg"
      >
        <h4 className="text-xl font-semibold text-slate-200 mb-4 flex items-center space-x-2">
          <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-pink-500 rounded-full"></div>
          <span>Improvement Opportunity Map</span>
        </h4>
        <p className="text-slate-400 text-sm mb-6">
          Identifies moments with high potential for improvement
        </p>
        
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis
              type="number"
              dataKey="expected"
              name="Expected Impact"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              label={{ value: 'Expected Impact', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
            />
            <YAxis
              type="number"
              dataKey="actual"
              name="Actual Impact"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              label={{ value: 'Actual Impact', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            />
            <Tooltip content={<OpportunityTooltip />} />
            <ReferenceLine x={0.5} stroke="#64748b" strokeDasharray="3 3" />
            <ReferenceLine y={0.5} stroke="#64748b" strokeDasharray="3 3" />
            <Scatter name="Moments" data={data.opportunityMap}>
              {data.opportunityMap.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STATUS_COLORS[entry.status]}
                  opacity={0.8}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        
        {/* Quadrant labels */}
        <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-400 font-semibold">Strong Moments</p>
            <p className="text-slate-400 text-xs">High expected, high actual</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 font-semibold">Missed Opportunities</p>
            <p className="text-slate-400 text-xs">High expected, low actual</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-400 font-semibold">Neutral</p>
            <p className="text-slate-400 text-xs">Low expected, low actual</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-amber-400 font-semibold">Over-delivery</p>
            <p className="text-slate-400 text-xs">Low expected, high actual</p>
          </div>
        </div>
      </motion.div>

      {/* Executive Interpretation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="backdrop-blur-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6 shadow-lg"
      >
        <h4 className="text-lg font-semibold text-blue-300 mb-3">Key Insights</h4>
        <p className="text-slate-200 leading-relaxed">{data.interpretation}</p>
      </motion.div>
    </div>
  );
}
