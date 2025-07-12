import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  FileText,
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'pending' | 'overdue' | 'cancelled';
  due_date: string;
  notes?: string;
  created_at: string;
}

const InvoicesPageSimple: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/crm/invoices', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const data = await response.json();
      
      // Format the data to match expected interface
      const formattedInvoices = data.map((invoice: any) => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id,
        client_name: invoice.client_name || 'Unknown Client',
        amount: parseFloat(invoice.subtotal || 0),
        tax_amount: parseFloat(invoice.tax_amount || 0), 
        total_amount: parseFloat(invoice.total || 0),
        status: invoice.status?.toLowerCase() || 'pending',
        due_date: invoice.due_date,
        notes: invoice.notes || '',
        created_at: invoice.created_at
      }));
      
      setInvoices(formattedInvoices || []);
    } catch (err) {
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sent' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getTotalStats = () => {
    if (!invoices || invoices.length === 0) {
      return { totalAmount: 0, paidAmount: 0, overdueAmount: 0 };
    }
    
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const paidAmount = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const overdueAmount = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    return { totalAmount, paidAmount, overdueAmount };
  };

  const stats = getTotalStats();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Invoices Management</h1>
            <p className="text-gray-600">Create, send, and track client invoices</p>
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center">
            <Plus size={20} className="mr-2" />
            Create Invoice
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoiced</p>
                <p className="text-2xl font-semibold text-gray-900">€{stats.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                <p className="text-2xl font-semibold text-gray-900">€{(stats.paidAmount || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
                <p className="text-2xl font-semibold text-gray-900">€{(stats.overdueAmount || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
              <span className="ml-2 text-gray-600">Loading invoices...</span>
            </div>
          ) : invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-purple-100 rounded-lg mr-3">
                            <FileText className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{invoice.invoice_number}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(invoice.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{invoice.client_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">€{invoice.total_amount.toFixed(2)}</p>
                          {invoice.tax_amount > 0 && (
                            <p className="text-sm text-gray-500">+ €{invoice.tax_amount.toFixed(2)} tax</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900" title="View">
                            <Eye size={16} />
                          </button>
                          <button className="text-green-600 hover:text-green-900" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button className="text-red-600 hover:text-red-900" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new invoice.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default InvoicesPageSimple;