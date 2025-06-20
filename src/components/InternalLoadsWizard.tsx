import React, { useState } from "react";
import { Steps, Button, Form, FormInstance } from "antd";
import {
  BulbOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import InternalLoadsLighting from "./InternalLoadsLighting";
import InternalLoadsPeople from "./InternalLoadsPeople";
import InternalLoadsMotor from "./InternalLoadsMotor";
import InternalLoadsEquipment from "./InternalLoadsEquipment";

const { Step } = Steps;

interface InternalLoadsWizardProps {
  form: FormInstance;
  roomDryBulbTemperature?: number;
  onComplete?: () => void;
}

const InternalLoadsWizard: React.FC<InternalLoadsWizardProps> = ({ 
  form, 
  roomDryBulbTemperature = 23.9,
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Aydınlatma",
      icon: <BulbOutlined />,
      component: <InternalLoadsLighting form={form} />,
    },
    {
      title: "İnsan",
      icon: <TeamOutlined />,
      component: <InternalLoadsPeople form={form} roomDryBulbTemperature={roomDryBulbTemperature} />,
    },
    {
      title: "Motor",
      icon: <ThunderboltOutlined />,
      component: <InternalLoadsMotor form={form} />,
    },
    {
      title: "Ekipman",
      icon: <ToolOutlined />,
      component: <InternalLoadsEquipment form={form} />,
    },
  ];

  const next = () => {
    setCurrentStep(currentStep + 1);
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="w-full">
      <Steps current={currentStep} className="mb-8">
        {steps.map((step, index) => (
          <Step 
            key={index} 
            title={step.title} 
            icon={step.icon}
            className="cursor-pointer"
            onClick={() => setCurrentStep(index)}
          />
        ))}
      </Steps>

      <div className="min-h-[400px]">
        {steps[currentStep].component}
      </div>

      <div className="flex justify-between mt-8">
        <Button
          disabled={currentStep === 0}
          onClick={prev}
        >
          Önceki
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button type="primary" onClick={next}>
            Sonraki
          </Button>
        ) : (
          <Button type="primary" onClick={handleComplete}>
            Tamamla
          </Button>
        )}
      </div>
    </div>
  );
};

export default InternalLoadsWizard;