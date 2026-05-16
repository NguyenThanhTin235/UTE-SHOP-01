import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchTerm(q);
    } else if (location.pathname !== '/search') {
      setSearchTerm('');
    }
  }, [location.search, location.pathname]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white shadow-[0px_4px_20px_rgba(15,23,42,0.05)] sticky top-0 z-50 font-medium text-[#131b2e] font-['Manrope']">
      <div className="flex justify-between items-center w-full px-4 md:px-10 py-4 max-w-[1440px] mx-auto gap-4">
        <div className="flex items-center gap-10 xl:gap-14">
          <Link className="font-['Manrope'] text-2xl text-[#004ac6] tracking-tight font-extrabold" to="/">UTEShop</Link>
          <nav className="hidden lg:flex gap-8">
            <Link className={`text-sm font-medium ${isActive('/') ? 'text-[#004ac6] underline underline-offset-8 decoration-2' : 'text-[#434655] hover:text-[#004ac6] transition-colors'}`} to="/">Home</Link>
            <Link className={`text-sm font-medium ${isActive('/search') ? 'text-[#004ac6] underline underline-offset-8 decoration-2' : 'text-[#434655] hover:text-[#004ac6] transition-colors'}`} to="/search">Shop</Link>
            <Link className={`text-sm font-medium ${isActive('/promotions') ? 'text-[#004ac6] underline underline-offset-8 decoration-2' : 'text-[#434655] hover:text-[#004ac6] transition-colors'}`} to="/promotions">Promotions</Link>
            <Link className={`text-sm font-medium ${isActive('/blog') ? 'text-[#004ac6] underline underline-offset-8 decoration-2' : 'text-[#434655] hover:text-[#004ac6] transition-colors'}`} to="/blog">Blog</Link>
            <Link className={`text-sm font-medium ${isActive('/support') ? 'text-[#004ac6] underline underline-offset-8 decoration-2' : 'text-[#434655] hover:text-[#004ac6] transition-colors'}`} to="/support">Support</Link>
          </nav>
        </div>
        
        <div className="hidden md:flex flex-1 max-w-[600px] mx-6 relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#434655] group-focus-within:text-[#004ac6] transition-colors">search</span>
          <input 
            type="text" 
            placeholder="Search for academic collections..." 
            className="w-full bg-[#f7f9ff] border-none rounded-full py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#004ac6]/20 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        <div className="flex items-center gap-6">
          <button className="md:hidden p-2 hover:bg-[#f7f9ff] rounded-full transition-all duration-200">
            <span className="material-symbols-outlined text-[#434655]">search</span>
          </button>
          <Link to="/cart" className="p-2 hover:bg-[#f7f9ff] rounded-full transition-all duration-200 relative text-[#434655]">
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="absolute top-1 -right-1 w-4 h-4 bg-[#004ac6] text-[10px] text-white flex items-center justify-center rounded-full font-bold">3</span>
          </Link>
          <button className="p-2 hover:bg-[#f7f9ff] rounded-full transition-all duration-200 text-[#434655] relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#b3261e] rounded-full"></span>
          </button>
          {user ? (
            <Link to="/user/profile" className="flex items-center gap-3 p-1 pr-4 hover:bg-[#f7f9ff] rounded-full transition-all duration-200 border border-[#e2e4f0]">
              <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=random`} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
              <span className="text-sm font-bold text-[#131b2e] hidden lg:block tracking-tight">{user.fullName}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-bold text-[#131b2e]">Login</Link>
              <Link to="/register" className="bg-[#004ac6] text-white text-sm font-bold px-4 py-2 rounded-full">Join</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
