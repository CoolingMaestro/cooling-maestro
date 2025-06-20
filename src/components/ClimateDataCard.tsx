import React, { useEffect, useState } from "react";
import { Card, Form, Select, Button, FormInstance } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";

const { Option } = Select;

// Shimmer animasyonu için CSS
const shimmerStyle = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

// Sayı animasyonu için component
const AnimatedNumber: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = "" }) => {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, Math.round);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const animation = animate(motionValue, value, {
      duration: 2,
      ease: "easeOut"
    });

    const unsubscribe = rounded.onChange(v => setDisplayValue(v));

    return () => {
      animation.stop();
      unsubscribe();
    };
  }, [value, motionValue, rounded]);

  return <span>{displayValue}{suffix}</span>;
};

// Animasyon varyantları
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 10
    }
  }
};

const iconVariants = {
  initial: { rotate: 0 },
  animate: { 
    rotate: [0, -10, 10, -10, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 3
    }
  }
};

interface DesignDayHourlyData {
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    windspeed_10m: number[];
    shortwave_radiation: number[];
    direct_radiation?: number[];
    diffuse_radiation?: number[];
    direct_normal_irradiance?: number[];
    surface_pressure?: number[];
  };
}

interface ClimateDataCardProps {
  form: FormInstance;
  provinces: string[];
  districts: string[];
  selectedProvince: string;
  setSelectedProvince: (province: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  fetchDistricts: (province: string) => Promise<void>;
  fetchClimateData: () => void;
  loading: boolean;
  climateData: {
    maxTemp: number;
    maxTempDate: string;
    humidity: number;
    wetBulbTemp: number;
    groundTemp: number;
    pressure: number | null;
    elevation: number | null;
    solarRadiation?: number;
    windSpeed?: string;
    directRadiation?: number;
    diffuseRadiation?: number;
    peakHour?: number;
    designDayData?: DesignDayHourlyData; // Tasarım günü saatlik verileri
  } | null;
}

const ClimateDataCard: React.FC<ClimateDataCardProps> = ({
  form,
  provinces,
  districts,
  selectedProvince,
  setSelectedProvince,
  selectedDistrict,
  setSelectedDistrict,
  fetchDistricts,
  fetchClimateData,
  loading,
  climateData,
}) => {

  return (
    <>
      <style>{shimmerStyle}</style>
      <Card
      title={
        <div className="flex items-center">
          <EnvironmentOutlined className="mr-2 text-blue-600" />
          <span>Konum Bilgileri</span>
        </div>
      }
      className="shadow-md hover:shadow-lg transition-shadow duration-300"
      styles={{
        header: {
          backgroundColor: "#f0f7ff",
          borderBottom: "1px solid #d6e8ff",
        },
      }}
    >
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item label="İl" name="province" required>
            <Select
              placeholder="İl seçiniz"
              showSearch
              onChange={async (value) => {
                setSelectedProvince(value);
                setSelectedDistrict("");
                form.setFieldsValue({ district: undefined });
                await fetchDistricts(value);
              }}
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
              className="w-full"
            >
              {provinces.map((province) => (
                <Option key={province} value={province}>
                  {province}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="İlçe" name="district" required>
            <Select
              placeholder="İlçe seçiniz"
              showSearch
              disabled={!selectedProvince}
              onChange={(value) => setSelectedDistrict(value)}
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
              className="w-full"
            >
              {districts.map((district) => (
                <Option key={district} value={district}>
                  {district}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <div className="flex justify-center mt-4">
          <motion.div
            initial={{ scale: 1 }}
            animate={{ 
              scale: (!selectedProvince || !selectedDistrict) ? 1 : [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            <Button
              type="primary"
              icon={
                <motion.div
                  className="inline-block"
                  animate={loading ? {
                    rotate: 360
                  } : {
                    rotate: 0
                  }}
                  transition={{
                    duration: 1,
                    repeat: loading ? Infinity : 0,
                    ease: "linear"
                  }}
                >
                  <i className="fas fa-cloud-sun mr-2"></i>
                </motion.div>
              }
              onClick={fetchClimateData}
              loading={loading}
              disabled={!selectedProvince || !selectedDistrict}
              className="!rounded-button whitespace-nowrap relative overflow-hidden"
              style={{
                background: loading 
                  ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%)'
                  : undefined,
                backgroundSize: loading ? '200% 100%' : undefined,
                animation: loading ? 'shimmer 1.5s ease-in-out infinite' : undefined,
              }}
            >
              <motion.span
                key={loading ? "loading" : "idle"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {loading ? "Veriler Yükleniyor..." : "İklim Verilerini Getir"}
              </motion.span>
            </Button>
          </motion.div>
        </div>

        <AnimatePresence>
          {climateData && (
            <motion.div 
              className="mt-6 bg-white rounded-lg shadow-md p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h4 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                <i className="fas fa-history mr-2"></i>
                {selectedProvince} {selectedDistrict} İklim Verileri
              </h4>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
              <motion.div 
                className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg cursor-pointer"
                variants={cardVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 font-medium">
                    En Yüksek Sıcaklık
                  </div>
                  <motion.i 
                    className="fas fa-temperature-high text-red-500 text-xl"
                    variants={iconVariants}
                    initial="initial"
                    animate="animate"
                  />
                </div>
                <motion.div 
                  className="text-2xl font-bold text-red-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  <AnimatedNumber value={climateData.maxTemp} suffix="°C" />
                </motion.div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(
                    climateData.maxTempDate
                  ).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </motion.div>

              <motion.div 
                className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg cursor-pointer"
                variants={cardVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 font-medium">
                    Bağıl Nem
                  </div>
                  <motion.i 
                    className="fas fa-tint text-blue-500 text-xl"
                    animate={{ 
                      y: [0, -5, 0],
                      transition: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  />
                </div>
                <motion.div 
                  className="text-2xl font-bold text-blue-700"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  <AnimatedNumber value={climateData.humidity} suffix="%" />
                </motion.div>
                <div className="text-xs text-gray-500 mt-2">
                  Tasarım günü pik saatindeki nem
                </div>
              </motion.div>

              <motion.div 
                className="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg cursor-pointer"
                variants={cardVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 font-medium">
                    Yaş Termometre Sıcaklığı
                  </div>
                  <motion.i 
                    className="fas fa-thermometer-half text-green-500 text-xl"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      transition: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  />
                </div>
                <motion.div 
                  className="text-2xl font-bold text-green-700"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <AnimatedNumber value={climateData.wetBulbTemp} suffix="°C" />
                </motion.div>
                <div className="text-xs text-gray-500 mt-2">
                  Tasarım günü pik saatindeki değer
                </div>
              </motion.div>

              <motion.div 
                className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg cursor-pointer"
                variants={cardVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 font-medium">
                    Zemin Sıcaklığı
                  </div>
                  <motion.i 
                    className="fas fa-layer-group text-orange-500 text-xl"
                    animate={{ 
                      rotateY: [0, 360],
                      transition: {
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear"
                      }
                    }}
                  />
                </div>
                <motion.div 
                  className="text-2xl font-bold text-orange-700"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                >
                  <AnimatedNumber value={climateData.groundTemp} suffix="°C" />
                </motion.div>
                <div className="text-xs text-gray-500 mt-2">
                  0-7 cm derinlikteki toprak sıcaklığı ortalaması
                </div>
              </motion.div>

              <motion.div 
                className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg cursor-pointer"
                variants={cardVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 font-medium">Basınç</div>
                  <motion.i 
                    className="fas fa-compress-alt text-purple-500 text-xl"
                    animate={{ 
                      scale: [1, 0.9, 1],
                      transition: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  />
                </div>
                <motion.div 
                  className="text-2xl font-bold text-purple-700"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                >
                  {climateData.pressure !== null ? (
                    <>
                      <AnimatedNumber value={climateData.pressure} suffix=" hPa" />
                    </>
                  ) : "Veri yok"}
                </motion.div>
                <div className="text-xs text-gray-500 mt-2">
                  {climateData.pressure !== null
                    ? "Yüzey basıncı"
                    : "API'den veri alınamadı"}
                </div>
              </motion.div>

              <motion.div 
                className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg cursor-pointer"
                variants={cardVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 font-medium">Rakım</div>
                  <motion.i 
                    className="fas fa-mountain text-green-600 text-xl"
                    animate={{ 
                      y: [0, -3, 0],
                      transition: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  />
                </div>
                <motion.div 
                  className="text-2xl font-bold text-green-700"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                >
                  {climateData.elevation !== null ? (
                    <>
                      <AnimatedNumber value={climateData.elevation} suffix=" m" />
                    </>
                  ) : "Veri yok"}
                </motion.div>
                <div className="text-xs text-gray-500 mt-2">
                  {climateData.elevation !== null
                    ? "Deniz seviyesinden yükseklik"
                    : "API'den veri alınamadı"}
                </div>
              </motion.div>

              {climateData.solarRadiation !== undefined && (
                <motion.div 
                  className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg cursor-pointer"
                  variants={cardVariants}
                  whileHover="hover"
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600 font-medium">
                      Güneş Radyasyonu
                    </div>
                    <motion.i 
                      className="fas fa-sun text-yellow-500 text-xl"
                      animate={{ 
                        rotate: 360,
                        transition: {
                          duration: 8,
                          repeat: Infinity,
                          ease: "linear"
                        }
                      }}
                    />
                  </div>
                  <motion.div 
                    className="text-2xl font-bold text-yellow-700"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                  >
                    <AnimatedNumber value={climateData.solarRadiation} suffix=" W/m²" />
                  </motion.div>
                  <div className="text-xs text-gray-500 mt-2">
                    Pik saatteki toplam radyasyon
                  </div>
                </motion.div>
              )}

              {climateData.windSpeed !== undefined && (
                <motion.div 
                  className="p-4 bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg cursor-pointer"
                  variants={cardVariants}
                  whileHover="hover"
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600 font-medium">
                      Rüzgar Hızı
                    </div>
                    <motion.i 
                      className="fas fa-wind text-sky-500 text-xl"
                      animate={{ 
                        x: [-5, 5, -5],
                        transition: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                    />
                  </div>
                  <motion.div 
                    className="text-2xl font-bold text-sky-700"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
                  >
                    {climateData.windSpeed} m/s
                  </motion.div>
                  <div className="text-xs text-gray-500 mt-2">
                    10m yükseklikteki rüzgar hızı
                  </div>
                </motion.div>
              )}
              </motion.div>
              
              {/* Tasarım Günü Detayları */}
              <motion.div
                className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex items-center mb-3">
                  <i className="fas fa-calendar-check text-indigo-600 mr-2"></i>
                  <h5 className="text-lg font-semibold text-indigo-800">Tasarım Günü Seçimi</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start">
                    <i className="fas fa-database text-indigo-500 mr-2 mt-1"></i>
                    <div>
                      <span className="font-medium text-gray-700">Veri Periyodu:</span>
                      <span className="text-gray-600 ml-1">Son 10 yıl</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="fas fa-percentage text-indigo-500 mr-2 mt-1"></i>
                    <div>
                      <span className="font-medium text-gray-700">Tasarım Kriteri:</span>
                      <span className="text-gray-600 ml-1">%1 aşılma sıklığı</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="fas fa-sun text-indigo-500 mr-2 mt-1"></i>
                    <div>
                      <span className="font-medium text-gray-700">Seçim Yöntemi:</span>
                      <span className="text-gray-600 ml-1">Maksimum soğutma yükü</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="fas fa-chart-line text-indigo-500 mr-2 mt-1"></i>
                    <div>
                      <span className="font-medium text-gray-700">Analiz:</span>
                      <span className="text-gray-600 ml-1">Sol-air sıcaklık hesabı</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-indigo-200">
                  <div className="flex items-center text-xs text-indigo-600">
                    <i className="fas fa-award mr-1"></i>
                    <span className="font-medium">ASHRAE 2021 Fundamentals Chapter 18 standardına uygun</span>
                  </div>
                </div>
              </motion.div>
              
              <div className="mt-4 text-xs text-gray-500 flex items-center">
                <i className="fas fa-info-circle mr-1"></i>
                Veriler OpenMeteo API&apos;den alınmıştır
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
    </>
  );
};

export default ClimateDataCard;