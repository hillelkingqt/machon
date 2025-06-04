
import { createContext } from 'react';
import type { DarkModeContextType } from '../types';

export type DarkMode = boolean;

export const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);
