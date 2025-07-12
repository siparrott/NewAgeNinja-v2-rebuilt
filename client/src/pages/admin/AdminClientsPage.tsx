import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Plus, Search, Filter, Eye, Edit, Trash2, Phone, Mail, MapPin, Building } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  notes: string;
  status: 'active' | 'inactive' | 'archived';
  leadId?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, statusFilter]);

  const fetchClients = async () => {
    try {
      // Simulate API call - replace with actual endpoint
      const mockClients: Client[] = [
        {
          id: '1',
          name: 'Sarah Mueller',
          email: 'sarah@example.com',
          phone: '+43 123 456 789',
          address: 'Mariahilfer Str. 123, 1060 Wien',
          company: 'Mueller Photography',
          notes: 'Regular client, prefers outdoor sessions',
          status: 'active',
          createdAt: '2025-01-20T10:30:00Z',
          updatedAt: '2025-01-25T10:30:00Z'
        },
        {
          id: '2',
          name: 'Michael Schmidt',
          email: 'michael@example.com',
          phone: '+43 987 654 321',
          address: 'Ringstraße 45, 1010 Wien',
          company: 'Schmidt Events',
          notes: 'Wedding photographer collaboration',
          status: 'active',
          createdAt: '2025-01-18T09:15:00Z',
          updatedAt: '2025-01-24T11:20:00Z'
        },
        {
          id: '3',
          name: 'Anna Weber',
          email: 'anna@example.com',
          phone: '+43 555 123 456',
          address: 'Praterstraße 78, 1020 Wien',
          company: '',
          notes: 'New mother, interested in family packages',
          status: 'active',
          createdAt: '2025-01-15T16:45:00Z',
          updatedAt: '2025-01-23T08:30:00Z'
        },
        {
          id: '4',
          name: 'Thomas Huber',
          email: 'thomas@example.com',
          phone: '+43 777 888 999',
          address: 'Währinger Str. 234, 1180 Wien',
          company: 'Huber Consulting',
          notes: 'Corporate headshots completed',
          status: 'inactive',
          createdAt: '2025-01-10T14:20:00Z',
          updatedAt: '2025-01-22T16:00:00Z'
        }
      ];
      setClients(mockClients);
    } catch (error) {
      // console.error removed
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    setFilteredClients(filtered);
  };

  const getStatusBadge = (status: Client['status']) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      inactive: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Inactive' },
      archived: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Archived' }
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Clients Management</h1>
            <p className="text-gray-600">Manage your client database and relationships</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Add Client
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>

            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter size={20} className="mr-2" />
              More Filters
            </button>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                    {client.company && (
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Building size={14} className="mr-1" />
                        {client.company}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(client.status)}
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600 flex items-center">
                    <Mail size={14} className="mr-2" />
                    {client.email}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Phone size={14} className="mr-2" />
                    {client.phone}
                  </p>
                  {client.address && (
                    <p className="text-sm text-gray-600 flex items-start">
                      <MapPin size={14} className="mr-2 mt-0.5" />
                      {client.address}
                    </p>
                  )}
                </div>

                {client.notes && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{client.notes}</p>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Added {new Date(client.createdAt).toLocaleDateString()}
                  </span>
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
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No clients found matching your criteria.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminClientsPage;