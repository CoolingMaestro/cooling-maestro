import React from "react";
import { Button } from "antd";

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-6 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
           <div>
              <h1 className="text-2xl font-bold">Cooling Maestro</h1>
              <p className="text-blue-100">Endüstriyel Soğutma Çözümleri</p>
            </div>
          </div>
          <div className="hidden md:flex space-x-4">
            <Button
              type="link"
              className="text-white hover:text-blue-200 !rounded-button whitespace-nowrap"
            >
              <i className="fas fa-home mr-1"></i> Ana Sayfa
            </Button>
            <Button
              type="link"
              className="text-white hover:text-blue-200 !rounded-button whitespace-nowrap"
            >
              <i className="fas fa-calculator mr-1"></i> Hesaplamalar
            </Button>
            <Button
              type="link"
              className="text-white hover:text-blue-200 !rounded-button whitespace-nowrap"
            >
              <i className="fas fa-book mr-1"></i> Kılavuz
            </Button>
            <Button
              type="link"
              className="text-white hover:text-blue-200 !rounded-button whitespace-nowrap"
            >
              <i className="fas fa-question-circle mr-1"></i> Yardım
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;