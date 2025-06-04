
import React from 'react';
import AnimatedDiv from '../ui/AnimatedDiv';
import Button from '../ui/Button';
import { Lightbulb, BookOpenText, Users } from 'lucide-react'; // Example icons

const AboutSection: React.FC = () => {
  const scrollToCourses = () => {
    const section = document.getElementById('courses');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: Lightbulb,
      title: "מומחיות וניסיון",
      description: "צוות מורים מנוסה ומומחה בתחום ההכנה למבחני מחוננים ותוכניות הצטיינות.",
      delay: 0.5
    },
    {
      icon: BookOpenText,
      title: "חומרי לימוד עדכניים",
      description: "ערכות תרגול מקיפות, מבחני סימולציה וחומרים אינטראקטיביים ברמה הגבוהה ביותר.",
      delay: 0.65
    },
    {
      icon: Users,
      title: "ליווי אישי ותומך",
      description: "יחס אישי לכל תלמיד והתאמת תוכנית הלמידה לצרכיו הייחודיים, להבטחת מיצוי הפוטנציאל.",
      delay: 0.8
    }
  ];

  return (
    <section id="about" className="py-16 sm:py-24 bg-white dark:bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedDiv animation="fadeInUp" className="text-center mb-12 sm:mb-16">
          <h2 className="text-lg font-semibold text-primary tracking-wider uppercase">מה אנחנו עושים</h2>
          <p className="mt-2 text-3xl lg:text-4xl xl:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
            מכינים את ילדיכם למצוינות והצלחה
          </p>
        </AnimatedDiv>

        <div className="max-w-3xl mx-auto text-center">
          <AnimatedDiv animation="fadeInUp" delay={0.2} className="mb-8 sm:mb-10">
             <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6">
                קורסי הכנה מותאמים אישית לפיתוח חשיבה והצלחה במבחנים
             </h3>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed sm:leading-loose">
              אנו מציעים תרגול אינטראקטיבי, מבחנים לדוגמה והסברים מפורטים שפותחו על ידי המומחים הטובים בתחום.
              מטרתנו היא לעזור לילדכם לפתח מיומנויות חשיבה גבוהות, להגיע מוכנים למבחני מחוננים וכיתות מצוינות, ולהצליח בגדול.
            </p>
          </AnimatedDiv>

          <AnimatedDiv animation="fadeInUp" delay={0.4} className="mb-16 sm:mb-20">
            <Button onClick={scrollToCourses} size="lg" variant="primary" className="text-xl px-8 py-3.5">
              בואו להכיר את הקורסים שלנו
            </Button>
          </AnimatedDiv>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {features.map(feature => (
            <AnimatedDiv 
              key={feature.title} 
              animation="fadeInUp" 
              delay={feature.delay} 
              className="group p-6 py-8 bg-gray-50 dark:bg-secondary-light rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex justify-center mb-5">
                <feature.icon 
                  className="h-16 w-16 text-primary dark:text-primary-light transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]" 
                  strokeWidth={1.5} 
                />
              </div>
              <h4 className="text-xl lg:text-2xl font-semibold text-gray-800 dark:text-white mb-3 transition-colors duration-300 group-hover:text-primary dark:group-hover:text-primary-light">
                {feature.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm sm:text-base">
                {feature.description}
              </p>
            </AnimatedDiv>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
