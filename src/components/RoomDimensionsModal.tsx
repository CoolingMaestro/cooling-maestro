import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Select,
  Checkbox,
  Button,
  Divider,
  Tabs,
  Typography,
  message,
} from "antd";
import Room3D from "./Room3D";
import { insulationService, InsulationType } from "../services/insulationService";

const { Option } = Select;
const { TabPane } = Tabs;
const { Text } = Typography;

interface RoomDimensionsModalProps {
  isModalVisible: boolean;
  handleCancel: () => void;
  handleSave: () => void;
  roomType: "rectangle" | "L" | "T";
  roomDimensions: {
    width: number;
    depth: number;
    height: number;
    lWidth: number;
    lDepth: number;
    tWidth: number;
    tDepth: number;
  };
  setRoomDimensions: React.Dispatch<React.SetStateAction<{
    width: number;
    depth: number;
    height: number;
    lWidth: number;
    lDepth: number;
    tWidth: number;
    tDepth: number;
  }>>;
  wallInsulation: { [key: string]: string };
  handleWallInsulationChange: (wall: string, value: string) => void;
  wallDoors: { [key: string]: boolean | { enabled: boolean; width?: number; height?: number; type?: string } };
  handleWallDoorChange: (wall: string, value: boolean | { enabled: boolean; width?: number; height?: number; type?: string }) => void;
  room3DRef: React.RefObject<any>;
}

const RoomDimensionsModal: React.FC<RoomDimensionsModalProps> = ({
  isModalVisible,
  handleCancel,
  handleSave,
  roomType,
  roomDimensions,
  setRoomDimensions,
  wallInsulation,
  handleWallInsulationChange,
  wallDoors,
  handleWallDoorChange,
  room3DRef,
}) => {
  const [insulationTypes, setInsulationTypes] = useState<InsulationType[]>([]);
  const [doorInsulationTypes, setDoorInsulationTypes] = useState<InsulationType[]>([]);
  const [loadingInsulationTypes, setLoadingInsulationTypes] = useState<boolean>(true);
  const [loadingDoorTypes, setLoadingDoorTypes] = useState<boolean>(true);
  const [modalKey, setModalKey] = useState<number>(Date.now());
  
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
  
  // Helper function to get max width for door based on wall and room type
  const getMaxDoorWidth = (wallId: string) => {
    if (roomType === "rectangle") {
      return wallId === "wall2" || wallId === "wall4" 
        ? roomDimensions.depth - 0.5 
        : roomDimensions.width - 0.5;
    }
    // For L and T shapes, use conservative estimates
    return Math.min(roomDimensions.width, roomDimensions.depth) - 0.5;
  };
  
  // Helper function to check if door is enabled
  const isDoorEnabled = (wall: string): boolean => {
    const door = wallDoors[wall];
    return typeof door === 'boolean' ? door : door?.enabled || false;
  };
  
  // Helper function to get door data
  const getDoorData = (wall: string) => {
    const door = wallDoors[wall];
    if (typeof door === 'boolean') {
      return { enabled: door, width: 1.0, height: 2.1, type: '' };
    }
    return door || { enabled: false, width: 1.0, height: 2.1, type: '' };
  };

  // Oda boyutları değiştiğinde kapı boyutlarını kontrol et
  useEffect(() => {
    Object.keys(wallDoors).forEach((wall) => {
      const door = wallDoors[wall];
      if (typeof door === 'object' && door?.enabled) {
        let needsUpdate = false;
        const updatedDoor = { ...door };
        
        // Genişlik kontrolü
        const maxWidth = getMaxDoorWidth(wall);
        
        if (door.width && door.width > maxWidth) {
          updatedDoor.width = maxWidth;
          needsUpdate = true;
        }
        
        // Yükseklik kontrolü
        const maxHeight = roomDimensions.height - 0.5;
        if (door.height && door.height > maxHeight) {
          updatedDoor.height = maxHeight;
          needsUpdate = true;
        }
        
        // Güncelleme gerekiyorsa
        if (needsUpdate) {
          handleWallDoorChange(wall, updatedDoor);
        }
      }
    });
  }, [roomDimensions.width, roomDimensions.depth, roomDimensions.height, wallDoors, handleWallDoorChange]);

  // L tipi oda için L kol derinliğini kontrol et
  useEffect(() => {
    if (roomType === 'L' && roomDimensions.lDepth >= roomDimensions.depth) {
      setRoomDimensions(prev => ({
        ...prev,
        lDepth: roomDimensions.depth - 0.1
      }));
    }
  }, [roomDimensions.depth, roomDimensions.lDepth, roomType, setRoomDimensions]);

  // Fetch insulation types from database
  useEffect(() => {
    const fetchInsulationTypes = async () => {
      try {
        setLoadingInsulationTypes(true);
        const { data, error } = await insulationService.getInsulationTypes();

        if (error) throw error;

        if (data) {
          setInsulationTypes(data);
        }
      } catch (error) {
        console.error("Error fetching insulation types:", error);
        message.error("Yalıtım tipleri yüklenirken hata oluştu");
      } finally {
        setLoadingInsulationTypes(false);
      }
    };

    const fetchDoorInsulationTypes = async () => {
      try {
        setLoadingDoorTypes(true);
        const { data, error } = await insulationService.getDoorInsulationTypes();

        if (error) throw error;

        if (data) {
          setDoorInsulationTypes(data);
        }
      } catch (error) {
        console.error("Error fetching door insulation types:", error);
        message.error("Kapı yalıtım tipleri yüklenirken hata oluştu");
      } finally {
        setLoadingDoorTypes(false);
      }
    };

    if (isModalVisible) {
      fetchInsulationTypes();
      fetchDoorInsulationTypes();
      // Modal açıldığında key'i güncelle
      setModalKey(Date.now());
    }
  }, [isModalVisible]);
  return (
    <Modal
      title={
        <div className="flex items-center text-blue-700">
          <i className="fas fa-cube mr-2"></i>
          <span>Oda Boyutları ve 3D Görünüm</span>
        </div>
      }
      open={isModalVisible}
      onCancel={handleCancel}
      width={1000}
      footer={null}
      className="room-dimensions-modal"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4 text-gray-700 flex items-center">
            <i className="fas fa-ruler mr-2 text-blue-600"></i>
            Oda Ölçüleri
          </h3>

          {roomType === "rectangle" && (
            <div className="space-y-4">
              <Form.Item label="Oda Genişliği (m)" required>
                <InputNumber
                  min={1}
                  max={50}
                  value={roomDimensions.width}
                  onChange={(value) =>
                    setRoomDimensions({
                      ...roomDimensions,
                      width: value || 8,
                    })
                  }
                  addonAfter="m"
                  className="w-full"
                />
              </Form.Item>
              <Form.Item label="Oda Uzunluğu (m)" required>
                <InputNumber
                  min={1}
                  max={50}
                  value={roomDimensions.depth}
                  onChange={(value) =>
                    setRoomDimensions({
                      ...roomDimensions,
                      depth: value || 6,
                    })
                  }
                  addonAfter="m"
                  className="w-full"
                />
              </Form.Item>
              <Form.Item label="Oda Yüksekliği (m)" required>
                <InputNumber
                  min={1}
                  max={20}
                  value={roomDimensions.height}
                  onChange={(value) =>
                    setRoomDimensions({
                      ...roomDimensions,
                      height: value || 3,
                    })
                  }
                  addonAfter="m"
                  className="w-full"
                />
              </Form.Item>
            </div>
          )}

          {/* L tipi oda için ek boyutlar */}
          {roomType === "L" && (
            <div className="space-y-4">
              <Form.Item label="Ana Oda Genişliği (m)" required>
                <InputNumber
                  min={1}
                  max={50}
                  value={roomDimensions.width}
                  onChange={(value) =>
                    setRoomDimensions({
                      ...roomDimensions,
                      width: value || 8,
                    })
                  }
                  addonAfter="m"
                  className="w-full"
                />
              </Form.Item>
              <Form.Item label="Ana Oda Derinliği (m)" required>
                <InputNumber
                  min={1}
                  max={50}
                  value={roomDimensions.depth}
                  onChange={(value) =>
                    setRoomDimensions({
                      ...roomDimensions,
                      depth: value || 6,
                    })
                  }
                  addonAfter="m"
                  className="w-full"
                />
              </Form.Item>
              <Form.Item label="L Kol Genişliği (m)" required>
                <InputNumber
                  min={1}
                  max={50}
                  value={roomDimensions.lWidth}
                  onChange={(value) =>
                    setRoomDimensions({
                      ...roomDimensions,
                      lWidth: value || 4,
                    })
                  }
                  addonAfter="m"
                  className="w-full"
                />
              </Form.Item>
              <Form.Item label="L Kol Derinliği (m)" required>
                <InputNumber
                  min={1}
                  max={Math.min(50, roomDimensions.depth - 0.1)}
                  value={roomDimensions.lDepth}
                  onChange={(value) =>
                    setRoomDimensions({
                      ...roomDimensions,
                      lDepth: value || 3,
                    })
                  }
                  addonAfter="m"
                  className="w-full"
                />
              </Form.Item>
              <Form.Item label="Oda Yüksekliği (m)" required>
                <InputNumber
                  min={1}
                  max={20}
                  value={roomDimensions.height}
                  onChange={(value) =>
                    setRoomDimensions({
                      ...roomDimensions,
                      height: value || 3,
                    })
                  }
                  addonAfter="m"
                  className="w-full"
                />
              </Form.Item>
            </div>
          )}

          {/* T tipi oda için ek boyutlar */}
          {roomType === "T" && (
            <div className="space-y-4">
              <Form.Item label="Ana Oda Genişliği (m)" required>
                <InputNumber
                  min={1}
                  max={50}
                  value={roomDimensions.width}
                  onChange={(value) =>
                    setRoomDimensions({
                      ...roomDimensions,
                      width: value || 8,
                    })
                  }
                  addonAfter="m"
                  className="w-full"
                />
              </Form.Item>
              <Form.Item label="Ana Oda Derinliği (m)" required>
                <InputNumber
                  min={1}
                  max={50}
                  value={roomDimensions.depth}
                  onChange={(value) =>
                    setRoomDimensions({
                      ...roomDimensions,
                      depth: value || 6,
                    })
                  }
                  addonAfter="m"
                  className="w-full"
                />
              </Form.Item>
              <Form.Item label="T Kol Genişliği (m)" required>
                <InputNumber
                  min={1}
                  max={50}
                  value={roomDimensions.tWidth}
                  onChange={(value) =>
                    setRoomDimensions({
                      ...roomDimensions,
                      tWidth: value || 4,
                    })
                  }
                  addonAfter="m"
                  className="w-full"
                />
              </Form.Item>
              <Form.Item label="T Kol Derinliği (m)" required>
                <InputNumber
                  min={1}
                  max={50}
                  value={roomDimensions.tDepth}
                  onChange={(value) =>
                    setRoomDimensions({
                      ...roomDimensions,
                      tDepth: value || 3,
                    })
                  }
                  addonAfter="m"
                  className="w-full"
                />
              </Form.Item>
              <Form.Item label="Oda Yüksekliği (m)" required>
                <InputNumber
                  min={1}
                  max={20}
                  value={roomDimensions.height}
                  onChange={(value) =>
                    setRoomDimensions({
                      ...roomDimensions,
                      height: value || 3,
                    })
                  }
                  addonAfter="m"
                  className="w-full"
                />
              </Form.Item>
            </div>
          )}

          <Divider orientation="left">Duvar Özellikleri</Divider>

          <div className="space-y-4">
            {getWallConfiguration().map((wall) => (
              <div key={wall.id} className="p-3 border border-blue-100 rounded-lg bg-blue-50 mb-3">
                <h4 className="font-medium text-blue-700 mb-2">
                  {wall.name}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      İzolasyon Tipi
                    </label>
                    <Select
                      className="w-full"
                      value={wallInsulation[wall.id]?.type || undefined}
                      onChange={(value) => {
                        const selectedInsulation = insulationTypes.find(ins => ins.name === value);
                        if (selectedInsulation) {
                          handleWallInsulationChange(wall.id, {
                            type: selectedInsulation.name,
                            uValue: selectedInsulation.u_value
                          });
                        }
                      }}
                      loading={loadingInsulationTypes}
                      placeholder="Lütfen Seçiniz"
                    >
                      {insulationTypes.map((insulation) => (
                        <Option key={insulation.id} value={insulation.name}>
                          {insulation.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Checkbox
                      checked={isDoorEnabled(wall.id)}
                      onChange={(e) => {
                        const doorData = getDoorData(wall.id);
                        handleWallDoorChange(wall.id, {
                          ...doorData,
                          enabled: e.target.checked
                        });
                        // Kapı eklendiğinde o duvara odaklan
                        if (e.target.checked && room3DRef.current) {
                          setTimeout(() => {
                            const wallNumber = parseInt(wall.id.replace('wall', ''));
                            room3DRef.current?.focusOnWall(wallNumber);
                          }, 100);
                        }
                      }}
                    >
                      Kapı Ekle
                    </Checkbox>
                    {isDoorEnabled(wall.id) && (
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600">Genişlik (m)</label>
                            <InputNumber
                              min={0.5}
                              max={getMaxDoorWidth(wall.id)}
                              step={0.1}
                              value={getDoorData(wall.id).width}
                              onChange={(value) => {
                                const doorData = getDoorData(wall.id);
                                handleWallDoorChange(wall.id, {
                                  ...doorData,
                                  width: value || 1.0
                                });
                                // Kapı boyutu değiştiğinde o duvara odaklan
                                if (room3DRef.current) {
                                  const wallNumber = parseInt(wall.id.replace('wall', ''));
                                  room3DRef.current?.focusOnWall(wallNumber);
                                }
                              }}
                              className="w-full"
                              size="small"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600">Yükseklik (m)</label>
                            <InputNumber
                              min={1.5}
                              max={roomDimensions.height - 0.5}
                              step={0.1}
                              value={getDoorData(wall.id).height}
                              onChange={(value) => {
                                const doorData = getDoorData(wall.id);
                                handleWallDoorChange(wall.id, {
                                  ...doorData,
                                  height: value || 2.1
                                });
                                // Kapı boyutu değiştiğinde o duvara odaklan
                                if (room3DRef.current) {
                                  const wallNumber = parseInt(wall.id.replace('wall', ''));
                                  room3DRef.current?.focusOnWall(wallNumber);
                                }
                              }}
                              className="w-full"
                              size="small"
                            />
                          </div>
                        </div>
                        <Select
                          placeholder="Kapı Tipi Seçiniz"
                          className="w-full"
                          size="small"
                          loading={loadingDoorTypes}
                          value={getDoorData(wall.id).insulationType || undefined}
                          onChange={(value) => {
                            const doorData = getDoorData(wall.id);
                            const selectedDoorInsulation = doorInsulationTypes.find(door => door.name === value);
                            handleWallDoorChange(wall.id, {
                              ...doorData,
                              insulationType: value,
                              uValue: selectedDoorInsulation?.u_value || 3.5
                            });
                          }}
                        >
                          {doorInsulationTypes.map((door) => (
                            <Option key={door.id} value={door.name}>
                              {door.name}
                            </Option>
                          ))}
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            ))}
          </div>

          <Divider orientation="left">Tavan ve Zemin Özellikleri</Divider>

          <div className="space-y-4">
            {/* Tavan Yalıtımı */}
            <div className="p-3 border border-green-100 rounded-lg bg-green-50">
              <h4 className="font-medium text-green-700 mb-2">
                <i className="fas fa-border-style mr-2"></i>
                Tavan
              </h4>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  İzolasyon Tipi
                </label>
                <Select
                  className="w-full"
                  value={wallInsulation.wall5?.type || undefined}
                  onChange={(value) => {
                    const selectedInsulation = insulationTypes.find(ins => ins.name === value);
                    if (selectedInsulation) {
                      handleWallInsulationChange('wall5', {
                        type: selectedInsulation.name,
                        uValue: selectedInsulation.u_value
                      });
                    }
                  }}
                  loading={loadingInsulationTypes}
                  placeholder="Lütfen Seçiniz"
                >
                  {insulationTypes.map((insulation) => (
                    <Option key={insulation.id} value={insulation.name}>
                      {insulation.name}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Zemin Yalıtımı */}
            <div className="p-3 border border-orange-100 rounded-lg bg-orange-50">
              <h4 className="font-medium text-orange-700 mb-2">
                <i className="fas fa-th-large mr-2"></i>
                Zemin
              </h4>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  İzolasyon Tipi
                </label>
                <Select
                  className="w-full"
                  value={wallInsulation.wall6?.type || undefined}
                  onChange={(value) => {
                    const selectedInsulation = insulationTypes.find(ins => ins.name === value);
                    if (selectedInsulation) {
                      handleWallInsulationChange('wall6', {
                        type: selectedInsulation.name,
                        uValue: selectedInsulation.u_value
                      });
                    }
                  }}
                  loading={loadingInsulationTypes}
                  placeholder="Lütfen Seçiniz"
                >
                  {insulationTypes.map((insulation) => (
                    <Option key={insulation.id} value={insulation.name}>
                      {insulation.name}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4 text-gray-700 flex items-center">
            <i className="fas fa-cube mr-2 text-blue-600"></i>
            3D Görünüm
          </h3>
          <div className="bg-white rounded-lg p-4 shadow-inner" style={{ height: '400px', minHeight: '400px', position: 'relative', overflow: 'hidden' }}>
            <Room3D
              key={`room3d-${roomType}-${modalKey}`}
              ref={room3DRef}
              roomType={roomType}
              width={roomDimensions.width}
              depth={roomDimensions.depth}
              height={roomDimensions.height}
              lWidth={roomDimensions.lWidth}
              lDepth={roomDimensions.lDepth}
              tWidth={roomDimensions.tWidth}
              tDepth={roomDimensions.tDepth}
              wallInsulation={wallInsulation}
              wallDoors={wallDoors}
            />
          </div>
          <div className="mt-4 flex justify-center space-x-4">
            <Button
              icon={<i className="fas fa-sync-alt"></i>}
              onClick={() => room3DRef.current?.rotateRoom()}
            >
              Döndür
            </Button>
            <Button
              icon={<i className="fas fa-search-plus"></i>}
              onClick={() => room3DRef.current?.zoomIn()}
            >
              Yakınlaştır
            </Button>
            <Button
              icon={<i className="fas fa-search-minus"></i>}
              onClick={() => room3DRef.current?.zoomOut()}
            >
              Uzaklaştır
            </Button>
          </div>
          <div className="mt-2 text-center text-sm text-gray-500">
            Mouse ile sürükleyerek görünümü değiştirebilirsiniz
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 space-x-4">
        <Button onClick={handleCancel}>İptal</Button>
        <Button type="primary" onClick={handleSave}>
          Kaydet
        </Button>
      </div>
    </Modal>
  );
};

export default RoomDimensionsModal;