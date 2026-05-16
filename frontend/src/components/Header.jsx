import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Header = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <header className="bg-white shadow-[0px_4px_20px_rgba(15,23,42,0.05)] sticky top-0 z-50 font-medium text-[#131b2e]">
      <div className="flex justify-between items-center w-full px-4 md:px-10 py-4 max-w-[1440px] mx-auto gap-8">
        <div className="flex items-center gap-8">
          <Link className="font-['Manrope'] text-2xl text-[#004ac6] tracking-tight font-extrabold" to="/">UTEShop</Link>
          <nav className="hidden md:flex gap-6">
            <Link className="text-sm font-medium text-[#004ac6] underline underline-offset-8 decoration-2" to="/">Home</Link>
            <Link className="text-sm font-medium text-[#434655] hover:text-[#004ac6] transition-colors" to="/shop">Shop</Link>
            <Link className="text-sm font-medium text-[#434655] hover:text-[#004ac6] transition-colors" to="/promotions">Promotions</Link>
            <Link className="text-sm font-medium text-[#434655] hover:text-[#004ac6] transition-colors" to="/blog">Blog</Link>
            <Link className="text-sm font-medium text-[#434655] hover:text-[#004ac6] transition-colors" to="/support">Support</Link>
          </nav>
        </div>
        
        <div className="hidden lg:flex flex-1 max-w-md relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#434655] group-focus-within:text-[#004ac6] transition-colors">search</span>
          <input type="text" placeholder="Search for academic collections..." className="w-full bg-[#f7f9ff] border-none rounded-full py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#004ac6]/20 transition-all outline-none" />
        </div>

        <div className="flex items-center gap-4">
          <button className="lg:hidden p-2 hover:bg-[#f7f9ff] rounded-full transition-all duration-200">
            <span className="material-symbols-outlined text-[#434655]">search</span>
          </button>
          <Link to="/cart" className="p-2 hover:bg-[#f7f9ff] rounded-full transition-all duration-200 relative text-[#434655]">
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#004ac6] text-[10px] text-white flex items-center justify-center rounded-full font-bold">3</span>
          </Link>
          <button className="p-2 hover:bg-[#f7f9ff] rounded-full transition-all duration-200 text-[#434655] relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#b3261e] rounded-full"></span>
          </button>
          {user ? (
            <Link to="/user/profile" className="flex items-center gap-2 p-1 pr-3 hover:bg-[#f7f9ff] rounded-full transition-all duration-200 border border-[#c3c6d7]/30">
              <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=random`} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
              <span className="text-sm font-bold text-[#131b2e] hidden md:block tracking-tight">{user.fullName}</span>
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
