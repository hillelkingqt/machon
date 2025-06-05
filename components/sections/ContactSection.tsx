import React, { useState, useEffect } from 'react';
import { CONTACT_DETAILS } from '../../constants';
import { MapPin, Phone, Mail, ExternalLink, Send, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import AnimatedDiv from '../ui/AnimatedDiv';
import Button from '../ui/Button';

type SubmissionStatus = 'idle' | 'loading' | 'success' | 'error';

const WORKER_URL = 'https://machon.hillelben14.workers.dev/';

const ContactSection: React.FC = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // Tailwind's 'md' breakpoint
        };
        checkMobile(); // Initial check
        // Optional: Add resize listener if dynamic changes are needed,
        // but for initial animation choice, mount check is often sufficient.
        // window.addEventListener('resize', checkMobile);
        // return () => window.removeEventListener('resize', checkMobile);
    }, []);


    const getWhatsAppNumber = (phone: string) => {
        let cleanedPhone = phone.replace(/[^0-9]/g, '');
        if (cleanedPhone.startsWith('0')) {
            cleanedPhone = `972${cleanedPhone.substring(1)}`;
        } else if (!cleanedPhone.startsWith('972')) {
            if (cleanedPhone.length >= 7 && cleanedPhone.length <= 10) {
                cleanedPhone = `972${cleanedPhone}`;
            } else {
                // Fallback for invalid numbers, though ideally validation should handle this
                return `9721000000`; // Example invalid fallback
            }
        }
        return cleanedPhone;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Reset status if user starts typing again after an error/success
        if (submissionStatus === 'error' || submissionStatus === 'success') {
            setSubmissionStatus('idle');
            setFeedbackMessage(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmissionStatus('loading');
        setFeedbackMessage(null);

        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSubmissionStatus('success');
                setFeedbackMessage('ההודעה נשלחה בהצלחה! ניצור איתך קשר בהקדם.');
                setFormData({ name: '', email: '', message: '' }); // Reset form
            } else {
                setSubmissionStatus('error');
                setFeedbackMessage(result.error || 'שליחת ההודעה נכשלה. אנא נסו שוב מאוחר יותר.');
                console.error('Submission error:', result.error || 'Unknown error');
            }
        } catch (error) {
            setSubmissionStatus('error');
            setFeedbackMessage('אירעה שגיאה בלתי צפויה. אנא נסו שוב מאוחר יותר.');
            console.error('Network or unexpected error:', error);
        }
    };


    return (
        <section className="py-16 sm:py-20 md:py-24 bg-white dark:bg-secondary">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <AnimatedDiv animation="fadeInUp" className="text-center mb-12 sm:mb-16">
                    <h2 className="text-lg font-semibold text-primary tracking-wider uppercase">צור קשר</h2>
                    <p className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
                        אנחנו כאן לשירותכם
                    </p>
                    <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                        יש לכם שאלות? רוצים להתייעץ? אל תהססו לפנות אלינו. נשמח לעמוד לרשותכם בכל עניין.
                    </p>
                </AnimatedDiv>

                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
                    <AnimatedDiv
                        animation={isMobile ? "fadeInUp" : "slideInRight"}
                        delay={isMobile ? 0.1 : 0.1}
                        className="bg-gray-50 dark:bg-secondary-light p-6 sm:p-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5"
                    >
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">פרטי התקשרות</h3>
                        <div className="space-y-4 sm:space-y-5 text-base sm:text-lg">
                            <a href={CONTACT_DETAILS.mapLink} target="_blank" rel="noopener noreferrer" className="flex items-start text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors group">
                                <MapPin size={22} className="me-3 mt-1 text-primary flex-shrink-0 transition-transform group-hover:scale-110" />
                                <span className="flex-1">{CONTACT_DETAILS.address}</span>
                                <ExternalLink size={16} className="ms-2 opacity-60 group-hover:opacity-100 self-center" />
                            </a>
                            <a href={CONTACT_DETAILS.phoneLink} className="flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors group">
                                <Phone size={22} className="me-3 text-primary flex-shrink-0 transition-transform group-hover:scale-110" />
                                <span>{CONTACT_DETAILS.phone}</span>
                            </a>
                            <a href={`mailto:${CONTACT_DETAILS.email}`} className="flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors group">
                                <Mail size={22} className="me-3 text-primary flex-shrink-0 transition-transform group-hover:scale-110" />
                                <span>{CONTACT_DETAILS.email}</span>
                            </a>
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700/50">
                            <Button
                                href={`https://wa.me/${getWhatsAppNumber(CONTACT_DETAILS.phone)}?text=${encodeURIComponent("שלום, הגעתי מאתר מכון אביב ואשמח לקבל פרטים נוספים.")}`}
                                external
                                variant="success"
                                className="w-full text-base sm:text-lg py-3 shadow-lg hover:shadow-xl"
                                icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 me-2 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892l-.001-.001c-1.993 0-3.917-.527-5.587-1.474l-6.162 1.688a.996.996 0 0 1-1.269-1.269zM12 21.803c1.818 0 3.529-.586 4.968-1.638l.35.205 3.475 1.009-1.018-3.379-.214-.704.27-.447c1.177-1.932 1.816-4.168 1.816-6.526.001-5.458-4.438-9.895-9.898-9.895-5.46 0-9.896 4.437-9.896 9.895 0 2.405.773 4.603 2.145 6.408l.396.537-.793 2.902 2.927-.793.582.408c1.384.967 3.039 1.489 4.744 1.489z" /></svg>}
                            >
                                שליחת הודעה בוואטסאפ
                            </Button>
                        </div>
                    </AnimatedDiv>

                    <AnimatedDiv
                        animation={isMobile ? "fadeInUp" : "slideInLeft"}
                        delay={isMobile ? 0.2 : 0.2}
                        className="bg-gray-50 dark:bg-secondary-light p-6 sm:p-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5"
                    >
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">שלחו לנו הודעה</h3>
                        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">שם מלא<span className="text-red-500 ms-1">*</span></label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required disabled={submissionStatus === 'loading'} className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-secondary dark:text-white transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-70 disabled:bg-gray-200 dark:disabled:bg-gray-700" placeholder="לדוגמה: ישראל ישראלי" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">אימייל<span className="text-red-500 ms-1">*</span></label>
                                <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} required disabled={submissionStatus === 'loading'} className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-secondary dark:text-white transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-70 disabled:bg-gray-200 dark:disabled:bg-gray-700" placeholder="your@email.com" />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">הודעה<span className="text-red-500 ms-1">*</span></label>
                                <textarea name="message" id="message" value={formData.message} onChange={handleInputChange} rows={4} required disabled={submissionStatus === 'loading'} className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-secondary dark:text-white transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-70 disabled:bg-gray-200 dark:disabled:bg-gray-700" placeholder="כתבו את פנייתכם כאן..."></textarea>
                            </div>
                            <div>
                                <Button type="submit" variant="primary" className="w-full text-base sm:text-lg py-3 shadow-lg hover:shadow-xl" icon={submissionStatus === 'loading' ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />} disabled={submissionStatus === 'loading'}>
                                    {submissionStatus === 'loading' ? 'שולח...' : 'שליחה'}
                                </Button>
                            </div>
                            {feedbackMessage && (
                                <div className={`p-3 mt-4 rounded-md text-sm font-medium flex items-center gap-x-2
                  ${submissionStatus === 'success' ? 'bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-200' : ''}
                  ${submissionStatus === 'error' ? 'bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-200' : ''}
                `}>
                                    {submissionStatus === 'success' && <CheckCircle2 size={18} />}
                                    {submissionStatus === 'error' && <AlertTriangle size={18} />}
                                    {feedbackMessage}
                                </div>
                            )}
                        </form>
                    </AnimatedDiv>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;