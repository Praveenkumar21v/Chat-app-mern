import axios from 'axios';
import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logout, setOnlineUser, setSocketConnection, setUser } from '../redux/userSlice';
import Sidebar from '../components/Sidebar';
import logo from '../assets/logo.png';
import io from 'socket.io-client';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUserDetails = useCallback(async () => {
    try {
      const URL = `${process.env.REACT_APP_BACKEND_URL}/api/user-details`;
      const response = await axios({
        url: URL,
        withCredentials: true
      });

      dispatch(setUser(response.data.data));

      if (response.data.data.logout) {
        dispatch(logout());
        navigate("/email");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  }, [dispatch, navigate]); 

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error("No token found in localStorage");
      return;
    }
    const socketConnection = io(process.env.REACT_APP_BACKEND_URL, {
      transports: ["websocket", "polling"],
      auth: {token},
      reconnection : true,
      reconnectionAttempts : 5,
      reconnectionDelay : 3000
    });

    socketConnection.on('connect', () => console.log('Socket connected:', socketConnection.id));
    socketConnection.on('connect_error', (error) => console.error('Socket connection error:', error));

    dispatch(setSocketConnection(socketConnection));

    socketConnection.on('onlineUser', (data) => {
      dispatch(setOnlineUser(data));
    });
    
    return () => {
      socketConnection.disconnect();
      dispatch(setSocketConnection(""));

    };
  }, [dispatch]); 

  const basePath = location.pathname === '/';
  return (
    <div className='grid lg:grid-cols-[300px,1fr] h-screen max-h-screen'>
      <section className={`bg-white ${!basePath && "hidden"} lg:block`}>
        <Sidebar />
      </section>

      <section className={`${basePath && "hidden"}`}>
        <Outlet />
      </section>

      <div className={`justify-center items-center flex-col gap-2 hidden ${!basePath ? "hidden" : "lg:flex"}`}>
        <div>
          <img
            src={logo}
            width={250}
            alt='logo'
          />
        </div>
        <p className='text-lg mt-2 text-slate-500'>Select user to send message</p>
      </div>
    </div>
  );
};

export default Home;