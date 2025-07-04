import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Select,
  Form,
  InputNumber,
  Checkbox,
  FormInstance,
} from "antd";
import {
  TeamOutlined,
} from "@ant-design/icons";

const { Option } = Select;

interface InternalLoadsPeopleProps {
  form: FormInstance;
  roomDryBulbTemperature?: number;
}

const InternalLoadsPeople: React.FC<InternalLoadsPeopleProps> = ({ form, roomDryBulbTemperature = 23.9 }) => {
  const [excludePeople, setExcludePeople] = useState<boolean>(false);
  const [_activityType, _setActivityType] = useState<string>("");

  // Initialize form fields
  useEffect(() => {
    form.setFieldsValue({
      excludePeople: false,
      calculatedPeopleSensibleLoad: 0,
      calculatedPeopleLatentLoad: 0,
      calculatedPeopleTotalLoad: 0,
    });
  }, [form]);

  // Form field watchers
  const peopleCount = Form.useWatch('peopleCount', form);
  const peopleHoursPerDay = Form.useWatch('peopleHoursPerDay', form);
  const activityType = Form.useWatch('activityType', form);

  // İnsan yükünü hesaplama fonksiyonu - ASHRAE Table 1'e göre geliştirilmiş
  const calculatePeopleLoad = useCallback(() => {
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
  }, [roomDryBulbTemperature, form]);

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
    peopleCount,
    peopleHoursPerDay,
    activityType,
    roomDryBulbTemperature,
    excludePeople,
    calculatePeopleLoad,
    form
  ]);

  return (
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
              _setActivityType(value);
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
  );
};

export default InternalLoadsPeople;