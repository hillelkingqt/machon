
import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, SOCIAL_LINKS, CONTACT_DETAILS, NAVIGATION_ITEMS } from '../constants'; // Corrected path
import { ExternalLink as ExternalLinkIcon, MapPin, Phone, Mail, BookOpenCheck } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-secondary-dark text-gray-300 pt-12 sm:pt-16 pb-8 border-t-4 border-primary-dark">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">
                    {/* About/Logo */}
                    <div className="space-y-3 sm:space-y-4">
                        <Link to="/" className="inline-flex items-center space-s-2 rtl:space-s-reverse mb-1 sm:mb-2 transition-opacity hover:opacity-80 group">
                            <BookOpenCheck
                                size={28}
                                className="text-primary-light transition-all duration-300 group-hover:text-primary group-hover:scale-105"
                                strokeWidth={2}
                            />
                            <span className="text-lg sm:text-xl font-semibold text-white ms-2 group-hover:text-primary-light transition-colors duration-300">{APP_NAME}</span>
                        </Link>
                        <p className="text-sm leading-relaxed text-gray-400">
                            {APP_NAME} - הכנה מקצועית למבחני מחוננים ותוכניות מצוינות.
                            אנו מחויבים להצלחת ילדיכם ומספקים את הכלים הטובים ביותר.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h5 className="text-base sm:text-lg font-semibold text-white mb-4">ניווט מהיר</h5>
                        <ul className="space-y-2 sm:space-y-2.5">
                            {NAVIGATION_ITEMS.filter(item => !item.isButton).map(item => (
                                <li key={item.label}>
                                    {item.external || item.href.startsWith('http') ? (
                                        <a
                                            href={item.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm hover:text-primary-light transition-colors duration-200 flex items-center group"
                                        >
                                            {item.icon && <item.icon size={16} className="me-2 opacity-70 group-hover:opacity-100" />}
                                            {item.label}
                                            {item.external && <ExternalLinkIcon size={14} className="ms-1.5 opacity-70 transition-opacity group-hover:opacity-100" />}
                                        </a>
                                    ) : (
                                        <Link
                                            to={item.href}
                                            className="text-sm hover:text-primary-light transition-colors duration-200 flex items-center group"
                                        >
                                            {item.icon && <item.icon size={16} className="me-2 opacity-70 group-hover:opacity-100" />}
                                            {item.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h5 className="text-base sm:text-lg font-semibold text-white mb-4">יצירת קשר</h5>
                        <ul className="space-y-2.5 sm:space-y-3 text-sm">
                            <li className="flex items-start group">
                                <MapPin size={16} className="me-2.5 mt-1 text-primary-light flex-shrink-0 transition-transform group-hover:scale-105" />
                                <a href={CONTACT_DETAILS.mapLink} target="_blank" rel="noopener noreferrer" className="hover:text-primary-light transition-colors duration-200">
                                    {CONTACT_DETAILS.address}
                                </a>
                            </li>
                            <li className="flex items-center group">
                                <Phone size={16} className="me-2.5 text-primary-light flex-shrink-0 transition-transform group-hover:scale-105" />
                                <a href={CONTACT_DETAILS.phoneLink} className="hover:text-primary-light transition-colors duration-200">{CONTACT_DETAILS.phone}</a>
                            </li>
                            <li className="flex items-center group">
                                <Mail size={16} className="me-2.5 text-primary-light flex-shrink-0 transition-transform group-hover:scale-105" />
                                <a href={`mailto:${CONTACT_DETAILS.email}`} className="hover:text-primary-light transition-colors duration-200">{CONTACT_DETAILS.email}</a>
                            </li>
                        </ul>
                    </div>

                    {/* Social Media */}
                    <div>
                        <h5 className="text-base sm:text-lg font-semibold text-white mb-4">עקבו אחרינו</h5>
                        <div className="flex space-s-4 rtl:space-s-reverse">
                            {SOCIAL_LINKS.map(social => (
                                <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-primary-light transition-all duration-300 transform hover:scale-110"
                                    aria-label={social.name}>
                                    <social.Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-6 sm:pt-8 mt-8 sm:mt-10 text-center text-xs sm:text-sm text-gray-400">
                    <p>&copy; {new Date().getFullYear()} {APP_NAME}. כל הזכויות שמורות למכון אביב.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
