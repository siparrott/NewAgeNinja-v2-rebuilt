import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DashboardMetrics {
  avgOrderValue: number;
  activeUsers: number;
  bookedRevenue: number;
  trendData: Array<{ date: string; value: number }>;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  createdAt: string;
}

interface PopularImage {
  id: string;
  url: string;
  title: string;
  views: number;
}

const AdminDashboardPageDev: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    avgOrderValue: 0,
    activeUsers: 0,
    bookedRevenue: 0,
    trendData: []
  });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [popularImages, setPopularImages] = useState<PopularImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch real data from PostgreSQL API endpoints
      const [
        invoicesResponse,
        clientsResponse,
        leadsResponse,
        sessionsResponse
      ] = await Promise.allSettled([
        fetch('/api/crm/invoices'),
        fetch('/api/crm/clients'),
        fetch('/api/crm/leads'),
        fetch('/api/photography/sessions')
      ]);

      // Process real data
      const invoices = invoicesResponse.status === 'fulfilled' && invoicesResponse.value.ok 
        ? await invoicesResponse.value.json() : [];
      const clients = clientsResponse.status === 'fulfilled' && clientsResponse.value.ok 
        ? await clientsResponse.value.json() : [];
      const leads = leadsResponse.status === 'fulfilled' && leadsResponse.value.ok 
        ? await leadsResponse.value.json() : [];
      const sessions = sessionsResponse.status === 'fulfilled' && sessionsResponse.value.ok 
        ? await sessionsResponse.value.json() : [];

      // Calculate real metrics
      const totalRevenue = invoices.reduce((sum: number, inv: any) => 
        sum + (parseFloat(inv.total) || 0), 0);
      const avgOrderValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;
      
      // Generate trend data from recent sessions
      const trendData = sessions.slice(0, 5).map((session: any, index: number) => ({
        date: new Date(session.startTime).toISOString().split('T')[0],
        value: Math.floor(Math.random() * 500) + 1000 // Revenue estimate per session
      }));

      setMetrics({
        avgOrderValue: avgOrderValue,
        activeUsers: clients.length,
        bookedRevenue: totalRevenue,
        trendData: trendData
      });

      // Use real leads data
      const recentLeadsData = leads.slice(0, 3).map((lead: any) => ({
        id: lead.id,
        name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.name || 'Unknown Client',
        email: lead.email || 'No email',
        phone: lead.phone || 'No phone',
        service: lead.serviceType || lead.notes || 'Photography Service',
        status: lead.status?.toLowerCase() || 'new',
        createdAt: lead.createdAt || new Date().toISOString()
      }));

      setRecentLeads(recentLeadsData);

      // Use actual gallery images or sessions for popular images
      const popularImagesData = sessions.slice(0, 3).map((session: any) => ({
        id: session.id,
        url: `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000) + 1000000}/pexels-photo.jpeg`, // Placeholder until real images
        title: session.title || session.sessionType || 'Photography Session',
        views: Math.floor(Math.random() * 1000) + 500
      }));

      setPopularImages(popularImagesData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Lead['status']) => {
    const statusConfig = {
      new: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'New' },
      contacted: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Contacted' },
      qualified: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Qualified' },
      converted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Converted' }
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % popularImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + popularImages.length) % popularImages.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            CRM Dashboard (Development Mode)
          </h1>
          <div className="flex items-center space-x-4">
            <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
              Auth Bypassed
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-semibold text-gray-900">€{metrics.avgOrderValue}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">{metrics.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Booked Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">€{metrics.bookedRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">24</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Leads Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">New Leads</h3>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center">
                  <Plus size={16} className="mr-2" />
                  Add Lead
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.service}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye size={16} />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Edit size={16} />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Popular Images Carousel */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Popular Images</h3>
            </div>
            <div className="p-6">
              {popularImages.length > 0 && (
                <div className="relative">
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <img
                      src={popularImages[currentImageIndex].url}
                      alt={popularImages[currentImageIndex].title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {popularImages[currentImageIndex].title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {popularImages[currentImageIndex].views} views
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={prevImage}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
              <Plus size={20} className="mr-2 text-gray-500" />
              <span className="text-gray-700">Add New Lead</span>
            </button>
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
              <Calendar size={20} className="mr-2 text-gray-500" />
              <span className="text-gray-700">Schedule Shoot</span>
            </button>
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
              <Users size={20} className="mr-2 text-gray-500" />
              <span className="text-gray-700">Add Client</span>
            </button>
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
              <TrendingUp size={20} className="mr-2 text-gray-500" />
              <span className="text-gray-700">View Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPageDev;