import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  GraduationCap,
  Lightbulb,
  LockKeyhole,
  Mail,
  Network,
  Settings,
} from "lucide-react";
import api from "../api";
import "../components/styles/Login.css";
import Logo from '../assets/logo.png'   

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/login/", formData);

      setMessage(response.data.message);
      console.log(response.data);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("is_staff", response.data.is_staff);
        localStorage.setItem("user", JSON.stringify(response.data));
      }
      
      if (response.data.is_staff === true) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setMessage("Invalid username or password");
    }
  };

  return (
    <div className="login-page">
      <section className="login-brand-panel" aria-label="SwapWise introduction">
        <button className="login-home-button" type="button" onClick={() => navigate('/')}>
          <GraduationCap size={24} />
        </button>

        <div className="login-orbit" aria-hidden="true">
          <div className="login-floating-icon icon-settings">
            <Settings size={22} />
          </div>
          <div className="login-floating-icon icon-bulb">
            <Lightbulb size={25} />
          </div>
          <div className="login-floating-icon icon-network">
            <Network size={28} />
          </div>
        </div>

        <div className="login-brand-content">
          {/* Flex container to keep logo and text on the same line */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px', 
            marginBottom: '16px' 
          }}>
            <img 
              src={Logo} 
              alt="SwapWise Logo" 
              style={{ 
                width: '45px', 
                height: '45px', 
                objectFit: 'contain' 
              }} 
            />
            <h1 style={{ margin: 0 }}>SwapWise</h1>
          </div>

          <p>The next generation of financial intelligence and asset exchange.</p>

          <div className="login-badges">
            <span>Skill Exchange</span>
            <span>Growth Driven</span>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <form onSubmit={handleLogin} className="login-form">
          <div className="login-form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to continue learning.</p>
          </div>

          <label className="login-field">
            <span>Email Address</span>
            <div className="login-input-wrap">
              <Mail size={19} />
              <input
                type="text"
                name="username"
                placeholder="you@example.com"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </label>

          <label className="login-field">
            <span className="login-label-row">
              Password
              <button className="login-forgot" type="button">
                Forgot password?
              </button>
            </span>
            <div className="login-input-wrap">
              <LockKeyhole size={19} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="........"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                className="login-password-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </label>

          <label className="login-remember">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>

          <button type="submit" className="login-submit">
            Sign In
          </button>

          {message && <p className="login-message">{message}</p>}

          <p className="login-register-text">
            Don&apos;t have an account?{" "}
            <button type="button" onClick={() => navigate('/register')}>
              Sign Up
            </button>
          </p>
        </form>
      </section>
    </div>
  );
}

export default Login;