
import React from 'react';
import HeroSection from '../components/sections/HeroSection';
import AboutSection from '../components/sections/AboutSection';
import CoursesSection from '../components/sections/CoursesSection';
import ContactSection from '../components/sections/ContactSection';

const HomePage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <CoursesSection />
      <ContactSection />
    </>
  );
};

export default HomePage;
