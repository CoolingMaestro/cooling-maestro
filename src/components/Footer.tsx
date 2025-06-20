import React from "react";
import { Typography, Divider } from "antd";

const { Paragraph, Text } = Typography;

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">Cooling Maestro</h3>
              </div>
            </div>
            <Paragraph className="text-gray-400 mb-4">
              Endüstriyel soğutma çözümleri için profesyonel hesaplama araçları
              sunan lider platform.
            </Paragraph>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <i className="fab fa-twitter"></i>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <i className="fab fa-github"></i>
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Hakkımızda</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Şirketimiz
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Ekibimiz
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Kariyer
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  KVKK
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Destek</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Yardım Merkezi
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  SSS
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Dokümantasyon
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  API
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  İletişim
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">İletişim</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt mt-1 mr-3 text-blue-400"></i>
                <span className="text-gray-400">
                  Soğutma Vadisi, No:123
                  <br />
                  Ankara, Türkiye
                </span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-phone-alt mr-3 text-blue-400"></i>
                <span className="text-gray-400">+90 (312) 123 4567</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-envelope mr-3 text-blue-400"></i>
                <span className="text-gray-400">info@coolingmaestro.com</span>
              </li>
            </ul>
            <div className="mt-4 flex items-center space-x-3">
              <i className="fab fa-cc-visa text-xl text-gray-400"></i>
              <i className="fab fa-cc-mastercard text-xl text-gray-400"></i>
              <i className="fab fa-cc-paypal text-xl text-gray-400"></i>
            </div>
          </div>
        </div>
        <Divider className="border-gray-700" />
        <div className="flex flex-col md:flex-row justify-between items-center">
          <Text className="text-gray-500 text-sm">
            © 2025 Cooling Maestro. Tüm hakları saklıdır.
          </Text>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-4">
            <a
              href="#"
              className="text-gray-500 text-sm hover:text-white transition-colors cursor-pointer"
            >
              Gizlilik Politikası
            </a>
            <a
              href="#"
              className="text-gray-500 text-sm hover:text-white transition-colors cursor-pointer"
            >
              Kullanım Şartları
            </a>
            <a
              href="#"
              className="text-gray-500 text-sm hover:text-white transition-colors cursor-pointer"
            >
              Çerez Politikası
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
