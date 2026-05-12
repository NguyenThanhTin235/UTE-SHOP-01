import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Header = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <header className="bg-white border-bottom py-3 px-4 w-100 shadow-sm sticky-top" style={{ zIndex: 1030 }}>
      <div className="container-xl d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-5">
          <Link to="/" className="logo-container d-flex align-items-center gap-2 text-decoration-none" style={{ fontSize: '22px', fontWeight: '700', color: '#2563eb' }}>
            <div className="logo-icon border border-2 border-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }}>
              <i className="fa-solid fa-diamond" style={{ fontSize: '12px' }}></i>
            </div>
            UTEShop
          </Link>

          <nav className="d-none d-md-flex align-items-center gap-4">
            <Link to="/marketplace" className="text-dark text-decoration-none small fw-bold hover-primary transition-all">Marketplace</Link>
            <Link to="/collections" className="text-dark text-decoration-none small fw-bold hover-primary transition-all">Collections</Link>
            <Link to="/about" className="text-dark text-decoration-none small fw-bold hover-primary transition-all">About</Link>
          </nav>
        </div>

        <div className="d-flex align-items-center gap-4 text-muted">
          <div className="d-none d-sm-flex align-items-center gap-3 pe-3 border-end">
            <i className="fa-solid fa-magnifying-glass cursor-pointer hover-primary"></i>
            <i className="fa-regular fa-bell cursor-pointer hover-primary position-relative">
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ width: '8px', height: '8px' }}></span>
            </i>
          </div>
          
          {user ? (
            <Link to="/user/profile" className="d-flex align-items-center gap-2 text-decoration-none">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.full_name}&background=random`} 
                alt={user.full_name} 
                className="rounded-circle border" 
                style={{ width: '32px', height: '32px', objectFit: 'cover' }} 
              />
              <span className="d-none d-lg-block small fw-bold text-dark">{user.full_name}</span>
            </Link>
          ) : (
            <div className="d-flex align-items-center gap-3">
              <Link to="/login" className="text-dark text-decoration-none small fw-bold">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm px-3 rounded-pill fw-bold">Join</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
