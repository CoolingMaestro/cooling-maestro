// Ana uygulama giriş noktası
// React ve Ant Design'ı başlatır, doğru rota yapısını kurar

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import trTR from 'antd/locale/tr_TR'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage'
import Dashboard from './Dashboard'
import Calculation from './Calculation'
import './main.css'

// Swiper CSS - LandindPage.tsx'de kullanılan carousel için gerekli
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/autoplay'

// Font Awesome ikonları için
const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
document.head.appendChild(link)

// React uygulamasını başlat
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={trTR}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} /> {/* Ana sayfa - Karşılama sayfası */}
          <Route path="/dashboard" element={<Dashboard />} /> {/* Dashboard sayfası */}
          <Route path="/calculation" element={<Calculation />} /> {/* Hesaplamalar sayfası */}
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
)