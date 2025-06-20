import React, { useState, useEffect } from "react";
import {
  Card,
  Radio,
  Select,
  Form,
  InputNumber,
  Checkbox,
  FormInstance,
  Tooltip,
} from "antd";
import {
  BulbOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Option } = Select;

interface InternalLoadsProps {
  form: FormInstance;
  roomDryBulbTemperature?: number; // Oda kuru termometre sıcaklığı
}

const InternalLoads: React.FC<InternalLoadsProps> = ({ form, roomDryBulbTemperature = 23.9 }) => {
  // Aydınlatma bölümü state'leri
  const [excludeLighting, setExcludeLighting] = useState<boolean>(false);
  const [lightingType, setLightingType] = useState<"totalWatt" | "lampCount">(
    "totalWatt"
  );
  const [selectedLampType, setSelectedLampType] = useState<string>("");
  // İnsan bölümü state'i
  const [excludePeople, setExcludePeople] = useState<boolean>(false);
  const [activityType, setActivityType] = useState<string>("");
  // Motor bölümü state'i
  const [excludeMotors, setExcludeMotors] = useState<boolean>(false);
  const [motorLocation, setMotorLocation] = useState<string>("both_inside");
  // Ekipman bölümü state'i
  const [excludeEquipment, setExcludeEquipment] = useState<boolean>(false);
  const [equipmentType, setEquipmentType] = useState<string>("");

  // Initialize form fields
  useEffect(() => {
    form.setFieldsValue({
      excludeLighting: false,
      excludePeople: false,
      excludeMotors: false,
      excludeEquipment: false,
      calculatedPeopleSensibleLoad: 0,
      calculatedPeopleLatentLoad: 0,
      calculatedPeopleTotalLoad: 0,
      calculatedMotorLoad: 0,
      motorLocation: "both_inside",
      calculatedEquipmentTotal: 0,
      calculatedEquipmentSensible: 0,
      calculatedEquipmentLatent: 0,
    });
  }, [form]);
  // Watt değerini hesaplama fonksiyonu - ASHRAE Equation (1)
  const calculateWattage = () => {
    const lampType = form.getFieldValue("lampType") || "";
    const hoursPerDay = form.getFieldValue("lightingHoursPerDay") || 0;
    
    // ASHRAE Fsa (Special Allowance Factor) - Balast faktörü
    let ballastFactor = 1.0;
    switch (lampType) {
      case "fluorescent":
        ballastFactor = 1.2; // Manyetik balast için ortalama
        break;
      case "led":
        ballastFactor = 1.05; // LED driver kaybı
        break;
      case "incandescent":
        ballastFactor = 1.0; // Akkor lambalar için balast yok
        break;
      default:
        ballastFactor = 1.1; // Varsayılan
    }
    
    // Kullanım faktörü (Ful) - genelde 1.0
    const useFactor = 1.0;
    
    let baseWattage = 0;
    if (lightingType === "totalWatt") {
      baseWattage = form.getFieldValue("totalWatt") || 0;
    } else {
      const lampCount = form.getFieldValue("lampCount") || 0;
      const wattPerLamp = form.getFieldValue("wattPerLamp") || 0;
      baseWattage = lampCount * wattPerLamp;
    }
    
    // ASHRAE Equation (1): qel = W × Ful × Fsa
    const instantaneousHeatGain = baseWattage * useFactor * ballastFactor;
    
    // Günlük faktör (ASHRAE'de yok ama mantıklı)
    const dailyFactor = hoursPerDay ? hoursPerDay / 24 : 1;
    
    return Math.round(instantaneousHeatGain * dailyFactor * 100) / 100;
  };
  
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

  // Ekipman yükünü hesaplama fonksiyonu - ASHRAE standartları
  const calculateEquipmentLoad = () => {
    const equipmentWatt = form.getFieldValue("equipmentTotalWatt") || 0;
    const hoursPerDay = form.getFieldValue("equipmentHoursPerDay") || 0;
    const equipmentType = form.getFieldValue("equipmentType") || "";
    
    // ASHRAE'ye göre ekipman kullanım faktörleri
    const equipmentFactors: { [key: string]: { usageFactor: number; sensibleRatio: number } } = {
      "computers": { usageFactor: 0.75, sensibleRatio: 1.0 },      // Bilgisayarlar - %75 kullanım, %100 duyulur
      "printers": { usageFactor: 0.50, sensibleRatio: 1.0 },       // Yazıcılar - %50 kullanım
      "copiers": { usageFactor: 0.30, sensibleRatio: 1.0 },        // Fotokopi - %30 kullanım
      "servers": { usageFactor: 1.0, sensibleRatio: 1.0 },         // Sunucular - %100 kullanım
      "kitchen_dry": { usageFactor: 0.50, sensibleRatio: 1.0 },    // Kuru mutfak ekipmanı
      "kitchen_wet": { usageFactor: 0.50, sensibleRatio: 0.70 },   // Islak mutfak ekipmanı - %30 gizli ısı
      "refrigeration": { usageFactor: 0.80, sensibleRatio: 1.0 },  // Soğutma ekipmanı
      "other": { usageFactor: 0.70, sensibleRatio: 1.0 }           // Diğer
    };
    
    const factor = equipmentFactors[equipmentType] || equipmentFactors["other"];
    
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

  // İnsan yükünü hesaplama fonksiyonu - ASHRAE Table 1'e göre geliştirilmiş
  const calculatePeopleLoad = () => {
    const peopleCount = form.getFieldValue("peopleCount") || 0;
    const hoursPerDay = form.getFieldValue("peopleHoursPerDay") || 0;
    const activity = form.getFieldValue("activityType") || "";
    
    // ASHRAE Table 1 değerleri - Toplam, Duyulur, Gizli ısılar (W/person)
    // Not: Bu değerler 23.9°C oda kuru termometre sıcaklığına göredir
    const activityHeatLoads: { 
      [key: string]: { total: number; sensible: number; latent: number } 
    } = {
      "seated_theater": { total: 103, sensible: 72, latent: 31 },
      "seated_very_light": { total: 117, sensible: 72, latent: 45 },
      "moderately_active": { total: 132, sensible: 73, latent: 59 },
      "standing_light": { total: 132, sensible: 73, latent: 59 },
      "walking_standing": { total: 147, sensible: 73, latent: 73 },
      "sedentary_work": { total: 161, sensible: 81, latent: 81 },
      "light_bench": { total: 220, sensible: 81, latent: 139 },
      "moderate_dancing": { total: 249, sensible: 89, latent: 160 },
      "moderate_machine": { total: 293, sensible: 110, latent: 183 },
      "bowling": { total: 425, sensible: 170, latent: 255 },
      "heavy_work": { total: 425, sensible: 170, latent: 255 },
      "heavy_machine": { total: 469, sensible: 186, latent: 283 },
      "athletics": { total: 528, sensible: 208, latent: 320 }
    };
    
    const defaultHeatLoad = { total: 150, sensible: 75, latent: 75 };
    const selectedActivityLoads = activityHeatLoads[activity] || defaultHeatLoad;
    
    let sensibleHeatPerPerson = selectedActivityLoads.sensible;
    let latentHeatPerPerson = selectedActivityLoads.latent;
    
    // ASHRAE Table 1 Not 1: 26.7°C için duyulur ısıyı %20 azalt, gizli ısıyı artır
    if (roomDryBulbTemperature >= 26.7) {
      const adjustmentFactor = 0.20; // %20 azaltma
      const oldSensible = sensibleHeatPerPerson;
      sensibleHeatPerPerson = sensibleHeatPerPerson * (1 - adjustmentFactor);
      latentHeatPerPerson = latentHeatPerPerson + (oldSensible - sensibleHeatPerPerson);
    }
    
    // Günlük faktör
    const dailyFactor = hoursPerDay / 24;
    
    const totalSensibleLoad = peopleCount * sensibleHeatPerPerson * dailyFactor;
    const totalLatentLoad = peopleCount * latentHeatPerPerson * dailyFactor;
    const totalPeopleLoad = totalSensibleLoad + totalLatentLoad;
    
    return {
      sensible: Math.round(totalSensibleLoad * 100) / 100,
      latent: Math.round(totalLatentLoad * 100) / 100,
      total: Math.round(totalPeopleLoad * 100) / 100
    };
  };
  useEffect(() => {
    form.setFieldsValue({
      calculatedWattage: calculateWattage(),
    });
  }, [lightingType, form.getFieldValue("lampType"), form.getFieldValue("lightingHoursPerDay")]);
  
  // İnsan yükü değiştiğinde form alanlarını güncelle
  useEffect(() => {
    if (!excludePeople) {
      const { sensible, latent, total } = calculatePeopleLoad();
      form.setFieldsValue({
        calculatedPeopleSensibleLoad: sensible,
        calculatedPeopleLatentLoad: latent,
        calculatedPeopleTotalLoad: total,
      });
    } else {
      form.setFieldsValue({
        calculatedPeopleSensibleLoad: 0,
        calculatedPeopleLatentLoad: 0,
        calculatedPeopleTotalLoad: 0,
      });
    }
  }, [
    form.getFieldValue("peopleCount"),
    form.getFieldValue("peopleHoursPerDay"),
    form.getFieldValue("activityType"),
    roomDryBulbTemperature,
    excludePeople
  ]);
  
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
    <div className="space-y-8">
      {/* Aydınlatma Bölümü */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BulbOutlined className="text-yellow-500 text-xl mr-2" />
              <span className="text-lg font-medium">Aydınlatma</span>
            </div>
            <Checkbox 
              checked={excludeLighting}
              onChange={(e) => {
                setExcludeLighting(e.target.checked);
                form.setFieldValue('excludeLighting', e.target.checked);
              }}
            >
              Hesaplamaya dahil etme
            </Checkbox>
          </div>
        }
        className="shadow-md hover:shadow-lg transition-shadow duration-300"
      >
        <div className="space-y-6">
          <div className="mb-4">
            <Radio.Group
              value={lightingType}
              onChange={(e) => setLightingType(e.target.value)}
              disabled={excludeLighting}
              className="flex flex-wrap gap-4"
            >
              <Radio.Button
                value="totalWatt"
                className="!rounded-button whitespace-nowrap px-4 py-2"
              >
                Toplam Watt
              </Radio.Button>
              <Radio.Button
                value="lampCount"
                className="!rounded-button whitespace-nowrap px-4 py-2"
              >
                Lamba Adedi
              </Radio.Button>
            </Radio.Group>
          </div>
          <Form.Item
            label={
              <span>
                Tip{" "}
                <Tooltip 
                  title={
                    <div style={{ fontSize: '12px' }}>
                      <strong>ASHRAE'ye göre balast faktörleri:</strong>
                      <br /><br />
                      <strong>• Floresan:</strong> 1.2 (manyetik balast)<br />
                      Balast kaybı nedeniyle %20 ek güç tüketimi<br /><br />
                      
                      <strong>• LED:</strong> 1.05<br />
                      LED driver kaybı %5<br /><br />
                      
                      <strong>• Akkor:</strong> 1.0<br />
                      Balast yok, doğrudan güç<br /><br />
                      
                      <em>Formül: Isı Yükü = Lamba Gücü × Balast Faktörü × Kullanım Faktörü</em>
                    </div>
                  }
                  placement="right"
                >
                  <InfoCircleOutlined style={{ color: '#1890ff', marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
            name="lampType"
            rules={[
              {
                required: !excludeLighting,
                message: "Lütfen lamba tipini seçiniz",
              },
            ]}
          >
            <Select
              placeholder="Lütfen Seçin"
              disabled={excludeLighting}
              onChange={(value) => {
                setSelectedLampType(value);
                form.setFieldsValue({
                  calculatedWattage: calculateWattage(),
                });
              }}
            >
              <Option value="fluorescent">Floresan</Option>
              <Option value="incandescent">Akkor</Option>
              <Option value="led">LED</Option>
            </Select>
          </Form.Item>
          {lightingType === "totalWatt" ? (
            <>
              <Form.Item
                label="Toplam (Watt)"
                name="totalWatt"
                rules={[
                  {
                    required: !excludeLighting,
                    message: "Lütfen toplam watt değerini giriniz",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  disabled={excludeLighting}
                  onChange={() => {
                    form.setFieldsValue({
                      calculatedWattage: calculateWattage(),
                    });
                  }}
                  addonAfter="W"
                />
              </Form.Item>
              <Form.Item
                label="Saat/gün"
                name="lightingHoursPerDay"
                rules={[
                  {
                    required: !excludeLighting,
                    message: "Lütfen günlük çalışma saatini giriniz",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  max={24}
                  className="w-full"
                  disabled={excludeLighting}
                  onChange={() => {
                    form.setFieldsValue({
                      calculatedWattage: calculateWattage(),
                    });
                  }}
                  addonAfter="saat"
                />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                label="Watt"
                name="wattPerLamp"
                rules={[
                  {
                    required: !excludeLighting,
                    message: "Lütfen lamba başına watt değerini giriniz",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  disabled={excludeLighting}
                  onChange={() => {
                    form.setFieldsValue({
                      calculatedWattage: calculateWattage(),
                    });
                  }}
                  addonAfter="W"
                />
              </Form.Item>
              <Form.Item
                label="Lamba Adedi"
                name="lampCount"
                rules={[
                  {
                    required: !excludeLighting,
                    message: "Lütfen lamba adedini giriniz",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  disabled={excludeLighting}
                  onChange={() => {
                    form.setFieldsValue({
                      calculatedWattage: calculateWattage(),
                    });
                  }}
                  addonAfter="adet"
                />
              </Form.Item>
              <Form.Item
                label="Saat/gün"
                name="lightingHoursPerDay"
                rules={[
                  {
                    required: !excludeLighting,
                    message: "Lütfen günlük çalışma saatini giriniz",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  max={24}
                  className="w-full"
                  disabled={excludeLighting}
                  onChange={() => {
                    form.setFieldsValue({
                      calculatedWattage: calculateWattage(),
                    });
                  }}
                  addonAfter="saat"
                />
              </Form.Item>
            </>
          )}
          <Form.Item label="Yük (Watt)" name="calculatedWattage">
            <InputNumber
              disabled
              className="w-full bg-gray-50"
              addonAfter="W"
            />
          </Form.Item>
        </div>
      </Card>
      {/* İnsan Bölümü */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TeamOutlined className="text-blue-500 text-xl mr-2" />
              <span className="text-lg font-medium">İnsan</span>
            </div>
            <Checkbox 
              checked={excludePeople}
              onChange={(e) => {
                setExcludePeople(e.target.checked);
                form.setFieldValue('excludePeople', e.target.checked);
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
            label="Aktivite Tipi"
            name="activityType"
            rules={[
              {
                required: !excludePeople,
                message: "Lütfen aktivite tipini seçiniz",
              },
            ]}
          >
            <Select
              placeholder="Lütfen Seçin"
              disabled={excludePeople}
              onChange={(value) => {
                setActivityType(value);
                const { sensible, latent, total } = calculatePeopleLoad();
                form.setFieldsValue({
                  calculatedPeopleSensibleLoad: sensible,
                  calculatedPeopleLatentLoad: latent,
                  calculatedPeopleTotalLoad: total,
                });
              }}
            >
              <Option value="seated_theater">Tiyatroda oturma (72W duyulur, 31W gizli)</Option>
              <Option value="seated_very_light">Oturarak çok hafif iş (72W duyulur, 45W gizli)</Option>
              <Option value="moderately_active">Orta aktif ofis işi (73W duyulur, 59W gizli)</Option>
              <Option value="standing_light">Ayakta hafif iş (73W duyulur, 59W gizli)</Option>
              <Option value="walking_standing">Yürüme, ayakta durma (73W duyulur, 73W gizli)</Option>
              <Option value="sedentary_work">Hareketsiz çalışma (81W duyulur, 81W gizli)</Option>
              <Option value="light_bench">Hafif tezgah işi (81W duyulur, 139W gizli)</Option>
              <Option value="moderate_dancing">Orta tempolu dans (89W duyulur, 160W gizli)</Option>
              <Option value="moderate_machine">Orta ağır makine işi (110W duyulur, 183W gizli)</Option>
              <Option value="bowling">Bowling (170W duyulur, 255W gizli)</Option>
              <Option value="heavy_work">Ağır iş (170W duyulur, 255W gizli)</Option>
              <Option value="heavy_machine">Ağır makine işi (186W duyulur, 283W gizli)</Option>
              <Option value="athletics">Atletizm (208W duyulur, 320W gizli)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Depoda kaç kişi çalışıyor?"
            name="peopleCount"
            rules={[
              {
                required: !excludePeople,
                message: "Lütfen çalışan kişi sayısını giriniz",
              },
            ]}
          >
            <InputNumber
              min={0}
              className="w-full"
              disabled={excludePeople}
              onChange={() => {
                const { sensible, latent, total } = calculatePeopleLoad();
                form.setFieldsValue({
                  calculatedPeopleSensibleLoad: sensible,
                  calculatedPeopleLatentLoad: latent,
                  calculatedPeopleTotalLoad: total,
                });
              }}
              addonAfter="kişi"
            />
          </Form.Item>
          <Form.Item
            label="Günde kaç saat çalışıyor?"
            name="peopleHoursPerDay"
            rules={[
              {
                required: !excludePeople,
                message: "Lütfen günlük çalışma saatini giriniz",
              },
            ]}
          >
            <InputNumber
              min={0}
              max={24}
              className="w-full"
              disabled={excludePeople}
              onChange={() => {
                const { sensible, latent, total } = calculatePeopleLoad();
                form.setFieldsValue({
                  calculatedPeopleSensibleLoad: sensible,
                  calculatedPeopleLatentLoad: latent,
                  calculatedPeopleTotalLoad: total,
                });
              }}
              addonAfter="saat"
            />
          </Form.Item>
          <Form.Item label="Duyulur Yük (Watt)" name="calculatedPeopleSensibleLoad">
            <InputNumber
              disabled
              className="w-full bg-gray-50"
              addonAfter="W"
            />
          </Form.Item>
          <Form.Item label="Gizli Yük (Watt)" name="calculatedPeopleLatentLoad">
            <InputNumber
              disabled
              className="w-full bg-gray-50"
              addonAfter="W"
            />
          </Form.Item>
          <Form.Item label="Toplam Yük (Watt)" name="calculatedPeopleTotalLoad">
            <InputNumber
              disabled
              className="w-full bg-gray-50"
              addonAfter="W"
            />
          </Form.Item>
        </div>
      </Card>
      {/* Motor Bölümü */}
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
      {/* Ekipman Bölümü */}
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
                      <strong>• Bilgisayarlar:</strong> %75 kullanım<br />
                      Nameplate değerinin %75'i gerçek tüketim<br /><br />
                      
                      <strong>• Yazıcılar:</strong> %50 kullanım<br />
                      Çoğu zaman bekleme modunda<br /><br />
                      
                      <strong>• Fotokopi:</strong> %30 kullanım<br />
                      Aralıklı kullanım<br /><br />
                      
                      <strong>• Sunucular:</strong> %100 kullanım<br />
                      Sürekli tam güçte çalışır<br /><br />
                      
                      <strong>• Islak mutfak:</strong> %50 kullanım, %30 gizli ısı<br />
                      Buhar ve nem üretir<br /><br />
                      
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
              <Option value="computers">Bilgisayarlar (%75)</Option>
              <Option value="printers">Yazıcılar (%50)</Option>
              <Option value="copiers">Fotokopi Makineleri (%30)</Option>
              <Option value="servers">Sunucular (%100)</Option>
              <Option value="kitchen_dry">Kuru Mutfak Ekipmanı (%50)</Option>
              <Option value="kitchen_wet">Islak Mutfak Ekipmanı (%50, %30 gizli)</Option>
              <Option value="refrigeration">Soğutma Ekipmanı (%80)</Option>
              <Option value="other">Diğer (%70)</Option>
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
    </div>
  );
};

export default InternalLoads;
