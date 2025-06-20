import React from "react";
import { Steps } from "antd";

interface DetailedCalculationStepsProps {
  currentStep: number;
  onChange: (step: number) => void;
}

const DetailedCalculationSteps: React.FC<DetailedCalculationStepsProps> = ({
  currentStep,
  onChange,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <Steps
        current={currentStep}
        onChange={onChange}
        className="custom-steps"
      >
        <Steps.Step
          title="Lokasyon"
          description="Konum ve iklim bilgileri"
          icon={<i className="fas fa-map-marker-alt text-blue-600"></i>}
        />
        <Steps.Step
          title="Isı Geçişi"
          description="Duvar ve yüzeylerden ısı geçişi"
          icon={
            <i className="fas fa-temperature-high text-blue-600"></i>
          }
        />
        <Steps.Step
          title="İç Yükler"
          description="Ekipman ve insan kaynaklı yükler"
          icon={<i className="fas fa-lightbulb text-blue-600"></i>}
        />
        <Steps.Step
          title="Hava Sızıntısı"
          description="Hava değişimi ve sızıntı"
          icon={<i className="fas fa-wind text-blue-600"></i>}
        />
        <Steps.Step
          title="Ürün"
          description="Ürün bilgileri"
          icon={<i className="fas fa-apple-alt text-blue-600"></i>}
        />
        <Steps.Step
          title="Sonuç"
          description="Toplam soğutma yükü"
          icon={<i className="fas fa-chart-bar text-blue-600"></i>}
        />
      </Steps>
    </div>
  );
};

export default DetailedCalculationSteps;