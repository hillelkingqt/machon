
import { LucideIcon } from 'lucide-react';
import React from 'react'; // Added for React.ElementType

export interface NavItem {
    labelKey: string; // Changed from label to labelKey
    defaultLabel?: string; // Optional: for fallback if key not found
    href: string;
    external?: boolean;
    isButton?: boolean;
    icon?: LucideIcon; // Optional icon for nav items
}
export interface SiteAdmin {
  id: string; // Assuming UUID from Supabase, can be number if auto-incrementing
  gmail: string;
  expires_at?: string | null; // ISO date string
  created_at: string; // ISO date string
}

export interface Course {
    id: string;
    title: string;
    icon: LucideIcon; // Changed from iconUrl: string
    description: string;
    detailedContent?: string; // Added for detailed course information
    links?: { label: string; href: string }[];
    color?: string; // For specific card styling
    price?: string; // Optional price for shop
}

export interface DarkModeContextType {
    darkMode: boolean;
    toggleDarkMode: () => void;
}

export interface Article {
    id: string;
    title: string;
    date: string;
    category?: string;
    fullContent?: string; // Added for full article text
    // fullContentLink?: string; // For future expansion
    excerpt: string;
    author?: string;
    imageUrl?: string;
    artag?: string;
}

// Added FAQ Types
export interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

export interface FAQCategory {
    id: string;
    title: string;
    icon?: React.ElementType;
    questions: FAQItem[];
}
