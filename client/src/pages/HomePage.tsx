import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { ChevronRight } from 'lucide-react';
import Typewriter from 'typewriter-effect';
import CountUp from 'react-countup';
import photoGridImage from '../assets/photo-grid.jpg';
import { useLanguage } from '../context/LanguageContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const testimonials = [
    {
      name: "Sarah M.",
      image: "https://i.imgur.com/BScsxGX.jpg",
      role: "Familienshooting",
      text: "Ein wundervolles Erlebnis! Die Fotos sind einfach traumhaft geworden und die Atmosphäre war super entspannt. Unsere Kinder haben sich sofort wohlgefühlt."
    },
    {
      name: "Michael K.",
      image: "https://i.imgur.com/HGZGIGX.jpg",
      role: "Business Portrait",
      text: "Professionell, kreativ und effizient. Die Business Portraits sind genau so geworden, wie ich sie mir vorgestellt habe. Sehr zu empfehlen!"
    },
    {
      name: "Lisa & Tom",
      image: "https://i.imgur.com/fcFwAhs.jpg", 
      role: "Hochzeitsfotografie",
      text: "Unsere Hochzeitsfotos sind einfach magisch! Jeder besondere Moment wurde perfekt eingefangen. Wir sind überglücklich mit dem Ergebnis."
    },
    {
      name: "Anna W.",
      image: "https://i.imgur.com/xx3UWL7.jpg",
      role: "Schwangerschaftsshooting",
      text: "Die Schwangerschaftsfotos sind wunderschön geworden. Ich fühlte mich während des Shootings sehr wohl und die Bilder spiegeln genau diese besondere Zeit wider."
    },
    {
      name: "Maria & Peter",
      image: "https://i.imgur.com/9d98SBH.jpg",
      role: "Neugeborenen-Shooting",
      text: "Die Fotos unseres Neugeborenen sind unbezahlbar. Die Geduld und Professionalität während des Shootings war beeindruckend. Jedes Bild ist ein Kunstwerk!"
    },
    {
      name: "Christina R.",
      image: "https://i.imgur.com/8HD86CW.jpg",
      role: "Event-Fotografie",
      text: "Die Fotos von unserer Firmenveranstaltung sind fantastisch. Jeder wichtige Moment wurde festgehalten, ohne dass es gestellt wirkt. Absolut empfehlenswert!"
    }
  ];

  const faqImages = [
    {
      title: "Was macht New Age Fotografie einzigartig?",
      image: "https://i.postimg.cc/D09JNp5m/00014518.jpg",
      alt: "Unique photography style"
    },
    {
      title: "Wo finden die Fotoshootings statt?",
      image: "https://i.postimg.cc/YqFdbhxq/00505458.jpg",
      alt: "Studio and outdoor locations"
    },
    {
      title: "Wie bereiten wir uns auf das Fotoshooting vor?",
      image: "https://i.postimg.cc/66k02BNs/00509892.jpg",
      alt: "Photoshoot preparation"
    },
    {
      title: "Wie lange dauert ein Familienfotoshooting?",
      image: "https://i.postimg.cc/W1Pq6KhH/00015672.jpg",
      alt: "Family photoshoot duration"
    },
    {
      title: "Können wir Haustiere zum Fotoshooting mitbringen?",
      image: "https://i.postimg.cc/7Y1g57V7/RJGOQBO.jpg",
      alt: "Pets in photoshoot"
    },
    {
      title: "Wie sorgt ihr dafür, dass wir uns vor der Kamera wohlfühlen?",
      image: "https://i.postimg.cc/Wb070x2d/brother-sister-close-up-30x20-L.jpg",
      alt: "Bad weather alternatives"
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center justify-between">
          <div className="max-w-2xl md:w-3/5 mb-8 md:mb-0">
            <h1 className="mb-4 leading-tight text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-transparent bg-clip-text">
              {t('home.hero.title')}
            </h1>
            <div className="mb-6">
              <span className="block text-xl sm:text-2xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-600 text-transparent bg-clip-text">
                <Typewriter
                  options={{
                    strings: [t('home.hero.subtitle')],
                    autoStart: true,
                    loop: true,
                    cursor: '',
                    delay: 50,
                    deleteSpeed: 50
                  }}
                />
              </span>
              <span className="block text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 tracking-tighter animate-fade-in-up">
                {t('home.hero.subtitle')}
              </span>
            </div>
            <button 
              onClick={() => navigate('/fotoshootings')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
{t('home.hero.cta')}
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

      {/* Description Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
              {t('home.services.description1')}
            </p>
          </div>
        </div>
      </section>

      {/* Services Introduction */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          {/* First Content Block */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
            <div className="md:w-1/3">
              <div className="aspect-[4/3] overflow-hidden rounded-lg shadow-lg">
                <img 
                  src="https://i.postimg.cc/zGVgt500/Familienportrat-Wien-Krchnavy-Stolz-0105-1024x683-1.jpg"
                  alt="Familienfotografie Wien - Professionelle Familienporträts im Studio"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="md:w-2/3">
              <h2 className="text-2xl md:text-3xl font-bold text-purple-600 mb-4">
                {t('home.familyPortraits.title')}
              </h2>
              <p className="text-gray-700 mb-4">
                Wir schaffen eine komfortable Umgebung und führen Sie durch die gesamte Sitzung, damit Sie sich entspannt und selbstbewusst fühlen. Unsere <a href="/galerie" className="text-purple-600 font-semibold hover:underline">Galerie mit Beispielen Familienfotos</a> zeigt die Qualität unserer Arbeit.
              </p>
              <p className="text-gray-700 mb-4">
                <span className="font-semibold">Unsere Expertise, schmeichelhafte Winkel zu finden und natürliche, authentische Ausdrücke einzufangen,</span> stellt sicher, dass Ihre Fotos echt aussehen und sich auch so anfühlen. <a href="https://www.wien.gv.at/stadtentwicklung/projekte/zielgebiete/donaustadt/seestadt-aspern/fotowalk.html" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Wien bietet einzigartige Fotospots</a> für Outdoor-Shootings.
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Wir bieten flexible Terminplanung mit verfügbaren Terminen an Wochenenden, einschließlich Sonntagen.</span> Dadurch finden Sie leicht eine passende Zeit für Ihre Fotosession.
              </p>
            </div>
          </div>

          {/* Second Content Block */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="md:w-1/3">
              <div className="aspect-[4/3] overflow-hidden rounded-lg shadow-lg">
                <img 
                  src="https://i.imgur.com/ITKEF8q.jpg"
                  alt="Neugeborenenfotos Wien - Einfühlsame Babyfotografie im Studio"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="md:w-2/3">
              <h2 className="text-2xl md:text-3xl font-bold text-purple-600 mb-4">
                {t('home.services.title')}
              </h2>
              <p className="text-gray-700 mb-4">
{t('home.services.description1')}
              </p>
              <p className="text-gray-700 mb-4">
{t('home.services.description2')}
              </p>
              <p className="text-gray-700">
{t('home.services.description3')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Voucher Section - Link to Gutschein Page */}
      <section className="py-16 bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-purple-600 mb-8">
              {t('home.vouchers.title')}
            </h2>
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
              <p className="text-lg text-gray-700 mb-6">
                {t('home.vouchers.description')}
              </p>
              <button 
                onClick={() => navigate('/gutschein')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {t('home.vouchers.cta')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Service Cards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Family Portraits */}
            <div 
              onClick={() => navigate('/fotoshootings')}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://i.postimg.cc/V6TFF8rC/00508749.jpg"
                  alt="Familienporträts Wien - Natürliche Familienfotografie"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-2">{t('home.familyPortraits.title')}</h3>
                <p className="text-gray-600">
                  {t('home.familyPortraits.description')}
                </p>
              </div>
            </div>

            {/* Pregnancy Photography */}
            <div 
              onClick={() => navigate('/fotoshootings')}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://i.imgur.com/AMnhw6w.jpg"
                  alt="Babybauch Fotografie Wien - Schwangerschaftsfotos im Studio"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-2">Schwangerschaftsfotografie in Wien & Zurich</h3>
                <p className="text-gray-600">
                  Feiern Sie die Schönheit der Mutterschaft mit unseren Schwangerschaftssitzungen. Wir schaffen atemberaubende Bilder, die diese besondere Zeit in Ihrem Leben hervorheben.
                </p>
              </div>
            </div>

            {/* Newborn Photography */}
            <div 
              onClick={() => navigate('/fotoshootings')}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://i.imgur.com/VLYZQof.jpg"
                  alt="Neugeborenenfotos im Studio Wien - Professionelle Babyfotografie"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-2">{t('home.newbornShoots.title')}</h3>
                <p className="text-gray-600">
                  {t('home.newbornShoots.description')}
                </p>
              </div>
            </div>

            {/* Business Photography */}
            <div 
              onClick={() => navigate('/fotoshootings')}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://i.imgur.com/9RaPUSK.jpg"
                  alt="Business Headshots Wien - Professionelle Businessfotografie"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-2">{t('home.businessPortraits.title')}</h3>
                <p className="text-gray-600">
                  {t('home.businessPortraits.description')}
                </p>
              </div>
            </div>

            {/* Event Photography */}
            <div 
              onClick={() => navigate('/fotoshootings')}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://i.imgur.com/gXtGKmm.jpg"
                  alt="Event Fotografie Wien - Professionelle Veranstaltungsfotografie"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-2">Event-Fotografie in Wien & Zurich</h3>
                <p className="text-gray-600">
                  Von Firmenveranstaltungen bis hin zu privaten Feiern fangen wir die besonderen Momente Ihrer Veranstaltung ein. Lassen Sie uns Ihre wichtigen Ereignisse für die Ewigkeit festhalten.
                </p>
              </div>
            </div>

            {/* Portrait Photography */}
            <div 
              onClick={() => navigate('/fotoshootings')}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://i.imgur.com/FPhLGV1.jpg"
                  alt="Porträtfotografie Wien - Individuelle Porträts im Studio"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-2">Porträtfotografie in Wien & Zurich</h3>
                <p className="text-gray-600">
                  Ob für persönliche oder berufliche Zwecke, unsere Porträtsitzungen sind darauf ausgelegt, Ihre Persönlichkeit und Ihren einzigartigen Stil zur Geltung zu bringen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-purple-600 mb-4">
              Vertrauen Sie auf unsere Erfahrung
            </h2>
            <p className="text-lg text-gray-700">
              Über die Jahre haben wir hunderte von zufriedenen Familien fotografiert
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">
                <CountUp end={500} duration={2.5} separator="," />+
              </div>
              <p className="text-gray-700 font-medium">Zufriedene Familien</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">
                <CountUp end={1200} duration={2.5} separator="," />+
              </div>
              <p className="text-gray-700 font-medium">Fotoshootings</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">
                <CountUp end={8} duration={2.5} />+
              </div>
              <p className="text-gray-700 font-medium">Jahre Erfahrung</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">
                <CountUp end={98} duration={2.5} />%
              </div>
              <p className="text-gray-700 font-medium">Weiterempfehlungsrate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-purple-600 mb-4">
              Was unsere Kunden sagen
            </h2>
            <p className="text-lg text-gray-700">
              Lesen Sie die Erfahrungen zufriedener Familien
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                    loading="lazy"
                  />
                  <div>
                    <h4 className="font-bold text-purple-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50" id="faq">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-purple-600 mb-4">
              FAQs
            </h2>
            <p className="text-lg text-gray-700">
              Häufig gestellte Fragen zur Familienfotografie
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {faqImages.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-lg">
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={faq.image}
                    alt={faq.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-purple-900 mb-3">
                    {faq.title}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-600 font-medium">Mehr erfahren</span>
                    <ChevronRight className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-pink-500 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bereit für Ihr Familienshooting?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Kontaktieren Sie uns noch heute und lassen Sie uns unvergessliche Erinnerungen schaffen
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/fotoshootings')}
              className="bg-white text-purple-600 font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-100 transition-colors duration-300"
            >
              Termin Buchen
            </button>
            <button 
              onClick={() => navigate('/kontakt')}
              className="border-2 border-white text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-white hover:text-purple-600 transition-colors duration-300"
            >
              Kontakt Aufnehmen
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;