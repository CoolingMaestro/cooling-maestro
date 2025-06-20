import React from "react";
import {
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  Table,
  Tooltip,
  FormInstance,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ProductThermalProperty } from "../services/productService";
import { ColumnsType } from "antd/es/table";

const { Option } = Select;

interface ProductItem {
  key: string;
  category: string;
  product: string;
  entryTemperature: number;
  dailyAmount: number;
  totalCapacity: number;
  coolingDuration: number;
  onRemove?: (key: string) => void;
}

interface ProductInfoCardProps {
  form: FormInstance;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedProduct: string;
  setSelectedProduct: (product: string) => void;
  productCategories: string[];
  loadingCategories: boolean;
  products: ProductThermalProperty[];
  loadingProducts: boolean;
  fetchProductsByCategory: (category: string) => void;
  handleAddProduct: () => void;
  productList: ProductItem[];
  productColumns: ColumnsType<ProductItem>;
}

const ProductInfoCard: React.FC<ProductInfoCardProps> = ({
  form,
  selectedCategory,
  setSelectedCategory,
  selectedProduct,
  setSelectedProduct,
  productCategories,
  loadingCategories,
  products,
  loadingProducts,
  fetchProductsByCategory,
  handleAddProduct,
  productList,
  productColumns,
}) => {


  return (
    <>
      <Card
      title="Ürün Bilgileri"
      className="shadow-md hover:shadow-lg transition-shadow duration-300 mt-6"
      styles={{
        header: {
          backgroundColor: "#f0f7ff",
          borderBottom: "1px solid #d6e8ff",
        },
      }}
    >
      <div className="space-y-6">
        {/* Ürün Seçimi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Form.Item
            label="Ürün Kategorisi"
            name="productCategory"
            rules={[
              {
                required: true,
                message: "Lütfen ürün kategorisi seçiniz",
              },
            ]}
          >
            <Select
              placeholder="Kategori seçiniz"
              onChange={(value) => {
                setSelectedCategory(value);
                setSelectedProduct("");
                form.setFieldsValue({ product: undefined });
                fetchProductsByCategory(value);
              }}
              className="w-full"
              value={selectedCategory}
              loading={loadingCategories}
            >
              {productCategories.map((category) => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Ürün"
            name="product"
            rules={[
              { required: true, message: "Lütfen ürün seçiniz" },
            ]}
          >
            <Select
              placeholder="Ürün seçiniz"
              disabled={!selectedCategory}
              onChange={(value) => {
                setSelectedProduct(value);
                // Seçilen ürünün optimal değerlerini bul ve form'a set et
                const selectedProductData = products.find(p => p.product_name === value);
                if (selectedProductData) {
                  // Optimal sıcaklık değeri (ortalama)
                  if (selectedProductData.optimal_storage_temp_min !== null && 
                      selectedProductData.optimal_storage_temp_max !== null) {
                    const avgTemp = (selectedProductData.optimal_storage_temp_min + 
                                   selectedProductData.optimal_storage_temp_max) / 2;
                    form.setFieldsValue({ targetTemperature: avgTemp });
                  }
                  
                  // Optimal nem değeri (ortalama)
                  if (selectedProductData.optimal_humidity_min !== null && 
                      selectedProductData.optimal_humidity_max !== null) {
                    const avgHumidity = (selectedProductData.optimal_humidity_min + 
                                       selectedProductData.optimal_humidity_max) / 2;
                    form.setFieldsValue({ targetHumidity: avgHumidity });
                  }
                }
              }}
              className="w-full"
              value={selectedProduct}
              loading={loadingProducts}
            >
              {products.map((product) => (
                <Option
                  key={product.id}
                  value={product.product_name}
                >
                  {product.product_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        {/* Hedef Değerler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Form.Item
            label={
              <span className="flex items-center">
                Hedeflenen Ürün Sıcaklığı
                <Tooltip title="Ürün seçildiğinde otomatik olarak optimal değerle doldurulur">
                  <i className="fas fa-info-circle text-gray-400 ml-2 text-sm"></i>
                </Tooltip>
              </span>
            }
            name="targetTemperature"
            rules={[
              {
                required: true,
                message: "Lütfen hedeflenen sıcaklığı giriniz",
              },
            ]}
          >
            <InputNumber
              min={-40}
              max={30}
              className="w-full"
              addonAfter="°C"
              placeholder="Hedeflenen sıcaklığı giriniz"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="flex items-center">
                Hedeflenen Ürün Nemi
                <Tooltip title="Ürün seçildiğinde otomatik olarak optimal değerle doldurulur">
                  <i className="fas fa-info-circle text-gray-400 ml-2 text-sm"></i>
                </Tooltip>
              </span>
            }
            name="targetHumidity"
            rules={[
              {
                required: true,
                message:
                  "Lütfen hedeflenen nem oranını giriniz",
              },
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              className="w-full"
              addonAfter="%"
              placeholder="Hedeflenen nem oranını giriniz"
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Form.Item
            label="Ürün Giriş Sıcaklığı (°C)"
            name="productEntryTemperature"
            rules={[
              {
                required: true,
                message: "Lütfen ürün giriş sıcaklığını giriniz",
              },
            ]}
          >
            <InputNumber
              min={-40}
              max={50}
              className="w-full"
              addonAfter="°C"
              placeholder="Giriş sıcaklığı"
            />
          </Form.Item>

          <Form.Item
            label="Günlük Ürün Miktarı (kg)"
            name="dailyProductAmount"
            rules={[
              {
                required: true,
                message: "Lütfen günlük ürün miktarını giriniz",
              },
            ]}
          >
            <InputNumber
              min={0}
              className="w-full"
              addonAfter="kg"
              placeholder="Günlük miktar"
            />
          </Form.Item>

          <Form.Item
            label="Toplam Depolama Kapasitesi (kg)"
            name="totalStorageCapacity"
            rules={[
              {
                required: true,
                message:
                  "Lütfen toplam depolama kapasitesini giriniz",
              },
            ]}
          >
            <InputNumber
              min={0}
              className="w-full"
              addonAfter="kg"
              placeholder="Toplam kapasite"
            />
          </Form.Item>

          <Form.Item
            label="Soğutma Süresi"
            name="coolingDuration"
            rules={[
              {
                required: true,
                message: "Lütfen soğutma süresini giriniz",
              },
            ]}
          >
            <InputNumber
              min={1}
              max={168}
              className="w-full"
              addonAfter="saat"
              placeholder="Soğutma süresini giriniz"
            />
          </Form.Item>
        </div>

        <div className="flex justify-end">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddProduct}
            className="!rounded-button whitespace-nowrap"
          >
            Ürün Ekle
          </Button>
        </div>

        {productList.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <i className="fas fa-list text-blue-600 mr-2"></i>
              Eklenen Ürünler
            </h4>
            <Table
              dataSource={productList}
              columns={productColumns}
              pagination={false}
              className="border border-gray-200 rounded-lg"
              size="middle"
            />
          </div>
        )}
      </div>
      </Card>
      
    </>
  );
};

export default ProductInfoCard;