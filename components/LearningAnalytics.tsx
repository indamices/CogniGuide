import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  SavedSession,
  MasteryLevel,
} from '../types';
import {
  TIME_RANGES,
  formatDuration,
  exportLearningReport,
  filterSessionsByTimeRange,
  calculateLearningStats,
  groupByDay,
  calculateMasteryDistribution,
  calculateStageDistribution,
  analyzeTimePatterns,
  generateInsights,
  checkAchievements,
  MASTERY_COLORS,
  type TimeRange,
  type DailyStats,
  type MasteryDistribution,
  type StageDistribution,
  type LearningInsight,
  type Achievement,
} from '../utils/analyticsHelpers';

interface LearningAnalyticsProps {
  sessions: SavedSession[];
  onClose?: () => void;
}

const LearningAnalytics: React.FC<LearningAnalyticsProps> = ({ sessions, onClose }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(TIME_RANGES[3]); // Default: All
  const [selectedTab, setSelectedTab] = useState<'overview' | 'trends' | 'insights' | 'achievements'>('overview');

  // Filter and process data
  const filteredSessions = useMemo(
    () => filterSessionsByTimeRange(sessions, selectedTimeRange),
    [sessions, selectedTimeRange]
  );

  const stats = useMemo(
    () => calculateLearningStats(filteredSessions),
    [filteredSessions]
  );

  const dailyData = useMemo(
    () => groupByDay(filteredSessions).slice(-14), // Last 14 days
    [filteredSessions]
  );

  const masteryDistribution = useMemo(
    () => calculateMasteryDistribution(filteredSessions),
    [filteredSessions]
  );

  const stageDistribution = useMemo(
    () => calculateStageDistribution(filteredSessions),
    [filteredSessions]
  );

  const timePatterns = useMemo(
    () => analyzeTimePatterns(filteredSessions),
    [filteredSessions]
  );

  const insights = useMemo(
    () => generateInsights(filteredSessions, stats, masteryDistribution, timePatterns),
    [filteredSessions, stats, masteryDistribution, timePatterns]
  );

  const achievements = useMemo(
    () => checkAchievements(filteredSessions, stats),
    [filteredSessions, stats]
  );

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  // Export report
  const handleExportReport = () => {
    const report = exportLearningReport(
      stats,
      selectedTimeRange,
      masteryDistribution,
      insights,
      achievements
    );

    // Download as text file
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CogniGuide_学习报告_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">学习分析仪表板</h1>
              <p className="text-xs text-slate-500">深入了解您的学习进度和效果</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReport}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出报告
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600 mr-2">时间范围:</span>
          {TIME_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedTimeRange.label === range.label
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="px-6 py-2 bg-white border-b border-slate-100 flex gap-1">
          {[
            { id: 'overview', label: '概览', icon: '📊' },
            { id: 'trends', label: '趋势分析', icon: '📈' },
            { id: 'insights', label: '智能洞察', icon: '💡' },
            { id: 'achievements', label: '成就', icon: '🏆' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all flex items-center gap-2 ${
                selectedTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="总学习时长"
                  value={formatDuration(stats.totalStudyTime)}
                  icon="⏱️"
                  color="indigo"
                  trend={stats.totalStudyTime > 0 ? '+本次统计' : undefined}
                />
                <StatCard
                  title="学习会话"
                  value={stats.totalSessions.toString()}
                  icon="💬"
                  color="blue"
                  subtitle="次"
                />
                <StatCard
                  title="知识点"
                  value={stats.totalConcepts.toString()}
                  icon="🧠"
                  color="purple"
                  subtitle="个"
                />
                <StatCard
                  title="平均掌握度"
                  value={`${stats.averageMastery}%`}
                  icon="📊"
                  color="emerald"
                  trend={stats.averageMastery >= 60 ? '优秀' : stats.averageMastery >= 40 ? '良好' : '继续努力'}
                />
              </div>

              {/* Mastery Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">知识掌握分布</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={masteryDistribution.filter(m => m.count > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name} (${entry.percentage}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="level"
                      >
                        {masteryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {masteryDistribution.map((m) => (
                      <div key={m.level} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}></div>
                        <span className="text-slate-600">
                          {m.level === 'Expert' ? '专家' : m.level === 'Competent' ? '熟练' : m.level === 'Novice' ? '新手' : '未知'}: {m.count}个
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stage Distribution */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">学习阶段分布</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stageDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" angle={-20} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">活跃主题</p>
                      <p className="text-2xl font-bold text-blue-800 mt-1">{stats.activeTopics}</p>
                    </div>
                    <div className="text-4xl">📚</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">总消息数</p>
                      <p className="text-2xl font-bold text-purple-800 mt-1">{stats.totalMessages}</p>
                    </div>
                    <div className="text-4xl">💬</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-600 font-medium">平均会话时长</p>
                      <p className="text-2xl font-bold text-emerald-800 mt-1">
                        {stats.totalSessions > 0 ? formatDuration(Math.round(stats.totalStudyTime / stats.totalSessions)) : '0分钟'}
                      </p>
                    </div>
                    <div className="text-4xl">⚡</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'trends' && (
            <div className="space-y-6">
              {/* Daily Learning Trend */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">学习时长趋势（近14天）</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: '分钟', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      formatter={(value: any) => [`${value}分钟`, '学习时长']}
                      labelFormatter={(label: any) => `日期: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="studyTime"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="学习时长"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Daily Session Count */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">每日会话数量（近14天）</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => [`${value}次`, '会话数']}
                      labelFormatter={(label: any) => `日期: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="sessions" fill="#10b981" radius={[8, 8, 0, 0]} name="会话数" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Time of Day Pattern */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">学习时段分布（24小时）</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timePatterns.filter(p => p.sessionCount > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis label={{ value: '会话数', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        name === 'sessionCount' ? `${value}次` : formatDuration(value),
                        name === 'sessionCount' ? '会话数' : '学习时长'
                      ]}
                      labelFormatter={(label: any) => `时间: ${label}:00`}
                    />
                    <Legend />
                    <Bar dataKey="sessionCount" fill="#f59e0b" radius={[8, 8, 0, 0]} name="会话数" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Concepts Learned Trend */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">知识点积累趋势（近14天）</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: '知识点数', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      formatter={(value: any) => [`${value}个`, '新知识点']}
                      labelFormatter={(label: any) => `日期: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="conceptsLearned"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="新知识点"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {selectedTab === 'insights' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span>💡</span>
                  <span>智能学习洞察</span>
                </h3>
                {insights.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p>暂无足够数据生成洞察</p>
                    <p className="text-sm mt-2">继续学习后，我们将为您提供个性化建议</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insights.map((insight, index) => (
                      <InsightCard key={index} insight={insight} />
                    ))}
                  </div>
                )}
              </div>

              {/* Learning Strengths and Weaknesses */}
              {masteryDistribution.some(m => m.count > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-sm border border-emerald-200 p-6">
                    <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
                      <span>💪</span>
                      <span>学习强项</span>
                    </h3>
                    <div className="space-y-3">
                      {masteryDistribution
                        .filter(m => m.level === MasteryLevel.Expert && m.count > 0)
                        .map(m => (
                          <div key={m.level} className="bg-white/80 rounded-lg p-3 border border-emerald-200">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-emerald-700">专家级知识点</span>
                              <span className="text-2xl font-bold text-emerald-600">{m.count}</span>
                            </div>
                          </div>
                        ))}
                      {masteryDistribution.filter(m => m.level === MasteryLevel.Expert).every(m => m.count === 0) && (
                        <p className="text-sm text-emerald-600">暂无专家级知识点，继续努力！</p>
                          )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl shadow-sm border border-amber-200 p-6">
                    <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                      <span>📝</span>
                      <span>待提升领域</span>
                    </h3>
                    <div className="space-y-3">
                      {masteryDistribution
                        .filter(m => m.level === MasteryLevel.Novice && m.count > 0)
                        .map(m => (
                          <div key={m.level} className="bg-white/80 rounded-lg p-3 border border-amber-200">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-amber-700">新手级知识点</span>
                              <span className="text-2xl font-bold text-amber-600">{m.count}</span>
                            </div>
                          </div>
                        ))}
                      {masteryDistribution.filter(m => m.level === MasteryLevel.Novice).every(m => m.count === 0) && (
                        <p className="text-sm text-amber-600">太棒了！所有知识点都已超越新手水平</p>
                          )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'achievements' && (
            <div className="space-y-6">
              {/* Achievement Summary */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">已解锁成就</p>
                    <p className="text-4xl font-bold mt-1">
                      {unlockedAchievements.length} / {achievements.length}
                    </p>
                  </div>
                  <div className="text-6xl">🏆</div>
                </div>
                <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${(unlockedAchievements.length / achievements.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Unlocked Achievements */}
              {unlockedAchievements.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>✨</span>
                    <span>已解锁成就</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unlockedAchievements.map((achievement) => (
                      <AchievementCard key={achievement.id} achievement={achievement} />
                    ))}
                  </div>
                </div>
              )}

              {/* Locked Achievements */}
              {lockedAchievements.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>🔒</span>
                    <span>待解锁成就</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lockedAchievements.map((achievement) => (
                      <AchievementCard key={achievement.id} achievement={achievement} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============== Sub-Components ==============

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'indigo' | 'blue' | 'purple' | 'emerald';
  subtitle?: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, trend }) => {
  const colorClasses = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-600">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className={`text-3xl font-bold ${colorClasses[color].split(' ')[2]}`}>
            {value}
          </span>
          {subtitle && <span className="text-sm text-slate-500 ml-1">{subtitle}</span>}
        </div>
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-full ${colorClasses[color]} font-medium`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

interface InsightCardProps {
  insight: LearningInsight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const bgColorClasses = {
    strength: 'bg-emerald-50 border-emerald-200',
    weakness: 'bg-amber-50 border-amber-200',
    suggestion: 'bg-blue-50 border-blue-200',
    achievement: 'bg-purple-50 border-purple-200',
  };

  return (
    <div className={`rounded-xl p-4 border ${bgColorClasses[insight.type]} transition-all hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className="text-3xl">{insight.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-slate-800">{insight.title}</h4>
            {insight.priority && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                insight.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {insight.priority === 'high' ? '高优先级' : insight.priority === 'medium' ? '中优先级' : '低优先级'}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600">{insight.description}</p>
        </div>
      </div>
    </div>
  );
};

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  return (
    <div className={`relative rounded-xl p-4 border-2 transition-all ${
      achievement.unlocked
        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300'
        : 'bg-slate-50 border-slate-200 opacity-75'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`text-4xl ${achievement.unlocked ? '' : 'grayscale'}`}>
          {achievement.icon}
        </div>
        <div className="flex-1">
          <h4 className={`font-bold ${achievement.unlocked ? 'text-amber-800' : 'text-slate-600'}`}>
            {achievement.title}
          </h4>
          <p className={`text-sm mt-1 ${achievement.unlocked ? 'text-amber-700' : 'text-slate-500'}`}>
            {achievement.description}
          </p>
          {!achievement.unlocked && achievement.progress !== undefined && achievement.goal && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>进度</span>
                <span>{Math.round(achievement.progress)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${achievement.progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        {achievement.unlocked && (
          <div className="absolute top-2 right-2">
            <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningAnalytics;
