import React, { useEffect } from 'react';
import { LOGO_URL } from '../constants';
import { MapPin, Clock, Phone, Instagram } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';

const About = () => {
  const { t, language } = useLanguage();
  const { settings } = useSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="bg-brand-black text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4">
                {t('aboutUs')}
            </h1>
            <div className="w-24 h-2 bg-brand-yellow mx-auto"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="bg-white border-2 border-black p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            
            {/* Brand Story */}
            <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
                <div className="w-full md:w-1/3 flex justify-center">
                    <img src={settings?.aboutLogo || settings?.siteLogo || LOGO_URL || null} alt="Logo" className="w-64 h-64 object-cover rounded-full border-4 border-brand-yellow shadow-xl" />
                </div>
                <div className="w-full md:w-2/3">
                    <h2 className="text-4xl font-black uppercase mb-6 flex items-center gap-3">
                        <span className="bg-brand-yellow px-2 text-black">WHO</span> WE ARE
                    </h2>
                    <p className="text-lg text-gray-700 leading-relaxed font-medium mb-6 text-justify">
                        {language === 'ar' ? settings?.aboutDescriptionAr : settings?.aboutDescriptionEn || t('aboutStoryText')}
                    </p>
                    <div className="flex gap-4">
                        <div className="bg-black text-white px-6 py-8 text-center flex-1 border-b-4 border-brand-yellow">
                            <span className="block text-4xl font-black text-brand-yellow mb-2">2026</span>
                            <span className="uppercase text-sm font-bold tracking-widest">Est. Year</span>
                        </div>
                        <div className="bg-black text-white px-6 py-8 text-center flex-1 border-b-4 border-brand-yellow">
                            <span className="block text-4xl font-black text-brand-yellow mb-2">58</span>
                            <span className="uppercase text-sm font-bold tracking-widest">Wilayas</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location & Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-gray-100 pt-12">
                {/* Map Section */}
                <div>
                    <h3 className="text-3xl font-black uppercase mb-6 flex items-center gap-3">
                        <MapPin className="w-8 h-8 text-brand-black" />
                        {t('visitUs')}
                    </h3>
                    <div className="relative w-full h-80 bg-gray-200 border-2 border-black group overflow-hidden">
                        {settings?.storeLocationUrl ? (
                            <iframe 
                                src={settings.storeLocationUrl || null}
                                className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-500"
                                allowFullScreen={true}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        ) : (
                            <>
                                <img 
                                    src="https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&q=80&w=1000" 
                                    alt="Map" 
                                    className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-brand-yellow border-2 border-black p-3 animate-bounce shadow-lg">
                                        <MapPin className="w-8 h-8 text-black" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-8">
                    <div>
                        <h3 className="text-3xl font-black uppercase mb-6">{t('contactInfo')}</h3>
                        <ul className="space-y-6">
                            <li className="flex items-start gap-4 group">
                                <div className="bg-brand-yellow p-3 border border-black group-hover:bg-black group-hover:text-brand-yellow transition-colors">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black uppercase text-lg">{t('openingHours')}</h4>
                                    <p className="text-gray-600 font-medium">Sat - Thu: 10:00 AM - 08:00 PM</p>
                                    <p className="text-red-500 font-bold">Friday: Closed</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 group">
                                <div className="bg-brand-yellow p-3 border border-black group-hover:bg-black group-hover:text-brand-yellow transition-colors">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black uppercase text-lg">{t('phone')}</h4>
                                    <p className="text-gray-600 font-medium font-mono text-lg ltr:text-left rtl:text-right" dir="ltr">
                                        {settings?.phoneNumber || '+213 555 123 456'}
                                    </p>
                                </div>
                            </li>
                             <li className="flex items-start gap-4 group">
                                <div className="bg-brand-yellow p-3 border border-black group-hover:bg-black group-hover:text-brand-yellow transition-colors">
                                    <Instagram className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black uppercase text-lg">Social Media</h4>
                                    <div className="flex flex-col gap-1">
                                        {settings?.instagramUrl && (
                                            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gray-600 font-medium hover:text-brand-yellow hover:bg-black hover:px-2 transition-all">
                                                Instagram
                                            </a>
                                        )}
                                        {settings?.facebookUrl && (
                                            <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gray-600 font-medium hover:text-brand-yellow hover:bg-black hover:px-2 transition-all">
                                                Facebook
                                            </a>
                                        )}
                                        {!settings?.instagramUrl && !settings?.facebookUrl && (
                                            <a href="#" className="text-gray-600 font-medium hover:text-brand-yellow hover:bg-black hover:px-2 transition-all">@YourTshirtDZ</a>
                                        )}
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default About;