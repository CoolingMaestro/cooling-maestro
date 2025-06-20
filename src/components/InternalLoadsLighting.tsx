import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Tabs,
  Select,
  Form,
  InputNumber,
  Checkbox,
  FormInstance,
  Tooltip,
} from "antd";
import {
  BulbOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Option } = Select;

interface InternalLoadsLightingProps {
  form: FormInstance;
}

const InternalLoadsLighting: React.FC<InternalLoadsLightingProps> = ({ form }) => {
  const [excludeLighting, setExcludeLighting] = useState<boolean>(false);
  const [lightingType, setLightingType] = useState<"totalWatt" | "lampCount">("totalWatt");
  const [_selectedLampType, _setSelectedLampType] = useState<string>("");

  // Initialize form fields
  useEffect(() => {
    form.setFieldsValue({
      excludeLighting: false,
    });
  }, [form]);

  // Form field watchers
  const lampType = Form.useWatch('lampType', form);
  const lightingHoursPerDay = Form.useWatch('lightingHoursPerDay', form);
  const totalWatt = Form.useWatch('totalWatt', form);
  const lampCount = Form.useWatch('lampCount', form);
  const wattPerLamp = Form.useWatch('wattPerLamp', form);

  // Watt değerini hesaplama fonksiyonu - ASHRAE Equation (1)
  const calculateWattage = useCallback(() => {
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
  }, [lightingType, form]);

  useEffect(() => {
    form.setFieldsValue({
      calculatedWattage: calculateWattage(),
    });
  }, [lightingType, lampType, lightingHoursPerDay, totalWatt, lampCount, wattPerLamp, form, calculateWattage]);

  return (
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
        <Form.Item
          label={
            <span>
              Tip{" "}
              <Tooltip 
                title={
                  <div style={{ fontSize: '12px' }}>
                    <strong>ASHRAE&apos;ye göre balast faktörleri:</strong>
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
              _setSelectedLampType(value);
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
        <Tabs 
        activeKey={lightingType}
        onChange={(key) => setLightingType(key as "totalWatt" | "lampCount")}
        items={[
          {
            key: "totalWatt",
            label: "Toplam Watt",
            disabled: excludeLighting,
            children: (
              <div className="space-y-6 pt-4">
                <Form.Item
                  label="Toplam (Watt)"
                  name="totalWatt"
                  rules={[
                    {
                      required: !excludeLighting && lightingType === "totalWatt",
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
                <Form.Item label="Yük (Watt)" name="calculatedWattage">
                  <InputNumber
                    disabled
                    className="w-full bg-gray-50"
                    addonAfter="W"
                  />
                </Form.Item>
              </div>
            ),
          },
          {
            key: "lampCount",
            label: "Lamba Adedi",
            disabled: excludeLighting,
            children: (
              <div className="space-y-6 pt-4">
                <Form.Item
                  label="Watt"
                  name="wattPerLamp"
                  rules={[
                    {
                      required: !excludeLighting && lightingType === "lampCount",
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
                      required: !excludeLighting && lightingType === "lampCount",
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
                <Form.Item label="Yük (Watt)" name="calculatedWattage">
                  <InputNumber
                    disabled
                    className="w-full bg-gray-50"
                    addonAfter="W"
                  />
                </Form.Item>
              </div>
            ),
          },
        ]}
      />
      </div>
    </Card>
  );
};

export default InternalLoadsLighting;