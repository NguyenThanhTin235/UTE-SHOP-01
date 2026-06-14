import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const PlatformContext = createContext(null);

export const usePlatform = () => useContext(PlatformContext);

export const PlatformProvider = ({ children }) => {
  const [theme, setTheme] = useState(null);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/public/ui-config');
        if (response.data && response.data.success) {
          const { theme: fetchedTheme, platformSettings: fetchedSettings } = response.data.data;
          setTheme(fetchedTheme);
          setPlatformSettings(fetchedSettings);
          
          if (fetchedTheme) {
            const root = document.documentElement;
            if (fetchedTheme.primaryColor) root.style.setProperty('--color-primary', fetchedTheme.primaryColor);
            if (fetchedTheme.fontFamily) {
              const fontBase = fetchedTheme.fontFamily.split(' (')[0];
              root.style.setProperty('--font-family', `"${fontBase}", sans-serif`);
            }
            if (fetchedTheme.borderRadius) {
               if (fetchedTheme.borderRadius === 'sharp') root.style.setProperty('--radius-base', '0px');
               else if (fetchedTheme.borderRadius === 'pill') root.style.setProperty('--radius-base', '9999px');
               else root.style.setProperty('--radius-base', '0.5rem');
            }
          }
        }
      } catch (error) {
        console.error('Failed to load global platform config:', error);
      } finally {
        setLoaded(true);
      }
    };

    loadConfig();
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PlatformContext.Provider value={{ theme, platformSettings }}>
      {children}
    </PlatformContext.Provider>
  );
};
