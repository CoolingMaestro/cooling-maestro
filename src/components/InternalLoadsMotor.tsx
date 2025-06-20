import React, { useState, useEffect } from "react";
import {
  Card,
  Select,
  Form,
  InputNumber,
  Checkbox,
  FormInstance,
  Tooltip,
} from "antd";
import {
  ThunderboltOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Option } = Select;

interface InternalLoadsMotorProps {
  form: FormInstance;
}

const InternalLoadsMotor: React.FC<InternalLoadsMotorProps> = ({ form }) => {
  const [excludeMotors, setExcludeMotors] = useState<boolean>(false);
  const [motorLocation, setMotorLocation] = useState<string>("both_inside");

  // Initialize form fields
  useEffect(() => {
    form.setFieldsValue({
      excludeMotors: false,
      calculatedMotorLoad: 0,
      motorLocation: "both_inside",
    });
  }, [form]);

  // Motor yükünü hesaplama fonksiyonu - ASHRAE Equation (2), (3), (4)
  const calculateMotorLoad = () => {
    const motorHP = form.getFieldValue("motorHP") || 0;
    const motorCount = form.getFieldValue("motorCount") || 0;
    const hoursPerDay = form.getFieldValue("motorHoursPerDay") || 0;
    const location = form.getFieldValue("motorLocation") || "both_inside";
    
    // HP'den Watt'a dönüşüm (1 HP = 746 W)
    const motorWatts = motorHP * 746 * motorCount;
    
    // Motor verimliliği (HP'ye göre değişir)
    let efficiency = 0.85; // Varsayılan %85
    if (motorHP < 1) efficiency = 0.72;
    else if (motorHP < 5) efficiency = 0.78;
    else if (motorHP < 10) efficiency = 0.82;
    else if (motorHP < 20) efficiency = 0.85;
    else if (motorHP < 50) efficiency = 0.88;
    else if (motorHP < 100) efficiency = 0.90;
    else if (motorHP < 200) efficiency = 0.92;
    else efficiency = 0.94;
    
    let motorHeatGain = 0;
    
    // ASHRAE formüllerine göre hesaplama
    switch (location) {
      case "both_inside":
        // Equation (2): Motor ve ekipman içeride
        motorHeatGain = motorWatts / efficiency;
        break;
      case "motor_outside":
        // Equation (3): Motor dışarıda, ekipman içeride
        motorHeatGain = motorWatts; // Sadece ekipman sürtünme ısısı
        break;
      case "equipment_outside":
        // Equation (4): Motor içeride, ekipman dışarıda
        motorHeatGain = motorWatts * ((1 - efficiency) / efficiency);
        break;
    }
    
    // Günlük faktör
    const dailyFactor = hoursPerDay / 24;
    
    // 2 ondalık basamağa yuvarla
    return Math.round(motorHeatGain * dailyFactor * 100) / 100;
  };

  // Motor yükü değiştiğinde form alanlarını güncelle
  useEffect(() => {
    if (!excludeMotors) {
      const motorLoad = calculateMotorLoad();
      form.setFieldsValue({
        calculatedMotorLoad: motorLoad,
      });
    } else {
      form.setFieldsValue({
        calculatedMotorLoad: 0,
      });
    }
  }, [
    form.getFieldValue("motorHP"),
    form.getFieldValue("motorCount"),
    form.getFieldValue("motorHoursPerDay"),
    form.getFieldValue("motorLocation"),
    excludeMotors
  ]);

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ThunderboltOutlined className="text-red-500 text-xl mr-2" />
            <span className="text-lg font-medium">Motor</span>
          </div>
          <Checkbox 
            checked={excludeMotors}
            onChange={(e) => {
              setExcludeMotors(e.target.checked);
              form.setFieldValue('excludeMotors', e.target.checked);
            }}
          >
            Hesaplamaya dahil etme
          </Checkbox>
        </div>
      }
      className="shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      <div className="space-y-6">
        <Form.Item
          label={
            <span>
              Motor ve Ekipman Konumu{" "}
              <Tooltip 
                title={
                  <div style={{ fontSize: '12px' }}>
                    <strong>ASHRAE'ye göre motor ısı yükü hesaplaması:</strong>
                    <br /><br />
                    <strong>• Motor ve ekipman içeride:</strong><br />
                    Isı Yükü = Motor Gücü / Verimlilik<br />
                    Tüm elektrik enerjisi ısıya dönüşür<br /><br />
                    
                    <strong>• Motor dışarıda, ekipman içeride:</strong><br />
                    Isı Yükü = Motor Gücü<br />
                    Sadece ekipman sürtünme ısısı<br /><br />
                    
                    <strong>• Motor içeride, ekipman dışarıda:</strong><br />
                    Isı Yükü = Motor Gücü × (1-Verimlilik) / Verimlilik<br />
                    Sadece motor kayıp ısısı<br /><br />
                    
                    <em>Örnek: 10 HP motor (%82 verimli, 24 saat çalışma)</em><br />
                    • Her ikisi içeride: 9,098W<br />
                    • Motor dışarıda: 7,460W<br />
                    • Ekipman dışarıda: 1,638W<br /><br />
                    
                    <em>Not: Günlük ortalama yük = Anlık yük × (Çalışma saati / 24)</em>
                  </div>
                }
                placement="right"
              >
                <InfoCircleOutlined style={{ color: '#1890ff', marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
          name="motorLocation"
          rules={[
            {
              required: !excludeMotors,
              message: "Lütfen motor konumunu seçiniz",
            },
          ]}
        >
          <Select
            placeholder="Lütfen Seçin"
            disabled={excludeMotors}
            onChange={(value) => {
              setMotorLocation(value);
              const motorLoad = calculateMotorLoad();
              form.setFieldsValue({
                calculatedMotorLoad: motorLoad,
              });
            }}
          >
            <Option value="both_inside">Motor ve ekipman içeride</Option>
            <Option value="motor_outside">Motor dışarıda, ekipman içeride</Option>
            <Option value="equipment_outside">Motor içeride, ekipman dışarıda</Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="Motor (HP)"
          name="motorHP"
          rules={[
            {
              required: !excludeMotors,
              message: "Lütfen motor gücünü giriniz",
            },
          ]}
        >
          <InputNumber
            min={0}
            className="w-full"
            disabled={excludeMotors}
            onChange={() => {
              const motorLoad = calculateMotorLoad();
              form.setFieldsValue({
                calculatedMotorLoad: motorLoad,
              });
            }}
            addonAfter="HP"
          />
        </Form.Item>
        <Form.Item
          label="Kaç adet motor var?"
          name="motorCount"
          rules={[
            {
              required: !excludeMotors,
              message: "Lütfen motor adedini giriniz",
            },
          ]}
        >
          <InputNumber
            min={0}
            className="w-full"
            disabled={excludeMotors}
            onChange={() => {
              const motorLoad = calculateMotorLoad();
              form.setFieldsValue({
                calculatedMotorLoad: motorLoad,
              });
            }}
            addonAfter="adet"
          />
        </Form.Item>
        <Form.Item
          label="Günde kaç saat çalışıyor?"
          name="motorHoursPerDay"
          rules={[
            {
              required: !excludeMotors,
              message: "Lütfen günlük çalışma saatini giriniz",
            },
          ]}
        >
          <InputNumber
            min={0}
            max={24}
            className="w-full"
            disabled={excludeMotors}
            onChange={() => {
              const motorLoad = calculateMotorLoad();
              form.setFieldsValue({
                calculatedMotorLoad: motorLoad,
              });
            }}
            addonAfter="saat"
          />
        </Form.Item>
        <Form.Item label="Yük (Watt)" name="calculatedMotorLoad">
          <InputNumber
            disabled
            className="w-full bg-gray-50"
            addonAfter="W"
          />
        </Form.Item>
      </div>
    </Card>
  );
};

export default InternalLoadsMotor;