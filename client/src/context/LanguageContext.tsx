import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.photoshoots': 'Photography',
    'nav.vouchers': 'Vouchers',
    'nav.blog': 'Blog',
    'nav.waitlist': 'Waitlist',
    'nav.contact': 'Contact',
    'nav.gallery': 'My Gallery',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.admin': 'Admin Dashboard',
    'nav.galleries': 'Client Galleries',
    'nav.myGallery': 'My Gallery',

    // Newsletter
    'newsletter.signup': 'Get a photography voucher worth €50 print credit.',
    'newsletter.thanks': 'Thank you for signing up! Please check your email for the voucher.',
    'newsletter.button': 'Sign Up',
    'newsletter.placeholder': 'Your email address',
    'newsletter.error': 'An error occurred. Please try again later.',

    // Admin interface
    'admin.dashboard': 'Admin Dashboard',
    'admin.clients': 'Clients',
    'admin.invoices': 'Invoices',
    'admin.galleries': 'Galleries',
    'admin.blog': 'Blog Posts',
    'admin.surveys': 'Surveys',
    'admin.reports': 'Reports',
    'admin.digitalFiles': 'Digital Files',

    // Common actions
    'action.create': 'Create',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.view': 'View',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.import': 'Import',
    'action.export': 'Export',
    'action.duplicate': 'Duplicate',
    'action.preview': 'Preview',
    'action.download': 'Download',
    'action.upload': 'Upload',
    'action.submit': 'Submit',
    'action.confirm': 'Confirm',
    'action.close': 'Close',
    'action.back': 'Back',
    'action.next': 'Next',
    'action.previous': 'Previous',
    'action.add': 'Add',
    'action.remove': 'Remove',
    'action.update': 'Update',

    // Status
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.draft': 'Draft',
    'status.published': 'Published',
    'status.pending': 'Pending',
    'status.complete': 'Complete',
    'status.cancelled': 'Cancelled',
    'status.scheduled': 'Scheduled',

    // Messages
    'message.error': 'Error loading data',
    'message.noData': 'No data available yet',
    'message.loading': 'Loading...',
    'message.success': 'Success!',
    'message.saved': 'Saved successfully',
    'message.deleted': 'Deleted successfully',
    'message.updated': 'Updated successfully',
    'message.created': 'Created successfully',

    // Home Page
    'home.title': 'Family Photographer Vienna - New Age Photography',
    'home.subtitle': 'Professional family photography in Vienna. Book family photos, newborn portraits, maternity sessions in our Vienna studio. Family photographer Vienna, Austria.',
    'home.hero.title': 'Family & Newborn Photographer in Vienna You Can Trust',
    'home.hero.description': 'Professional photography sessions in our Vienna studio for families, newborns and business portraits.',
    'home.hero.cta': 'Book Session',
    'home.about.title': 'About Us',
    'home.about.description': 'We specialize in capturing precious family moments with warmth and professionalism.',
    'home.services.title': 'Our Photography Services',
    'home.services.description1': 'As a <strong>Family Photographer in Vienna</strong> and specialized <strong>Newborn Photographer in Vienna</strong>, we create timeless memories in a relaxed studio atmosphere. Even if you are camera-shy or have unpredictable children, we create family portraits that you will treasure forever.',
    'home.services.description2': '<strong>Our professional photographers find the most flattering angles and capture authentic expressions.</strong> Our timeless photos become treasured memories.',
    'home.services.description3': 'As a family-friendly studio, we offer a relaxed and stress-free atmosphere for unforgettable shoots. <strong>Contact us today!</strong>',
    'home.vouchers.title': 'Photography Vouchers',
    'home.vouchers.description': 'Give unforgettable moments with our photography vouchers. Perfect for family, friends or as a special gift.',
    'home.vouchers.cta': 'View Vouchers',

    // Photoshoots Page
    'photoshoots.title': 'Photography Sessions Vienna - Family & Newborn Photography',
    'photoshoots.subtitle': 'Professional photography sessions in Vienna: family portraits, maternity photos, newborn pictures, business headshots',
    'photoshoots.hero.title': 'Photography Sessions Vienna - Family & Newborn Photography',
    'photoshoots.hero.subtitle': 'Professional photography sessions in Vienna: family portraits, maternity photos, newborn pictures & business headshots',
    'photoshoots.familyPortraits.title': 'Family Portraits in Vienna & Zurich',
    'photoshoots.familyPortraits.description': 'Our family sessions are all about capturing the unique bond you share. From candid moments to posed portraits, we create images you\'ll treasure forever.',
    'photoshoots.maternity.title': 'Maternity Photography in Vienna & Zurich',
    'photoshoots.maternity.description': 'Celebrate the beauty of motherhood with our maternity sessions. We create stunning images that highlight this special time in your life.',
    'photoshoots.newborn.title': 'Newborn Photography in Vienna & Zurich',
    'photoshoots.newborn.description': 'There\'s nothing more delicate than the first days of a newborn\'s life. Our newborn sessions focus on capturing these fleeting moments with tenderness and care.',
    'photoshoots.business.title': 'Corporate Photography in Vienna & Zurich',
    'photoshoots.business.description': 'Enhance your professional image with our corporate photography services. From portraits to team photos, we help you present your business in the best light.',
    'photoshoots.events.title': 'Event Photography in Vienna & Zurich',
    'photoshoots.events.description': 'There\'s nothing more exciting than unforgettable moments at events. Our event photography focuses on capturing these special moments with creativity and professionalism.',
    'photoshoots.weddings.title': 'Wedding Photography in Vienna & Zurich',
    'photoshoots.weddings.description': 'There\'s nothing more beautiful than the magic of a wedding day. Our wedding photography captures these magical moments with attention to detail and artistic flair.',
    'photoshoots.features.flexible': 'Flexible Appointments',
    'photoshoots.features.flexibleDesc': 'We offer flexible appointment scheduling, including weekends',
    'photoshoots.features.family': 'For the Whole Family',
    'photoshoots.features.familyDesc': 'Suitable for families of all sizes, including pets',
    'photoshoots.features.professional': 'Professional Equipment',
    'photoshoots.features.professionalDesc': 'State-of-the-art camera equipment for best results',

    // Vouchers Page
    'vouchers.title': 'Photography Session Vouchers Vienna - Gift Ideas',
    'vouchers.subtitle': 'Photography session vouchers as perfect gift ideas. Family, maternity and newborn photography sessions in Vienna to give as gifts.',
    'vouchers.hero.title': 'Photography Session Vouchers',
    'vouchers.hero.description': 'Give unforgettable moments with our photography session vouchers. Perfect for family, friends or special occasions.',
    'vouchers.search.placeholder': 'Search vouchers...',
    'vouchers.filter.all': 'All Categories',
    'vouchers.filter.family': 'Family',
    'vouchers.filter.newborn': 'Newborn',
    'vouchers.filter.maternity': 'Maternity',
    'vouchers.filter.business': 'Business',
    'vouchers.noResults': 'No vouchers found matching your search.',
    'vouchers.loading': 'Loading vouchers...',
    'vouchers.buyNow': 'Buy Now',
    'vouchers.validFor': 'Valid for',
    'vouchers.months': 'months',

    // Contact Page
    'contact.title': 'Contact - Family Photographer Vienna',
    'contact.subtitle': 'Contact our family photographer in Vienna. Studio: Corner entrance Schönbrunnerstraße, Wehrgasse 11A/2+5, 1050 Vienna. Tel: +43 677 633 99210. Hours: Fri-Sun 09:00-17:00.',
    'contact.hero.title': 'Contact',
    'contact.hero.subtitle': 'Get in touch for your photography session',
    'contact.form.title': 'Send us a message',
    'contact.form.name': 'Full Name',
    'contact.form.email': 'Email Address',
    'contact.form.phone': 'Phone Number',
    'contact.form.message': 'Your Message',
    'contact.form.submit': 'Send Message',
    'contact.form.sending': 'Sending...',
    'contact.form.success': 'Thank you! Your message has been sent successfully.',
    'contact.form.error': 'An error occurred. Please try again later.',
    'contact.info.title': 'Contact Information',
    'contact.info.email': 'Email',
    'contact.info.phone': 'Phone',
    'contact.info.hours': 'Opening Hours',
    'contact.info.hoursValue': 'Fri-Sun: 09:00 - 17:00',
    'contact.studio.title': 'Studio Address',
    'contact.studio.address': 'Schönbrunner Str. 25, 1050 Vienna, Austria',
    'contact.studio.note': '5 minutes from Kettenbrückengasse',
    'contact.studio.parking': 'Street parking available',
    'contact.office.title': 'Office and Correspondence Address',
    'contact.office.address': 'Julius Tandler Platz 5 / 13, 1090 Vienna',

    // Blog Page (English)
    'blog.title': 'Photography Blog Vienna - Tips & Inspiration',
    'blog.subtitle': 'Photography blog with tips, inspiration and behind-the-scenes from our Vienna studio.',
    'blog.heroTitle': 'Photography Blog - Tips & Inspiration',
    'blog.heroSubtitle': 'Discover photography tips, behind-the-scenes and inspiration for perfect family photos',
    'blog.searchPlaceholder': 'Search blog posts...',
    'blog.loading': 'Loading posts...',
    'blog.filter.all': 'All Articles',
    'blog.filter.family': 'Family Photography',
    'blog.filter.newborn': 'Newborn Photography',
    'blog.filter.tips': 'Photography Tips',
    'blog.noResults': 'No articles found matching your search.',
    'blog.readMore': 'Read More',
    'blog.publishedOn': 'Published on',
    'blog.by': 'by',

    // Waitlist Page
    'waitlist.title': 'Request Appointment - Book Photography Session Vienna | New Age Photography',
    'waitlist.subtitle': 'Request a photography session appointment in Vienna. Available weekend appointments for family, maternity and newborn photography.',
    'waitlist.heroTitle': 'Request Photography Session Appointment in Vienna',
    'waitlist.heroSubtitle': 'Professional family photographer in Vienna with flexible appointments. We offer photography sessions on weekends - contact us for availability.',
    'waitlist.success': 'Your request has been sent successfully. We will contact you shortly.',
    'waitlist.error': 'An error occurred. Please try again later.',
    'waitlist.fullName': 'Full Name',
    'waitlist.fullNamePlaceholder': 'Your full name',
    'waitlist.preferredDate': 'Preferred Date for Your Shooting',
    'waitlist.email': 'Email Address',
    'waitlist.emailPlaceholder': 'your@email.com',
    'waitlist.phone': 'WhatsApp / Phone Number',
    'waitlist.phonePlaceholder': '+43 ',
    'waitlist.message': 'Your Message',
    'waitlist.messagePlaceholder': 'Share your wishes for the photography session with us...',
    'waitlist.submit': 'Send Request',

    // Gallery filter options  
    'gallery.filter.family': 'Family',
    'gallery.filter.newborn': 'Newborn',
    'gallery.filter.maternity': 'Maternity',
    'gallery.filter.business': 'Business',
    'gallery.filter.event': 'Event',
    'gallery.filter.wedding': 'Wedding',

    // Maternity Gutschein Page
    'maternity.title': 'Maternity Photography',
    'maternity.subtitle': 'Magical Moments of Your Pregnancy',
    'maternity.moments.title': 'Your Most Beautiful Moments Captured ✨',
    'maternity.moments.description': 'Your pregnancy is a special time full of anticipation and emotions. We capture these unique moments in stylish, timeless images – whether in the studio or at your desired location.',
    'maternity.feature.professional': 'Professional care & styling advice',
    'maternity.feature.timing': 'Best time: 32nd-36th week of pregnancy',
    'maternity.package.basic': 'Basic',
    'maternity.package.basicSub': 'Beautiful Memories',
    'maternity.package.premium': 'Premium',
    'maternity.package.premiumSub': 'Comprehensive Memories',
    'maternity.package.deluxe': 'Deluxe',
    'maternity.package.deluxeSub': 'The Complete Experience',
    'maternity.feature.30min': '30 minutes shooting',
    'maternity.feature.1photo': '1 edited photo',
    'maternity.feature.1outfit': '1 outfit',
    'maternity.feature.partnerOptional': 'Partner photos optional',
    'maternity.feature.45min': '45 minutes shooting',
    'maternity.feature.5photos': '5 edited photos',
    'maternity.feature.2outfits': '2 outfits',
    'maternity.feature.partnerIncluded': 'Partner photos included',
    'maternity.feature.60min': '60 minutes shooting',
    'maternity.feature.10photos': '10 edited photos',
    'maternity.feature.onlineGallery': 'Online gallery',
    'maternity.feature.3outfits': '3 outfits',
    'maternity.feature.partnerFamily': 'Partner & family photos',

    // Family Gutschein Page
    'family.title': 'Family Photography',
    'family.subtitle': 'Capture Your Family\'s Precious Moments',
    'family.package.basic': 'Family Basic',
    'family.package.basicSub': 'Perfect for Small Families',
    'family.package.premium': 'Family Premium',
    'family.package.premiumSub': 'Ideal for Larger Families',
    'family.package.deluxe': 'Family Deluxe',
    'family.package.deluxeSub': 'The Complete Family Experience',
    'family.feature.30min': '30 minutes shooting',
    'family.feature.45min': '45 minutes shooting',
    'family.feature.60min': '60 minutes shooting',
    'family.feature.1photo': '1 edited photo',
    'family.feature.5photos': '5 edited photos',
    'family.feature.10photos': '10 edited photos',
    'family.feature.welcome': 'Welcome drink',
    'family.feature.outfitChange': 'Outfit change possible',
    'family.feature.upTo12': 'Up to 12 adults and 4 children possible, pets welcome',
    'family.feature.allCombinations': 'All combinations',

    // Newborn Gutschein Page
    'newborn.title': 'Newborn Photography',
    'newborn.subtitle': 'Capture Your Baby\'s First Precious Moments',
    'newborn.package.basic': 'Basic',
    'newborn.package.basicSub': 'First Memories',
    'newborn.package.premium': 'Premium',
    'newborn.package.premiumSub': 'Comprehensive Memories',
    'newborn.package.deluxe': 'Deluxe',
    'newborn.package.deluxeSub': 'The Complete Experience',
    'newborn.feature.30min': '30min shooting',
    'newborn.feature.45min': '45min shooting',
    'newborn.feature.1hour': '1 hour shooting',
    'newborn.feature.1photo': '1 edited photo',
    'newborn.feature.5photos': '5 edited photos',
    'newborn.feature.10photos': '10 edited photos',
    'newborn.feature.2setups': '2 setups',
    'newborn.feature.propsIncluded': 'Props included',
    'newborn.feature.familyPhotos': 'Family photos included',
    'newborn.feature.propsOutfits': 'Props & outfits included',
    'newborn.feature.allProps': 'All props & outfits',
  },
  de: {
    // Navigation
    'nav.home': 'Startseite',
    'nav.photoshoots': 'Fotoshootings',
    'nav.vouchers': 'Gutscheine',
    'nav.blog': 'Blog',
    'nav.waitlist': 'Warteliste',
    'nav.contact': 'Kontakt',
    'nav.gallery': 'Meine Galerie',
    'nav.login': 'Anmelden',
    'nav.logout': 'Abmelden',
    'nav.admin': 'Admin-Dashboard',
    'nav.galleries': 'Kundengalerien',
    'nav.myGallery': 'Meine Galerie',

    // Newsletter
    'newsletter.signup': 'Sichern Sie sich einen Fotoshooting-Gutschein im Wert von €50 Print Guthaben.',
    'newsletter.thanks': 'Vielen Dank für Ihre Anmeldung! Bitte prüfen Sie Ihre E-Mails für den Gutschein.',
    'newsletter.button': 'Anmelden',
    'newsletter.placeholder': 'Ihre E-Mail-Adresse',
    'newsletter.error': 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',

    // Admin interface
    'admin.dashboard': 'Admin-Dashboard',
    'admin.clients': 'Kunden',
    'admin.invoices': 'Rechnungen',
    'admin.galleries': 'Galerien',
    'admin.blog': 'Blog-Beiträge',
    'admin.surveys': 'Umfragen',
    'admin.reports': 'Berichte',
    'admin.digitalFiles': 'Digitale Dateien',

    // Common actions
    'action.create': 'Erstellen',
    'action.edit': 'Bearbeiten',
    'action.delete': 'Löschen',
    'action.save': 'Speichern',
    'action.cancel': 'Abbrechen',
    'action.view': 'Anzeigen',
    'action.search': 'Suchen',
    'action.filter': 'Filter zurücksetzen',
    'action.import': 'Importieren',
    'action.export': 'Exportieren',
    'action.duplicate': 'Duplizieren',
    'action.preview': 'Vorschau',
    'action.download': 'Herunterladen',
    'action.upload': 'Hochladen',
    'action.submit': 'Senden',
    'action.confirm': 'Bestätigen',
    'action.close': 'Schließen',
    'action.back': 'Zurück',
    'action.next': 'Weiter',
    'action.previous': 'Zurück',
    'action.add': 'Hinzufügen',
    'action.remove': 'Entfernen',
    'action.update': 'Aktualisieren',

    // Status
    'status.active': 'Aktiv',
    'status.inactive': 'Inaktiv',
    'status.draft': 'Entwurf',
    'status.published': 'Veröffentlicht',
    'status.pending': 'Ausstehend',
    'status.complete': 'Abgeschlossen',
    'status.cancelled': 'Storniert',
    'status.scheduled': 'Geplant',

    // Messages
    'message.error': 'Fehler beim Laden der Daten',
    'message.noData': 'Noch keine Daten verfügbar',
    'message.loading': 'Lädt...',
    'message.success': 'Erfolgreich!',
    'message.saved': 'Erfolgreich gespeichert',
    'message.deleted': 'Erfolgreich gelöscht',
    'message.updated': 'Erfolgreich aktualisiert',
    'message.created': 'Erfolgreich erstellt',

    // Home Page
    'home.title': 'Familienfotograf Wien - New Age Fotografie',
    'home.subtitle': 'Professionelle Familienfotografie in Wien. Buchen Sie Familienfotos, Neugeborenenporträts, Schwangerschaftsfotos in unserem Wiener Studio. Familienfotograf Wien, Österreich.',
    'home.hero.title': 'Familien- & Neugeborenenfotograf in Wien, dem Sie vertrauen können',
    'home.hero.description': 'Professionelle Fotoshootings in unserem Wiener Studio für Familien, Neugeborene und Business-Porträts.',
    'home.hero.cta': 'Session buchen',
    'home.about.title': 'Über uns',
    'home.about.description': 'Wir sind spezialisiert darauf, kostbare Familienmomente mit Wärme und Professionalität festzuhalten.',
    'home.services.title': 'Unsere Fotografie-Services',
    'home.services.description1': 'Als <strong>Familienfotograf in Wien</strong> und spezialisierter <strong>Neugeborenenfotograf in Wien</strong> erschaffen wir zeitlose Erinnerungen in entspannter Studio-Atmosphäre. Auch wenn Sie kamerascheu sind oder unberechenbare Kinder haben, erstellen wir Familienporträts, die Sie für immer schätzen werden.',
    'home.services.description2': '<strong>Unsere professionellen Fotografen finden die vorteilhaftesten Winkel und fangen authentische Ausdrücke ein.</strong> Unsere zeitlosen Fotos werden zu geschätzten Erinnerungen.',
    'home.services.description3': 'Als familienfreundliches Studio bieten wir eine entspannte und stressfreie Atmosphäre für unvergessliche Shootings. <strong>Kontaktieren Sie uns noch heute!</strong>',
    'home.vouchers.title': 'Fotografie-Gutscheine',
    'home.vouchers.description': 'Verschenken Sie unvergessliche Momente mit unseren Fotografie-Gutscheinen. Perfekt für Familie, Freunde oder als besonderes Geschenk.',
    'home.vouchers.cta': 'Gutscheine ansehen',

    // Photoshoots Page
    'photoshoots.title': 'Fotoshootings Wien - Familien- & Neugeborenenfotografie',
    'photoshoots.subtitle': 'Professionelle Fotoshootings in Wien: Familienporträts, Schwangerschaftsfotos, Neugeborenenbilder, Business-Headshots',
    'photoshoots.hero.title': 'Fotoshootings Wien - Familien- & Neugeborenenfotografie',
    'photoshoots.hero.subtitle': 'Professionelle Fotoshootings in Wien: Familienporträts, Schwangerschaftsfotos, Neugeborenenbilder & Business-Headshots',
    'photoshoots.familyPortraits.title': 'Familienporträts in Wien & Zürich',
    'photoshoots.familyPortraits.description': 'Bei unseren Familiensessions geht es darum, die einzigartige Verbindung festzuhalten, die Sie teilen. Von spontanen Momenten bis hin zu gestellten Porträts erstellen wir Bilder, die Sie für immer schätzen werden.',
    'photoshoots.maternity.title': 'Schwangerschaftsfotografie in Wien & Zürich',
    'photoshoots.maternity.description': 'Feiern Sie die Schönheit der Mutterschaft mit unseren Schwangerschaftssessions. Wir erstellen atemberaubende Bilder, die diese besondere Zeit in Ihrem Leben hervorheben.',
    'photoshoots.newborn.title': 'Neugeborenenfotografie in Wien & Zürich',
    'photoshoots.newborn.description': 'Es gibt nichts Zarteres als die ersten Tage im Leben eines Neugeborenen. Unsere Neugeborenensessions konzentrieren sich darauf, diese flüchtigen Momente mit Zärtlichkeit und Sorgfalt festzuhalten.',
    'photoshoots.business.title': 'Unternehmensporträts in Wien & Zürich',
    'photoshoots.business.description': 'Verbessern Sie Ihr professionelles Image mit unseren Unternehmensporträts. Von Porträts bis hin zu Teamfotos helfen wir Ihnen, Ihr Unternehmen im besten Licht zu präsentieren.',
    'photoshoots.events.title': 'Eventfotografie in Wien & Zürich',
    'photoshoots.events.description': 'Es gibt nichts Aufregenderes als unvergessliche Momente bei Events. Unsere Eventfotografie konzentriert sich darauf, diese besonderen Momente mit Kreativität und Professionalität festzuhalten.',
    'photoshoots.weddings.title': 'Hochzeitsfotografie in Wien & Zürich',
    'photoshoots.weddings.description': 'Es gibt nichts Schöneres als die Magie eines Hochzeitstages. Unsere Hochzeitsfotografie hält diese magischen Momente mit Liebe zum Detail und künstlerischem Flair fest.',
    'photoshoots.features.flexible': 'Flexible Termine',
    'photoshoots.features.flexibleDesc': 'Wir bieten flexible Terminplanung, auch an Wochenenden',
    'photoshoots.features.family': 'Für die ganze Familie',
    'photoshoots.features.familyDesc': 'Geeignet für Familien jeder Größe, auch mit Haustieren',
    'photoshoots.features.professional': 'Professionelle Ausrüstung',
    'photoshoots.features.professionalDesc': 'Modernste Kameraausrüstung für beste Ergebnisse',

    // Vouchers Page
    'vouchers.title': 'Fotoshooting Gutscheine Wien - Geschenkideen',
    'vouchers.subtitle': 'Fotoshooting Gutscheine als perfekte Geschenkidee. Familien-, Schwangerschafts- und Neugeborenen-Fotoshootings in Wien zum Verschenken.',
    'vouchers.hero.title': 'Fotoshooting Gutscheine Wien',
    'vouchers.hero.description': 'Verschenken Sie unvergessliche Momente mit unseren Fotoshooting-Gutscheinen. Perfekt für Familie, Freunde oder besondere Anlässe.',
    'vouchers.search.placeholder': 'Gutscheine suchen...',
    'vouchers.filter.all': 'Alle Kategorien',
    'vouchers.filter.family': 'Familie',
    'vouchers.filter.newborn': 'Neugeborene',
    'vouchers.filter.maternity': 'Schwangerschaft',
    'vouchers.filter.business': 'Business',
    'vouchers.noResults': 'Keine Gutscheine gefunden, die Ihren Kriterien entsprechen.',
    'vouchers.loading': 'Die Gutscheine konnten nicht geladen werden. Bitte versuchen Sie es später erneut.',
    'vouchers.buyNow': 'Jetzt kaufen',
    'vouchers.validFor': 'Gültig für',
    'vouchers.months': 'Monate',

    // Contact Page
    'contact.title': 'Kontakt - Familienfotograf Wien | New Age Fotografie',
    'contact.subtitle': 'Kontaktieren Sie unseren Familienfotograf in Wien. Studio: Eingang Ecke Schönbrunnerstraße, Wehrgasse 11A/2+5, 1050 Wien. Tel: +43 677 633 99210. Öffnungszeiten Fr-So 09:00-17:00.',
    'contact.hero.title': 'Kontakt',
    'contact.hero.subtitle': 'Nehmen Sie Kontakt für Ihr Fotoshooting auf',
    'contact.form.title': 'Senden Sie uns eine Nachricht',
    'contact.form.name': 'Vollständiger Name',
    'contact.form.email': 'E-Mail-Adresse',
    'contact.form.phone': 'Telefonnummer',
    'contact.form.message': 'Ihre Nachricht',
    'contact.form.submit': 'Nachricht senden',
    'contact.form.sending': 'Wird gesendet...',
    'contact.form.success': 'Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.',
    'contact.form.error': 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    'contact.info.title': 'Kontaktinformationen',
    'contact.info.email': 'E-Mail',
    'contact.info.phone': 'Telefon',
    'contact.info.hours': 'Öffnungszeiten',
    'contact.info.hoursValue': 'Fr-So: 09:00 - 17:00',
    'contact.studio.title': 'Studio-Adresse',
    'contact.studio.address': 'Schönbrunner Str. 25, 1050 Wien, Österreich',
    'contact.studio.note': '5 Minuten von der Kettenbrückengasse',
    'contact.studio.parking': 'Straßenparkplätze verfügbar',
    'contact.office.title': 'Büro- und Korrespondenzadresse',
    'contact.office.address': 'Julius Tandler Platz 5 / 13, 1090 Wien',

    // Blog Page
    'blog.title': 'Fotografie Blog Wien - Tipps & Inspiration',
    'blog.subtitle': 'Fotografie-Blog mit Tipps, Inspiration und Einblicken hinter die Kulissen aus unserem Wiener Studio.',
    'blog.hero.title': 'Fotografie Blog',
    'blog.hero.subtitle': 'Tipps, Inspiration und Geschichten aus unseren Fotoshootings',
    'blog.search.placeholder': 'Artikel suchen...',
    'blog.filter.all': 'Alle Artikel',
    'blog.filter.family': 'Familienfotografie',
    'blog.filter.newborn': 'Neugeborenenfotografie',
    'blog.filter.tips': 'Foto-Tipps',
    'blog.noResults': 'Keine Artikel gefunden, die Ihrer Suche entsprechen.',
    'blog.readMore': 'Weiterlesen',
    'blog.publishedOn': 'Veröffentlicht am',
    'blog.by': 'von',

    // Gallery filter options
    'gallery.filter.family': 'Familie',
    'gallery.filter.newborn': 'Neugeborene',
    'gallery.filter.maternity': 'Schwangerschaft',
    'gallery.filter.business': 'Business',
    'gallery.filter.event': 'Event',
    'gallery.filter.wedding': 'Hochzeit',

    // Maternity Gutschein Page
    'maternity.title': 'Schwangerschafts Fotoshooting',
    'maternity.subtitle': 'Magische Momente Ihrer Schwangerschaft',
    'maternity.moments.title': 'Ihre schönsten Momente festgehalten ✨',
    'maternity.moments.description': 'Ihre Schwangerschaft ist eine besondere Zeit voller Vorfreude und Emotionen. Wir fangen diese einzigartigen Momente in stilvollen, zeitlosen Bildern ein – ob im Studio oder an Ihrem Wunschort.',
    'maternity.feature.professional': 'Professionelle Betreuung & Styling-Beratung',
    'maternity.feature.timing': 'Beste Zeit: 32.-36. Schwangerschaftswoche',
    'maternity.package.basic': 'Basic',
    'maternity.package.basicSub': 'Schöne Erinnerungen',
    'maternity.package.premium': 'Premium',
    'maternity.package.premiumSub': 'Umfangreiche Erinnerungen',
    'maternity.package.deluxe': 'Deluxe',
    'maternity.package.deluxeSub': 'Das komplette Erlebnis',
    'maternity.feature.30min': '30 Minuten Shooting',
    'maternity.feature.1photo': '1 bearbeitete Fotos',
    'maternity.feature.1outfit': '1 Outfit',
    'maternity.feature.partnerOptional': 'Partner-Fotos optional',
    'maternity.feature.45min': '45 Minuten Shooting',
    'maternity.feature.5photos': '5 bearbeitete Fotos',
    'maternity.feature.2outfits': '2 Outfits',
    'maternity.feature.partnerIncluded': 'Partner-Fotos inklusive',
    'maternity.feature.60min': '60 Minuten Shooting',
    'maternity.feature.10photos': '10 bearbeitete Fotos',
    'maternity.feature.onlineGallery': 'Online Galerie',
    'maternity.feature.3outfits': '3 Outfits',
    'maternity.feature.partnerFamily': 'Partner- & Familienfotos',

    // Family Gutschein Page
    'family.title': 'Familienfotografie',
    'family.subtitle': 'Halten Sie die kostbaren Momente Ihrer Familie fest',
    'family.package.basic': 'Family Basic',
    'family.package.basicSub': 'Perfect für kleine Familien',
    'family.package.premium': 'Family Premium',
    'family.package.premiumSub': 'Ideal für größere Familien',
    'family.package.deluxe': 'Family Deluxe',
    'family.package.deluxeSub': 'Das komplette Familienerlebnis',
    'family.feature.30min': '30 Minuten Shooting',
    'family.feature.45min': '45 Minuten Shooting',
    'family.feature.60min': '60 Minuten Shooting',
    'family.feature.1photo': '1 bearbeitete Fotos',
    'family.feature.5photos': '5 bearbeitete Fotos',
    'family.feature.10photos': '10 bearbeitete Fotos',
    'family.feature.welcome': 'Begrüßungsgetränk',
    'family.feature.outfitChange': 'Outfit-Wechsel möglich',
    'family.feature.upTo12': 'Bis zu 12 Erwachsene und 4 Kinder möglich, Haustiere willkommen',
    'family.feature.allCombinations': 'Alle Kombinationen',

    // Newborn Gutschein Page
    'newborn.title': 'Neugeborenenfotografie',
    'newborn.subtitle': 'Halten Sie die ersten kostbaren Momente Ihres Babys fest',
    'newborn.package.basic': 'Basic',
    'newborn.package.basicSub': 'Erste Erinnerungen',
    'newborn.package.premium': 'Premium',
    'newborn.package.premiumSub': 'Umfangreiche Erinnerungen',
    'newborn.package.deluxe': 'Deluxe',
    'newborn.package.deluxeSub': 'Das komplette Erlebnis',
    'newborn.feature.30min': '30min Shooting',
    'newborn.feature.45min': '45min Shooting',
    'newborn.feature.1hour': '1 Stunden Shooting',
    'newborn.feature.1photo': '1 bearbeitete Fotos',
    'newborn.feature.5photos': '5 bearbeitete Fotos',
    'newborn.feature.10photos': '10 bearbeitete Fotos',
    'newborn.feature.2setups': '2 Setups',
    'newborn.feature.propsIncluded': 'Requisiten inklusive',
    'newborn.feature.familyPhotos': 'Familienfotos inklusive',
    'newborn.feature.propsOutfits': 'Requisiten & Outfits inklusive',
    'newborn.feature.allProps': 'Alle Requisiten & Outfits',

    // Blog Page (German)
    'blog.title': 'Blog - Fotografie Tipps & Inspiration | New Age Fotografie Wien',
    'blog.subtitle': 'Fotografie-Blog mit Tipps für Familienfotos, Neugeborenenbilder und Schwangerschaftsfotos. Inspiration und Beratung vom Wiener Familienfotograf.',
    'blog.heroTitle': 'Fotografie Blog - Tipps & Inspiration',
    'blog.heroSubtitle': 'Entdecken Sie Fotografie-Tipps, Behind-the-Scenes und Inspiration für perfekte Familienfotos',
    'blog.searchPlaceholder': 'Blog-Beiträge durchsuchen...',
    'blog.loading': 'Lade Beiträge...',

    // Waitlist Page (German)
    'waitlist.title': 'Termin anfragen - Fotoshooting Wien buchen | New Age Fotografie',
    'waitlist.subtitle': 'Fotoshooting-Termin in Wien anfragen. Verfügbare Termine an Wochenenden für Familien-, Schwangerschafts- und Neugeborenen-Fotografie.',
    'waitlist.heroTitle': 'Fotoshooting Termin in Wien anfragen',
    'waitlist.heroSubtitle': 'Professioneller Familienfotograf in Wien mit flexiblen Terminen. Wir bieten Fotoshootings an Wochenenden - kontaktieren Sie uns für die Verfügbarkeit.',
    'waitlist.success': 'Ihre Anfrage wurde erfolgreich gesendet. Wir werden uns in Kürze bei Ihnen melden.',
    'waitlist.error': 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    'waitlist.fullName': 'Vollname',
    'waitlist.fullNamePlaceholder': 'Ihr vollständiger Name',
    'waitlist.preferredDate': 'Bevorzugtes Datum für Ihr Shooting',
    'waitlist.email': 'Email Adresse',
    'waitlist.emailPlaceholder': 'ihre@email.com',
    'waitlist.phone': 'WhatsApp / Telefonnummer',
    'waitlist.phonePlaceholder': '+43 ',
    'waitlist.message': 'Ihre Nachricht',
    'waitlist.messagePlaceholder': 'Teilen Sie uns Ihre Wünsche für das Fotoshooting mit...',
    'waitlist.submit': 'Anfrage senden',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('de');

  const t = (key: string): string => {
    const keys = key.split('.');
    let value = translations[language] as any;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to German if key not found in English
        value = translations.de as any;
        for (const fallbackK of keys) {
          if (value && typeof value === 'object' && fallbackK in value) {
            value = value[fallbackK];
          } else {
            return key; // Return key if not found in either language
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};