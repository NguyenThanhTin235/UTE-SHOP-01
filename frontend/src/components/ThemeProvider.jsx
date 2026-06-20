import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlatformConfig } from '../redux/uiSlice';

// Provide a backward-compatible hook for components still using usePlatform
export const usePlatform = () => {
  const { theme, platformSettings, isLoaded } = useSelector((state) => state.ui);
  return {
    theme,
    platformSettings,
    isLoaded,
    isMaintenanceMode: platformSettings?.isMaintenanceMode || false,
    maintenanceMessage: platformSettings?.maintenanceMessage || 'We are currently under maintenance. Please check back later.'
  };
};

const ThemeProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { isLoaded, platformSettings } = useSelector((state) => state.ui);

  useEffect(() => {
    dispatch(fetchPlatformConfig());
  }, [dispatch]);

  // Apply document title and favicon after loading
  useEffect(() => {
    if (isLoaded && platformSettings) {
      if (platformSettings.storeName) {
        document.title = `${platformSettings.storeName} | Marketplace`;
      }
      if (platformSettings.faviconUrl) {
        let faviconEl = document.querySelector("link[rel='icon']");
        if (faviconEl) {
          faviconEl.href = platformSettings.faviconUrl;
        }
      }
    }
  }, [isLoaded, platformSettings]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ThemeProvider;

