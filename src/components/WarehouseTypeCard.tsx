import React from "react";
import { Card, Form, Input, InputNumber } from "antd";
import { WarehouseType } from "../services/warehouseService";

interface WarehouseTypeCardProps {
  form: any;
  warehouseTypes: WarehouseType[];
  loadingWarehouseTypes: boolean;
}

const WarehouseTypeCard: React.FC<WarehouseTypeCardProps> = ({
  form,
  warehouseTypes,
  loadingWarehouseTypes,
}) => {
  return (
    <Card
      title={
        <div className="flex items-center">
          <i className="fas fa-warehouse mr-2 text-blue-600"></i>
          <span>Depo Tipi</span>
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
      <div className="space-y-6">
        {loadingWarehouseTypes ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">
              Depo tipleri yükleniyor...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouseTypes.map((warehouse) => (
              <div
                key={warehouse.id}
                onClick={() => {
                  form.setFieldsValue({
                    storageType: warehouse.type_code,
                    targetTemperature:
                      warehouse.default_temperature,
                    targetHumidity: warehouse.default_humidity,
                  });
                }}
                className="cursor-pointer"
              >
                <div
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    form.getFieldValue("storageType") ===
                    warehouse.type_code
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <i
                      className={`fas ${
                        warehouse.icon_name || "fa-warehouse"
                      } text-2xl text-blue-600`}
                    ></i>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {warehouse.type_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {warehouse.temp_range_min}°C ile{" "}
                        {warehouse.temp_range_max}°C arası
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Form.Item name="storageType" hidden>
          <Input />
        </Form.Item>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <i className="fas fa-thermometer-half text-blue-600 mr-2"></i>
              Hedeflenen Sıcaklık
            </h4>
            <Form.Item
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
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <i className="fas fa-tint text-blue-600 mr-2"></i>
              Hedeflenen Nem
            </h4>
            <Form.Item
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
        </div>
      </div>
    </Card>
  );
};

export default WarehouseTypeCard;