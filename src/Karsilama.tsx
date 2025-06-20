// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  Divider,
} from "antd";
import * as echarts from "echarts";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface KarsilamaProps {
  onStartCalculation?: () => void;
}

const Karsilama: React.FC<KarsilamaProps> = ({
  onStartCalculation,
}) => {
  const [form] = Form.useForm();
  // Örnek demo hesaplama formu için state
  const [volume, setVolume] = useState<number>(100);
  const [externalTemp, setExternalTemp] = useState<number>(35);
  const [productType, setProductType] = useState<string>("meyve");
  const [showDemoResult, setShowDemoResult] = useState<boolean>(false);
  // Sektör referansları için state
  // Müşteri referansları
  const customers = [
    {
      name: "Soğutma A.Ş.",
      sector: "Gıda",
      quote: "Cooling Maestro ile hesaplamalarımız %40 daha hızlı ve doğru.",
    },
    {
      name: "Lojistik Depo",
      sector: "Lojistik",
      quote:
        "Artık her müşteri için yeniden hesaplama yapmak zorunda kalmıyoruz.",
    },
    {
      name: "Süt Ürünleri",
      sector: "Süt",
      quote:
        "Enerji tasarrufu sağlayan hesaplamalar sayesinde maliyetlerimizi düşürdük.",
    },
    {
      name: "Pharma Soğuk",
      sector: "İlaç",
      quote: "Hassas ilaç depolama gereksinimlerimiz için mükemmel çözüm.",
    },
  ];
  // Demo hesaplama sonucu
  const calculateDemo = () => {
    setShowDemoResult(true);
  };
  // Özellikler grafiği
  useEffect(() => {
    const chartDom = document.getElementById("featuresChart");
    if (chartDom) {
      const myChart = echarts.init(chartDom);
      const option = {
        animation: false,
        radar: {
          indicator: [
            { name: "Hesaplama Hızı", max: 100 },
            { name: "Doğruluk", max: 100 },
            { name: "Kullanım Kolaylığı", max: 100 },
            { name: "Özelleştirme", max: 100 },
            { name: "Raporlama", max: 100 },
          ],
        },
        series: [
          {
            type: "radar",
            data: [
              {
                value: [95, 90, 85, 80, 92],
                name: "Cooling Maestro",
                areaStyle: {
                  color: "rgba(59, 130, 246, 0.6)",
                },
                lineStyle: {
                  color: "#1d4ed8",
                },
              },
              {
                value: [60, 70, 50, 40, 55],
                name: "Geleneksel Yöntemler",
                areaStyle: {
                  color: "rgba(156, 163, 175, 0.5)",
                },
                lineStyle: {
                  color: "#6b7280",
                },
              },
            ],
          },
        ],
      };
      myChart.setOption(option);
      return () => {
        myChart.dispose();
      };
    }
  }, []);
  const navigate = useNavigate();

  const handleGirisYap = () => {
    navigate("/dashboard"); // Dashboard yönlendirmesi
  };
  return (
    <div className="min-h-screen bg-white">
      {/* Header / Navigation */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-4 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src="https://readdy.ai/api/search-image?query=A%2520professional%2520sleek%2520modern%2520logo%2520for%2520Cooling%2520Maestro%2520featuring%2520a%2520stylized%2520snowflake%2520or%2520cooling%2520symbol%2520with%2520blue%2520gradient%2520colors.%2520The%2520logo%2520should%2520be%2520minimalist%2520corporate%2520and%2520suitable%2520for%2520an%2520industrial%2520cooling%2520calculation%2520software.%2520Clean%2520background%2520high%2520contrast.&width=60&height=60&seq=1&orientation=squarish"
                alt="Cooling Maestro Logo"
                className="h-12 w-12 object-contain mr-3"
              />
              <div>
                <h1 className="text-2xl font-bold">Cooling Maestro</h1>
                <p className="text-sm text-blue-100">
                  Endüstriyel Soğutma Çözümleri
                </p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Button
                type="link"
                className="text-white hover:text-blue-200 !rounded-button whitespace-nowrap"
              >
                Ana Sayfa
              </Button>
              <Button
                type="link"
                className="text-white hover:text-blue-200 !rounded-button whitespace-nowrap"
              >
                Özellikler
              </Button>
              <Button
                type="link"
                className="text-white hover:text-blue-200 !rounded-button whitespace-nowrap"
              >
                Fiyatlandırma
              </Button>
              <Button
                type="link"
                className="text-white hover:text-blue-200 !rounded-button whitespace-nowrap"
              >
                Hakkımızda
              </Button>
              <Button
                type="link"
                className="text-white hover:text-blue-200 !rounded-button whitespace-nowrap"
              >
                İletişim
              </Button>
            </nav>
            <div className="flex items-center space-x-3">
              <Button
                type="default"
                className="border-white text-blue !rounded-button whitespace-nowrap"
                onClick={handleGirisYap}
              >
                Giriş Yap
              </Button>
              <Button
                type="primary"
                className="bg-blue-500 border-blue-500 hover:bg-blue-600 !rounded-button whitespace-nowrap"
              >
                Kayıt Ol
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center z-0"
          style={{
            backgroundImage: `url('https://readdy.ai/api/search-image?query=A%2520professional%2520industrial%2520cooling%2520facility%2520with%2520modern%2520refrigeration%2520equipment%2520and%2520cold%2520storage%2520units.%2520The%2520left%2520side%2520has%2520a%2520gradient%2520blue%2520background%2520that%2520perfectly%2520blends%2520with%2520the%2520right%2520side%2520showing%2520technical%2520equipment.%2520High%2520quality%2520photorealistic%2520image%2520with%2520excellent%2520lighting%2520and%2520composition.&width=1440&height=600&seq=2&orientation=landscape')`,
          }}
        />
        <div className="relative z-10 container mx-auto px-4 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-white bg-gradient-to-r from-blue-900/90 to-blue-800/70 p-8 rounded-lg backdrop-blur-sm">
              <Title
                level={1}
                className="text-4xl md:text-5xl font-bold text-white mb-6"
              >
                Endüstriyel Soğutma Yüklerini Bilimsel Olarak Hesaplayın
              </Title>
              <Paragraph className="text-lg text-blue-100 mb-8">
                Cooling Maestro, depo ve soğuk odalar için otomatik ısı yükü ve
                sistem konfigürasyonu hesaplayan web tabanlı profesyonel bir
                araçtır.
              </Paragraph>
              <div className="flex flex-wrap gap-4">
                <Button
                  type="primary"
                  size="large"
                  className="bg-blue-500 hover:bg-blue-600 text-lg px-8 py-3 h-auto !rounded-button whitespace-nowrap"
                  onClick={onStartCalculation}
                >
                  <i className="fas fa-play-circle mr-2"></i> Ücretsiz Deneyin
                </Button>
                <Button
                  size="large"
                  className="border-white text-white hover:bg-white hover:text-blue-700 text-lg px-8 py-3 h-auto !rounded-button whitespace-nowrap cursor-pointer"
                >
                  <i className="fas fa-info-circle mr-2"></i> Nasıl Çalışır?
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Problem-Solution Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Title level={2} className="text-3xl font-bold text-gray-800 mb-4">
              Soğutma Hesaplamalarında Yaşanan Zorluklar
            </Title>
            <Text className="text-lg text-gray-600">
              Endüstriyel soğutma hesaplamalarında karşılaştığınız zorlukları
              Cooling Maestro ile aşın
            </Text>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card
              className="shadow-md hover:shadow-lg transition-shadow duration-300 h-full"
              cover={
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://readdy.ai/api/search-image?query=A%2520frustrated%2520engineer%2520struggling%2520with%2520complex%2520manual%2520calculations%2520on%2520paper%2520with%2520many%2520crossed-out%2520formulas%2520and%2520scattered%2520documents.%2520The%2520scene%2520shows%2520stress%2520and%2520inefficiency%2520with%2520a%2520clean%2520professional%2520office%2520background.&width=400&height=200&seq=3&orientation=landscape"
                    alt="Manuel Hesaplama Zorlukları"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              }
            >
              <div className="text-center">
                <Title level={4} className="text-red-600 mb-3">
                  <i className="fas fa-exclamation-triangle mr-2"></i> Elle
                  Hesaplar Karmaşık mı?
                </Title>
                <Text className="text-gray-600">
                  Manuel hesaplamalar zaman alıcı ve hata yapmaya açıktır.
                  Karmaşık formüller ve değişkenler arasında kaybolabilirsiniz.
                </Text>
              </div>
            </Card>
            <Card
              className="shadow-md hover:shadow-lg transition-shadow duration-300 h-full"
              cover={
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://readdy.ai/api/search-image?query=A%2520disorganized%2520desk%2520with%2520outdated%2520Excel%2520spreadsheets%2520showing%2520cooling%2520load%2520calculations%2520on%2520a%2520computer%2520screen.%2520The%2520spreadsheets%2520look%2520complex%2520and%2520confusing%2520with%2520a%2520clean%2520professional%2520office%2520background.&width=400&height=200&seq=4&orientation=landscape"
                    alt="Excel Dosyaları Güncel Değil"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              }
            >
              <div className="text-center">
                <Title level={4} className="text-red-600 mb-3">
                  <i className="fas fa-file-excel mr-2"></i> Excel Dosyaları
                  Güncel Değil mi?
                </Title>
                <Text className="text-gray-600">
                  Eski Excel dosyaları güncel standartları karşılamıyor ve
                  bakımı zor. Formüllerin doğruluğundan emin olamıyorsunuz.
                </Text>
              </div>
            </Card>
            <Card
              className="shadow-md hover:shadow-lg transition-shadow duration-300 h-full"
              cover={
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://readdy.ai/api/search-image?query=A%2520stressed%2520cooling%2520engineer%2520working%2520late%2520with%2520multiple%2520client%2520folders%2520and%2520repeating%2520calculations%2520for%2520different%2520customers.%2520The%2520scene%2520shows%2520inefficiency%2520and%2520repetitive%2520work%2520with%2520a%2520clean%2520professional%2520office%2520background.&width=400&height=200&seq=5&orientation=landscape"
                    alt="Her Müşteri İçin Yeniden Hesaplama"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              }
            >
              <div className="text-center">
                <Title level={4} className="text-red-600 mb-3">
                  <i className="fas fa-redo-alt mr-2"></i> Her Müşteri İçin
                  Yeniden mi Uğraşıyorsun?
                </Title>
                <Text className="text-gray-600">
                  Her yeni proje için sıfırdan hesaplama yapmak zorunda kalmak
                  verimsiz ve zaman kaybıdır.
                </Text>
              </div>
            </Card>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-green-500">
            <Title
              level={3}
              className="text-2xl font-bold text-gray-800 mb-6 flex items-center"
            >
              <i className="fas fa-check-circle text-green-500 mr-3 text-3xl"></i>
              Cooling Maestro ile Çözüm
            </Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <i className="fas fa-check text-green-500 text-lg bg-green-100 p-1 rounded-full"></i>
                  </div>
                  <div className="ml-3">
                    <Text strong className="text-gray-800 block mb-1">
                      Otomatik U değeri seçimi
                    </Text>
                    <Text className="text-gray-600">
                      Duvar, tavan ve zemin malzemelerine göre ısı transfer
                      katsayılarını otomatik hesaplar.
                    </Text>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <i className="fas fa-check text-green-500 text-lg bg-green-100 p-1 rounded-full"></i>
                  </div>
                  <div className="ml-3">
                    <Text strong className="text-gray-800 block mb-1">
                      API üzerinden anlık iklim verisi
                    </Text>
                    <Text className="text-gray-600">
                      Konum bazlı sıcaklık ve nem verilerini otomatik olarak
                      çeker ve hesaplamalarda kullanır.
                    </Text>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <i className="fas fa-check text-green-500 text-lg bg-green-100 p-1 rounded-full"></i>
                  </div>
                  <div className="ml-3">
                    <Text strong className="text-gray-800 block mb-1">
                      Ürün veritabanına dayalı yük hesabı
                    </Text>
                    <Text className="text-gray-600">
                      Geniş ürün kütüphanesi ile farklı gıda ve malzemeler için
                      doğru hesaplamalar yapar.
                    </Text>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <i className="fas fa-check text-green-500 text-lg bg-green-100 p-1 rounded-full"></i>
                  </div>
                  <div className="ml-3">
                    <Text strong className="text-gray-800 block mb-1">
                      Detaylı raporlama ve analiz
                    </Text>
                    <Text className="text-gray-600">
                      Hesaplama sonuçlarını detaylı raporlar halinde sunar,
                      böylece verimlilik analizleri yapabilirsiniz.
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Demo Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Title level={2} className="text-3xl font-bold text-gray-800 mb-4">
              Cooling Maestro ile Ücretsiz Deneme
            </Title>
            <Text className="text-lg text-gray-600">
              Hemen kaydolun, 30 gün boyunca tüm özellikleri ücretsiz deneyin.
            </Text>
          </div>
          <div className="max-w-xl mx-auto">
            <Form
              form={form}
              layout="vertical"
              onFinish={calculateDemo}
              className="bg-gray-50 p-8 rounded-lg shadow-md"
            >
              <Form.Item
                label="Hacim (m³)"
                name="volume"
                initialValue={volume}
                rules={[{ required: true, message: "Lütfen hacmi girin" }]}
              >
                <Input
                  type="number"
                  placeholder="Örneğin: 100"
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="rounded-md"
                />
              </Form.Item>
              <Form.Item
                label="Dış Mekan Sıcaklığı (°C)"
                name="externalTemp"
                initialValue={externalTemp}
                rules={[
                  {
                    required: true,
                    message: "Lütfen dış mekan sıcaklığını girin",
                  },
                ]}
              >
                <Input
                  type="number"
                  placeholder="Örneğin: 35"
                  onChange={(e) => setExternalTemp(Number(e.target.value))}
                  className="rounded-md"
                />
              </Form.Item>
              <Form.Item
                label="Ürün Tipi"
                name="productType"
                initialValue={productType}
                rules={[
                  { required: true, message: "Lütfen ürün tipini seçin" },
                ]}
              >
                <Select
                  placeholder="Ürün tipi seçin"
                  onChange={(value) => setProductType(value)}
                  className="rounded-md"
                >
                  <Option value="meyve">Meyve</Option>
                  <Option value="sebze">Sebze</Option>
                  <Option value="et">Et</Option>
                  <Option value="süt">Süt</Option>
                  <Option value="ilaç">İlaç</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 rounded-md py-3"
                >
                  Demo Hesapla
                </Button>
              </Form.Item>
            </Form>
          </div>
          {showDemoResult && (
            <div className="mt-12 bg-gray-100 p-8 rounded-lg shadow-md">
              <Title level={3} className="text-xl font-bold text-gray-800 mb-4">
                Hesaplama Sonucu
              </Title>
              <Paragraph className="text-gray-700 mb-4">
                Tahmini soğutma yükü:{" "}
                <Text strong className="text-lg">
                  {volume * 10} BTU/h
                </Text>
              </Paragraph>
              <Paragraph className="text-gray-700 mb-4">
                Önerilen soğutucu:{" "}
                <Text strong className="text-lg">
                  R-404A
                </Text>
              </Paragraph>
              <Divider className="my-4" />
              <Title
                level={4}
                className="text-lg font-semibold text-gray-800 mb-3"
              >
                Detaylı Rapor
              </Title>
              <Paragraph className="text-gray-700 mb-2">
                - Hacim: {volume} m³
              </Paragraph>
              <Paragraph className="text-gray-700 mb-2">
                - Dış Mekan Sıcaklığı: {externalTemp} °C
              </Paragraph>
              <Paragraph className="text-gray-700 mb-2">
                - Ürün Tipi: {productType}
              </Paragraph>
              <Paragraph className="text-gray-700">
                Hesaplamalarınız başarıyla tamamlandı. Daha fazla bilgi için
                bizimle iletişime geçin.
              </Paragraph>
            </div>
          )}
        </div>
      </section>
      {/* Referanslar Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Title level={2} className="text-3xl font-bold text-gray-800 mb-4">
              Müşteri Yorumları
            </Title>
            <Text className="text-lg text-gray-600">
              Cooling Maestro ile yaşadıkları deneyimleri paylaşan değerli
              müşterilerimizden bazıları.
            </Text>
          </div>
          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            className="mySwiper"
          >
            {customers.map((customer, index) => (
              <SwiperSlide key={index}>
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="flex flex-col items-center">
                    <div className="text-center mb-4">
                      <Text className="text-lg font-semibold text-gray-800">
                        "{customer.quote}"
                      </Text>
                    </div>
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${customer.name}&background=007bff&color=fff`}
                          alt={customer.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <Text className="font-semibold text-gray-800">
                          {customer.name}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {customer.sector}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <img
                  src="https://readdy.ai/api/search-image?query=A%2520professional%2520sleek%2520modern%2520logo%2520for%2520Cooling%2520Maestro%2520featuring%2520a%2520stylized%2520snowflake%2520or%2520cooling%2520symbol%2520with%2520blue%2520gradient%2520colors.%2520The%2520logo%2520should%2520be%2520minimalist%2520corporate%2520and%2520suitable%2520for%2520an%2520industrial%2520cooling%2520calculation%2520software.%2520Clean%2520background%2520high%2520contrast.&width=60&height=60&seq=1&orientation=squarish"
                  alt="Cooling Maestro Logo"
                  className="h-10 w-10 object-contain mr-3"
                />
                <div>
                  <h3 className="text-xl font-bold">Cooling Maestro</h3>
                </div>
              </div>
              <Paragraph className="text-gray-400 mb-4">
                Endüstriyel soğutma çözümleri için profesyonel hesaplama
                araçları sunan lider platform.
              </Paragraph>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <i className="fab fa-twitter"></i>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <i className="fab fa-linkedin-in"></i>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <i className="fab fa-github"></i>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Hakkımızda</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Şirketimiz
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Ekibimiz
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Kariyer
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    KVKK
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Destek</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Yardım Merkezi
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    SSS
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Dokümantasyon
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    API
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    İletişim
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">İletişim</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <i className="fas fa-map-marker-alt mt-1 mr-3 text-blue-400"></i>
                  <span className="text-gray-400">
                    Soğutma Vadisi, No:123
                    <br />
                    Ankara, Türkiye
                  </span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-phone-alt mr-3 text-blue-400"></i>
                  <span className="text-gray-400">+90 (312) 123 4567</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-envelope mr-3 text-blue-400"></i>
                  <span className="text-gray-400">info@coolingmaestro.com</span>
                </li>
              </ul>
              <div className="mt-4 flex items-center space-x-3">
                <i className="fab fa-cc-visa text-xl text-gray-400"></i>
                <i className="fab fa-cc-mastercard text-xl text-gray-400"></i>
                <i className="fab fa-cc-paypal text-xl text-gray-400"></i>
              </div>
            </div>
          </div>
          <Divider className="border-gray-700" />
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Text className="text-gray-500 text-sm">
              © 2025 Cooling Maestro. Tüm hakları saklıdır.
            </Text>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-4">
              <a
                href="#"
                className="text-gray-500 text-sm hover:text-white transition-colors cursor-pointer"
              >
                Gizlilik Politikası
              </a>
              <a
                href="#"
                className="text-gray-500 text-sm hover:text-white transition-colors cursor-pointer"
              >
                Kullanım Şartları
              </a>
              <a
                href="#"
                className="text-gray-500 text-sm hover:text-white transition-colors cursor-pointer"
              >
                Çerez Politikası
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Karsilama;
