import React, { createContext, useContext, useState, useEffect } from 'react';

interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    sidebar: string;
    'sidebar-accent': string;
    background: string;
    foreground: string;
    card: string;
    border: string;
    'primary-text': string;
  };
}

const themes: Theme[] = [
  {
    name: 'Claro',
    colors: {
      primary: '#1E3A8A',
      secondary: '#3B82F6',
      sidebar: '#1E3A8A',
      'sidebar-accent': '#1E40AF',
      background: '#F3F4F6',
      foreground: '#1F2937',
      card: '#ffffff',
      border: '#E5E7EB',
      'primary-text': '#1E3A8A'
    }
  },
  {
    name: 'Oscuro',
    colors: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      sidebar: '#0F172A',
      'sidebar-accent': '#1E293B',
      background: '#020617',
      foreground: '#F8FAFC',
      card: '#1E293B',
      border: '#334155',
      'primary-text': '#3B82F6'
    }
  },
  {
    name: 'Pasión Carmesí',
    colors: {
      primary: '#B00020',
      secondary: '#FF4C4C',
      sidebar: '#3B0F15',
      'sidebar-accent': '#4A151C',
      background: '#FBE9E7',
      foreground: '#3B0F15',
      card: '#ffffff',
      border: '#FFCDD2',
      'primary-text': '#B00020'
    }
  },
  {
    name: 'Océano Profundo',
    colors: {
      primary: '#0EA5E9',
      secondary: '#38BDF8',
      sidebar: '#0F172A',
      'sidebar-accent': '#1E293B',
      background: '#F0FDFF',
      foreground: '#0F172A',
      card: '#ffffff',
      border: '#BAE6FD',
      'primary-text': '#0EA5E9'
    }
  },
  {
    name: 'Atardecer Naranja',
    colors: {
      primary: '#F97316',
      secondary: '#FFB347',
      sidebar: '#1F2937',
      'sidebar-accent': '#374151',
      background: '#FFEDD5',
      foreground: '#1F2937',
      card: '#ffffff',
      border: '#FED7AA',
      'primary-text': '#F97316'
    }
  },
  {
    name: 'Ámbar Dorado',
    colors: {
      primary: '#D97706',
      secondary: '#FBBF24',
      sidebar: '#1F2937',
      'sidebar-accent': '#374151',
      background: '#FEF9C3',
      foreground: '#1F2937',
      card: '#ffffff',
      border: '#FEF08A',
      'primary-text': '#D97706'
    }
  },
  {
    name: 'Misterio Púrpura',
    colors: {
      primary: '#3B2D91',
      secondary: '#5C4DAB',
      sidebar: '#2B1C67',
      'sidebar-accent': '#3D2B8A',
      background: '#E4D7F6',
      foreground: '#2B1C67',
      card: '#ffffff',
      border: '#DDD6FE',
      'primary-text': '#3B2D91'
    }
  },
  {
    name: 'Rosa Encantado',
    colors: {
      primary: '#F472B6',
      secondary: '#FBCFE8',
      sidebar: '#1F2937',
      'sidebar-accent': '#374151',
      background: '#FDF2F8',
      foreground: '#1F2937',
      card: '#ffffff',
      border: '#FCE7F3',
      'primary-text': '#F472B6'
    }
  },
  {
    name: 'Bosque Esmeralda',
    colors: {
      primary: '#065F46',
      secondary: '#10B981',
      sidebar: '#1F2937',
      'sidebar-accent': '#374151',
      background: '#F0FDF4',
      foreground: '#1F2937',
      card: '#ffffff',
      border: '#D1FAE5',
      'primary-text': '#065F46'
    }
  },
  {
    name: 'Café Premium',
    colors: {
      primary: '#7A4A2A',
      secondary: '#B75D4D',
      sidebar: '#4E3B3B',
      'sidebar-accent': '#5E4B4B',
      background: '#F8E2D1',
      foreground: '#4E3B3B',
      card: '#ffffff',
      border: '#EDE0D4',
      'primary-text': '#7A4A2A'
    }
  }
];


interface ThemeContextType {
  currentTheme: string;
  setTheme: (name: string) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'Claro';
  });

  useEffect(() => {
    const theme = themes.find(t => t.name === currentTheme) || themes[0];
    const root = document.documentElement;

    // Aplicar variables CSS
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Casos especiales para Tailwind/Shadcn
    if (currentTheme === 'Oscuro') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('app-theme', currentTheme);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme: setCurrentTheme, availableThemes: themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
