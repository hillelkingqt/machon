
import { LucideIcon } from 'lucide-react';

export interface NavItem {
    label: string;
    href: string;
    external?: boolean;
    isButton?: boolean;
    icon?: LucideIcon; // Optional icon for nav items
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
}