import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ComprehensiveGalleryGrid from '../../components/galleries/ComprehensiveGalleryGrid';
import { Gallery } from '../../types/gallery';
import { getGalleries, deleteGallery } from '../../lib/gallery-api';
import { Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const GalleriesPage: React.FC = () => {
  const { t } = useLanguage();
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [filteredGalleries, setFilteredGalleries] = useState<Gallery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGalleries();
  }, []);

  useEffect(() => {
    filterGalleries();
  }, [galleries, searchTerm]);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      const data = await getGalleries();
      setGalleries(data);
    } catch (err) {
      console.error('Error fetching galleries:', err);
      setError('Failed to load galleries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterGalleries = () => {
    if (!searchTerm.trim()) {
      setFilteredGalleries(galleries);
      return;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = galleries.filter(gallery => 
      gallery.title.toLowerCase().includes(lowerSearchTerm)
    );
    
    setFilteredGalleries(filtered);
  };  const handleDeleteGallery = async (id: string) => {
    try {
      setLoading(true);
      await deleteGallery(id);
      
      // Update local state
      setGalleries(prevGalleries => prevGalleries.filter(gallery => gallery.id !== id));
      setLoading(false);
    } catch (err) {
      console.error('Error deleting gallery:', err);
      setError('Failed to delete gallery. Please try again.');
      setLoading(false);
    }
  };

  const handleShareGallery = (gallery: Gallery) => {
    const url = `${window.location.origin}/gallery/${gallery.slug}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => {
          alert('Gallery link copied to clipboard!');
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          prompt('Copy this link:', url);
        });
    } else {
      prompt('Copy this link:', url);
    }
  };

  const handleEditGallery = (gallery: Gallery) => {
    // Use React Router navigation instead of window.location.href
    window.location.assign(`/admin/galleries/${gallery.id}/edit`);
  };

  const handleDuplicateGallery = (gallery: Gallery) => {
    // For now, alert the user that duplication is coming soon
    alert('Gallery duplication feature coming soon!');
  };

  const handlePreviewGallery = (gallery: Gallery) => {
    // Open gallery in a new tab
    window.open(`/gallery/${gallery.slug}`, '_blank');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{t('page.galleries')}</h1>
            <p className="text-gray-600">{t('gallery.create')}</p>
          </div>
          <Link
            to="/admin/galleries/new"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Plus size={20} className="mr-2" />
            {t('gallery.create')}
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>            <input
              type="text"
              placeholder={t('action.search') + ' galleries...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Galleries Grid */}
        {loading ? (          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
            <span className="ml-2 text-gray-600">{t('message.loading')}</span>
          </div>        ) : filteredGalleries.length > 0 ? (
          <ComprehensiveGalleryGrid 
            galleries={filteredGalleries}
            isAdmin={true}
            onDelete={handleDeleteGallery}
            onShare={handleShareGallery}
            onEdit={handleEditGallery}
            onDuplicate={handleDuplicateGallery}
            onPreview={handlePreviewGallery}
          />
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('message.noResults')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? t('message.noResults')
                : t('gallery.noImages')}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link
                  to="/admin/galleries/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  {t('gallery.create')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default GalleriesPage;