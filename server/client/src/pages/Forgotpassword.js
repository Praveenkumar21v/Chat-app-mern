import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array(6).fill('')); 
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(''); 
  const navigate = useNavigate();
  const otpRefs = useRef([]); 

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const URL = `${process.env.REACT_APP_BACKEND_URL}/api/forgot-password/generate-otp`;

    try {
      const response = await axios.post(URL, { email });
      toast.success(response.data.message);
      setStep(2); 
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  const handleOtpChange = (index, value) => {
    if (/^[0-9]$/.test(value) || value === '') { 
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < otp.length - 1) {
        otpRefs.current[index + 1].focus();
      }

      if (value.length === 1) {
        setPasswordError('');
      }
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join(''); 
    const URL = `${process.env.REACT_APP_BACKEND_URL}/api/forgot-password/verify-otp`;

    try {
      const response = await axios.post(URL, { email, otp: otpString });
      toast.success(response.data.message);
      setStep(3); 
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match!");
      return; 
    }

    const URL = `${process.env.REACT_APP_BACKEND_URL}/api/forgot-password/update-password`;

    try {
      const response = await axios.post(URL, { email, newPassword });
      toast.success(response.data.message);
      navigate('/email'); 
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  return (
    <div className='mt-5'>
      <div className='bg-white w-full max-w-md rounded overflow-hidden p-4 mx-auto'>
        <h3 className='text-center'>Forgot Password</h3>

        {step === 1 && (
          <form className='grid gap-4 mt-5' onSubmit={handleEmailSubmit}>
            <div className='flex flex-col gap-1'>
              <label htmlFor='email'>Email:</label>
              <input
                type='email'
                id='email'
                name='email'
                placeholder='Enter your email'
                className='bg-slate-100 px-2 py-1 focus:outline-primary'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button className='bg-primary text-lg px- 4 py-1 hover:bg-secondary rounded mt-2 font-bold text-white leading-relaxed tracking-wide'>
              Generate OTP
            </button>
          </form>
        )}

        {step === 2 && (
          <form className='grid gap-4 mt-5' onSubmit={handleOtpSubmit}>
            <div className='flex flex-col gap-1'>
              <label htmlFor='otp'>Enter OTP:</label>
              <div className='grid grid-cols-6 gap-2'>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type='text'
                    maxLength='1'
                    className='bg-slate-100 px-2 py-1 focus:outline-primary text-center'
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    ref={(el) => (otpRefs.current[index] = el)} 
                  />
                ))}
              </div>
            </div>
            <button className='bg-primary text-lg px-4 py-1 hover:bg-secondary rounded mt-2 font-bold text-white leading-relaxed tracking-wide'>
              Verify OTP
            </button>
          </form>
        )}

        {step === 3 && (
          <form className='grid gap-4 mt-5 ' onSubmit={handlePasswordSubmit}>
            <div className='flex flex-col gap-1'>
              <label htmlFor='newPassword'>New Password:</label>
              <input
                type='password'
                id='newPassword'
                name='newPassword'
                placeholder='Enter new password'
                className='bg-slate-100 px-2 py-1 focus:outline-primary'
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError(''); 
                }}
                required
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label htmlFor='confirmPassword'>Confirm Password:</label>
              <input
                type='password'
                id='confirmPassword'
                name='confirmPassword'
                placeholder='Confirm new password'
                className='bg-slate-100 px-2 py-1 focus:outline-primary'
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError(''); 
                }}
                required
              />
            </div>
            {passwordError && (
              <p className='text-red-500 text-sm'>{passwordError}</p>
            )}
            <button className='bg-primary text-lg px-4 py-1 hover:bg-secondary rounded mt-2 font-bold text-white leading-relaxed tracking-wide'>
              Complete Setup
            </button>
          </form>
        )}

        <p className='my-3 text-center'>
          <Link to={"/email"} className='hover:text-primary font-semibold'>
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;