import React from 'react';
import { useNavigate } from 'react-router-dom';
import Typewriter from 'typewriter-effect';
import photoGridImage from '@assets/Familienportrat-Wien-Krchnavy-Stolz-0105-1024x683-1.jpg';

// Hardcoded Hero Section to prevent translation system failures
const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center justify-between">
        <div className="max-w-2xl md:w-3/5 mb-8 md:mb-0">
          <div className="mb-6">
            <h1 className="block text-xl sm:text-2xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-600 text-transparent bg-clip-text">
              <Typewriter
                options={{
                  strings: ['Endlich ein Fotostudio'],
                  autoStart: true,
                  loop: true,
                  cursor: '',
                  delay: 50,
                  deleteSpeed: 50
                }}
              />
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 mb-4">
              das spontane, natürliche und individuelle Porträts Ihrer Familie liefert...
            </p>
          </div>
          <button 
            onClick={() => navigate('/warteliste')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Book Photoshoot Now
          </button>
        </div>
        <div className="md:w-2/5">
          <img 
            src={photoGridImage}
            alt="Comprehensive family portrait showcase featuring various photography styles including family groups, couples, newborns, maternity, and lifestyle sessions"
            className="w-full rounded-lg shadow-lg"
            onError={(e) => {
              e.currentTarget.src = "https://i.postimg.cc/zGVgt500/Familienportrat-Wien-Krchnavy-Stolz-0105-1024x683-1.jpg";
            }}
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;