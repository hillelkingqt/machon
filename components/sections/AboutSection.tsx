import React from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedDiv from '../ui/AnimatedDiv';
import Button from '../ui/Button';
import { ABOUT_STATS, TEAM_MEMBERS_DATA, APP_NAME } from '../../constants';
import { CheckCircle, MessageSquareQuote, Brain, Star } from 'lucide-react';

const AboutSection: React.FC = () => {
  const navigate = useNavigate();

  const handleDiscoverCoursesClick = () => {
    navigate('/courses');
  };
  
  const teamFeatures = [
    {
      icon: Brain,
      title: "מומחיות פדגוגית",
      description: "צוות המורכב ממורים מנוסים, מומחים למחוננים ופסיכולוגים חינוכיים.",
      delay: 0.5
    },
    {
      icon: CheckCircle,
      title: "תוכן מותאם ועדכני",
      description: "קורסים דיגיטליים חדשניים עם תרגולים אינטראקטיביים ופתרונות מוסברים.",
      delay: 0.65
    },
    {
      icon: Star,
      title: "ליווי אישי להצלחה",
      description: "מעקב התקדמות, מבחני דמה, וליווי להורים לאורך כל הדרך.",
      delay: 0.8
    }
  ];

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-white dark:bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedDiv animation="fadeInUp" className="text-center mb-12 sm:mb-16">
          <h2 className="text-lg font-semibold text-primary tracking-wider uppercase">מי אנחנו</h2>
          <p className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
            {APP_NAME}: מכינים את ילדיכם למצוינות והצלחה
          </p>
        </AnimatedDiv>

        <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
          <AnimatedDiv animation="fadeInUp" delay={0.1}>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6">
              האתר המוביל בישראל להכנה למבחני מחוננים ותוכניות ייחודיות
            </h3>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed sm:leading-loose mb-4">
              אנו ב{APP_NAME} מתמחים בפיתוח קורסים דיגיטליים חדשניים, המותאמים במיוחד לילדים בכיתות א’ עד ו’.
              מטרתנו היא להעניק לכל ילד את הכלים הטובים ביותר להתמודדות עם מבחני המחוננים, מבחני קבלה לבתי ספר יוקרתיים,
              תוכניות העשרה וכיתות מצוינות.
            </p>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed sm:leading-loose">
              הקורסים שלנו משלבים סרטונים אינטראקטיביים, תרגולים מותאמים אישית, פתרונות מוסברים, וטיפים חיוניים להתמודדות עם לחץ,
              אסטרטגיות פתרון וחשיבה יצירתית. אנו שואפים לא רק להכין למבחן, אלא גם לפתח ביטחון עצמי, יכולת חשיבה עצמאית ואהבה ללמידה.
            </p>
          </AnimatedDiv>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16 sm:mb-20">
          {teamFeatures.map(feature => (
            <AnimatedDiv 
              key={feature.title} 
              animation="fadeInUp" 
              delay={feature.delay} 
              className="group p-6 py-8 bg-gray-50 dark:bg-secondary-light rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5"
            >
              <div className="flex justify-center mb-5">
                <feature.icon 
                  className="h-14 w-14 sm:h-16 sm:w-16 text-primary dark:text-primary-light transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]" 
                  strokeWidth={1.5} 
                />
              </div>
              <h4 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-white mb-3 transition-colors duration-300 group-hover:text-primary dark:group-hover:text-primary-light text-center">
                {feature.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm sm:text-base text-center">
                {feature.description}
              </p>
            </AnimatedDiv>
          ))}
        </div>
        
        <AnimatedDiv animation="fadeIn" delay={0.3} className="mb-16 sm:mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
                {ABOUT_STATS.map((stat, index) => (
                    <AnimatedDiv key={stat.label} animation="zoomIn" delay={0.4 + index * 0.1} className="p-4 bg-gray-100 dark:bg-secondary-light rounded-lg shadow-md">
                        <stat.icon className="h-10 w-10 sm:h-12 sm:w-12 text-primary dark:text-primary-light mx-auto mb-2" strokeWidth={1.5} />
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                        <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{stat.label}</div>
                    </AnimatedDiv>
                ))}
            </div>
        </AnimatedDiv>

        <AnimatedDiv animation="fadeInUp" delay={0.5} className="mb-16 sm:mb-20">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-10 sm:mb-12">צוות המומחים שלנו</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {TEAM_MEMBERS_DATA.map((member, index) => (
              <AnimatedDiv key={index} animation="fadeInUp" delay={0.6 + index * 0.1} className="text-center p-6 bg-gray-50 dark:bg-secondary-light rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <img src={member.imageUrl} alt={member.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto mb-4 object-cover shadow-md" />
                <h4 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-1">{member.name}</h4>
                <p className="text-sm text-primary dark:text-primary-light mb-2">{member.role.split(' ')[0]}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{member.role.substring(member.role.indexOf(' ') + 1)}</p>
              </AnimatedDiv>
            ))}
          </div>
        </AnimatedDiv>
        
        <AnimatedDiv animation="fadeInUp" delay={0.7} className="mb-12 sm:mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-10 sm:mb-12">מה לקוחותינו מספרים</h3>
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1,2].map(i => (
              <div key={i} className="p-6 bg-gray-50 dark:bg-secondary-light rounded-xl shadow-lg">
                <MessageSquareQuote className="h-8 w-8 text-primary dark:text-primary-light mb-3" />
                <p className="text-gray-700 dark:text-gray-300 italic mb-3 leading-relaxed">
                  "הקורס היה מעולה! הבן שלנו הגיע מוכן למבחן והצליח מאוד. התרגול האינטראקטיבי וההסברים היו ברורים מאוד. ממליצים בחום!"
                </p>
                <p className="font-semibold text-gray-800 dark:text-white">- משפחת כהן (שם בדוי)</p>
              </div>
            ))}
          </div>
        </AnimatedDiv>

        <AnimatedDiv animation="fadeInUp" delay={0.8} className="text-center">
          <Button onClick={handleDiscoverCoursesClick} size="lg" variant="primary" className="text-lg sm:text-xl px-8 py-3.5">
            הצטרפו להצלחה - גלו את הקורסים שלנו
          </Button>
        </AnimatedDiv>
      </div>
    </section>
  );
};

export default AboutSection;