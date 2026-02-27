"use client";

import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

interface ChartRendererProps {
    data: Record<string, unknown>[];
    chartConfig: {
        type: string;
        xAxis?: string;
        yAxis?: string;
    };
}

const PIE_COLORS = ["#8B5CF6", "#6366F1", "#A855F7", "#4F46E5"];

export function ChartRenderer({ data, chartConfig }: ChartRendererProps) {
    if (!data.length || chartConfig.type === "none") return null;

    const yKey = chartConfig.yAxis ?? "";
    const xKey = chartConfig.xAxis ?? "";
    const chartData = data.map(item => ({
        ...item,
        [yKey]: Number(item[yKey]) || 0,
    }));

    return (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Visual Insight</h4>
            </div>
            <div className="bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 p-10 rounded-[3rem] shadow-3xl h-[480px]">
                <ResponsiveContainer width="100%" height="100%">
                    {chartConfig.type === "line" ? (
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.2)" fontSize={11} axisLine={false} tickLine={false} tickMargin={15} />
                            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} axisLine={false} tickLine={false} tickMargin={15} />
                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '15px' }} />
                            <Line type="monotone" dataKey={yKey} stroke="#8B5CF6" strokeWidth={4} dot={{ r: 5, fill: '#8B5CF6', strokeWidth: 0 }} activeDot={{ r: 8, fill: '#fff' }} />
                        </LineChart>
                    ) : chartConfig.type === "pie" ? (
                        <PieChart>
                            <Pie data={chartData} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={160} innerRadius={110} paddingAngle={6} stroke="none">
                                {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '15px' }} />
                        </PieChart>
                    ) : (
                        <BarChart data={chartData} margin={{ bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} tickMargin={15} height={60} interval={0} angle={-10} textAnchor="end" />
                            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} axisLine={false} tickLine={false} tickMargin={15} />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '15px' }} />
                            <Bar dataKey={yKey} fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </section>
    );
}
