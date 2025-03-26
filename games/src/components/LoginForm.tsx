import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { setCookie } from '../utils/cookie';
import { useUser } from '../context/UserContext'; // Import the useUser hook

const LoginForm = () => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const userData = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.post('/auth/login', { mobile });
      const { token, } = response.data;
      setCookie('token', token, 1); // Set token in cookies
      const expirationTime = new Date().getTime() + 24 * 60 * 60 * 1000; 
      localStorage.setItem('user', JSON.stringify({userData:response.data, expirationTime}));
      
      api.defaults.headers['Authorization'] = `Bearer ${token}`;

      // Set the user in the global context
      

      navigate(`${userData.userData.data.user.role === 'moderator' ? '/moderator' : '/games'}`);
    } catch (err) {
      console.log(err);
      setError('Login failed. Please check your mobile number.');
    }
  };


  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Mobile</label>
          <input
            type="text"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginForm;
