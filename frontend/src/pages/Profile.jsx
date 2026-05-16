import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateProfile, uploadAvatar, logout, reset } from '../redux/authSlice';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  // Helper to format date for input type="date"
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    try {
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: formatDate(user?.dob),
    gender: user?.gender || '',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = React.useRef(null);

  // Sync form data when user data changes (e.g. after login or update)
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        dob: formatDate(user.dob),
        gender: user.gender || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isError) {
      toast.error(message, { id: 'profile-error' });
      dispatch(reset());
    }
    if (isSuccess && (message === 'Profile updated successfully' || message === 'Avatar uploaded successfully')) {
      toast.success(message, { id: 'profile-success' });
      dispatch(reset());
    }
  }, [isError, isSuccess, message, dispatch]);

  const onChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const onAvatarClick = () => {
    fileInputRef.current.click();
  };

  const onAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const uploadData = new FormData();
      uploadData.append('avatar', file);
      dispatch(uploadAvatar(uploadData));
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    
    // Basic Phone validation
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      return toast.error('Invalid Vietnamese phone number format', { id: 'profile-error' });
    }

    dispatch(updateProfile(formData));
  };

  const onLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Layout>
      <div className="container-xl py-5" style={{ maxWidth: '1100px' }}>
        <div className="row g-4 align-items-stretch">
          {/* Sidebar */}
          <aside className="col-lg-4 col-xl-3">
            <div className="bg-white rounded-4 shadow-sm border p-4 text-center h-100">
              <div className="position-relative d-inline-block mb-3">
                <img 
                  src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.fullName}&background=random`} 
                  alt="Profile" 
                  className="rounded-circle border border-4 border-white shadow-sm" 
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={onAvatarChange} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                />
                <button 
                  onClick={onAvatarClick}
                  className="position-absolute bottom-0 end-0 bg-primary text-white border-0 rounded-circle d-flex align-items-center justify-content-center shadow" 
                  style={{ width: '28px', height: '28px' }}
                >
                  <i className="fa-solid fa-camera" style={{ fontSize: '10px' }}></i>
                </button>
              </div>
              <h5 className="fw-bold mb-1" style={{ color: '#1e3a8a' }}>{user?.fullName}</h5>
              <p className="text-muted small fw-medium mb-4">Verified Customer</p>

              <div className="list-group list-group-flush text-start border-top pt-3">
                <a href="#" className="list-group-item list-group-item-action border-0 py-3 rounded-3 active d-flex align-items-center gap-3">
                  <i className="fa-regular fa-user fs-5"></i>
                  <span className="small fw-bold">Profile info</span>
                </a>
                <a href="#" className="list-group-item list-group-item-action border-0 py-3 rounded-3 d-flex align-items-center gap-3 text-muted">
                  <i className="fa-solid fa-box-open fs-5"></i>
                  <span className="small fw-bold">Orders history</span>
                </a>
                <a href="#" className="list-group-item list-group-item-action border-0 py-3 rounded-3 d-flex align-items-center gap-3 text-muted">
                  <i className="fa-regular fa-star fs-5"></i>
                  <span className="small fw-bold">Reviews</span>
                </a>
                <a href="#" className="list-group-item list-group-item-action border-0 py-3 rounded-3 d-flex align-items-center gap-3 text-muted">
                  <i className="fa-regular fa-heart fs-5"></i>
                  <span className="small fw-bold">Wishlist</span>
                </a>
                <a href="#" className="list-group-item list-group-item-action border-0 py-3 rounded-3 d-flex align-items-center gap-3 text-muted mb-3">
                  <i className="fa-solid fa-location-dot fs-5"></i>
                  <span className="small fw-bold">Addresses</span>
                </a>
                
                <button onClick={onLogout} className="list-group-item list-group-item-action border-0 py-3 rounded-3 d-flex align-items-center gap-3 text-danger border-top">
                  <i className="fa-solid fa-arrow-right-from-bracket fs-5"></i>
                  <span className="small fw-bold">Logout</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="col-lg-8 col-xl-9">
            <div className="bg-white rounded-4 shadow-sm border p-4 p-md-5 h-100">
              <div className="mb-5">
                <h2 className="fw-bold h3 mb-2" style={{ color: '#1e3a8a' }}>Personal information</h2>
                <p className="text-muted small">Manage your identity and contact details across the UTEShop marketplace.</p>
              </div>

              <form onSubmit={onSubmit}>
                <div className="row g-4 mb-5">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.5px' }}>Full Name</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <i className="fa-regular fa-user"></i>
                      </span>
                      <input 
                        type="text" 
                        name="fullName" 
                        className="form-control bg-light border-start-0 ps-0 py-2" 
                        value={formData.fullName} 
                        onChange={onChange}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.5px' }}>Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <i className="fa-regular fa-envelope"></i>
                      </span>
                      <input 
                        type="email" 
                        name="email" 
                        className="form-control bg-light border-start-0 ps-0 py-2" 
                        value={formData.email} 
                        onChange={onChange}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.5px' }}>Phone Number</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <i className="fa-solid fa-phone"></i>
                      </span>
                      <input 
                        type="text" 
                        name="phone" 
                        className="form-control bg-light border-start-0 ps-0 py-2" 
                        value={formData.phone} 
                        onChange={onChange}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.5px' }}>Date of Birth</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <i className="fa-regular fa-calendar"></i>
                      </span>
                      <input 
                        type="date" 
                        name="dob" 
                        className="form-control bg-light border-start-0 ps-0 py-2" 
                        value={formData.dob} 
                        onChange={onChange}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.5px' }}>Gender</label>
                    <select 
                      name="gender" 
                      className="form-select bg-light py-2" 
                      value={formData.gender} 
                      onChange={onChange}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.5px' }}>Account Tier</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-primary">
                        <i className="fa-solid fa-shield-halved"></i>
                      </span>
                      <input 
                        type="text" 
                        className="form-control bg-light border-start-0 ps-0 py-2 text-primary fw-bold" 
                        value="Premium Academic Member" 
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between pt-4 border-top">
                  <div className="text-muted small d-flex align-items-center gap-2">
                    <i className="fa-regular fa-clock"></i>
                    Last updated on October 24, 2023
                  </div>
                  <button type="submit" disabled={isLoading} className="btn btn-primary px-5 py-2 fw-bold rounded-3 shadow-sm">
                    {isLoading ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
