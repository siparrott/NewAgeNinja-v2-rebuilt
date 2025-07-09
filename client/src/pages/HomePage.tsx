import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { ChevronRight } from 'lucide-react';
import Typewriter from 'typewriter-effect';
import CountUp from 'react-countup';
import photoGridImage from '../assets/photo-grid.jpg';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

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
            <h1 className="mb-4 leading-tight">
              <span className="block text-2xl sm:text-3xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-600 text-transparent bg-clip-text">
                <Typewriter
                  options={{
                    strings: ['Endlich ein Fotostudio...'],
                    autoStart: true,
                    loop: true,
                    cursor: '',
                    delay: 50,
                    deleteSpeed: 50,
                    pauseFor: 2500
                  }}
                />
              </span>
              <span className="block text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 tracking-tighter animate-fade-in-up">
                das spontane, natürliche und individuelle Porträts Ihrer Familie liefert...
              </span>
            </h1>
            <p className="text-base sm:text-lg mb-4 tracking-tighter text-gray-900">
              Selbst wenn Sie kamerascheu sind oder unberechenbare Kinder haben, keine Sorge, wir erstellen Familienporträts, die Sie für immer schätzen werden.
            </p>
            <button 
              onClick={() => navigate('/fotoshootings')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Jetzt Shooting Buchen
            </button>
          </div>
          <div className="md:w-2/5">
            <img 
              src={photoGridImage}
              alt="Comprehensive family portrait showcase featuring various photography styles including family groups, couples, newborns, maternity, and lifestyle sessions"
              className="w-full rounded-lg shadow-lg"
              onError={(e) => {
                // Fallback for mobile/loading issues
                console.log('Image failed to load, using fallback');
                e.currentTarget.src = "https://i.postimg.cc/zGVgt500/Familienportrat-Wien-Krchnavy-Stolz-0105-1024x683-1.jpg";
              }}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Counter Section */}
      <section className="bg-gradient-to-r from-pink-500 to-purple-600 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="text-white">
              <div className="text-3xl md:text-4xl font-bold mb-2">
                <CountUp end={27156} duration={2.5} separator="," />
              </div>
              <div className="text-base md:text-lg text-white/90">Glückliche Familien</div>
            </div>
            <div className="text-white">
              <div className="text-3xl md:text-4xl font-bold mb-2">
                <CountUp end={5431977} duration={2.5} separator="," />
              </div>
              <div className="text-base md:text-lg text-white/90">Porträts eingefangen</div>
            </div>
            <div className="text-white">
              <div className="text-3xl md:text-4xl font-bold mb-2">
                <CountUp end={27} duration={2.5} />
              </div>
              <div className="text-base md:text-lg text-white/90">Jahre Berufserfahrung</div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* First Content Block */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
            <div className="md:w-1/3">
              <div className="aspect-[4/3] overflow-hidden rounded-lg shadow-lg">
                <img 
                  src="https://i.postimg.cc/zGVgt500/Familienportrat-Wien-Krchnavy-Stolz-0105-1024x683-1.jpg"
                  alt="Family portrait session"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="md:w-2/3">
              <h2 className="text-2xl md:text-3xl font-bold text-purple-600 mb-4">
                Ihr Moment, Ihr Zauber ✨
              </h2>
              <p className="text-gray-700 mb-4">
                Wir schaffen eine komfortable Umgebung und führen Sie durch die gesamte Sitzung, damit Sie sich entspannt und selbstbewusst fühlen.
              </p>
              <p className="text-gray-700 mb-4">
                <span className="font-semibold">Unsere Expertise, schmeichelhafte Winkel zu finden und natürliche, authentische Ausdrücke einzufangen,</span> stellt sicher, dass Ihre Fotos echt aussehen und sich auch so anfühlen.
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
                  alt="Newborn photography session"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="md:w-2/3">
              <h2 className="text-2xl md:text-3xl font-bold text-purple-600 mb-4">
                Flexible Termine – Kein Stress, nur Spaß! 🎯
              </h2>
              <p className="text-gray-700 mb-4">
                Erleben Sie <span className="font-semibold">maßgeschneiderte Fotoshootings in unserem kundenorientierten Studio.</span> Wir legen großen Wert auf Details und schaffen eine komfortable Umgebung.
              </p>
              <p className="text-gray-700 mb-4">
                <span className="font-semibold">Unsere professionellen Fotografen finden die schmeichelhaftesten Winkel und fangen authentische Ausdrücke ein.</span> Unsere zeitlosen Fotos werden zu wertvollen Erinnerungen.
              </p>
              <p className="text-gray-700">
                Als familienfreundliches Studio bieten wir eine entspannte und stressfreie Atmosphäre für unvergessliche Shootings. <span className="font-semibold">Kontaktieren Sie uns noch heute!</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Blocks */}
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
                  alt="Family portrait"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-2">Familienporträts in Wien & Zurich</h3>
                <p className="text-gray-600">
                  Unsere Familiensitzungen drehen sich darum, die einzigartige Bindung festzuhalten, die Sie teilen. Von spontanen Momenten bis hin zu inszenierten Porträts schaffen wir Bilder, die Sie für immer schätzen werden.
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
                  alt="Pregnancy photography"
                  className="w-full h-full object-cover"
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
                  alt="Newborn photography"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-2">Neugeborenenfotografie in Wien & Zurich</h3>
                <p className="text-gray-600">
                  Es gibt nichts Zarteres als die ersten Tage im Leben eines Neugeborenen. Unsere Neugeborenensitzungen konzentrieren sich darauf, diese flüchtigen Momente mit Zärtlichkeit und Sorgfalt einzufangen.
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
                  alt="Business photography"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-2">Firmenfotografie in Wien & Zurich</h3>
                <p className="text-gray-600">
                  Verbessern Sie Ihr professionelles Image mit unseren Firmenfotografie-Dienstleistungen. Von Porträts bis hin zu Teamfotos helfen wir Ihnen, Ihr Unternehmen im besten Licht zu präsentieren.
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
                  src="https://i.imgur.com/0KAHvWd.jpg"
                  alt="Event photography"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-2">Eventfotografie in Wien & Zurich</h3>
                <p className="text-gray-600">
                  Es gibt nichts Aufregenderes als die unvergesslichen Momente bei Veranstaltungen. Unsere Eventfotografie konzentriert sich darauf, diese besonderen Augenblicke mit Kreativität und Professionalität festzuhalten.
                </p>
              </div>
            </div>

            {/* Wedding Photography */}
            <div 
              onClick={() => navigate('/fotoshootings')}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg"
                  alt="Wedding photography"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-2">Hochzeitsfotografie in Wien & Zurich</h3>
                <p className="text-gray-600">
                  Es gibt nichts Schöneres als die Magie eines Hochzeitstages. Unsere Hochzeitsfotografie fängt diese magischen Momente mit Liebe zum Detail und künstlerischem Flair ein.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Title Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-purple-900">
            Erstklassiges Portraitstudio in Wien & Zürich | Familien-, Neugeborenen-, Schwangerschafts- & Unternehmensfotografie
          </h2>
        </div>
      </section>

      {/* Voucher Grid Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Pregnancy Photoshoot */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://i.imgur.com/Vd6xtPg.jpg"
                  alt="Pregnancy photoshoot"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-2">Schwangerschafts-Shooting</h3>
                <p className="text-gray-600 mb-4">Professionelle Fotografie für werdende Mütter</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-purple-600">€199</span>
                  <button 
                    onClick={() => navigate('/gutschein/maternity')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full transition-colors"
                  >
                    Jetzt Buchen
                  </button>
                </div>
              </div>
            </div>

            {/* Family Photoshoot */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://i.imgur.com/4m5hoL9.jpg"
                  alt="Family photoshoot"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-2">Familien-Shooting</h3>
                <p className="text-gray-600 mb-4">Unvergessliche Momente für die ganze Familie</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-purple-600">€249</span>
                  <button 
                    onClick={() => navigate('/gutschein/family')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full transition-colors"
                  >
                    Jetzt Buchen
                  </button>
                </div>
              </div>
            </div>

            {/* Newborn Photoshoot */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://i.imgur.com/QWOgLqX.jpg"
                  alt="Newborn photoshoot"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-2">Neugeborenen-Shooting</h3>
                <p className="text-gray-600 mb-4">Erste Momente Ihres kleinen Wunders</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-purple-600">€299</span>
                  <button 
                    onClick={() => navigate('/gutschein/newborn')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full transition-colors"
                  >
                    Jetzt Buchen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-purple-900">
            Was unsere Kunden sagen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-800">{testimonial.name}</h3>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-purple-900">
            Häufig gestellte Fragen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {faqImages.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="aspect-[4/3] overflow-hidden rounded-lg mb-6">
                  <img
                    src={faq.image}
                    alt={faq.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-4">
                  {faq.title}
                </h3>
                <p className="text-gray-700">
                  {index === 0 && "Unsere Leidenschaft für authentische Momente und unser Engagement für Qualität. Wir verstehen Familie als mehr als nur eine Gruppe von Menschen; es sind die Beziehungen und Liebe, die wir in jedem Bild festhalten. Unser Ansatz verbindet künstlerische Vision mit persönlicher Betreuung, um Fotos zu erschaffen, die Ihre Familiengeschichte erzählen."}
                  {index === 1 && "Unsere Fotoshootings finden ausschließlich in unserem Studio in Wien statt. Dort haben wir die perfekte Umgebung und professionelles Licht – ideal für natürliche und stilvolle Familienporträts."}
                  {index === 2 && "Nach der Buchung erhalten Sie von uns eine detaillierte Anleitung zur Vorbereitung – von der Auswahl der Kleidung bis hin zu Tipps für die Gestaltung des Shootings. Unser Ziel ist es, dass Sie sich wohl fühlen und Spaß haben."}
                  {index === 3 && "Unsere Familienfotoshootings dauern in der Regel bis zu einer Stunde. Wir nehmen uns genug Zeit, um sicherzustellen, dass schöne, natürliche Aufnahmen entstehen – ganz entspannt und ohne Eile."}
                  {index === 4 && "Absolut! Haustiere sind ein wichtiger Teil der Familie und herzlich willkommen."}
                  {index === 5 && "Wir wissen: Nicht jeder steht gerne vor der Kamera. Aber genau das ist unsere Stärke! Mit viel Einfühlungsvermögen, Humor und einer lockeren Atmosphäre helfen wir Groß und Klein, sich zu entspannen. Bei uns darf gelacht, gealbert und echt sein – so entstehen die natürlichsten Familienfotos."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;