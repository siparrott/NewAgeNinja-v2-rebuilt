import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Calendar, Camera, Clock, DollarSign, MapPin, TrendingUp, AlertTriangle, CheckCircle, Plus, Sun, Cloud, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isAfter } from 'date-fns';

interface PhotographySession {
  id: string;
  title: string;
  description?: string;
  sessionType: string;
  status: string;
  startTime: string;
  endTime: string;
  clientName?: string;
  clientEmail?: string;
  locationName?: string;
  basePrice?: number;
  depositAmount?: number;
  depositPaid: boolean;
  equipmentList?: string[];
  weatherDependent: boolean;
  goldenHourOptimized: boolean;
  portfolioWorthy: boolean;
  editingStatus: string;
}

interface DashboardStats {
  totalSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  totalRevenue: number;
  pendingDeposits: number;
  equipmentConflicts: number;
}

const PhotographyCalendarPage: React.FC = () => {
  const [sessions, setSessions] = useState<PhotographySession[]>([]);
  const [selectedSession, setSelectedSession] = useState<PhotographySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeView, setActiveView] = useState('calendar');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sessionType: 'portrait',
    status: 'scheduled',
    startTime: '',
    endTime: '',
    clientName: '',
    clientEmail: '',
    locationName: '',
    basePrice: '',
    depositAmount: '',
    equipmentList: [] as string[],
    weatherDependent: false,
    goldenHourOptimized: false,
    portfolioWorthy: false
  });

  // Mock stats - will be replaced with real data
  const stats: DashboardStats = {
    totalSessions: 45,
    upcomingSessions: 12,
    completedSessions: 33,
    totalRevenue: 18750,
    pendingDeposits: 3,
    equipmentConflicts: 1
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/photography/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        console.log('No sessions found or API not ready yet');
        setSessions([]);
      }
    } catch (error) {
      console.log('Sessions API not ready yet, showing demo interface');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => 
      isSameDay(parseISO(session.startTime), date)
    );
  };

  const getSessionTypeColor = (sessionType: string) => {
    const colors = {
      'wedding': 'bg-pink-100 border-pink-300 text-pink-800',
      'portrait': 'bg-blue-100 border-blue-300 text-blue-800',
      'commercial': 'bg-green-100 border-green-300 text-green-800',
      'event': 'bg-purple-100 border-purple-300 text-purple-800',
      'family': 'bg-orange-100 border-orange-300 text-orange-800',
      'fashion': 'bg-indigo-100 border-indigo-300 text-indigo-800',
    };
    return colors[sessionType as keyof typeof colors] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'in-progress': return <Camera className="w-3 h-3 text-blue-600" />;
      case 'scheduled': return <Clock className="w-3 h-3 text-orange-600" />;
      case 'cancelled': return <AlertTriangle className="w-3 h-3 text-red-600" />;
      default: return <Clock className="w-3 h-3 text-gray-600" />;
    }
  };

  const handleCreateSession = () => {
    setShowSessionForm(true);
  };

  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const sessionData = {
        ...formData,
        basePrice: formData.basePrice ? parseFloat(formData.basePrice) : undefined,
        depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : undefined,
        equipmentList: formData.equipmentList.filter(item => item.trim() !== ''),
        startTime: formData.startTime,
        endTime: formData.endTime
      };

      const response = await fetch('/api/photography/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        setShowSessionForm(false);
        setFormData({
          title: '',
          description: '',
          sessionType: 'portrait',
          status: 'scheduled',
          startTime: '',
          endTime: '',
          clientName: '',
          clientEmail: '',
          locationName: '',
          basePrice: '',
          depositAmount: '',
          equipmentList: [],
          weatherDependent: false,
          goldenHourOptimized: false,
          portfolioWorthy: false
        });
        fetchSessions(); // Refresh the sessions list
      } else {
        alert('Failed to create session. Please try again.');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error creating session. Please try again.');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addEquipmentItem = () => {
    const equipment = prompt('Enter equipment item:');
    if (equipment) {
      setFormData(prev => ({
        ...prev,
        equipmentList: [...prev.equipmentList, equipment]
      }));
    }
  };

  const removeEquipmentItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipmentList: prev.equipmentList.filter((_, i) => i !== index)
    }));
  };

  const handleSessionClick = (session: PhotographySession) => {
    setSelectedSession(session);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Photography Calendar</h1>
            <p className="text-gray-600 mt-1">
              Advanced photography session management system with equipment tracking and client workflow tools
            </p>
          </div>
          <button 
            onClick={handleCreateSession}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Camera className="w-4 h-4" />
            <span>New Session</span>
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Sessions</span>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-gray-500">All time</p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Upcoming</span>
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
            <p className="text-xs text-gray-500">Next 30 days</p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Completed</span>
              <CheckCircle className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.completedSessions}</div>
            <p className="text-xs text-gray-500">This month</p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Revenue</span>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500">This month</p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Pending Deposits</span>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.pendingDeposits}</div>
            <p className="text-xs text-gray-500">
              {stats.pendingDeposits > 0 ? 'Need attention' : 'All current'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Equipment Conflicts</span>
              <AlertTriangle className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.equipmentConflicts}</div>
            <p className="text-xs text-gray-500">
              {stats.equipmentConflicts > 0 ? 'Needs resolution' : 'All clear'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={handleCreateSession}
              className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-gray-50"
            >
              <Camera className="w-6 h-6" />
              <span className="text-sm">Schedule Session</span>
            </button>
            <button className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-gray-50">
              <MapPin className="w-6 h-6" />
              <span className="text-sm">Location Scouting</span>
            </button>
            <button className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-gray-50">
              <CheckCircle className="w-6 h-6" />
              <span className="text-sm">Equipment Check</span>
            </button>
            <button className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-gray-50">
              <TrendingUp className="w-6 h-6" />
              <span className="text-sm">Revenue Report</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">New Photography Calendar Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Sun className="w-5 h-5 text-yellow-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Golden Hour Optimization</h4>
                <p className="text-sm text-gray-600">Automatically suggests optimal shooting times based on location and season</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Cloud className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Weather Integration</h4>
                <p className="text-sm text-gray-600">Real-time weather monitoring with automatic backup planning</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Camera className="w-5 h-5 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Equipment Management</h4>
                <p className="text-sm text-gray-600">Smart conflict detection and rental coordination</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Star className="w-5 h-5 text-orange-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Portfolio Tracking</h4>
                <p className="text-sm text-gray-600">Identify portfolio gaps and high-value sessions</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">AI-Powered Analytics</h4>
                <p className="text-sm text-gray-600">Booking patterns and revenue forecasting insights</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Workflow Automation</h4>
                <p className="text-sm text-gray-600">Post-shoot pipeline with editing and delivery tracking</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex space-x-1">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 border rounded hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 border rounded hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-1 rounded ${activeView === 'calendar' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
                onClick={() => setActiveView('calendar')}
              >
                Calendar
              </button>
              <button 
                className={`px-3 py-1 rounded ${activeView === 'timeline' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
                onClick={() => setActiveView('timeline')}
              >
                Timeline
              </button>
              <button 
                className={`px-3 py-1 rounded ${activeView === 'overview' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
                onClick={() => setActiveView('overview')}
              >
                Shoot Overview
              </button>
            </div>
          </div>

          {activeView === 'calendar' && (
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {daysInMonth.map(day => {
                const daySession = getSessionsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[120px] p-2 border-b border-r cursor-pointer hover:bg-gray-50 ${
                      !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                    } ${isSelected ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="text-sm font-medium mb-1">
                      {format(day, 'd')}
                    </div>
                    
                    {isCurrentMonth && (
                      <div className="space-y-1">
                        {daySession.slice(0, 3).map(session => (
                          <div
                            key={session.id}
                            className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm ${getSessionTypeColor(session.sessionType)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSessionClick(session);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate flex-1">{session.title}</span>
                              {getStatusIcon(session.status)}
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              {session.goldenHourOptimized && (
                                <Sun className="w-2 h-2 text-yellow-600" />
                              )}
                              {session.weatherDependent && (
                                <Cloud className="w-2 h-2 text-blue-600" />
                              )}
                              {session.portfolioWorthy && (
                                <Star className="w-2 h-2 text-purple-600" />
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {daySession.length > 3 && (
                          <div className="text-xs text-gray-500 p-1">
                            +{daySession.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeView === 'timeline' && (
            <div className="text-center py-12">
              <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Timeline View</h3>
              <p className="text-gray-600">
                Chronological session timeline with travel time optimization and equipment scheduling.
              </p>
            </div>
          )}

          {activeView === 'overview' && (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Shoot Overview</h3>
              <p className="text-gray-600">
                Equipment needs, crew coordination, and revenue pipeline dashboard for upcoming sessions.
              </p>
            </div>
          )}
        </div>

        {/* Session Legend */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Session Types & Indicators</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-200 rounded border border-pink-300"></div>
              <span>Wedding</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-200 rounded border border-blue-300"></div>
              <span>Portrait</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-200 rounded border border-green-300"></div>
              <span>Commercial</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-200 rounded border border-purple-300"></div>
              <span>Event</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sun className="w-3 h-3 text-yellow-600" />
              <span>Golden Hour</span>
            </div>
            <div className="flex items-center space-x-2">
              <Cloud className="w-3 h-3 text-blue-600" />
              <span>Weather Dependent</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-3 h-3 text-purple-600" />
              <span>Portfolio Worthy</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>Completed</span>
            </div>
          </div>
        </div>

        {/* Session Form Modal */}
        {showSessionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">Create New Photography Session</h3>
              
              <form onSubmit={handleSubmitSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Session Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Session Type</label>
                  <select
                    value={formData.sessionType}
                    onChange={(e) => handleInputChange('sessionType', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="wedding">Wedding</option>
                    <option value="commercial">Commercial</option>
                    <option value="event">Event</option>
                    <option value="family">Family</option>
                    <option value="fashion">Fashion</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Client Name</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.locationName}
                    onChange={(e) => handleInputChange('locationName', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Base Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.basePrice}
                      onChange={(e) => handleInputChange('basePrice', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Deposit ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.depositAmount}
                      onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Equipment List</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.equipmentList.map((item, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center">
                        {item}
                        <button
                          type="button"
                          onClick={() => removeEquipmentItem(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addEquipmentItem}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Equipment
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.weatherDependent}
                      onChange={(e) => handleInputChange('weatherDependent', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Weather Dependent</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.goldenHourOptimized}
                      onChange={(e) => handleInputChange('goldenHourOptimized', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Golden Hour Optimized</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.portfolioWorthy}
                      onChange={(e) => handleInputChange('portfolioWorthy', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Portfolio Worthy</span>
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                  >
                    Create Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSessionForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PhotographyCalendarPage;