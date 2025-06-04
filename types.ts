
export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  isButton?: boolean;
}

export interface Course {
  id: string;
  title: string;
  iconUrl: string;
  description: string;
  links?: { label: string; href: string }[];
  color?: string; // For specific card styling
}

export interface DarkModeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}
