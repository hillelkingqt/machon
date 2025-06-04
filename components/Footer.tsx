
import React from 'react';
import { LOGO_URL, APP_NAME, SOCIAL_LINKS, CONTACT_DETAILS, NAVIGATION_ITEMS } from '../constants';
import { ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  const scrollToSection = (id: string) => {
    const section = document.getElementById(id.substring(1));
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-secondary-dark text-gray-400 pt-16 pb-8 border-t-4 border-primary-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* About/Logo */}
          <div className="space-y-4">
            <a href="#hero" onClick={(e) => { e.preventDefault(); scrollToSection('#hero'); }} className="inline-block mb-2 transition-opacity hover:opacity-80">
              <img src={LOGO_URL} alt={APP_NAME} className="h-12 sm:h-14 w-auto" />
            </a>
            <p className="text-sm leading-relaxed">
              {APP_NAME} - הכנה מקצועית למבחני מחוננים ותוכניות מצוינות.
              אנו מחויבים להצלחת ילדיכם ומספקים את הכלים הטובים ביותר.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-5">קישורים מהירים</h5>
            <ul className="space-y-2.5">
              {NAVIGATION_ITEMS.filter(item => !item.isButton).map(item => (
                <li key={item.label}>
                  <a 
                    href={item.href} 
                    onClick={(e) => {
                      if (!item.external && item.href.startsWith('#')) {
                        e.preventDefault();
                        scrollToSection(item.href);
                      }
                    }}
                    target={item.external ? '_blank' : '_self'}
                    rel={item.external ? 'noopener noreferrer' : ''}
                    className="hover:text-primary-light transition-colors duration-200 text-sm flex items-center group"
                  >
                    {item.label}
                    {item.external && <ExternalLink size={14} className="ms-1.5 opacity-70 transition-opacity group-hover:opacity-100" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-5">יצירת קשר</h5>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start group">
                <span className="me-2.5 mt-0.5 text-primary-light transition-transform group-hover:scale-110">📍</span> 
                <a href={CONTACT_DETAILS.mapLink} target="_blank" rel="noopener noreferrer" className="hover:text-primary-light transition-colors duration-200">
                  {CONTACT_DETAILS.address}
                </a>
              </li>
              <li className="flex items-center group">
                <span className="me-2.5 text-primary-light transition-transform group-hover:scale-110">📞</span> 
                <a href={CONTACT_DETAILS.phoneLink} className="hover:text-primary-light transition-colors duration-200">{CONTACT_DETAILS.phone}</a>
              </li>
              <li className="flex items-center group">
                <span className="me-2.5 text-primary-light transition-transform group-hover:scale-110">✉️</span> 
                <a href={`mailto:${CONTACT_DETAILS.email}`} className="hover:text-primary-light transition-colors duration-200">{CONTACT_DETAILS.email}</a>
              </li>
            </ul>
          </div>
          
          {/* Social Media */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-5">עקבו אחרינו</h5>
            <div className="flex space-s-5 rtl:space-s-reverse">
              {SOCIAL_LINKS.map(social => (
                <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-primary-light transition-all duration-300 transform hover:scale-110"
                   aria-label={social.name}>
                  <social.Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 mt-10 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. כל הזכויות שמורות למכון אביב.</p>
          <p className="mt-1.5">
            פותח באמצעות <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="text-primary-light hover:underline">Gemini AI</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
