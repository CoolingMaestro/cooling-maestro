import React from "react";

interface CalculationTypeCardsProps {
  selectedCalculationType: "quick" | "detailed" | null;
  setSelectedCalculationType: (type: "quick" | "detailed") => void;
  setShowCalculationForm: (show: boolean) => void;
}

const CalculationTypeCards: React.FC<CalculationTypeCardsProps> = ({
  selectedCalculationType,
  setSelectedCalculationType,
  setShowCalculationForm,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Hızlı Hesaplama Kartı */}
      <div
        className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-lg
        ${
          selectedCalculationType === "quick"
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-blue-300"
        }`}
        onClick={() => {
          setSelectedCalculationType("quick");
          setShowCalculationForm(true);
        }}
      >
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <i className="fas fa-bolt text-xl text-blue-600"></i>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Hızlı Hesaplama
            </h3>
            <p className="text-sm text-gray-600">
              5 dakika içinde sonuç alın
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          <li className="flex items-center text-gray-600">
            <i className="fas fa-check text-green-500 mr-2"></i>
            <span>Temel parametrelerle hızlı hesaplama</span>
          </li>
          <li className="flex items-center text-gray-600">
            <i className="fas fa-check text-green-500 mr-2"></i>
            <span>Yaklaşık değerler</span>
          </li>
          <li className="flex items-center text-gray-600">
            <i className="fas fa-check text-green-500 mr-2"></i>
            <span>Ön fizibilite için ideal</span>
          </li>
        </ul>
      </div>

      {/* Detaylı Hesaplama Kartı */}
      <div
        className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-lg
        ${
          selectedCalculationType === "detailed"
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-blue-300"
        }`}
        onClick={() => {
          setSelectedCalculationType("detailed");
          setShowCalculationForm(true);
        }}
      >
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <i className="fas fa-clipboard-list text-xl text-blue-600"></i>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Detaylı Hesaplama
            </h3>
            <p className="text-sm text-gray-600">
              Hassas sonuçlar için detaylı analiz
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          <li className="flex items-center text-gray-600">
            <i className="fas fa-check text-green-500 mr-2"></i>
            <span>Kapsamlı parametre girişi</span>
          </li>
          <li className="flex items-center text-gray-600">
            <i className="fas fa-check text-green-500 mr-2"></i>
            <span>Yüksek hassasiyetli sonuçlar</span>
          </li>
          <li className="flex items-center text-gray-600">
            <i className="fas fa-check text-green-500 mr-2"></i>
            <span>Profesyonel projeler için uygun</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CalculationTypeCards;