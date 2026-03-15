import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      /** Giao diện chữ chuyên nghiệp: Inter + stack hệ thống; mono cho IMEI/mã/số liệu */
      fontFamily: {
        sans: [
          'Inter',
          '"SF Pro Display"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        primary: '#1A73E8',
        ink: {
          primary: '#0F172A',
          secondary: '#475569',
          disabled: '#94A3B8',
        },
        surface: {
          app: '#F8FAFC',
          card: '#FFFFFF',
        },
        'border-soft': '#E2E8F0',
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#0EA5E9',
        },
        flow: {
          inbound: '#1A73E8',
          outbound: '#0EA5E9',
          transfer: '#8B5CF6',
        },
      },
      /** Apple-style: phẳng, phân lớp tinh tế — không dùng bóng đất sét đa lớp */
      boxShadow: {
        'apple-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'apple-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'apple-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        /** Ô input / search — lõm nhẹ, không bóng trắng âm */
        'apple-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
        flat: 'none',
      },
      borderRadius: {
        /** Card / panel chính */
        card: '1rem',
        /** Khối phụ, ô thống kê nhỏ */
        card2: '0.75rem',
      },
    },
  },
  plugins: [],
}

export default config

