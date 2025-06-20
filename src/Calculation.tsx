
import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

import {
  Button,
  Form,
  Breadcrumb,
  Typography,
  message,
} from "antd";
import {
  HomeOutlined,
  CalculatorOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import Footer from "./components/Footer";
import Header from "./components/Header";
import CalculationTypeCards from "./components/CalculationTypeCards";
import ProductInfoCard from "./components/ProductInfoCard";
import ClimateDataCard from "./components/ClimateDataCard";
import Transmission from "./Transmission";
import DetailedCalculationSteps from "./components/DetailedCalculationSteps";
import CalculationResultCard from "./components/CalculationResultCard";
import InternalLoadsWizard from "./components/InternalLoadsWizard";
import Infiltration from "./components/Infiltration";
import { productService, ProductThermalProperty } from "./services/productService";
import { fetchClimateData } from "./utils/fetchClimateData";
import { calculationService, CalculationInput } from "./services/calculationService";
import {
  useCalculationState,
  useLocationState,
  useProductState,
  useWallState,
} from "./hooks/useCalculationState";

const { Title, Text } = Typography;

// Ürün tablosu sütunları
const productColumns = [
  {
    title: "Kategori",
    dataIndex: "category",
    key: "category",
  },
  {
    title: "Ürün",
    dataIndex: "product",
    key: "product",
  },
  {
    title: "Giriş Sıcaklığı (°C)",
    dataIndex: "entryTemperature",
    key: "entryTemperature",
  },
  {
    title: "Günlük Miktar (kg)",
    dataIndex: "dailyAmount",
    key: "dailyAmount",
  },
  {
    title: "Toplam Kapasite (kg)",
    dataIndex: "totalCapacity",
    key: "totalCapacity",
  },
  {
    title: "Soğutma Süresi (saat)",
    dataIndex: "coolingDuration",
    key: "coolingDuration",
  },
  {
    title: "İşlem",
    key: "action",
    render: (_text: string, record: any) => (
      <Button
        type="text"
        danger
        icon={<DeleteOutlined />}
        onClick={() => record.onRemove?.(record.key)}
        className="!rounded-button whitespace-nowrap"
      />
    ),
  },
];

const App: React.FC = () => {
  const [form] = Form.useForm();
  
  // Custom hooks for state management
  const {
    selectedCalculationType,
    setSelectedCalculationType,
    showCalculationForm,
    setShowCalculationForm,
    currentStep,
    setCurrentStep,
    handleStepChange,
    calculationResult,
    setCalculationResult,
  } = useCalculationState();

  const {
    selectedProvince,
    setSelectedProvince,
    selectedDistrict,
    setSelectedDistrict,
    provinces,
    setProvinces,
    districts,
    setDistricts,
    loading,
    setLoading,
    climateData,
    setClimateData,
  } = useLocationState();

  const {
    selectedCategory,
    setSelectedCategory,
    selectedProduct,
    setSelectedProduct,
    productList,
    setProductList,
  } = useProductState();

  const {
    wallInsulation,
    wallDoors,
  } = useWallState();

  // Remaining local state
  const [buildingLocation] = useState<
    "inside" | "outside"
  >("inside");
  const [roomType] = useState<"rectangle" | "L" | "T">(
    "rectangle"
  );
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [products, setProducts] = useState<ProductThermalProperty[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [productThermalProperties, setProductThermalProperties] = useState<Map<string, ProductThermalProperty>>(new Map());

  // Fetch provinces from database
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const { data, error } = await supabase
          .from("sehirler")
          .select("sehir")
          .order("sehir", { ascending: true });

        if (error) throw error;

        if (data) {
          const provinceList = data.map((item) => item.sehir).filter(Boolean);
          setProvinces(provinceList);
        }
      } catch (error) {
        console.error("Error fetching provinces:", error);
        message.error("İller yüklenirken hata oluştu");
      }
    };

    fetchProvinces();
  }, []);


  // Fetch product categories from database
  useEffect(() => {
    const fetchProductCategories = async () => {
      try {
        setLoadingCategories(true);
        const { data, error } = await productService.getProductCategories();

        if (error) throw error;

        if (data) {
          setProductCategories(data);
        }
      } catch (error) {
        console.error("Error fetching product categories:", error);
        message.error("Ürün kategorileri yüklenirken hata oluştu");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchProductCategories();
  }, []);

  // Fetch products when category is selected
  const fetchProductsByCategory = async (category: string) => {
    try {
      setLoadingProducts(true);
      const { data, error } = await productService.getProductsByCategory(
        category
      );

      if (error) throw error;

      if (data) {
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error("Ürünler yüklenirken hata oluştu");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch districts based on selected province
  const fetchDistricts = async (provinceName: string) => {
    try {
      // First get the plaka_kodu for the selected province
      const { data: provinceData, error: provinceError } = await supabase
        .from("sehirler")
        .select("plaka_kodu")
        .eq("sehir", provinceName)
        .single();

      if (provinceError) throw provinceError;

      if (provinceData) {
        // Then get all districts for that plaka_kodu
        const { data: districtData, error: districtError } = await supabase
          .from("ilceler")
          .select("ilce")
          .eq("plaka_kodu", provinceData.plaka_kodu)
          .order("ilce", { ascending: true });

        if (districtError) throw districtError;

        if (districtData) {
          const districtList = districtData
            .map((item) => item.ilce)
            .filter(Boolean);
          setDistricts(districtList);
        }
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
      message.error("İlçeler yüklenirken hata oluştu");
      setDistricts([]);
    }
  };

  // Hava durumu verilerini getirme simülasyonu
  const handleFetchClimateData = async () => {
    await fetchClimateData({
      selectedProvince,
      selectedDistrict,
      setLoading,
      setClimateData,
    });
  };



  // Room dimensions for 3D visualization
  const [roomDimensions] = useState({
    width: 8,
    depth: 6,
    height: 3,
    // L tipi oda için ek boyutlar
    lWidth: 4,
    lDepth: 3,
    // T tipi oda için ek boyutlar
    tWidth: 4,
    tDepth: 3,
  });


  // Ürün ekleme fonksiyonu
  const handleAddProduct = () => {
    if (!selectedCategory || !selectedProduct) return;

    const entryTemp = form.getFieldValue("productEntryTemperature");
    const dailyAmount = form.getFieldValue("dailyProductAmount");
    const totalCapacity = form.getFieldValue("totalStorageCapacity");
    const coolingDuration = form.getFieldValue("coolingDuration");

    if (!entryTemp || !dailyAmount || !totalCapacity || !coolingDuration) {
      return;
    }

    const newProduct = {
      key: Date.now().toString(),
      category: selectedCategory,
      product: selectedProduct,
      entryTemperature: entryTemp,
      dailyAmount,
      totalCapacity,
      coolingDuration,
    };

    setProductList([...productList, newProduct]);

    // Seçilen ürünün termal özelliklerini kaydet
    const selectedProductData = products.find(p => p.product_name === selectedProduct);
    if (selectedProductData) {
      const newMap = new Map(productThermalProperties);
      newMap.set(selectedProduct, selectedProductData);
      setProductThermalProperties(newMap);
    }

    // Form alanlarını temizle
    form.setFieldsValue({
      productEntryTemperature: null,
      dailyProductAmount: null,
      totalStorageCapacity: null,
      coolingDuration: null,
    });

    setSelectedCategory("");
    setSelectedProduct("");
  };

  // Ürün silme fonksiyonu
  const handleRemoveProduct = (key: string) => {
    setProductList(productList.filter((item) => item.key !== key));
  };

  // productColumns artık component dışında tanımlı
  // handleRemoveProduct'ı props olarak geçmemiz gerekiyor
  const enhancedProductColumns = productColumns.map(col => {
    if (col.key === 'action') {
      return {
        ...col,
        render: (_text: string, record: any) => (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveProduct(record.key)}
            className="!rounded-button whitespace-nowrap"
          />
        ),
      };
    }
    return col;
  });

  // Hesaplama fonksiyonu
  const handleCalculate = async () => {
    try {
      // Form verilerini validate et
      const formValues = await form.validateFields().catch((errorInfo) => {
        console.error('Validation failed:', errorInfo);
        // Get all form values even if validation fails
        return form.getFieldsValue();
      });
      
      // Tüm ürünler için thermal properties'i al
      const productsWithProperties = await Promise.all(
        productList.map(async (product) => {
          const { data, error } = await productService.getProductByName(product.product);
          if (error || !data) {
            console.error(`Error fetching product ${product.product}:`, error);
            return null;
          }
          return {
            ...product,
            thermalProperties: data,
          };
        })
      );

      // En az bir ürün olduğundan emin ol
      const validProducts = productsWithProperties.filter(p => p && p.thermalProperties);
      if (validProducts.length === 0) {
        message.error('Lütfen en az bir ürün ekleyin.');
        return;
      }

      // Hedef sıcaklığı belirle (ilk ürünün optimal saklama sıcaklığı)
      const firstProduct = validProducts[0];
      const targetTemperature = firstProduct?.thermalProperties 
        ? (firstProduct.thermalProperties.optimal_storage_temp_min + 
           firstProduct.thermalProperties.optimal_storage_temp_max) / 2
        : 0;

      // Wall ID'lerini eşleştir
      // wall1 = front, wall2 = right, wall3 = back, wall4 = left, wall5 = ceiling, wall6 = floor
      const wallInsulationMapped = {
        front: wallInsulation.wall1 || { type: '', uValue: 0 },
        right: wallInsulation.wall2 || { type: '', uValue: 0 },
        back: wallInsulation.wall3 || { type: '', uValue: 0 },
        left: wallInsulation.wall4 || { type: '', uValue: 0 },
        ceiling: wallInsulation.wall5 || { type: '', uValue: 0 },
        floor: wallInsulation.wall6 || { type: '', uValue: 0 },
      };

      // Eksik duvarlar için hata kontrolü
      const missingWalls = [];
      if (!wallInsulationMapped.front) missingWalls.push('Ön duvar');
      if (!wallInsulationMapped.back) missingWalls.push('Arka duvar');
      if (!wallInsulationMapped.left) missingWalls.push('Sol duvar');
      if (!wallInsulationMapped.right) missingWalls.push('Sağ duvar');
      if (!wallInsulationMapped.ceiling) missingWalls.push('Tavan');
      if (!wallInsulationMapped.floor) missingWalls.push('Zemin');

      if (missingWalls.length > 0) {
        message.error(`Lütfen şu duvarlar için yalıtım seçin: ${missingWalls.join(', ')}`);
        return;
      }

      // Hesaplama için input hazırla
      const calculationInput: CalculationInput = {
        climateData: {
          maxTemperature: climateData?.maxTemp || 0,
          humidity: climateData?.humidity || 0,
          wetBulbTemperature: climateData?.wetBulbTemp || 0,
          groundTemperature: climateData?.groundTemp || 0,
          pressure: climateData?.pressure,
          elevation: climateData?.elevation,
          indoorTemperature: formValues.indoorTemperature,
          indoorHumidity: formValues.indoorHumidity,
        },
        products: productsWithProperties.filter(p => p && p.thermalProperties),
        roomDimensions,
        roomType,
        buildingLocation,
        wallInsulation: wallInsulationMapped,
        wallDoors: {
          front: typeof wallDoors.wall1 === 'boolean' ? { enabled: wallDoors.wall1 } : (wallDoors.wall1 || { enabled: false }),
          right: typeof wallDoors.wall2 === 'boolean' ? { enabled: wallDoors.wall2 } : (wallDoors.wall2 || { enabled: false }),
          back: typeof wallDoors.wall3 === 'boolean' ? { enabled: wallDoors.wall3 } : (wallDoors.wall3 || { enabled: false }),
          left: typeof wallDoors.wall4 === 'boolean' ? { enabled: wallDoors.wall4 } : (wallDoors.wall4 || { enabled: false }),
        },
        internalLoads: {
          lighting: {
            exclude: formValues.excludeLighting === true,
            totalWatt: formValues.excludeLighting ? 0 : (formValues.totalWatt || formValues.calculatedWattage || 0),
            hoursPerDay: formValues.excludeLighting ? 0 : (formValues.lightingHoursPerDay || 0),
          },
          people: {
            exclude: formValues.excludePeople === true,
            count: formValues.excludePeople ? 0 : (formValues.peopleCount || 0),
            activityType: formValues.excludePeople ? undefined : (formValues.activityType || undefined),
            hoursPerDay: formValues.excludePeople ? 0 : (formValues.peopleHoursPerDay || 0),
            roomTemperature: formValues.indoorTemperature || 23.9,
          },
          motors: {
            exclude: formValues.excludeMotors === true,
            hp: formValues.excludeMotors ? 0 : (formValues.motorHP || 0),
            count: formValues.excludeMotors ? 0 : (formValues.motorCount || 0),
            hoursPerDay: formValues.excludeMotors ? 0 : (formValues.motorHoursPerDay || 0),
            ...(formValues.excludeMotors ? {} : { location: formValues.motorLocation || 'both_inside' }),
          },
          equipment: {
            exclude: formValues.excludeEquipment === true,
            totalWatt: formValues.excludeEquipment ? 0 : (formValues.equipmentTotalWatt || 0),
            hoursPerDay: formValues.excludeEquipment ? 0 : (formValues.equipmentHoursPerDay || 0),
            type: formValues.excludeEquipment ? undefined : (formValues.equipmentType || 'general'),
          },
        },
        infiltration: {
          anteRoom: formValues.anteRoom || 'without',
          method: formValues.infiltrationMethod || 'airChange',
          usage: formValues.usage || 'average',
          doorPassCount: formValues.doorPassCount || 0,
          openCloseDuration: formValues.openCloseDuration || 0,
          doorOpenDuration: formValues.doorOpenDuration || 0,
          dailyDoorUsageDuration: formValues.dailyDoorUsageDuration || 0,
          airFlow: formValues.airFlow || 0,
        },
        targetTemperature,
      };

      // Debug: Log the calculation input
      console.log('Calculation Input:', calculationInput);
      console.log('Form Values:', formValues);

      // Hesaplama yap
      const result = calculationService.calculateCoolingLoad(calculationInput);
      
      // Sonucu state'e kaydet
      setCalculationResult(result);
      
      // Sonuç adımına geç
      setCurrentStep(6);
      
    } catch (error) {
      console.error('Hesaplama hatası:', error);
      console.error('Form values:', form.getFieldsValue());
      message.error('Hesaplama yapılırken bir hata oluştu. Lütfen tüm alanları doldurun.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumb
            items={[
              {
                href: '#',
                title: (
                  <>
                    <HomeOutlined />
                    <span>Ana Sayfa</span>
                  </>
                ),
              },
              {
                title: (
                  <>
                    <CalculatorOutlined />
                    <span>Hesaplama Formu</span>
                  </>
                ),
              },
            ]}
          />
          <Title level={2} className="mt-4 text-gray-800">
            Endüstriyel Soğutma Yükü Hesaplama Formu
          </Title>
          <Text className="text-gray-600 block mb-4">
            Lütfen hesaplama tipini seçiniz.
          </Text>
          <CalculationTypeCards
            selectedCalculationType={selectedCalculationType}
            setSelectedCalculationType={setSelectedCalculationType}
            setShowCalculationForm={setShowCalculationForm}
          />
        </div>

        {showCalculationForm && selectedCalculationType === "detailed" && (
          <div className="space-y-8">
            <DetailedCalculationSteps
              currentStep={currentStep}
              onChange={handleStepChange}
            />


            <Form 
              form={form} 
              layout="vertical" 
              className="space-y-8"
              onValuesChange={() => {
                // Form değişikliklerinde yeniden hesaplama tetiklenir
                // setTriggerRecalculation(prev => prev + 1);
              }}
            >
              {/* Step 0: Konum Bilgileri Kartı */}
              {currentStep === 0 && (
                <ClimateDataCard
                  form={form}
                  provinces={provinces}
                  districts={districts}
                  selectedProvince={selectedProvince}
                  setSelectedProvince={setSelectedProvince}
                  selectedDistrict={selectedDistrict}
                  setSelectedDistrict={setSelectedDistrict}
                  fetchDistricts={fetchDistricts}
                  fetchClimateData={handleFetchClimateData}
                  loading={loading}
                  climateData={climateData}
                />
              )}
              
              {/* Step 1: Isı Geçişi (Mekan Boyutları) */}
              {currentStep === 1 && (
                <Transmission form={form} climateData={climateData} />
              )}

              {/* Step 2: İç Yükler */}
              {currentStep === 2 && (
                <InternalLoadsWizard 
                  form={form} 
                  roomDryBulbTemperature={form.getFieldValue('indoorTemperature') || 23.9} 
                  onComplete={() => setCurrentStep(3)}
                  onBack={() => setCurrentStep(1)}
                />
              )}

              {/* Step 3: Hava Sızıntısı */}
              {currentStep === 3 && (
                <Infiltration form={form} />
              )}

              {/* Step 4: Ürün Bilgileri */}
              {currentStep === 4 && (
                <ProductInfoCard
                    form={form}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    selectedProduct={selectedProduct}
                    setSelectedProduct={setSelectedProduct}
                    productCategories={productCategories}
                    loadingCategories={loadingCategories}
                    products={products}
                    loadingProducts={loadingProducts}
                    fetchProductsByCategory={fetchProductsByCategory}
                    handleAddProduct={handleAddProduct}
                    productList={productList}
                    productColumns={enhancedProductColumns}
                />
              )}

              {currentStep === 5 && (
                <div className="flex justify-center mt-8">
                  <Button
                    type="primary"
                    size="large"
                    icon={<i className="fas fa-calculator mr-2"></i>}
                    onClick={handleCalculate}
                    className="!rounded-button whitespace-nowrap"
                  >
                    Hesaplamayı Başlat
                  </Button>
                </div>
              )}

              {currentStep === 6 && calculationResult && (
                <CalculationResultCard calculationResult={calculationResult} />
              )}

              {currentStep < 6 && currentStep !== 2 && (
                <div className="flex justify-center gap-4 mt-8">
                  <Button
                    size="large"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    disabled={currentStep === 0}
                    className="!rounded-button whitespace-nowrap"
                  >
                    <i className="fas fa-arrow-left mr-2"></i> Geri
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="!rounded-button whitespace-nowrap"
                  >
                    Devam Et <i className="fas fa-arrow-right ml-2"></i>
                  </Button>
                </div>
              )}
            </Form>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default App;
