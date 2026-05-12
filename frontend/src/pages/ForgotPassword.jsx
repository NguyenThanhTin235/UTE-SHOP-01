import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, reset } from '../redux/authSlice';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
      setSubmitted(true);
      dispatch(reset());
    }
  }, [isError, isSuccess, message, dispatch]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    dispatch(forgotPassword(email));
  };

  return (
    <Layout>
      <div className="container-fluid d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '70vh' }}>
        <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border text-center" style={{ maxWidth: '480px', width: '100%' }}>
          {!submitted ? (
            <>
              <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mx-auto mb-4" style={{ width: '56px', height: '56px' }}>
                <i className="fa-solid fa-shield-halved fs-4"></i>
              </div>
              
              <h1 className="h3 fw-bold mb-2" style={{ color: '#1e3a8a' }}>Forgot your password?</h1>
              <p className="text-muted small mb-5 px-3">
                Enter your email address and we'll send<br className="d-none d-md-block" /> you a link to reset your password.
              </p>

              <form onSubmit={onSubmit} className="text-start">
                <InputField
                  label="EMAIL ADDRESS"
                  type="email"
                  name="email"
                  value={email}
                  placeholder="name@university.edu"
                  icon="fa-regular fa-envelope"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <PrimaryButton type="submit" isLoading={isLoading} className="py-3 rounded-3 mb-4 w-100 fw-bold">
                  Send reset link
                </PrimaryButton>
              </form>

              <div className="pt-2">
                <Link to="/login" className="text-muted text-decoration-none small fw-medium d-flex align-items-center justify-content-center gap-2">
                  <i className="fa-solid fa-arrow-left"></i> Back to Login
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mx-auto mb-4" style={{ width: '56px', height: '56px' }}>
                <i className="fa-regular fa-envelope fs-4"></i>
              </div>
              
              <h1 className="h3 fw-bold mb-2" style={{ color: '#1e3a8a' }}>Check your email</h1>
              <p className="text-muted small mb-4">
                If an account exists for that email, you will<br />receive password reset instructions shortly.
              </p>

              <div className="p-4 rounded-4 mb-4" style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7' }}>
                <div className="d-flex align-items-center justify-content-center bg-white text-success rounded-circle mx-auto mb-3 shadow-sm" style={{ width: '40px', height: '40px', border: '1px solid #dcfce7' }}>
                  <i className="fa-solid fa-check"></i>
                </div>
                <h6 className="fw-bold mb-1" style={{ color: '#166534', fontSize: '15px' }}>Password reset email sent</h6>
                <p className="small mb-0" style={{ color: '#166534', opacity: 0.8 }}>We've sent a recovery link to your registered email address. Please check your inbox.</p>
              </div>

              <PrimaryButton onClick={() => navigate('/reset-password', { state: { email } })} className="py-3 rounded-3 mb-4 w-100 fw-bold">
                Enter Reset Code
              </PrimaryButton>

              <div className="small text-muted mb-3">
                Didn't receive the email? Check your spam folder or
              </div>
              
              <Link to="/login" className="text-primary text-decoration-none small fw-bold d-flex align-items-center justify-content-center gap-2 mb-4">
                <i className="fa-solid fa-arrow-left"></i> Back to Login
              </Link>

              <div className="border-top pt-4 text-muted small fw-bold" style={{ letterSpacing: '1px', fontSize: '10px' }}>
                ACADEMIC MODERNISM • SECURE PORTAL
              </div>
            </>
          )}
        </div>

        {!submitted && (
          <p className="mt-4 text-muted small px-3 text-center" style={{ maxWidth: '450px' }}>
            If you're having trouble receiving the email, please check your spam folder or <a href="#" className="text-dark fw-bold text-decoration-none">contact Support</a>.
          </p>
        )}
        {submitted && (
          <p className="mt-4 text-muted small px-3 text-center" style={{ maxWidth: '450px' }}>
            Need help? <a href="#" className="text-primary fw-bold text-decoration-none">Contact UTEShop Support</a>
          </p>
        )}
      </div>
    </Layout>
  );
};

export default ForgotPassword;
