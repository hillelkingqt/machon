
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom'; // Changed useNavigate to useHistory
import { PlayCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedDiv from '../ui/AnimatedDiv';
import Button from '../ui/Button';

const VIDEO_THUMBNAIL_URL = 'https://www.machon-aviv.co.il/wp-content/uploads/2021/01/Slider_img1.jpg';
const VIDEO_URL = 'https://www.youtube.com/embed/fY85ck-pI5c'; // Use embed URL for iframe

const HeroSection: React.FC = () => {
    const [showVideoModal, setShowVideoModal] = useState(false);
    const history = useHistory(); // Changed navigate to history

    const handleDiscoverCoursesClick = () => {
        history.push('/courses'); // Changed navigate to history.push
    };

    return (
        <section className="relative min-h-screen flex items-center justify-center text-center pt-28 pb-16 sm:pt-32 sm:pb-20 md:pt-36 md:pb-24 overflow-hidden bg-gradient-to-br from-gray-100 via-slate-100 to-sky-100 dark:from-secondary-dark dark:via-gray-800 dark:to-secondary">
            <div className="absolute inset-0 bg-fixed bg-cover bg-center opacity-5 dark:opacity-[0.02]" style={{ backgroundImage: `url('https://www.machon-aviv.co.il/wp-content/uploads/2018/08/bg-slider.jpg')` }}></div>
            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 z-10">
                <AnimatedDiv animation="fadeInDown" className="mb-6 sm:mb-8">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-3 sm:mb-4">
                        <span className="block text-gray-800 dark:text-white">הכנה מושלמת</span>
                        <span className="block text-primary gradient-text bg-gradient-to-r from-primary via-teal-500 to-cyan-500 dark:from-primary-light dark:via-teal-400 dark:to-cyan-400">
                            למבחני קבלה ומחוננים
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-semibold">
                        מקצועיות, חוויה והצלחה מובטחת!
                    </p>
                </AnimatedDiv>

                <AnimatedDiv animation="fadeInUp" delay={0.2} className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 sm:mb-10 leading-relaxed">
                    <p>
                        קורסי הכנה אונליין למבחני מחוננים, תוכנית האצה של בר אילן ותוכנית אודיסאה.
                        עם תרגול מותאם אישית, הסברים ברורים וליווי מקצועי להצלחה.
                        יש לנו את כל מה שהילד שלכם צריך בשביל להצליח!
                    </p>
                </AnimatedDiv>

                <AnimatedDiv animation="fadeInUp" delay={0.3} className="mb-10 sm:mb-12">
                    <Button onClick={handleDiscoverCoursesClick} size="lg" variant="primary" className="text-lg sm:text-xl px-8 py-3.5 shadow-xl hover:shadow-2xl">
                        גלו את הקורסים שלנו
                    </Button>
                </AnimatedDiv>

                <AnimatedDiv animation="zoomIn" delay={0.4}>
                    <div
                        className="relative max-w-xl lg:max-w-2xl mx-auto rounded-xl shadow-2xl overflow-hidden cursor-pointer group transform transition-all duration-500 hover:scale-105 border-2 sm:border-4 border-white/50 dark:border-gray-700/50 hover:border-primary/70 dark:hover:border-primary-light/70"
                        onClick={() => setShowVideoModal(true)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setShowVideoModal(true)}
                        aria-label="נגן סרטון הסבר"
                    >
                        <img
                            src={VIDEO_THUMBNAIL_URL}
                            alt="תלמידים לומדים במכון אביב"
                            className="w-full h-auto object-cover aspect-video"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center">
                            <PlayCircle size={80} className="text-white opacity-90 group-hover:opacity-100 transform transition-transform duration-300 group-hover:scale-110 animate-pulse-slow group-hover:animate-none" />
                        </div>
                        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-primary text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold shadow-lg">
                            צפו בסרטון ההסבר
                        </div>
                    </div>
                </AnimatedDiv>
            </div>

            {showVideoModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-3 sm:p-4"
                    onClick={() => setShowVideoModal(false)}
                    aria-modal="true"
                    role="dialog"
                >
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="bg-white dark:bg-secondary-dark p-1 sm:p-1.5 rounded-lg sm:rounded-xl shadow-xl w-full max-w-xl lg:max-w-3xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowVideoModal(false)}
                            className="absolute -top-2.5 -right-2.5 sm:-top-3 sm:-right-3 bg-primary text-white rounded-full p-1.5 sm:p-2 hover:bg-primary-dark transition-colors z-10 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                            aria-label="סגור וידאו"
                        >
                            <X size={20} />
                        </button>
                        <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-md sm:rounded-lg">
                            <iframe
                                src={`${VIDEO_URL}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1`}
                                title="סרטון הסבר - מכון אביב"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </section>
    );
};

export default HeroSection;
