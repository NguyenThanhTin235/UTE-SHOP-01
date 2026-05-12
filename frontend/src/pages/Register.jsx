import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { sendOTP, reset } from '../redux/authSlice';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { fullName, email, password, confirmPassword } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      toast.dismiss();
      toast.error(message);
      dispatch(reset());
    }

    if (isSuccess && message === 'OTP has been sent to your email') {
      toast.dismiss();
      toast.success(message);
      navigate('/verify-otp', { state: { regData: formData } });
      dispatch(reset());
    }
  }, [isError, isSuccess, message, navigate, dispatch, formData]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.dismiss();
      toast.error('Passwords do not match');
    } else {
      dispatch(sendOTP(email.trim()));
    }
  };

  return (
    <Layout>
      <div className="container-xl d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '80vh' }}>
        <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border text-center" style={{ maxWidth: '520px', width: '100%' }}>
          <div className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle" 
               style={{ width: '56px', height: '56px' }}>
            <i className="fa-solid fa-diamond fs-4"></i>
          </div>
          
          <h1 className="fw-bold h3 mb-1">Create your account</h1>
          <p className="text-muted small mb-5">Start shopping from multiple fashion stores</p>

          <form onSubmit={onSubmit} className="text-start">
            <InputField
              label="Full name"
              type="text"
              name="fullName"
              value={fullName}
              placeholder="Eleanor Rigby"
              icon="fa-regular fa-user"
              onChange={onChange}
              required
            />

            <InputField
              label="Email address"
              type="email"
              name="email"
              value={email}
              placeholder="eleanor@fashion.com"
              icon="fa-regular fa-envelope"
              onChange={onChange}
              required
            />

            <div className="row g-3">
              <div className="col-6">
                <InputField
                  label="Password"
                  type="password"
                  name="password"
                  value={password}
                  placeholder="••••••••"
                  icon="fa-solid fa-lock"
                  onChange={onChange}
                  required
                />
              </div>
              <div className="col-6">
                <InputField
                  label="Confirm"
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  placeholder="••••••••"
                  icon="fa-solid fa-lock"
                  onChange={onChange}
                  required
                />
              </div>
            </div>

            <PrimaryButton type="submit" isLoading={isLoading} className="py-3 rounded-3 mb-3 w-100 fw-bold">
              Create account <i className="fa-solid fa-arrow-right ms-2"></i>
            </PrimaryButton>

            <div className="text-center mb-4 text-muted" style={{ fontSize: '11px' }}>
              <i className="fa-solid fa-shield-halved me-2"></i>
              Your data is protected by industry standard encryption
            </div>

            <div className="d-flex align-items-center mb-4">
              <hr className="flex-grow-1 text-muted opacity-25" />
              <span className="mx-3 text-muted fw-bold" style={{ fontSize: '10px' }}>OR</span>
              <hr className="flex-grow-1 text-muted opacity-25" />
            </div>

            <div className="row g-2 mb-4 text-center">
              {[
                { icon: 'fa-solid fa-store', label: 'MULTI-VENDOR' },
                { icon: 'fa-solid fa-credit-card', label: 'SECURE PAY' },
                { icon: 'fa-solid fa-truck-fast', label: 'FREE RETURNS' },
              ].map((feature, idx) => (
                <div key={idx} className="col-4">
                  <div className="d-flex flex-column align-items-center gap-2">
                    <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px' }}>
                      <i className={`${feature.icon} fs-6`}></i>
                    </div>
                    <span className="fw-bold text-muted" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>{feature.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center small text-muted">
              Already have an account? <Link to="/login" className="text-primary fw-bold text-decoration-none ms-1">Login</Link>
            </div>
          </form>
        </div>

        <div className="mt-4 d-flex gap-4 text-muted small fw-bold" style={{ letterSpacing: '1px', fontSize: '10px' }}>
          <a href="#" className="text-decoration-none text-muted hover-dark">PRIVACY POLICY</a>
          <span>&bull;</span>
          <a href="#" className="text-decoration-none text-muted hover-dark">TERMS OF SERVICE</a>
          <span>&bull;</span>
          <a href="#" className="text-decoration-none text-muted hover-dark">HELP CENTER</a>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
