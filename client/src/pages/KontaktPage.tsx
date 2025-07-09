import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Mail, Phone, Clock, MapPin, Train, Car } from 'lucide-react';
import { submitContactForm } from '../lib/forms';

const KontaktPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await submitContactForm(formData);
      setSuccess(true);
      setFormData({ fullName: '', email: '', phone: '', message: '' });
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Kontakt</h1>
            <p className="mt-4 text-xl text-gray-600">Ich freue mich auf Ihre Nachricht</p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-900">Kontaktinformationen</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Mail className="w-6 h-6 text-gray-600" />
                <span className="text-gray-700">hallo@newagefotografie.com</span>
              </div>
              <div className="flex items-center space-x-4">
                <Phone className="w-6 h-6 text-gray-600" />
                <span className="text-gray-700">+43 677 933 99210</span>
              </div>
              <div className="flex items-center space-x-4">
                <Clock className="w-6 h-6 text-gray-600" />
                <span className="text-gray-700">Fr-So: 09:00 - 17:00</span>
              </div>
              <div className="flex items-center space-x-4">
                <MapPin className="w-6 h-6 text-gray-600" />
                <span className="text-gray-700">Schönbrunner Str. 25, 1050 Wien, Austria</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Anfahrt</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Train className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">5 Minuten von Kettenbrückengasse</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Car className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Street parking available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Kontaktformular</h2>
            {success ? (
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-green-800">Vielen Dank für Ihre Nachricht! Ich melde mich in Kürze bei Ihnen.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-Mail</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefon</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">Nachricht</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Wird gesendet...' : 'Nachricht senden'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default KontaktPage;