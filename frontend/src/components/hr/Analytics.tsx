import React from 'react';
import Card from '../ui/Card';

interface AnalyticsProps {
  data: {
    totalCandidates: number;
    totalInterviews: number;
    averageScore: number;
    completionRate: number;
    topSkills: Array<{ skill: string; count: number }>;
    scoreDistribution: Array<{ range: string; count: number }>;
    monthlyTrends: Array<{ month: string; interviews: number; score: number }>;
  };
}

const Analytics: React.FC<AnalyticsProps> = ({ data }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{data.totalCandidates}</div>
            <div className="text-gray-600">Total Candidates</div>
            <div className="text-sm text-green-600 mt-1">+12% from last month</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{data.totalInterviews}</div>
            <div className="text-gray-600">Interviews Conducted</div>
            <div className="text-sm text-green-600 mt-1">+8% from last month</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{data.averageScore}%</div>
            <div className="text-gray-600">Average Score</div>
            <div className="text-sm text-green-600 mt-1">+5% from last month</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{data.completionRate}%</div>
            <div className="text-gray-600">Completion Rate</div>
            <div className="text-sm text-green-600 mt-1">+3% from last month</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Skills */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Skills Assessed</h3>
          <div className="space-y-3">
            {data.topSkills.map((skill, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{skill.skill}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(skill.count / Math.max(...data.topSkills.map(s => s.count))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8">{skill.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Score Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
          <div className="space-y-3">
            {data.scoreDistribution.map((range, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{range.range}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${(range.count / Math.max(...data.scoreDistribution.map(r => r.count))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8">{range.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interviews
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.monthlyTrends.map((trend, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {trend.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {trend.interviews}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(trend.score)}`}>
                      {trend.score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      {index > 0 && trend.score > data.monthlyTrends[index - 1].score ? (
                        <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : index > 0 ? (
                        <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : null}
                      <span className={index > 0 && trend.score > data.monthlyTrends[index - 1].score ? 'text-green-600' : index > 0 ? 'text-red-600' : 'text-gray-500'}>
                        {index > 0 ? Math.abs(trend.score - data.monthlyTrends[index - 1].score) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
