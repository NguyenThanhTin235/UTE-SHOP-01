import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { resetPassword, reset } from '../redux/authSlice';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const { newPassword, confirmPassword } = passwords;
  
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const email = location.state?.email;

  const { isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (isError) {
      toast.dismiss();
      toast.error(message);
      dispatch(reset());
    }

    if (isSuccess && message === 'Password has been updated successfully') {
      toast.dismiss();
      toast.success('Password reset successful! Please login.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      dispatch(reset());
    }
  }, [isError, isSuccess, message, navigate, dispatch]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePasswordChange = (e) => {
    setPasswords((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length < 6) {
      toast.error('Please enter all 6 digits of OTP');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    dispatch(resetPassword({ email, otp: otpCode, newPassword }));
  };

  return (
    <Layout>
      <div className="container-xl d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '70vh' }}>
        <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border text-center" style={{ maxWidth: '480px', width: '100%' }}>
          <div className="d-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success rounded-circle mx-auto mb-4" style={{ width: '56px', height: '56px' }}>
            <i className="fa-solid fa-key fs-4"></i>
          </div>
          
          <h1 className="h3 fw-bold mb-2" style={{ color: '#1e3a8a' }}>Reset your password</h1>
          <p className="text-muted small mb-4">
            We've sent a 6-digit code to <span className="text-dark fw-bold">{email}</span>.
          </p>

          <form onSubmit={onSubmit} className="text-start">
            <div className="mb-4">
              <label className="form-label fw-bold text-muted mb-2 d-block text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                VERIFICATION CODE
              </label>
              <div className="d-flex justify-content-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    className={`form-control text-center fw-bold fs-4 ${digit ? 'border-primary' : ''}`}
                    style={{ width: '50px', height: '60px', color: '#2563eb' }}
                    value={digit}
                    maxLength={1}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    required
                  />
                ))}
              </div>
            </div>

            <InputField
              label="NEW PASSWORD"
              type="password"
              name="newPassword"
              value={newPassword}
              placeholder="••••••••"
              icon="fa-solid fa-lock"
              onChange={handlePasswordChange}
              required
            />

            <InputField
              label="CONFIRM NEW PASSWORD"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              placeholder="••••••••"
              icon="fa-solid fa-lock"
              onChange={handlePasswordChange}
              required
            />

            <PrimaryButton type="submit" isLoading={isLoading} className="py-3 rounded-3 mb-4 w-100 fw-bold">
              Reset Password
            </PrimaryButton>
          </form>

          <div className="border-top pt-4">
            <Link to="/forgot-password" className="text-muted text-decoration-none small fw-medium d-flex align-items-center justify-content-center gap-2 hover-primary transition-all">
              <i className="fa-solid fa-arrow-left"></i> Change Email
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPassword;
