import React, { useState, useEffect } from "react";
import {
  Card,
  Radio,
  Select,
  Form,
  InputNumber,
  Checkbox,
  FormInstance,
} from "antd";
import {
  BulbOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
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
  // Ekipman bölümü state'i
  const [excludeEquipment, setExcludeEquipment] = useState<boolean>(false);

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
    });
  }, [form]);
  // Watt değerini hesaplama fonksiyonu
  const calculateWattage = () => {
    if (lightingType === "totalWatt") {
      return form.getFieldValue("totalWatt") || 0;
    } else {
      const lampCount = form.getFieldValue("lampCount") || 0;
      const wattPerLamp = form.getFieldValue("wattPerLamp") || 0;
      return lampCount * wattPerLamp;
    }
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
      sensible: totalSensibleLoad,
      latent: totalLatentLoad,
      total: totalPeopleLoad
    };
  };
  useEffect(() => {
    form.setFieldsValue({
      calculatedWattage: calculateWattage(),
    });
  }, [lightingType]);
  
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
            label="Tip"
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
              onChange={(value) => setSelectedLampType(value)}
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
              addonAfter="saat"
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
            label="Toplam (Watt)"
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
              addonAfter="saat"
            />
          </Form.Item>
        </div>
      </Card>
    </div>
  );
};

export default InternalLoads;
