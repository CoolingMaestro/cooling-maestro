import React, { useState } from "react";
import {
  Card,
  Radio,
  Select,
  Form,
  InputNumber,
  Tooltip,
  Space,
  FormInstance,
} from "antd";
import { InfoCircleOutlined, CloudOutlined } from "@ant-design/icons";

const { Option } = Select;

interface InfiltrationProps {
  form: FormInstance;
}

const Infiltration: React.FC<InfiltrationProps> = ({ form }) => {
  const [infiltrationMethod, setInfiltrationMethod] = useState<string>("");
  const [anteRoom, setAnteRoom] = useState<string>("with");

  // Initialize anteRoom in form
  React.useEffect(() => {
    form.setFieldsValue({
      anteRoom: "with",
    });
  }, [form]);
  
  // Handle infiltration method change
  const handleInfiltrationMethodChange = (value: string) => {
    setInfiltrationMethod(value);
    form.resetFields([
      "usage",
      "doorPassCount",
      "openCloseDuration",
      "doorOpenDuration",
      "dailyDoorUsageDuration",
      "airFlow",
    ]);
  };
  
  // Handle ante room change
  const handleAnteRoomChange = (e: any) => {
    setAnteRoom(e.target.value);
    form.setFieldsValue({ anteRoom: e.target.value });
  };
  
  return (
    <div className="space-y-8">
      <Card
        title={
          <div className="flex items-center">
            <CloudOutlined className="text-blue-500 text-xl mr-2" />
            <span className="text-lg font-medium">Hava Sızıntısı</span>
          </div>
        }
        className="shadow-md hover:shadow-lg transition-shadow duration-300"
      >
        <div className="space-y-6">
          {/* Ante Room Radio Buttons */}
          <div className="mb-4">
            <Radio.Group
              value={anteRoom}
              onChange={handleAnteRoomChange}
              className="flex flex-wrap gap-4"
            >
              <Radio.Button
                value="with"
                className="!rounded-button whitespace-nowrap px-4 py-2"
              >
                Ön Odalı
              </Radio.Button>
              <Radio.Button
                value="without"
                className="!rounded-button whitespace-nowrap px-4 py-2"
              >
                Ön Odasız
              </Radio.Button>
            </Radio.Group>
          </div>
          
          {/* Infiltration Method Selection */}
          <Form.Item
            label="Hava Sızıntısı Yöntemi"
            name="infiltrationMethod"
            rules={[{ required: true, message: "Lütfen bir yöntem seçiniz" }]}
          >
            <Select
              placeholder="Lütfen Seçin"
              onChange={handleInfiltrationMethodChange}
              className="w-full"
            >
              <Option value="airChange">Hava Değişimi</Option>
              <Option value="doorOpening">Kapı Açılışı</Option>
              <Option value="manualEntry">Manuel Giriş</Option>
            </Select>
          </Form.Item>
          {/* Air Change Option Content */}
          {infiltrationMethod === "airChange" && (
            <Form.Item
              label={
                <Space>
                  <span>Kullanım Yoğunluğu</span>
                  <Tooltip title="Soğuk odanın ne kadar yoğun kullanıldığını belirtir. Yoğun: Sık sık giriş-çıkış, sürekli hareket, yükleme/boşaltma, personel veya ürün trafiği yüksek odalar. Orta: Giriş-çıkışların, hareketin ve kullanımın ortalama olduğu odalar. Doğru seçilmezse soğutma yükü hesabı yanlış çıkar. Oda trafiğini göz önünde bulundurarak en uygun seçeneği işaretleyin.">
                    <InfoCircleOutlined className="text-blue-500 cursor-pointer" />
                  </Tooltip>
                </Space>
              }
              name="usage"
              rules={[
                { required: true, message: "Lütfen kullanım yoğunluğunu seçiniz" },
              ]}
            >
              <Select placeholder="Lütfen Seçin" className="w-full">
                <Option value="heavy">Yoğun</Option>
                <Option value="average">Ortalama</Option>
              </Select>
            </Form.Item>
          )}
          
          {/* Door Opening Option Content */}
          {infiltrationMethod === "doorOpening" && (
            <>
                <Form.Item
                  label={
                    <Space>
                      <span>Kapıdan Geçiş Sayısı *</span>
                      <Tooltip title="Bu kapıdan bir günde (veya sipariş başına) toplam kaç kez giriş-çıkış yapılıyor? Her açıp kapama, bir geçiş sayılır.">
                        <InfoCircleOutlined className="text-blue-500 cursor-pointer" />
                      </Tooltip>
                    </Space>
                  }
                  name="doorPassCount"
                  rules={[
                    {
                      required: true,
                      message: "Lütfen kapıdan geçiş sayısını giriniz",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Geçiş sayısı"
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <Space>
                      <span>Aç-Kapa Süresi (saniye/geçiş) *</span>
                      <Tooltip title="Kapı her açılıp kapandığında ortalama kaç saniye açık kalıyor? Her geçişin süresini belirtin.">
                        <InfoCircleOutlined className="text-blue-500 cursor-pointer" />
                      </Tooltip>
                    </Space>
                  }
                  name="openCloseDuration"
                  rules={[
                    {
                      required: true,
                      message: "Lütfen aç-kapa süresini giriniz",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Saniye/geçiş"
                    addonAfter="saniye"
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <Space>
                      <span>Kapının Açık Kaldığı Süre (dakika) *</span>
                      <Tooltip title="Kapı zaman zaman uzun süre açık kalıyorsa, toplamda kaç dakika boyunca tamamen açık kalıyor? Sadece geçişlerdeki değil, örneğin yükleme/boşaltma için kapı sürekli açık kaldığında bu süreyi yazın.">
                        <InfoCircleOutlined className="text-blue-500 cursor-pointer" />
                      </Tooltip>
                    </Space>
                  }
                  name="doorOpenDuration"
                  rules={[
                    {
                      required: true,
                      message: "Lütfen kapının açık kaldığı süreyi giriniz",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Dakika"
                    addonAfter="dakika"
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <Space>
                      <span>Günlük Kapı Kullanım Süresi (saat) *</span>
                      <Tooltip title="Bir gün içinde (veya sipariş başına) kapının toplam kullanım süresi nedir? Tüm açılıp kapanmaların toplam süresi saat cinsinden.">
                        <InfoCircleOutlined className="text-blue-500 cursor-pointer" />
                      </Tooltip>
                    </Space>
                  }
                  name="dailyDoorUsageDuration"
                  rules={[
                    {
                      required: true,
                      message: "Lütfen günlük kapı kullanım süresini giriniz",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={24}
                    className="w-full"
                    placeholder="Saat"
                    addonAfter="saat"
                  />
                </Form.Item>
            </>
          )}
          
          {/* Manual Entry Option Content */}
          {infiltrationMethod === "manualEntry" && (
            <Form.Item
                label={
                  <Space>
                    <span>Hava Debisi *</span>
                    <Tooltip title="Soğutma odasına giren veya çıkan havanın hacmi. Genellikle m³/saat veya m³/dakika cinsinden ölçülür. Sisteme giren taze hava miktarını belirtir. Yanlış veya eksik girilirse soğutma yükü hesabı hatalı olur. Örnek: Eğer bir havalandırma cihazı kullanıyorsanız, cihazın teknik etiketinde yazar: 'Hava debisi: 1200 m³/h' gibi.">
                      <InfoCircleOutlined className="text-blue-500 cursor-pointer" />
                    </Tooltip>
                  </Space>
                }
                name="airFlow"
                rules={[
                  { required: true, message: "Lütfen hava debisini giriniz" },
                ]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  placeholder="m³/saat"
                  addonAfter="m³/saat"
                />
              </Form.Item>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Infiltration;
