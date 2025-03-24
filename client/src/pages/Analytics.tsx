import React, { useEffect, useState } from 'react';
import TopNavbar from '@/components/layout/TopNavbar';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useObligations } from '@/hooks/useObligations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Obligation } from '@/types';
import { OBLIGATION_TYPES, OBLIGATION_STATUSES } from '@/constants';

interface AnalyticsData {
  typeCounts: { name: string; value: number }[];
  statusCounts: { name: string; value: number }[];
  upcomingObligations: Obligation[];
  overdueObligations: Obligation[];
  monthlyObligations: { name: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B', '#4CAF50'];

const Analytics: React.FC = () => {
  const { obligations, isLoading } = useObligations({});
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    typeCounts: [],
    statusCounts: [],
    upcomingObligations: [],
    overdueObligations: [],
    monthlyObligations: []
  });
  
  useEffect(() => {
    if (!obligations || obligations.length === 0 || isLoading) return;
    
    // Process obligations to generate analytics data
    const typeMap = new Map<string, number>();
    const statusMap = new Map<string, number>();
    const monthMap = new Map<string, number>();
    const upcoming: Obligation[] = [];
    const overdue: Obligation[] = [];
    
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    // Initialize maps with all possible values to ensure all categories are shown
    OBLIGATION_TYPES.forEach(type => {
      typeMap.set(type.label, 0);
    });
    
    OBLIGATION_STATUSES.forEach(status => {
      statusMap.set(status.label, 0);
    });
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    monthNames.forEach(month => {
      monthMap.set(month, 0);
    });
    
    obligations.forEach(obligation => {
      // Count by type
      const typeLabel = OBLIGATION_TYPES.find(t => t.value === obligation.type)?.label || obligation.type;
      typeMap.set(typeLabel, (typeMap.get(typeLabel) || 0) + 1);
      
      // Count by status
      const statusLabel = OBLIGATION_STATUSES.find(s => s.value === obligation.status)?.label || obligation.status;
      statusMap.set(statusLabel, (statusMap.get(statusLabel) || 0) + 1);
      
      // Process due dates for upcoming/overdue and monthly distribution
      if (obligation.due_date) {
        const dueDate = new Date(obligation.due_date);
        
        // Check if obligation is upcoming (due within 30 days and not overdue)
        if (dueDate > now && dueDate <= thirtyDaysFromNow) {
          upcoming.push(obligation);
        }
        
        // Check if obligation is overdue
        if (dueDate < now && obligation.status !== 'completed') {
          overdue.push(obligation);
        }
        
        // Count by month
        const month = monthNames[dueDate.getMonth()];
        monthMap.set(month, (monthMap.get(month) || 0) + 1);
      }
    });
    
    // Convert maps to arrays for charts
    const typeCounts = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));
    const statusCounts = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));
    const monthlyObligations = Array.from(monthMap.entries()).map(([name, count]) => ({ name, count }));
    
    setAnalyticsData({
      typeCounts,
      statusCounts,
      upcomingObligations: upcoming.sort((a, b) => {
        if (!a.due_date || !b.due_date) return 0;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }).slice(0, 5),
      overdueObligations: overdue.sort((a, b) => {
        if (!a.due_date || !b.due_date) return 0;
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
      }).slice(0, 5),
      monthlyObligations
    });
  }, [obligations, isLoading]);
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <TopNavbar title="Analytics" />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-montserrat font-bold text-3xl text-[#0F2B46] mb-2">Analytics</h1>
            <p className="text-gray-600">Insights and statistics for your contractual obligations</p>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">Loading analytics data...</div>
          ) : (
            <>
              {/* Distribution Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Obligation Types Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Obligation Types</CardTitle>
                    <CardDescription>Distribution of obligations by type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.typeCounts}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analyticsData.typeCounts.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Obligation Status Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Obligation Status</CardTitle>
                    <CardDescription>Current status of all obligations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.statusCounts}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analyticsData.statusCounts.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Monthly Distribution */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Monthly Obligation Distribution</CardTitle>
                  <CardDescription>Number of obligations due each month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.monthlyObligations}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Obligations" fill="#26E07F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Upcoming and Overdue */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Obligations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Obligations</CardTitle>
                    <CardDescription>Due in the next 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.upcomingObligations.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No upcoming obligations</div>
                    ) : (
                      <div className="space-y-3">
                        {analyticsData.upcomingObligations.map(obligation => (
                          <div key={obligation.id} className="p-3 border border-gray-100 rounded-md">
                            <div className="flex items-start gap-2">
                              <div className={`
                                w-2 h-2 rounded-full mt-2
                                ${obligation.type === 'payment' ? 'bg-blue-500' :
                                  obligation.type === 'delivery' ? 'bg-green-500' :
                                  obligation.type === 'reporting' ? 'bg-purple-500' :
                                  obligation.type === 'compliance' ? 'bg-teal-500' :
                                  obligation.type === 'renewal' ? 'bg-orange-500' :
                                  obligation.type === 'termination' ? 'bg-red-500' :
                                  'bg-gray-500'}
                              `} />
                              <div>
                                <p className="font-medium">{obligation.text}</p>
                                <div className="flex justify-between mt-1">
                                  <span className="text-sm text-gray-500">
                                    {obligation.responsible_party || 'Not assigned'}
                                  </span>
                                  <span className="text-sm font-semibold">
                                    {obligation.due_date ? new Date(obligation.due_date).toLocaleDateString() : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Overdue Obligations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Overdue Obligations</CardTitle>
                    <CardDescription>Past due and not completed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.overdueObligations.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No overdue obligations</div>
                    ) : (
                      <div className="space-y-3">
                        {analyticsData.overdueObligations.map(obligation => (
                          <div key={obligation.id} className="p-3 border border-red-100 rounded-md">
                            <div className="flex items-start gap-2">
                              <div className={`
                                w-2 h-2 rounded-full mt-2
                                ${obligation.type === 'payment' ? 'bg-blue-500' :
                                  obligation.type === 'delivery' ? 'bg-green-500' :
                                  obligation.type === 'reporting' ? 'bg-purple-500' :
                                  obligation.type === 'compliance' ? 'bg-teal-500' :
                                  obligation.type === 'renewal' ? 'bg-orange-500' :
                                  obligation.type === 'termination' ? 'bg-red-500' :
                                  'bg-gray-500'}
                              `} />
                              <div>
                                <p className="font-medium">{obligation.text}</p>
                                <div className="flex justify-between mt-1">
                                  <span className="text-sm text-gray-500">
                                    {obligation.responsible_party || 'Not assigned'}
                                  </span>
                                  <span className="text-sm font-semibold text-red-500">
                                    Due {obligation.due_date ? new Date(obligation.due_date).toLocaleDateString() : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default Analytics;
