import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Trash2, 
  FileText,
  User,
  CreditCard,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  ShoppingCart
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';
import { invoiceApi, type CreateInvoiceData } from '../../lib/invoice-api';
import { PRICE_LIST_CATEGORIES, getPriceListByCategory, PriceListItem } from '../../data/priceList';

interface Client {
  id: string;
  name: string;
  email: string;
  address1?: string;
  city?: string;
  country?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

interface InvoiceFormData {
  client_id: string;
  due_date: string;
  payment_terms: string;
  currency: string;
  notes?: string;
  discount_amount: number;
  items: InvoiceItem[];
}

interface AdvancedInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingInvoice?: Invoice | null;
}

interface Invoice {
  id: string;
  client_id: string;
  due_date: string;
  payment_terms: string;
  currency: string;
  notes?: string;
  discount_amount: number;
  items: InvoiceItem[];
}

const AdvancedInvoiceForm: React.FC<AdvancedInvoiceFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingInvoice
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPriceList, setShowPriceList] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<InvoiceFormData>({
    client_id: '',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    payment_terms: 'Net 30',
    currency: 'EUR',
    notes: '',
    discount_amount: 0,
    items: [
      {
        id: '1',
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: 19 // Default German VAT
      }
    ]
  });

  const steps = [
    { id: 1, title: 'Client & Details', icon: User },
    { id: 2, title: 'Line Items', icon: FileText },
    { id: 3, title: 'Payment & Terms', icon: CreditCard },
    { id: 4, title: 'Review & Create', icon: Eye }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      if (editingInvoice) {
        loadInvoiceData();
      }
    }
  }, [isOpen, editingInvoice]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from the PostgreSQL crm_clients table via Express API
      const response = await fetch('/api/crm/clients');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data && data.length > 0) {
        // Transform the CRM client data to match our Client interface
        const transformedClients = data.map((client: any) => ({
          id: client.id,
          name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.company || 'Unnamed Client',
          email: client.email || '',
          address1: client.address,
          city: client.city,
          country: client.country
        }));
        setClients(transformedClients);
        setFilteredClients(transformedClients);
        console.log(`Loaded ${transformedClients.length} clients from CRM database`);
      } else {
        // No clients found in CRM, use sample clients as fallback
        console.log('No clients found in CRM database, using sample clients');
        const sampleClients = getSampleClients();
        setClients(sampleClients);
        setFilteredClients(sampleClients);
      }
    } catch (err) {
      console.error('Error fetching clients from CRM:', err);
      setError('Failed to load clients from database');
      // Fallback to sample clients
      const sampleClients = getSampleClients();
      setClients(sampleClients);
      setFilteredClients(sampleClients);
    } finally {
      setLoading(false);
    }
  };

  // Filter clients based on search input
  const filterClients = (searchTerm: string) => {
    setClientSearch(searchTerm);
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }
    
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.address1 && client.address1.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.city && client.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredClients(filtered);
  };

  // Handle client selection
  const selectClient = (client: Client) => {
    setFormData(prev => ({ ...prev, client_id: client.id }));
    setClientSearch(client.name);
    setShowClientDropdown(false);
  };

  const getSampleClients = (): Client[] => {
    return [
      {
        id: 'sample-1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        address1: '123 Main Street',
        city: 'Boston',
        country: 'USA'
      },
      {
        id: 'sample-2', 
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        address1: '456 Oak Avenue',
        city: 'Chicago',
        country: 'USA'
      },
      {
        id: 'sample-3',
        name: 'Mike Johnson', 
        email: 'mike.johnson@test.com',
        address1: '789 Pine Street',
        city: 'Miami',
        country: 'USA'
      },
      {
        id: 'sample-4',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@demo.com', 
        address1: '321 Elm Drive',
        city: 'Seattle',
        country: 'USA'
      },
      {
        id: 'sample-5',
        name: 'Robert Brown',
        email: 'robert.brown@shop.com',
        address1: '654 Cedar Lane', 
        city: 'Portland',
        country: 'USA'
      }
    ];
  };

  const loadInvoiceData = () => {
    // This would load invoice data for editing
    // Implementation depends on the editing flow
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unit_price;
    const tax = subtotal * (item.tax_rate / 100);
    return subtotal + tax;
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0);
    const totalTax = formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price * item.tax_rate / 100), 0);
    const discount = formData.discount_amount;
    const total = subtotal + totalTax - discount;

    return { subtotal, totalTax, discount, total };
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 19
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (itemId: string) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }));
    }
  };
  const updateItem = (itemId: string, updates: Partial<InvoiceItem>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  };

  const addPriceListItem = (priceListItem: PriceListItem, quantity: number = 1) => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: priceListItem.description + (priceListItem.notes ? ` (${priceListItem.notes})` : ''),
      quantity: quantity,
      unit_price: priceListItem.price,
      tax_rate: 19 // Default German VAT
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setShowPriceList(false);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.client_id !== '' && formData.due_date !== '';
      case 2:
        return formData.items.every(item => 
          item.description.trim() !== '' && 
          item.quantity > 0 && 
          item.unit_price >= 0
        );
      case 3:
        return formData.payment_terms !== '';
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare the invoice data for the PostgreSQL API
      const invoiceData: CreateInvoiceData = {
        clientId: formData.client_id,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: formData.due_date,
        currency: formData.currency,
        paymentTerms: formData.payment_terms,
        notes: formData.notes,
        discountAmount: formData.discount_amount.toString(),
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate
        }))
      };

      // Create the invoice using PostgreSQL API
      const invoice = await invoiceApi.createInvoice(invoiceData);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: {
        return (
          <div className="space-y-6">            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Client * {clients.length > 0 && <span className="text-sm text-gray-500">({clients.length} clients available)</span>}
              </label>
              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => filterClients(e.target.value)}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder={loading ? 'Loading clients...' : 'Search clients by name, email, or location...'}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required={!formData.client_id}
                  disabled={loading}
                />
                {showClientDropdown && filteredClients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredClients.map(client => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => selectClient(client)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                        {client.city && (
                          <div className="text-xs text-gray-400">{client.city}{client.country && `, ${client.country}`}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {showClientDropdown && clientSearch && filteredClients.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                    <div className="text-gray-500 text-center">No clients found matching "{clientSearch}"</div>
                  </div>
                )}
              </div>              {clients.length === 0 && !loading && (
                <p className="mt-2 text-sm text-amber-600">
                  <AlertCircle className="inline w-4 h-4 mr-1" />
                  No clients found. Using sample clients for demo.
                </p>
              )}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => {
                    // This could open a quick client creation modal
                    alert('Quick client creation feature can be added here. For now, please go to the Clients page to add new clients.');
                  }}
                  className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add New Client
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>              </div>
            </div>
          </div>
        );
      }

      case 2: {
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowPriceList(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center text-sm"
                >
                  <ShoppingCart size={16} className="mr-1" />
                  Price List
                </button>
                <button
                  onClick={addItem}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center text-sm"
                >
                  <Plus size={16} className="mr-1" />
                  Add Item
                </button>              </div>
            </div>

            <div className="space-y-3">
              {formData.items.map((item) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-12 gap-3 items-start">
                    <div className="col-span-5">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder="Item description..."
                        className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Tax %
                      </label>
                      <input
                        type="number"
                        value={item.tax_rate}
                        onChange={(e) => updateItem(item.id, { tax_rate: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <div className="col-span-1 flex items-end">
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={formData.items.length === 1}
                        className="p-2 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-right text-sm text-gray-600">
                    Total: {formData.currency} {calculateItemTotal(item).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="text-right space-y-1">
                  <div className="text-sm text-gray-600">
                    Subtotal: {formData.currency} {calculateTotals().subtotal.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Tax: {formData.currency} {calculateTotals().totalTax.toFixed(2)}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    Total: {formData.currency} {calculateTotals().total.toFixed(2)}                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 3: {
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms *
                </label>
                <select
                  value={formData.payment_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  <option value="Net 15">Net 15 (15 days)</option>
                  <option value="Net 30">Net 30 (30 days)</option>
                  <option value="Net 60">Net 60 (60 days)</option>
                  <option value="Due on receipt">Due on receipt</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Amount
                </label>
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Additional notes for this invoice..."
              />
            </div>          </div>
        );
      }

      case 4: {
        const totals = calculateTotals();
        const selectedClient = clients.find(c => c.id === formData.client_id);
        
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Client Details</h4>
                  <p className="text-gray-600">{selectedClient?.name}</p>
                  <p className="text-gray-600">{selectedClient?.email}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Invoice Details</h4>
                  <p className="text-gray-600">Due Date: {new Date(formData.due_date).toLocaleDateString()}</p>
                  <p className="text-gray-600">Payment Terms: {formData.payment_terms}</p>
                  <p className="text-gray-600">Currency: {formData.currency}</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Line Items</h4>                <div className="space-y-2">
                  {formData.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.description} (x{item.quantity})</span>
                      <span>{formData.currency} {calculateItemTotal(item).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="space-y-1 text-right">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formData.currency} {totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span>{formData.currency} {totals.totalTax.toFixed(2)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formData.currency} {totals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>{formData.currency} {totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
                <span>{error}</span>
              </div>
            )}          </div>
        );
      }

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
            </h2>
            <p className="text-gray-600">Step {currentStep} of {steps.length}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Step Progress */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${currentStep >= step.id 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {currentStep > step.id ? (
                    <Check size={16} />
                  ) : (
                    <step.icon size={16} />
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-purple-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-px mx-4 ${
                    currentStep > step.id ? 'bg-purple-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} className="mr-1" />
            Previous
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={16} className="ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    Create Invoice
                  </>
                )}
              </button>
            )}          </div>
        </div>
      </motion.div>

      {/* Price List Modal */}
      <AnimatePresence>
        {showPriceList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
            onClick={() => setShowPriceList(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Select from Price List</h3>
                <button
                  onClick={() => setShowPriceList(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All Categories</option>
                  {PRICE_LIST_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} - {category.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price List Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getPriceListByCategory(selectedCategory).map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {PRICE_LIST_CATEGORIES.find(cat => cat.id === item.category)?.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-purple-600">
                          {item.currency} {item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {item.notes && (
                      <p className="text-xs text-amber-600 mb-3 bg-amber-50 p-2 rounded">
                        ℹ️ {item.notes}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        defaultValue="1"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        id={`qty-${item.id}`}
                        placeholder="Qty"
                      />
                      <button
                        onClick={() => {
                          const qtyInput = document.getElementById(`qty-${item.id}`) as HTMLInputElement;
                          const quantity = parseInt(qtyInput?.value || '1');
                          addPriceListItem(item, quantity);
                        }}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center justify-center"
                      >
                        <Plus size={14} className="mr-1" />
                        Add to Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {getPriceListByCategory(selectedCategory).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No items found in this category.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedInvoiceForm;
