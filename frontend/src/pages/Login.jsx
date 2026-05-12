import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login, reset } from '../redux/authSlice';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const { email, password, rememberMe } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      toast.dismiss();
      toast.error(message);
      dispatch(reset());
    }

    if (isSuccess && user) {
      toast.dismiss();
      toast.success('Login successful!');
      navigate('/user/profile');
      dispatch(reset());
    }
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <Layout>
      <div className="container-fluid p-0" style={{ backgroundColor: '#f9fafb' }}>
        <div className="container-xl py-5">
          <main className="row g-0 bg-white shadow-sm rounded-4 overflow-hidden mx-auto" style={{ maxWidth: '1200px', border: '1px solid #eee', minHeight: '700px' }}>
            {/* Left Side: Visual Section */}
            <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 text-white position-relative"
                 style={{ 
                   background: 'url("https://images.unsplash.com/photo-1441984904996-e0b6ed29ae27?auto=format&fit=crop&w=1000&q=80") center/cover no-repeat',
                   minHeight: '700px'
                 }}>
              <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.1), rgba(0,0,0,0.4))' }}></div>
              
              <div className="position-relative z-1 text-center">
                <div className="d-inline-flex align-items-center gap-2 mb-1">
                  <div className="border border-2 border-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <i className="fa-solid fa-diamond fs-6"></i>
                  </div>
                  <span className="fs-3 fw-bold">UTEShop</span>
                </div>
                <p className="small opacity-90 tracking-widest text-uppercase mb-0" style={{ letterSpacing: '1px', fontSize: '12px' }}>Multi-vendor Fashion Marketplace</p>
                <div className="mx-auto mt-3" style={{ width: '150px', height: '1px', background: 'rgba(255,255,255,0.4)' }}></div>
              </div>

              <div className="position-relative z-1 glass-card p-4 rounded-4 mx-2 mb-2" 
                   style={{ 
                     background: 'rgba(255, 255, 255, 0.15)', 
                     backdropFilter: 'blur(12px)', 
                     border: '1px solid rgba(255, 255, 255, 0.25)',
                     boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                   }}>
                <p className="fs-5 fw-medium fst-italic mb-4" style={{ lineHeight: '1.4' }}>"Redefining modern elegance through a curated collective of global fashion visionaries."</p>
                <div className="d-flex align-items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80" 
                       alt="Elena Rossi" className="rounded-circle" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                  <div className="text-start">
                    <h6 className="mb-0 fw-bold" style={{ fontSize: '14px' }}>Elena Rossi</h6>
                    <span className="opacity-80" style={{ fontSize: '12px' }}>Head of Curation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Form Section */}
            <div className="col-lg-6 d-flex align-items-center justify-content-center p-4 p-md-5" style={{ backgroundColor: '#f9fafb' }}>
              <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm w-100" style={{ maxWidth: '450px' }}>
                <div className="text-center mb-5">
                  <h1 className="fw-bold h2 mb-2" style={{ color: '#111827' }}>Welcome back</h1>
                  <p className="text-muted small">Login to continue shopping</p>
                </div>

                <form onSubmit={onSubmit}>
                  <InputField
                    label="Email Address"
                    type="email"
                    name="email"
                    value={email}
                    placeholder="name@example.com"
                    icon="fa-regular fa-envelope"
                    onChange={onChange}
                    required
                  />

                  <InputField
                    label="Password"
                    type="password"
                    name="password"
                    value={password}
                    placeholder="Enter your password"
                    icon="fa-solid fa-lock"
                    onChange={onChange}
                    required
                  />

                  <div className="d-flex justify-content-between align-items-center mb-4" style={{ fontSize: '13px' }}>
                    <div className="form-check">
                      <input 
                        type="checkbox" 
                        className="form-check-input" 
                        id="rememberMe" 
                        name="rememberMe"
                        checked={rememberMe}
                        onChange={onChange}
                      />
                      <label className="form-check-label text-muted" htmlFor="rememberMe">Remember me</label>
                    </div>
                    <Link to="/forgot-password" className="text-dark fw-bold text-decoration-none">Forgot password?</Link>
                  </div>

                  <PrimaryButton type="submit" isLoading={isLoading} className="py-3 rounded-3 mb-4 shadow-sm w-100 fw-bold">
                    Login
                  </PrimaryButton>

                  <div className="d-flex align-items-center my-4">
                    <hr className="flex-grow-1 text-muted opacity-10" />
                    <span className="mx-3 text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>OR CONTINUE WITH</span>
                    <hr className="flex-grow-1 text-muted opacity-10" />
                  </div>

                  <div className="row g-3 mb-5">
                    <div className="col-6">
                      <button type="button" className="btn btn-outline-light border text-dark w-100 py-2 d-flex align-items-center justify-content-center gap-2 hover-bg-light rounded-3 shadow-sm" style={{ fontSize: '13px', fontWeight: '500' }}>
                        <i className="fa-brands fa-google text-danger"></i> Google
                      </button>
                    </div>
                    <div className="col-6">
                      <button type="button" className="btn btn-outline-light border text-dark w-100 py-2 d-flex align-items-center justify-content-center gap-2 hover-bg-light rounded-3 shadow-sm" style={{ fontSize: '13px', fontWeight: '500' }}>
                        <i className="fa-brands fa-facebook-f text-primary"></i> Facebook
                      </button>
                    </div>
                  </div>

                  <div className="text-center small text-muted">
                    Don't have an account? <Link to="/register" className="text-danger fw-bold text-decoration-none ms-1">Sign up</Link>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
