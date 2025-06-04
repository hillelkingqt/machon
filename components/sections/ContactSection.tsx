
import React from 'react';
import { CONTACT_DETAILS } from '../../constants';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import AnimatedDiv from '../ui/AnimatedDiv';
import Button from '../ui/Button';

const ContactSection: React.FC = () => {
  // Basic phone number cleanup for WhatsApp link
  const getWhatsAppNumber = (phone: string) => {
    let cleanedPhone = phone.replace(/[^0-9]/g, ''); // Remove non-digits
    if (cleanedPhone.startsWith('0')) {
      cleanedPhone = `972${cleanedPhone.substring(1)}`;
    } else if (!cleanedPhone.startsWith('972')) {
      cleanedPhone = `972${cleanedPhone}`; // Assuming it's a local number without 0
    }
    return cleanedPhone;
  };

  return (
    <section id="contact" className="py-16 sm:py-24 bg-white dark:bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedDiv animation="fadeInUp" className="text-center mb-12 sm:mb-16">
          <h2 className="text-lg font-semibold text-primary tracking-wider uppercase">צור קשר</h2>
          <p className="mt-2 text-3xl lg:text-4xl xl:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
            אנחנו כאן לשירותכם
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            יש לכם שאלות? רוצים להתייעץ? אל תהססו לפנות אלינו. נשמח לעמוד לרשותכם בכל עניין.
          </p>
        </AnimatedDiv>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <AnimatedDiv 
            animation="slideInRight" 
            delay={0.1} 
            className="bg-gray-50 dark:bg-secondary-light p-6 sm:p-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">פרטי התקשרות</h3>
            <div className="space-y-5 text-lg">
              <a href={CONTACT_DETAILS.mapLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors group">
                <MapPin size={24} className="me-3 text-primary flex-shrink-0 transition-transform group-hover:scale-110" />
                <span>{CONTACT_DETAILS.address}</span>
                <ExternalLink size={18} className="ms-2 opacity-60 group-hover:opacity-100" />
              </a>
              <a href={CONTACT_DETAILS.phoneLink} className="flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors group">
                <Phone size={24} className="me-3 text-primary flex-shrink-0 transition-transform group-hover:scale-110" />
                <span>{CONTACT_DETAILS.phone}</span>
              </a>
              <a href={`mailto:${CONTACT_DETAILS.email}`} className="flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors group">
                <Mail size={24} className="me-3 text-primary flex-shrink-0 transition-transform group-hover:scale-110" />
                <span>{CONTACT_DETAILS.email}</span>
              </a>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700/50">
              <Button 
                href={`https://wa.me/${getWhatsAppNumber(CONTACT_DETAILS.phone)}`}
                external 
                variant="success" 
                className="w-full text-base sm:text-lg py-3"
                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 me-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892l-.001-.001c-1.993 0-3.917-.527-5.587-1.474l-6.162 1.688a.996.996 0 0 1-1.269-1.269zM12 21.803c1.818 0 3.529-.586 4.968-1.638l.35.205 3.475 1.009-1.018-3.379-.214-.704.27-.447c1.177-1.932 1.816-4.168 1.816-6.526.001-5.458-4.438-9.895-9.898-9.895-5.46 0-9.896 4.437-9.896 9.895 0 2.405.773 4.603 2.145 6.408l.396.537-.793 2.902 2.927-.793.582.408c1.384.967 3.039 1.489 4.744 1.489z"/></svg>}
              >
                שליחת הודעה בוואטסאפ
              </Button>
            </div>
          </AnimatedDiv>

          <AnimatedDiv 
            animation="slideInLeft" 
            delay={0.2} 
            className="bg-gray-50 dark:bg-secondary-light p-6 sm:p-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">שלחו לנו הודעה</h3>
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">שם מלא</label>
                <input type="text" name="name" id="name" required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-secondary dark:text-white transition-all duration-200" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">אימייל</label>
                <input type="email" name="email" id="email" required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-secondary dark:text-white transition-all duration-200" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">הודעה</label>
                <textarea name="message" id="message" rows={4} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-secondary dark:text-white transition-all duration-200"></textarea>
              </div>
              <div>
                <Button type="submit" variant="primary" className="w-full text-base sm:text-lg py-3">
                  שליחה
                </Button>
              </div>
            </form>
          </AnimatedDiv>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
