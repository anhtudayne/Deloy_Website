import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { Package, Lock, User as UserIcon, HelpCircle, Globe, Fingerprint, ScanFace } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:3000/api/auth/login', {
        username,
        password,
      });

      if (res.data.success) {
        toast.success(res.data.message, {
          style: {
            background: '#F8FAFC',
            color: '#0F172A',
            borderRadius: '20px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
          iconTheme: {
            primary: '#1A73E8',
            secondary: '#F8FAFC',
          },
        });
        setAuth(res.data.data.accessToken, res.data.data.user);
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng nhập không thành công', {
        style: {
          background: '#F8FAFC',
          color: '#0F172A',
          borderRadius: '20px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
        iconTheme: {
          primary: '#EF4444',
          secondary: '#F8FAFC',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-app flex items-center justify-center relative overflow-hidden font-sans">
      <Toaster position="top-right" />
      
      {/* Header Info */}
      <div className="absolute top-6 left-8 flex items-center gap-2 z-20">
        <h1 className="text-primary font-semibold text-xl tracking-tight">F4 Warehouse</h1>
      </div>
      <div className="absolute top-6 right-8 flex items-center gap-4 text-gray-500 z-20">
        <button className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
          <HelpCircle size={20} />
        </button>
        <button className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
          <Globe size={20} />
        </button>
      </div>

      {/* Floating 3D Elements using Framer Motion */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} 
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute top-24 left-32 opacity-40 blur-[1px]"
      >
        <div className="w-24 h-24 bg-primary/20 rounded-2xl shadow-apple-sm rotate-12 flex items-center justify-center">
          <Package size={40} className="text-primary" />
        </div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, 20, 0], rotate: [0, -15, 0] }} 
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-32 left-32 opacity-30 blur-[2px]"
      >
        <div className="w-20 h-20 bg-primary/15 rounded-2xl shadow-apple-sm flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary rounded-full"></div>
        </div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, -15, 0], rotate: [0, 20, 0] }} 
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-20 right-40 opacity-40 blur-[1px]"
      >
        <div className="w-20 h-20 bg-violet-100 rounded-full shadow-apple-sm flex items-center justify-center rotate-45">
          <Lock size={32} className="text-[#6D28D9]" />
        </div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, 25, 0], rotate: [0, -10, 0] }} 
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-64 right-48 opacity-20 blur-[3px]"
      >
        <div className="w-16 h-16 bg-status-danger/20 rounded-xl shadow-apple-sm rotate-[30deg]" />
      </motion.div>

      {/* Login Card */}
      <div className="bg-white rounded-2xl px-10 py-12 w-[420px] border border-border-soft shadow-apple-lg flex flex-col items-center relative z-10">
        
        <div className="w-16 h-16 bg-primary rounded-full shadow-apple-sm flex items-center justify-center mb-6 border border-white/80">
          <Package className="text-white" size={32} />
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-1">Chào mừng trở lại</h2>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">Hệ thống quản lý kho thông minh</p>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider ml-2">Tên đăng nhập</label>
            <div className="bg-white rounded-full p-4 flex items-center gap-3 shadow-apple-inset w-full ring-2 ring-transparent focus-within:ring-primary/20 border border-border-soft transition-all">
              <UserIcon className="text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="username@f4.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-gray-700 font-medium placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider ml-2">Mật khẩu</label>
            <div className="bg-white rounded-full p-4 flex items-center gap-3 shadow-apple-inset w-full ring-2 ring-transparent focus-within:ring-primary/20 border border-border-soft transition-all">
              <Lock className="text-gray-400" size={20} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-gray-700 font-medium tracking-widest placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-2 mt-[-8px]">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="w-5 h-5 rounded-md bg-slate-100 border border-border-soft flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <input type="checkbox" className="hidden" />
              </div>
              <span className="text-sm text-gray-600 font-medium">Ghi nhớ tôi</span>
            </label>
            <a href="#" className="text-sm font-semibold text-primary hover:underline">Quên mật khẩu?</a>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-primary text-white hover:bg-blue-700 font-bold text-lg py-4 rounded-full shadow-apple-sm active:opacity-90 active:scale-[0.98] transition-all mt-4 disabled:opacity-70"
          >
            {isLoading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-sm text-gray-500 font-medium">Hoặc đăng nhập bằng</p>
          <div className="flex gap-4">
            <button type="button" className="w-12 h-12 bg-white rounded-full shadow-apple-sm flex items-center justify-center active:opacity-80 transition-transform hover:bg-slate-50 border border-border-soft">
              <ScanFace size={22} className="text-gray-700" />
            </button>
            <button type="button" className="w-12 h-12 bg-white rounded-full shadow-apple-sm flex items-center justify-center active:opacity-80 transition-transform hover:bg-slate-50 border border-border-soft">
              <Fingerprint size={22} className="text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 flex flex-col items-center gap-2 z-20">
        <div className="flex gap-4 text-sm font-medium text-gray-500">
          <a href="#" className="hover:text-primary transition-colors">Điều khoản</a>
          <a href="#" className="hover:text-primary transition-colors">Bảo mật</a>
          <a href="#" className="hover:text-primary transition-colors">Liên hệ</a>
        </div>
        <p className="text-xs text-gray-400">© 2024 F4 Warehouse. Hệ thống quản lý kho thông minh.</p>
      </div>

    </div>
  );
}
