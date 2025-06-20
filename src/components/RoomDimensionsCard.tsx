import React from "react";
import { Card, Form, Radio, Select, Button, InputNumber } from "antd";
import { BuildOutlined } from "@ant-design/icons";

const { Option } = Select;

interface RoomDimensionsCardProps {
  buildingLocation: "inside" | "outside";
  setBuildingLocation: (value: "inside" | "outside") => void;
  roomType: "rectangle" | "L" | "T";
  setRoomType: (value: "rectangle" | "L" | "T") => void;
  showModal: () => void;
  isRoomDimensionsSaved: boolean;
  roomDimensions: {
    width: number;
    depth: number;
    height: number;
    lWidth: number;
    lDepth: number;
    tWidth: number;
    tDepth: number;
  };
  // Tip tanımlaması düzeltildi - obje tipinde
  wallInsulation: { 
    [key: string]: { type: string; uValue: number } | null 
  };
  wallDoors: { 
    [key: string]: boolean | { 
      enabled: boolean; 
      width?: number; 
      height?: number; 
      type?: string 
    } 
  };
}

const RoomDimensionsCard: React.FC<RoomDimensionsCardProps> = ({
  buildingLocation,
  setBuildingLocation,
  roomType,
  setRoomType,
  showModal,
  isRoomDimensionsSaved,
  roomDimensions,
  wallInsulation,
  wallDoors,
}) => {
  // Helper function to get room type display name
  const getRoomTypeDisplayName = (type: string) => {
    switch (type) {
      case "rectangle":
        return "Dikdörtgen Oda";
      case "L":
        return "L Oda";
      case "T":
        return "T Oda";
      default:
        return "";
    }
  };

  // Helper function to get wall configuration based on room type
  const getWallConfiguration = () => {
    switch (roomType) {
      case "rectangle":
        return [
          { id: "wall1", name: "Duvar 1 (Ön)" },
          { id: "wall2", name: "Duvar 2 (Sağ)" },
          { id: "wall3", name: "Duvar 3 (Arka)" },
          { id: "wall4", name: "Duvar 4 (Sol)" }
        ];
      case "L":
        return [
          { id: "wall1", name: "Duvar 1 (Ana Bölüm - Ön)" },
          { id: "wall2", name: "Duvar 2 (Ana Bölüm - Sağ)" },
          { id: "wall3", name: "Duvar 3 (L Kolu - Arka)" },
          { id: "wall4", name: "Duvar 4 (L Kolu - Sol)" },
          { id: "wall5", name: "Duvar 5 (L Kolu - Ön)" },
          { id: "wall6", name: "Duvar 6 (Bağlantı Duvarı)" },
          { id: "wall7", name: "Duvar 7 (Ana Bölüm - Arka)" },
          { id: "wall8", name: "Duvar 8 (Ana Bölüm - Sol)" }
        ];
      case "T":
        return [
          { id: "wall1", name: "Duvar 1 (Sol Kol)" },
          { id: "wall2", name: "Duvar 2 (Orta - Ön)" },
          { id: "wall3", name: "Duvar 3 (Sağ Kol)" },
          { id: "wall4", name: "Duvar 4 (Sağ Yan)" },
          { id: "wall5", name: "Duvar 5 (Arka)" },
          { id: "wall6", name: "Duvar 6 (Sol Yan)" }
        ];
      default:
        return [];
    }
  };

  // Helper function to get door info
  const getDoorInfo = (wallId: string) => {
    const door = wallDoors[wallId];
    if (!door) return null;
    
    if (typeof door === 'boolean') {
      return door ? { enabled: true, width: 1.0, height: 2.1, type: '' } : null;
    }
    
    return door.enabled ? door : null;
  };

  // Count walls with doors
  const wallsWithDoors = getWallConfiguration().filter(wall => {
    const door = getDoorInfo(wall.id);
    return door !== null;
  });

  return (
    <Card
      title={
        <div className="flex items-center">
          <BuildOutlined className="mr-2 text-blue-600" />
          <span>Mekan Boyutları</span>
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
        {/* Odanın Yerleşimi */}
        <Form.Item
          label="Odanın Yerleşimi"
          name="buildingLocation"
          initialValue="inside"
        >
          <Radio.Group
            onChange={(e) => setBuildingLocation(e.target.value)}
            value={buildingLocation}
            className="flex flex-wrap gap-4"
          >
            <Radio.Button
              value="inside"
              className="!rounded-button whitespace-nowrap px-4 py-2 flex items-center"
            >
              <i className="fas fa-building mr-2"></i> Bina İçinde
              (İklimlendirilmiş Ortam)
            </Radio.Button>
            <Radio.Button
              value="outside"
              className="!rounded-button whitespace-nowrap px-4 py-2 flex items-center"
            >
              <i className="fas fa-cloud-sun mr-2"></i> Bina Dışında
              (Dış Hava ile Temaslı)
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Bina içindeyse ortam koşulları */}
        {buildingLocation === 'inside' && (
          <div className="p-4 bg-blue-50 rounded-lg space-y-4">
            <h4 className="font-medium text-blue-700 mb-2">
              <i className="fas fa-thermometer-half mr-2"></i>
              Bina İçi Ortam Koşulları
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                label="Ortam Sıcaklığı (°C)"
                name="indoorTemperature"
                initialValue={25}
                rules={[
                  { required: true, message: 'Lütfen ortam sıcaklığını giriniz' },
                  { type: 'number', min: 15, max: 35, message: 'Sıcaklık 15-35°C arasında olmalıdır' }
                ]}
              >
                <InputNumber
                  min={15}
                  max={35}
                  step={0.5}
                  className="w-full"
                  addonAfter="°C"
                  placeholder="25"
                />
              </Form.Item>
              <Form.Item
                label="Ortam Nem Oranı (%)"
                name="indoorHumidity"
                initialValue={50}
                rules={[
                  { required: true, message: 'Lütfen nem oranını giriniz' },
                  { type: 'number', min: 20, max: 80, message: 'Nem oranı %20-80 arasında olmalıdır' }
                ]}
              >
                <InputNumber
                  min={20}
                  max={80}
                  step={5}
                  className="w-full"
                  addonAfter="%"
                  placeholder="50"
                />
              </Form.Item>
            </div>
          </div>
        )}

        {/* Oda Tipi */}
        <Form.Item
          label="Oda Tipi"
          name="roomType"
          required
          initialValue="rectangle"
        >
          <Select
            onChange={(value) => setRoomType(value)}
            className="w-full md:w-1/2"
          >
            <Option value="rectangle">Dikdörtgen Oda</Option>
            <Option value="L">L Oda</Option>
            <Option value="T">T Oda</Option>
          </Select>
        </Form.Item>

        {/* Oda Boyutları Butonu */}
        <div className="flex justify-center">
          <Button
            type="primary"
            size="large"
            icon={<i className="fas fa-ruler-combined mr-2"></i>}
            onClick={showModal}
            className="!rounded-button whitespace-nowrap"
          >
            Oda Boyutlarını Ayarla
          </Button>
        </div>

        {/* Room Summary Display */}
        {isRoomDimensionsSaved && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
              <i className="fas fa-check-circle mr-2"></i>
              Oda Bilgileri Kaydedildi
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Room Dimensions */}
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Oda Boyutları</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Oda Tipi: {getRoomTypeDisplayName(roomType)}</li>
                  {roomType === "rectangle" && (
                    <>
                      <li>• Genişlik: {roomDimensions.width} m</li>
                      <li>• Derinlik: {roomDimensions.depth} m</li>
                      <li>• Yükseklik: {roomDimensions.height} m</li>
                    </>
                  )}
                  {roomType === "L" && (
                    <>
                      <li>• Ana Genişlik: {roomDimensions.width} m</li>
                      <li>• Ana Derinlik: {roomDimensions.depth} m</li>
                      <li>• L Kol Genişliği: {roomDimensions.lWidth} m</li>
                      <li>• L Kol Derinliği: {roomDimensions.lDepth} m</li>
                      <li>• Yükseklik: {roomDimensions.height} m</li>
                    </>
                  )}
                  {roomType === "T" && (
                    <>
                      <li>• Ana Genişlik: {roomDimensions.width} m</li>
                      <li>• Ana Derinlik: {roomDimensions.depth} m</li>
                      <li>• T Kol Genişliği: {roomDimensions.tWidth} m</li>
                      <li>• T Kol Derinliği: {roomDimensions.tDepth} m</li>
                      <li>• Yükseklik: {roomDimensions.height} m</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Wall Insulation Summary - Obje tipine göre güncellendi */}
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Duvar Yalıtımları</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  {getWallConfiguration().map((wall) => {
                    const insulation = wallInsulation[wall.id];
                    if (insulation?.type) {
                      return (
                        <li key={wall.id}>
                          • {wall.name}: {insulation.type}
                        </li>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                  {/* Tavan ve Zemin */}
                  {wallInsulation.wall5?.type && (
                    <li>• Tavan: {wallInsulation.wall5.type}</li>
                  )}
                  {wallInsulation.wall6?.type && (
                    <li>• Zemin: {wallInsulation.wall6.type}</li>
                  )}
                  {Object.values(wallInsulation).filter(Boolean).length === 0 && (
                    <li className="text-gray-500">Yalıtım bilgisi girilmedi</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Door Information */}
            {wallsWithDoors.length > 0 && (
              <div className="mt-3">
                <h5 className="font-medium text-gray-700 mb-2">Kapı Bilgileri</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  {wallsWithDoors.map((wall) => {
                    const door = getDoorInfo(wall.id);
                    if (door) {
                      return (
                        <li key={wall.id}>
                          • {wall.name}: {door.width} m x {door.height} m
                          {door.type && ` (${door.type})`}
                        </li>
                      );
                    }
                    return null;
                  })}
                </ul>
              </div>
            )}

            {/* Edit Button */}
            <div className="mt-3 text-center">
              <Button
                type="link"
                onClick={showModal}
                className="text-blue-600 hover:text-blue-800"
              >
                <i className="fas fa-edit mr-1"></i>
                Düzenle
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RoomDimensionsCard;