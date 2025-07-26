import React, { useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Camera } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const FotoshootingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // SEO Meta Tags
    document.title = t('photoshoots.title');
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', t('photoshoots.subtitle'));

    // Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', t('photoshoots.title'));

    return () => {
      document.title = 'New Age Fotografie - Familienfotograf Wien';
    };
  }, [t]);

  const shootingTypes = [
    {
      title: t('photoshoots.familyPortraits.title'),
      description: t('photoshoots.familyPortraits.description'),
      image: 'https://i.postimg.cc/gcKwDrqv/Baby-Pink-Bubbles-20x20.jpg',
      link: '/gutschein/family'
    },
    {
      title: t('photoshoots.maternity.title'),
      description: t('photoshoots.maternity.description'),
      image: 'https://i.postimg.cc/WzrVSs3F/3-J9-A3679-renamed-3632.jpg',
      link: '/gutschein/maternity'
    },
    {
      title: t('photoshoots.newborn.title'),
      description: t('photoshoots.newborn.description'),
      image: 'https://i.postimg.cc/43YQ9VD4/4-S8-A4770-105-1024x683-Copy.jpg',
      link: '/gutschein/newborn'
    },
    {
      title: t('photoshoots.business.title'),
      description: t('photoshoots.business.description'),
      image: 'https://i.postimg.cc/RZjf8FsX/Whats-App-Image-2025-05-24-at-2-38-45-PM-1.jpg',
      link: '/fotoshootings/business'
    },
    {
      title: t('photoshoots.events.title'),
      description: t('photoshoots.events.description'),
      image: 'https://i.postimg.cc/907tz7nR/21469528-10155302675513124-226449768-n.jpg',
      link: '/fotoshootings/event'
    },
    {
      title: t('photoshoots.weddings.title'),
      description: t('photoshoots.weddings.description'),
      image: 'https://i.postimg.cc/j50XzC6p/4S8A7207.jpg',
      link: '/fotoshootings/wedding'
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-purple-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('photoshoots.hero.title')}
            </h1>
            <p className="text-purple-100 text-lg">
              {t('photoshoots.hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {shootingTypes.map((type, index) => (
              <div key={index} className="mb-12">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-purple-900 mb-4">{type.title}</h2>
                  <p className="text-gray-600">{type.description}</p>
                </div>

                <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-8">
                  <img 
                    src={type.image}
                    alt={type.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <button
                      onClick={() => navigate(type.link)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-lg transition-colors transform hover:scale-105"
                    >
                      {t('action.view')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <Clock size={48} className="text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('photoshoots.features.flexible')}</h3>
              <p className="text-gray-600">
                {t('photoshoots.features.flexibleDesc')}
              </p>
            </div>
            <div className="text-center">
              <Users size={48} className="text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('photoshoots.features.family')}</h3>
              <p className="text-gray-600">
                {t('photoshoots.features.familyDesc')}
              </p>
            </div>
            <div className="text-center">
              <Camera size={48} className="text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('photoshoots.features.professional')}</h3>
              <p className="text-gray-600">
                {t('photoshoots.features.professionalDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FotoshootingsPage;