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
  ToolOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Option } = Select;

interface InternalLoadsEquipmentProps {
  form: FormInstance;
}

const InternalLoadsEquipment: React.FC<InternalLoadsEquipmentProps> = ({ form }) => {
  const [excludeEquipment, setExcludeEquipment] = useState<boolean>(false);
  const [equipmentType, setEquipmentType] = useState<string>("");

  // Initialize form fields
  useEffect(() => {
    form.setFieldsValue({
      excludeEquipment: false,
      calculatedEquipmentTotal: 0,
      calculatedEquipmentSensible: 0,
      calculatedEquipmentLatent: 0,
    });
  }, [form]);

  // Ekipman yükünü hesaplama fonksiyonu - ASHRAE standartları
  const calculateEquipmentLoad = () => {
    const equipmentWatt = form.getFieldValue("equipmentTotalWatt") || 0;
    const hoursPerDay = form.getFieldValue("equipmentHoursPerDay") || 0;
    const equipmentType = form.getFieldValue("equipmentType") || "";
    
    // ASHRAE'ye göre ekipman kullanım faktörleri
    const equipmentFactors: { [key: string]: { usageFactor: number; sensibleRatio: number } } = {
      "computer_light": { usageFactor: 0.50, sensibleRatio: 1.00 },
      "computer_medium": { usageFactor: 0.65, sensibleRatio: 1.00 },
      "computer_heavy": { usageFactor: 0.80, sensibleRatio: 1.00 },
      "kitchen_hooded": { usageFactor: 0.25, sensibleRatio: 1.00 },    // Davlumbazlı - sadece radyant
      "kitchen_unhooded": { usageFactor: 0.25, sensibleRatio: 0.34 },  // Davlumbazsız - %66 gizli
      "medical": { usageFactor: 0.50, sensibleRatio: 0.90 },
      "industrial": { usageFactor: 0.80, sensibleRatio: 0.95 },
      "forklift_electric": { usageFactor: 0.30, sensibleRatio: 0.85 }, // %15 gizli (batarya ısınması)
      "forklift_propane": { usageFactor: 0.30, sensibleRatio: 0.70 },  // %30 gizli (yanma ürünleri)
      "crane_overhead": { usageFactor: 0.20, sensibleRatio: 0.95 },
      "conveyor": { usageFactor: 0.70, sensibleRatio: 0.95 },
      "pallet_jack": { usageFactor: 0.25, sensibleRatio: 0.90 },
      "battery_charger": { usageFactor: 0.40, sensibleRatio: 0.95 },
      "general": { usageFactor: 0.50, sensibleRatio: 1.00 }
    };
    
    const factor = equipmentFactors[equipmentType] || equipmentFactors["general"];
    
    // Gerçek güç tüketimi = Nameplate × Kullanım faktörü
    const actualPower = equipmentWatt * factor.usageFactor;
    
    // Günlük faktör
    const dailyFactor = hoursPerDay / 24;
    
    // Toplam ısı yükü
    const totalLoad = actualPower * dailyFactor;
    
    return {
      total: Math.round(totalLoad * 100) / 100,
      sensible: Math.round(totalLoad * factor.sensibleRatio * 100) / 100,
      latent: Math.round(totalLoad * (1 - factor.sensibleRatio) * 100) / 100
    };
  };

  // Ekipman yükü değiştiğinde form alanlarını güncelle
  useEffect(() => {
    if (!excludeEquipment) {
      const { total, sensible, latent } = calculateEquipmentLoad();
      form.setFieldsValue({
        calculatedEquipmentTotal: total,
        calculatedEquipmentSensible: sensible,
        calculatedEquipmentLatent: latent,
      });
    } else {
      form.setFieldsValue({
        calculatedEquipmentTotal: 0,
        calculatedEquipmentSensible: 0,
        calculatedEquipmentLatent: 0,
      });
    }
  }, [
    form.getFieldValue("equipmentTotalWatt"),
    form.getFieldValue("equipmentHoursPerDay"),
    form.getFieldValue("equipmentType"),
    excludeEquipment
  ]);

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ToolOutlined className="text-green-500 text-xl mr-2" />
            <span className="text-lg font-medium">Ekipman</span>
          </div>
          <Checkbox 
            checked={excludeEquipment}
            onChange={(e) => {
              setExcludeEquipment(e.target.checked);
              form.setFieldValue('excludeEquipment', e.target.checked);
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
              Ekipman Tipi{" "}
              <Tooltip 
                title={
                  <div style={{ fontSize: '12px' }}>
                    <strong>ASHRAE'ye göre ekipman kullanım faktörleri:</strong>
                    <br /><br />
                    <strong>Ofis Ekipmanları:</strong><br />
                    • Bilgisayar (Hafif): %50<br />
                    • Bilgisayar (Orta): %65<br />
                    • Bilgisayar (Yoğun): %80<br /><br />
                    
                    <strong>Mutfak Ekipmanları:</strong><br />
                    • Davlumbazlı: %25 (sadece radyant)<br />
                    • Davlumbazsız: %25 (%66 gizli ısı)<br /><br />
                    
                    <strong>Depo/Lojistik Ekipmanları:</strong><br />
                    • Elektrikli Forklift: %30<br />
                    • Propanlı Forklift: %30 (%30 gizli)<br />
                    • Tavan Vinci: %20<br />
                    • Konveyör: %70<br />
                    • Transpalet: %25<br />
                    • Batarya Şarj: %40<br /><br />
                    
                    <em>Formül: Gerçek Güç = Nameplate × Kullanım Faktörü</em>
                  </div>
                }
                placement="right"
              >
                <InfoCircleOutlined style={{ color: '#1890ff', marginLeft: 4 }} />
              </Tooltip>
            </span>
          }
          name="equipmentType"
          rules={[
            {
              required: !excludeEquipment,
              message: "Lütfen ekipman tipini seçiniz",
            },
          ]}
        >
          <Select
            placeholder="Lütfen Seçin"
            disabled={excludeEquipment}
            onChange={(value) => {
              setEquipmentType(value);
              const { total, sensible, latent } = calculateEquipmentLoad();
              form.setFieldsValue({
                calculatedEquipmentTotal: total,
                calculatedEquipmentSensible: sensible,
                calculatedEquipmentLatent: latent,
              });
            }}
          >
            <Option value="computer_light">Bilgisayar - Hafif Kullanım (%50)</Option>
            <Option value="computer_medium">Bilgisayar - Orta Kullanım (%65)</Option>
            <Option value="computer_heavy">Bilgisayar - Yoğun Kullanım (%80)</Option>
            <Option value="kitchen_hooded">Mutfak Ekipmanı - Davlumbazlı (%25)</Option>
            <Option value="kitchen_unhooded">Mutfak Ekipmanı - Davlumbazsız (%25)</Option>
            <Option value="medical">Medikal Ekipman (%50)</Option>
            <Option value="industrial">Endüstriyel Ekipman (%80)</Option>
            <Option value="forklift_electric">Elektrikli Forklift (%30)</Option>
            <Option value="forklift_propane">Propanlı Forklift (%30)</Option>
            <Option value="crane_overhead">Tavan Vinci (%20)</Option>
            <Option value="conveyor">Konveyör Bant (%70)</Option>
            <Option value="pallet_jack">Elektrikli Transpalet (%25)</Option>
            <Option value="battery_charger">Forklift Batarya Şarj İstasyonu (%40)</Option>
            <Option value="general">Genel Ekipman (%50)</Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="Nameplate Güç (Watt)"
          name="equipmentTotalWatt"
          rules={[
            {
              required: !excludeEquipment,
              message: "Lütfen toplam watt değerini giriniz",
            },
          ]}
        >
          <InputNumber
            min={0}
            className="w-full"
            disabled={excludeEquipment}
            onChange={() => {
              const { total, sensible, latent } = calculateEquipmentLoad();
              form.setFieldsValue({
                calculatedEquipmentTotal: total,
                calculatedEquipmentSensible: sensible,
                calculatedEquipmentLatent: latent,
              });
            }}
            addonAfter="W"
          />
        </Form.Item>
        <Form.Item
          label="Günde kaç saat çalışıyor?"
          name="equipmentHoursPerDay"
          rules={[
            {
              required: !excludeEquipment,
              message: "Lütfen günlük çalışma saatini giriniz",
            },
          ]}
        >
          <InputNumber
            min={0}
            max={24}
            className="w-full"
            disabled={excludeEquipment}
            onChange={() => {
              const { total, sensible, latent } = calculateEquipmentLoad();
              form.setFieldsValue({
                calculatedEquipmentTotal: total,
                calculatedEquipmentSensible: sensible,
                calculatedEquipmentLatent: latent,
              });
            }}
            addonAfter="saat"
          />
        </Form.Item>
        <Form.Item label="Duyulur Yük (Watt)" name="calculatedEquipmentSensible">
          <InputNumber
            disabled
            className="w-full bg-gray-50"
            addonAfter="W"
          />
        </Form.Item>
        <Form.Item label="Gizli Yük (Watt)" name="calculatedEquipmentLatent">
          <InputNumber
            disabled
            className="w-full bg-gray-50"
            addonAfter="W"
          />
        </Form.Item>
        <Form.Item label="Toplam Yük (Watt)" name="calculatedEquipmentTotal">
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

export default InternalLoadsEquipment;