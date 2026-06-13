import React from 'react';
import { Link } from 'react-router-dom';
import { usePlatform } from './ThemeProvider';

const Footer = () => {
  const { platformSettings } = usePlatform() || {};
  const storeName = platformSettings?.storeName || 'UTEShop';
  const logoUrl = platformSettings?.logoUrl;
  const contactEmail = platformSettings?.contactEmail || 'support@uteshop.com';
  const contactPhone = platformSettings?.contactPhone || '1900 1234';
  const contactAddress = platformSettings?.contactAddress || 'Ho Chi Minh City, Vietnam';

  return (
    <footer className="bg-[#f7f9ff] border-t border-[#c3c6d7] mt-24 font-sans">
      <div className="w-full py-12 px-4 md:px-10 mt-auto flex flex-col md:flex-row justify-between items-start max-w-[1280px] mx-auto gap-12">
        <div className="max-w-xs space-y-6">
          <Link to="/" className="flex items-center gap-2 font-sans text-2xl text-primary tracking-tight font-extrabold">
            {logoUrl && <img src={logoUrl} alt={storeName} className="h-8 w-8 object-contain rounded-lg" />}
            {storeName}
          </Link>
          <p className="text-sm text-[#434655] leading-relaxed">Elevating the multi-vendor experience with academic precision and soft aesthetics.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 flex-grow">
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider">Explore</h4>
            <ul className="space-y-3 text-sm text-[#434655]">
              <li><Link className="hover:text-primary transition-all" to="/search">New Arrivals</Link></li>
              <li><Link className="hover:text-primary transition-all" to="/search">Featured Designers</Link></li>
              <li><Link className="hover:text-primary transition-all" to="/support">Help Center</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3 text-sm text-[#434655]">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">mail</span>
                <a className="hover:text-primary transition-all" href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                <a className="hover:text-primary transition-all" href={`tel:${contactPhone}`}>{contactPhone}</a>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">location_on</span>
                <span>{contactAddress}</span>
              </li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider">Connect</h4>
            <div className="flex gap-4">
              <a className="w-10 h-10 flex items-center justify-center rounded-full bg-[#e1e4f5] text-[#434655] hover:bg-primary hover:text-white transition-all shadow-sm" href="#"><span className="material-symbols-outlined text-[20px]">language</span></a>
              <a className="w-10 h-10 flex items-center justify-center rounded-full bg-[#e1e4f5] text-[#434655] hover:bg-primary hover:text-white transition-all shadow-sm" href={`mailto:${contactEmail}`}><span className="material-symbols-outlined text-[20px]">alternate_email</span></a>
              <a className="w-10 h-10 flex items-center justify-center rounded-full bg-[#e1e4f5] text-[#434655] hover:bg-primary hover:text-white transition-all shadow-sm" href="#"><span className="material-symbols-outlined text-[20px]">share</span></a>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full px-4 md:px-10 py-6 border-t border-[#c3c6d7] max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-[#434655]">© {new Date().getFullYear()} {storeName} Marketplace.</p>
        <p className="font-bold opacity-30 uppercase tracking-widest text-[10px]">Academic Modernism Framework v1.0</p>
      </div>
    </footer>
  );
};

export default Footer;
