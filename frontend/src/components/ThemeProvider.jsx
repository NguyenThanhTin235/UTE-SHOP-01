import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ThemeProvider = ({ children }) => {
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/public/ui-config');
        if (response.data && response.data.success) {
          const { theme } = response.data.data;
          if (theme) {
            const root = document.documentElement;
            
            // Set Primary Color
            if (theme.primaryColor) {
              root.style.setProperty('--color-primary', theme.primaryColor);
            }
            
            // Set Font Family
            if (theme.fontFamily) {
              // Parse 'Manrope (Standard)' to 'Manrope'
              const fontBase = theme.fontFamily.split(' (')[0];
              root.style.setProperty('--font-family', `"${fontBase}", sans-serif`);
            }
            
            // Set Border Radius (optional, we could inject into root if we want, but since Tailwind classes are used, we can just apply a global class to body)
            if (theme.borderRadius) {
               if (theme.borderRadius === 'sharp') {
                 root.style.setProperty('--radius-base', '0px');
               } else if (theme.borderRadius === 'pill') {
                 root.style.setProperty('--radius-base', '9999px');
               } else {
                 root.style.setProperty('--radius-base', '0.5rem');
               }
            }

            // Dark Mode Support
            if (theme.darkModeSupport) {
              // Usually handled by OS or user toggle, but we can set a root attribute if needed
            }
          }
        }
      } catch (error) {
        console.error('Failed to load global theme:', error);
      } finally {
        setThemeLoaded(true);
      }
    };

    loadTheme();
  }, []);

  if (!themeLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ThemeProvider;
