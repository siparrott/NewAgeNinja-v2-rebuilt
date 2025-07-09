import React, { useEffect } from 'react';
import Layout from '../components/layout/Layout';
import VoucherCard from '../components/vouchers/VoucherCard';
import CategoryFilter from '../components/vouchers/CategoryFilter';
import { useAppContext } from '../context/AppContext';
import { Search } from 'lucide-react';

const VouchersPage: React.FC = () => {
  const { filteredVouchers, selectedCategory } = useAppContext();
  const [searchTerm, setSearchTerm] = React.useState('');

  useEffect(() => {
    // SEO Meta Tags
    document.title = 'Fotoshooting Gutscheine Wien - Geschenkideen | New Age Fotografie';
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Fotoshooting Gutscheine als perfekte Geschenkidee. Familien-, Schwangerschafts- und Neugeborenen-Fotoshootings in Wien zum Verschenken.');

    return () => {
      document.title = 'New Age Fotografie - Familienfotograf Wien';
    };
  }, []);
  
  // Filter vouchers based on search term
  const displayedVouchers = searchTerm 
    ? filteredVouchers.filter(voucher => 
        voucher.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredVouchers;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          {selectedCategory ? `${selectedCategory} Fotoshooting Gutscheine Wien` : 'Fotoshooting Gutscheine Wien - Familien & Baby'}
        </h1>
        
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar with filters */}
          <div className="lg:col-span-1">
            {/* Search */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Suche</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Gutscheine suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                />
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            {/* Category Filter */}
            <CategoryFilter />
          </div>
          
          {/* Main content with vouchers */}
          <div className="lg:col-span-3">
            {displayedVouchers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedVouchers.map(voucher => (
                  <VoucherCard key={voucher.id} voucher={voucher} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Keine Gutscheine gefunden</h3>
                <p className="text-gray-600 mb-4">
                  Wir konnten keine Gutscheine finden, die Ihren Kriterien entsprechen.
                </p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Filter zurücksetzen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VouchersPage;