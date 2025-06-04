
import React from 'react';
import { NavItem, Course } from './types';
import { ExternalLink, Facebook, Instagram, MessageCircle /* Using MessageCircle for WhatsApp-like icon */ } from 'lucide-react';

export const LOGO_URL = 'https://www.machon-aviv.co.il/wp-content/uploads/2021/01/makon_aviv_logo_extra_bold_white_bg.png';
export const APP_NAME = 'מכון אביב';

export const NAVIGATION_ITEMS: NavItem[] = [
  { label: 'ראשי', href: '#hero' },
  { label: 'אודותינו', href: '#about' },
  { label: 'הקורסים שלנו', href: '#courses' },
  { label: 'חנות', href: 'https://www.machon-aviv.co.il/shop/', external: true },
  { label: 'מאמרים', href: 'https://www.machon-aviv.co.il/blog/', external: true },
  { label: 'צור קשר', href: '#contact', isButton: true },
];

export const COURSES_DATA: Course[] = [
  {
    id: 'gifted',
    title: "מבחן מחוננים כיתות ב', ג' וקבלה לחטיבה",
    iconUrl: 'https://www.machon-aviv.co.il/wp-content/uploads/2021/01/con-icon1.png',
    description: "קורס ההכנה המקיף והמתקדם ביותר כדי שהילד שלכם יעבור את הבחינה בקלות ובהנאה. עזרי לימוד מתקדמים וכמות חומר מקיפה.",
    links: [
      { label: "הכנה למבחן מחוננים כיתה ב'", href: "https://www.machon-aviv.co.il/gifted-courses/" },
      { label: "הכנה למבחן מחוננים כיתה ג'", href: "https://www.machon-aviv.co.il/gifted-courses/" },
      { label: "הכנה למבחן מחוננים לחטיבה", href: "https://www.machon-aviv.co.il/gifted-courses/" },
    ],
    color: "bg-gradient-to-br from-teal-500 to-cyan-600 dark:from-teal-600 dark:to-cyan-700",
  },
  {
    id: 'bar-ilan',
    title: 'נוער מוכשר במתמטיקה - תוכנית בר אילן',
    iconUrl: 'https://www.machon-aviv.co.il/wp-content/uploads/2021/01/ui-icon.png',
    description: "כמות המבחנים הגדולה ביותר בתחום. המבחנים שלנו מדויקים ומדמים באופן מעולה את הבחינה האמיתית.",
    links: [
      { label: "הכנה לעולים לכיתה ו'", href: "https://www.machon-aviv.co.il/bar-ilan/" },
      { label: "הכנה לעולים לכיתה ז'", href: "https://www.machon-aviv.co.il/bar-ilan/" },
      { label: "הכנה לתוכנית האצה", href: "https://www.machon-aviv.co.il/bar-ilan/" },
    ],
    color: "bg-gradient-to-br from-sky-500 to-blue-600 dark:from-sky-600 dark:to-blue-700",
  },
  {
    id: 'odyssey',
    title: 'תוכנית אודיסאה',
    iconUrl: 'https://www.machon-aviv.co.il/wp-content/uploads/2021/01/app-icon.png',
    description: "כדי להתקבל לתוכנית היוקרתית ביותר באקדמיה - חומרי לימוד מקיפים ונרחבים ביותר עם אפליקציה מתקדמת וידידותית.",
    color: "bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700",
  },
  {
    id: 'tzav-rishon',
    title: 'הכנה למבחני צו ראשון',
    iconUrl: 'https://www.machon-aviv.co.il/wp-content/uploads/2021/01/con-icon-1.png',
    description: "להנות משירות משמעותי ותורם ביחידה טכנולוגית. הכנה אינטנסיבית ומהירה שתעזור לכם לעבור את הבחינה בקלות ובמהירות.",
    color: "bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700",
  },
];

export const CONTACT_DETAILS = {
  address: 'גלגלי הפלדה 2400, הרצליה',
  phone: '*1000',
  phoneLink: 'tel:*1000',
  email: 'info@machon-aviv.co.il',
  mapLink: 'https://www.google.com/maps/search/?api=1&query=גלגלי+הפלדה+2400+הרצליה'
};

// Basic WhatsApp link formatting helper
const getWhatsAppLink = (phone: string) => {
  let cleanedPhone = phone.replace(/[^0-9]/g, ''); // Remove non-digits like '*'
  if (cleanedPhone.startsWith('0')) {
    cleanedPhone = `972${cleanedPhone.substring(1)}`; // Replace leading 0 with 972
  } else if (!cleanedPhone.startsWith('972')) {
     // If it's a short code like *1000, this won't be a valid WhatsApp number.
     // For this example, we'll assume if it's not starting with 0 or 972, it might be a direct dial number not for WhatsApp.
     // However, if a typical mobile number is entered without 0, prepend 972.
     // This logic might need refinement based on actual phone number formats expected.
     if (cleanedPhone.length >= 7 && cleanedPhone.length <= 10) { // Basic check for typical local number length
        cleanedPhone = `972${cleanedPhone}`;
     } else {
        // Not a typical format for direct conversion to WhatsApp international; might return a non-functional link or '#'
        // For a generic approach with '*1000', a direct WhatsApp link is problematic.
        // Falling back to a generic contact page or placeholder for such cases might be better.
        // Here, we'll just try to make it if it seems like a mobile number.
        return `https://wa.me/${cleanedPhone}`; // This will likely fail for *1000
     }
  }
  return `https://wa.me/${cleanedPhone}`;
};


export const SOCIAL_LINKS = [
  { name: 'Facebook', Icon: Facebook, href: '#' }, // Replace # with actual link
  { name: 'Instagram', Icon: Instagram, href: '#' }, // Replace # with actual link
  { name: 'WhatsApp', Icon: MessageCircle, href: getWhatsAppLink(CONTACT_DETAILS.phone) },
];
