import React, { useState, useEffect } from "react";
import {
  Card,
  Select,
  Form,
  InputNumber,
  Tooltip,
  Space,
  FormInstance,
  Table,
  Button,
  Checkbox,
  Modal,
  Radio,
  Alert,
  message,
} from "antd";
import { 
  InfoCircleOutlined, 
  HomeOutlined, 
  DeleteOutlined,
  PlusOutlined,
  EditOutlined
} from "@ant-design/icons";
import { supabase } from "./lib/supabase";
import { Stage, Layer, Rect, Text, Group } from 'react-konva';

const { Option } = Select;

interface WallInsulationProps {
  form: FormInstance;
  climateData?: {
    maxTemp: number;
    maxTempDate: string;
    humidity: number;
    wetBulbTemp: number;
    groundTemp: number;
    pressure: number | null;
    elevation: number | null;
  } | null;
}

interface WallData {
  id: string;
  type: 'wall' | 'roof' | 'floor';
  name: string;
  insulationType: string;
  thickness: string;
  color: string;
  orientation: string;
  tdValue: number;
  uValue: number;
  load: number;
  width: number;
  height: number;
}

interface DoorData {
  id: string;
  wall: string;
  doorType: string;
  quantity: number;
  height: number;
  width: number;
  uValue: number;
  load: number;
}

interface RoomDimensions {
  height: number;
  width: number;
  length: number;
  location: 'inside' | 'outside';
}

const WallInsulation: React.FC<WallInsulationProps> = ({ form, climateData }) => {
  const [roomDimensions, setRoomDimensions] = useState<RoomDimensions>({
    height: 3,
    width: 4,
    length: 5,
    location: 'inside'
  });
  const [wallOrientations, setWallOrientations] = useState({
    wall1: 'internal',
    wall2: 'internal', 
    wall3: 'internal',
    wall4: 'internal'
  });
  const [uniformInsulation, setUniformInsulation] = useState(true);
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [wallsData, setWallsData] = useState<WallData[]>([
    { id: 'wall1', type: 'wall', name: 'Wall1', insulationType: '', thickness: '', color: '', orientation: 'internal', tdValue: 0, uValue: 0, load: 0, width: 5, height: 3 },
    { id: 'wall2', type: 'wall', name: 'Wall2', insulationType: '', thickness: '', color: '', orientation: 'internal', tdValue: 0, uValue: 0, load: 0, width: 4, height: 3 },
    { id: 'wall3', type: 'wall', name: 'Wall3', insulationType: '', thickness: '', color: '', orientation: 'internal', tdValue: 0, uValue: 0, load: 0, width: 5, height: 3 },
    { id: 'wall4', type: 'wall', name: 'Wall4', insulationType: '', thickness: '', color: '', orientation: 'internal', tdValue: 0, uValue: 0, load: 0, width: 4, height: 3 },
    { id: 'roof', type: 'roof', name: 'Roof', insulationType: '', thickness: '', color: '', orientation: '', tdValue: 0, uValue: 0, load: 0, width: 5, height: 4 },
    { id: 'floor', type: 'floor', name: 'Floor', insulationType: '', thickness: '', color: '', orientation: '', tdValue: 0, uValue: 0, load: 0, width: 5, height: 4 },
  ]);
  const [doorsData, setDoorsData] = useState<DoorData[]>([
    { id: 'door1', wall: '', doorType: '', quantity: 1, height: 0, width: 0, uValue: 0, load: 0 }
  ]);
  const [insulationTypes, setInsulationTypes] = useState<string[]>([]);
  const [floorInsulationTypes, setFloorInsulationTypes] = useState<string[]>([]);
  const [thicknessOptions, setThicknessOptions] = useState<Map<string, number[]>>(new Map());
  const [floorThicknessOptions, setFloorThicknessOptions] = useState<Map<string, number[]>>(new Map());
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [floorColorOptions, setFloorColorOptions] = useState<string[]>([]);
  const [insulationData, setInsulationData] = useState<Map<string, any>>(new Map());
  const [floorInsulationData, setFloorInsulationData] = useState<Map<string, any>>(new Map());
  const [targetIndoorTemp, setTargetIndoorTemp] = useState<number | undefined>(undefined);
  const [ambientTemp, setAmbientTemp] = useState<number | undefined>(undefined);
  const [outdoorTemp, setOutdoorTemp] = useState<number | undefined>(undefined);

  // Oda boyutları değiştiğinde form'u güncelle
  useEffect(() => {
    form.setFieldsValue({
      roomDimensions,
      wallOrientations,
      uniformInsulation,
    });
  }, [roomDimensions, wallOrientations, uniformInsulation, form]);

  // İklim verilerini prop'tan al
  useEffect(() => {
    console.log('Climate data received in Transmission:', climateData);
    if (climateData?.maxTemp !== undefined) {
      console.log('Setting outdoor temp to:', climateData.maxTemp);
      setOutdoorTemp(climateData.maxTemp);
    }
  }, [climateData]);

  // Automatically recalculate loads when wallsData changes
  useEffect(() => {
    const newWallsData = wallsData.map(wall => {
      const calculated = calculateWallLoad(wall);
      return {
        ...wall,
        tdValue: calculated.tdValue,
        uValue: calculated.uValue,
        load: calculated.load
      };
    });
    
    // Only update if values have changed
    const hasChanged = newWallsData.some((newWall, index) => 
      newWall.load !== wallsData[index].load || 
      newWall.uValue !== wallsData[index].uValue ||
      newWall.tdValue !== wallsData[index].tdValue
    );
    
    if (hasChanged) {
      setWallsData(newWallsData);
    }
  }, [wallsData.map(w => `${w.width}_${w.height}_${w.insulationType}_${w.thickness}_${w.color}_${w.orientation}`).join(','), roomDimensions.location, insulationData, targetIndoorTemp, ambientTemp, outdoorTemp]);

  // Insulation types, thickness ve color değerlerini veritabanından çek
  useEffect(() => {
    const fetchInsulationData = async () => {
      try {
        const { data, error } = await supabase
          .from('insulation_types')
          .select('name, thickness, insulation_color, u_value, solar_absorptance')
          .eq('surface', 'wall')
          .order('name');

        if (error) throw error;

        if (data) {
          // Unique insulation types
          const uniqueTypes = [...new Set(data.map(item => item.name))];
          setInsulationTypes(uniqueTypes);

          // Her insulation type için thickness değerlerini grupla
          const thicknessMap = new Map<string, number[]>();
          const dataMap = new Map<string, any>();
          
          data.forEach(item => {
            const key = `${item.name}_${item.thickness}_${item.insulation_color}`;
            dataMap.set(key, {
              u_value: item.u_value,
              solar_absorptance: item.solar_absorptance || 0
            });
            
            if (!thicknessMap.has(item.name)) {
              thicknessMap.set(item.name, []);
            }
            if (item.thickness && !thicknessMap.get(item.name)?.includes(item.thickness)) {
              thicknessMap.get(item.name)?.push(item.thickness);
            }
          });

          // Thickness değerlerini sırala
          thicknessMap.forEach((values, key) => {
            values.sort((a, b) => a - b);
          });

          setThicknessOptions(thicknessMap);
          setInsulationData(dataMap);

          // Unique color değerlerini al
          const uniqueColors = [...new Set(data.map(item => item.insulation_color).filter(Boolean))];
          setColorOptions(uniqueColors);
        }
      } catch (error) {
        console.error('Error fetching insulation data:', error);
        message.error('İzolasyon verileri yüklenirken hata oluştu');
      }
    };

    fetchInsulationData();
  }, []);

  // Floor insulation types verileri
  useEffect(() => {
    const fetchFloorInsulationData = async () => {
      try {
        const { data, error } = await supabase
          .from('insulation_types')
          .select('name, thickness, insulation_color, u_value, solar_absorptance')
          .eq('surface', 'floor')
          .order('name');

        if (error) throw error;

        if (data) {
          // Unique insulation types for floor
          const uniqueTypes = [...new Set(data.map(item => item.name))];
          setFloorInsulationTypes(uniqueTypes);

          // Floor için thickness değerlerini grupla
          const thicknessMap = new Map<string, number[]>();
          const dataMap = new Map<string, any>();
          
          data.forEach(item => {
            const key = `${item.name}_${item.thickness}_${item.insulation_color}`;
            dataMap.set(key, {
              u_value: item.u_value,
              solar_absorptance: item.solar_absorptance || 0
            });
            
            if (!thicknessMap.has(item.name)) {
              thicknessMap.set(item.name, []);
            }
            if (item.thickness && !thicknessMap.get(item.name)?.includes(item.thickness)) {
              thicknessMap.get(item.name)?.push(item.thickness);
            }
          });

          // Thickness değerlerini sırala
          thicknessMap.forEach((values, key) => {
            values.sort((a, b) => a - b);
          });

          setFloorThicknessOptions(thicknessMap);
          setFloorInsulationData(dataMap);

          // Unique color değerlerini al
          const uniqueColors = [...new Set(data.map(item => item.insulation_color).filter(Boolean))];
          setFloorColorOptions(uniqueColors);
        }
      } catch (error) {
        console.error('Error fetching floor insulation data:', error);
        message.error('Zemin izolasyon verileri yüklenirken hata oluştu');
      }
    };

    fetchFloorInsulationData();
  }, []);

  // Orientation değişikliği
  const handleOrientationChange = (wall: string, value: string) => {
    setWallOrientations(prev => ({
      ...prev,
      [wall]: value
    }));
  };


  // Tek bir duvar için yük hesaplama fonksiyonu
  const calculateWallLoad = (wall: WallData) => {
    // Get insulation data for this wall
    const thickness = wall.thickness ? parseInt(wall.thickness.replace(' mm', '')) : 0;
    const key = `${wall.insulationType}_${thickness}_${wall.color}`;
    const insulationInfo = wall.type === 'floor' 
      ? floorInsulationData.get(key)
      : insulationData.get(key);
    
    // TD hesaplaması için sıcaklıkları kontrol et
    let tdValue = 0;
    
    if (roomDimensions.location === 'outside') {
      // Bina dışında - hedef iç sıcaklık vs dış hava sıcaklığı
      if (targetIndoorTemp !== undefined && outdoorTemp !== undefined) {
        tdValue = Math.abs(targetIndoorTemp - outdoorTemp);
      }
    } else {
      // Bina içerisinde - hedef iç sıcaklık vs çevre sıcaklığı
      if (targetIndoorTemp !== undefined && ambientTemp !== undefined) {
        tdValue = Math.abs(targetIndoorTemp - ambientTemp);
      }
    }
    
    // Eğer izolasyon bilgileri eksikse sadece yükü 0 yap, TD'yi değil
    if (!insulationInfo || !wall.width || !wall.height || !wall.insulationType || !wall.thickness || !wall.color) {
      return { uValue: 0, load: 0, tdValue: tdValue };
    }
    
    // Calculate area
    const area = wall.width * wall.height;
    
    // Debug için log ekleyelim
    console.log('TD Calculation Debug:', {
      location: roomDimensions.location,
      targetIndoorTemp,
      ambientTemp,
      outdoorTemp,
      calculatedTD: tdValue,
      insulationInfo: insulationInfo ? 'found' : 'not found',
      wallInfo: {
        insulationType: wall.insulationType,
        thickness: wall.thickness,
        color: wall.color
      }
    });
    
    // Base heat transfer calculation
    const baseLoad = insulationInfo.u_value * area * tdValue;
    
    let totalLoad = baseLoad;
    
    // Add solar radiation if room is outside building
    if (roomDimensions.location === 'outside' && wall.type === 'wall') {
      // Solar radiation factors based on orientation
      const solarFactors = {
        'north': 0.3,   // Less solar exposure
        'south': 1.0,   // Maximum solar exposure
        'east': 0.7,    // Morning sun
        'west': 0.7,    // Afternoon sun
        'internal': 0   // No solar exposure
      };
      
      const solarFactor = solarFactors[wall.orientation] || 0;
      const solarIntensity = 800; // W/m² (example solar intensity)
      const solarLoad = area * solarIntensity * insulationInfo.solar_absorptance * solarFactor;
      
      totalLoad += solarLoad;
    }
    
    return {
      tdValue: tdValue,
      uValue: insulationInfo.u_value,
      load: parseFloat(totalLoad.toFixed(2))
    };
  };

  // Kapı ekleme
  const addDoor = () => {
    const newDoor: DoorData = {
      id: `door${doorsData.length + 1}`,
      wall: '',
      doorType: '',
      quantity: 1,
      height: 0,
      width: 0,
      uValue: 0,
      load: 0
    };
    setDoorsData([...doorsData, newDoor]);
  };

  // Kapı silme
  const removeDoor = (doorId: string) => {
    setDoorsData(doorsData.filter(door => door.id !== doorId));
  };

  // Toplam yük hesaplama
  const totalWallLoad = wallsData.reduce((sum, wall) => sum + wall.load, 0);
  const totalDoorLoad = doorsData.reduce((sum, door) => sum + door.load, 0);

  // Tablo kolonları
  const wallColumns = [
    {
      title: <div style={{ textAlign: 'center' }}>Yüzey</div>,
      dataIndex: 'name',
      key: 'surface',
      render: (text: string, record: WallData) => {
        let displayText = '';
        if (record.type === 'wall') {
          const wallNumber = record.id.replace('wall', '');
          displayText = `Duvar ${wallNumber}`;
        } else if (record.type === 'roof') {
          displayText = 'Çatı';
        } else if (record.type === 'floor') {
          displayText = 'Zemin';
        } else {
          displayText = text;
        }
        return <div style={{ textAlign: 'center' }}>{displayText}</div>;
      },
      width: 100,
    },
    {
      title: <div style={{ textAlign: 'center' }}>Genişlik (m)</div>,
      dataIndex: 'width',
      key: 'width',
      width: 120,
      render: (value: number, record: WallData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <InputNumber
            value={value}
            min={0.1}
            step={0.1}
            style={{ width: '100%' }}
            onChange={(newValue) => {
              const newData = wallsData.map(item => 
                item.id === record.id ? { ...item, width: newValue || 0 } : item
              );
              setWallsData(newData);
            }}
          />
        </div>
      ),
    },
    {
      title: <div style={{ textAlign: 'center' }}>Yükseklik (m)</div>,
      dataIndex: 'height',
      key: 'height',
      width: 120,
      render: (value: number, record: WallData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <InputNumber
            value={value}
            min={0.1}
            step={0.1}
            style={{ width: '100%' }}
            onChange={(newValue) => {
              const newData = wallsData.map(item => 
                item.id === record.id ? { ...item, height: newValue || 0 } : item
              );
              setWallsData(newData);
            }}
          />
        </div>
      ),
    },
    {
      title: <div style={{ textAlign: 'center' }}>İzolasyon</div>,
      dataIndex: 'insulationType',
      key: 'insulationType',
      render: (text: string, record: WallData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Select
            value={text}
            style={{ width: 'auto', minWidth: '120px' }}
            dropdownMatchSelectWidth={false}
            onChange={(value) => {
              if (uniformInsulation && record.type !== 'floor') {
                // Tüm duvarlar ve çatı için aynı değeri uygula (zemin hariç)
                const newData = wallsData.map(item => 
                  item.type !== 'floor' ? { ...item, insulationType: value } : item
                );
                setWallsData(newData);
              } else {
                // Sadece seçili duvarı güncelle
                const newData = wallsData.map(item => 
                  item.id === record.id ? { ...item, insulationType: value } : item
                );
                setWallsData(newData);
              }
            }}
          >
            {record.type === 'floor' 
              ? floorInsulationTypes.map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))
              : insulationTypes.map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))
            }
          </Select>
        </div>
      ),
    },
    {
      title: <div style={{ textAlign: 'center' }}>İzolasyon Kalınlığı</div>,
      dataIndex: 'thickness',
      key: 'thickness',
      render: (text: string, record: WallData) => {
        // İlgili insulation type için thickness değerlerini al
        const availableThicknesses = record.type === 'floor' 
          ? floorThicknessOptions.get(record.insulationType) || []
          : thicknessOptions.get(record.insulationType) || [];
        
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Select
              value={text}
              style={{ width: 'auto', minWidth: '100px' }}
              dropdownMatchSelectWidth={false}
              onChange={(value) => {
              if (uniformInsulation && record.type !== 'floor') {
                // Tüm duvarlar ve çatı için aynı değeri uygula (zemin hariç)
                const newData = wallsData.map(item => 
                  item.type !== 'floor' ? { ...item, thickness: value } : item
                );
                setWallsData(newData);
              } else {
                // Sadece seçili duvarı güncelle
                const newData = wallsData.map(item => 
                  item.id === record.id ? { ...item, thickness: value } : item
                );
                setWallsData(newData);
              }
            }}
          >
            {availableThicknesses.map(thickness => (
              <Option key={thickness} value={`${thickness} mm`}>{thickness} mm</Option>
            ))}
            </Select>
          </div>
        );
      },
    },
    {
      title: <div style={{ textAlign: 'center' }}>İzolasyon Rengi</div>,
      dataIndex: 'color',
      key: 'color',
      render: (text: string, record: WallData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Select
            value={text}
            style={{ width: 'auto', minWidth: '100px' }}
            dropdownMatchSelectWidth={false}
            onChange={(value) => {
            if (uniformInsulation && record.type !== 'floor') {
              // Tüm duvarlar ve çatı için aynı değeri uygula (zemin hariç)
              const newData = wallsData.map(item => 
                item.type !== 'floor' ? { ...item, color: value } : item
              );
              setWallsData(newData);
            } else {
              // Sadece seçili duvarı güncelle
              const newData = wallsData.map(item => 
                item.id === record.id ? { ...item, color: value } : item
              );
              setWallsData(newData);
            }
          }}
        >
          {record.type === 'floor' 
            ? floorColorOptions.map(color => (
                <Option key={color} value={color}>{color}</Option>
              ))
            : colorOptions.map(color => (
                <Option key={color} value={color}>{color}</Option>
              ))
          }
          </Select>
        </div>
      ),
    },
    {
      title: <div style={{ textAlign: 'center' }}>Duvar Yönü</div>,
      dataIndex: 'orientation',
      key: 'orientation',
      render: (text: string, record: WallData) => (
        record.type === 'wall' ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Select
              value={text}
              style={{ width: 'auto', minWidth: '100px' }}
              dropdownMatchSelectWidth={false}
              onChange={(value) => {
                let newData = wallsData.map(item => 
                  item.id === record.id ? { ...item, orientation: value } : item
                );
              
              // Eğer bir duvar yönü belirlendiyse, diğer duvarları otomatik ayarla
              if (value !== 'internal' && record.type === 'wall') {
                const wallMap = {
                  'wall1': { 'north': { wall2: 'west', wall3: 'south', wall4: 'east' },
                             'south': { wall2: 'east', wall3: 'north', wall4: 'west' },
                             'east': { wall2: 'north', wall3: 'west', wall4: 'south' },
                             'west': { wall2: 'south', wall3: 'east', wall4: 'north' }
                  },
                  'wall2': { 'north': { wall1: 'east', wall3: 'west', wall4: 'south' },
                             'south': { wall1: 'west', wall3: 'east', wall4: 'north' },
                             'east': { wall1: 'south', wall3: 'north', wall4: 'west' },
                             'west': { wall1: 'north', wall3: 'south', wall4: 'east' }
                  },
                  'wall3': { 'north': { wall1: 'south', wall2: 'east', wall4: 'west' },
                             'south': { wall1: 'north', wall2: 'west', wall4: 'east' },
                             'east': { wall1: 'west', wall2: 'south', wall4: 'north' },
                             'west': { wall1: 'east', wall2: 'north', wall4: 'south' }
                  },
                  'wall4': { 'north': { wall1: 'west', wall2: 'south', wall3: 'east' },
                             'south': { wall1: 'east', wall2: 'north', wall3: 'west' },
                             'east': { wall1: 'north', wall2: 'west', wall3: 'south' },
                             'west': { wall1: 'south', wall2: 'east', wall3: 'north' }
                  }
                };
                
                const mappings = wallMap[record.id]?.[value];
                if (mappings) {
                  newData = newData.map(item => {
                    if (item.type === 'wall' && item.id !== record.id && mappings[item.id]) {
                      return { ...item, orientation: mappings[item.id] };
                    }
                    return item;
                  });
                }
              }
              
              setWallsData(newData);
            }}
          >
            {roomDimensions.location === 'inside' && (
              <Option value="internal">İç Duvar</Option>
            )}
            {roomDimensions.location === 'outside' && (
              <>
                <Option value="north">Kuzey</Option>
                <Option value="south">Güney</Option>
                <Option value="east">Doğu</Option>
                <Option value="west">Batı</Option>
              </>
            )}
            </Select>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>-</div>
        )
      ),
    },
    {
      title: <div style={{ textAlign: 'center' }}>TD (K)</div>,
      dataIndex: 'tdValue',
      key: 'tdValue',
      render: (value: number) => <div style={{ textAlign: 'center' }}>{value.toFixed(1)}</div>,
    },
    {
      title: <div style={{ textAlign: 'center' }}>U (Watt/m²-K)</div>,
      dataIndex: 'uValue',
      key: 'uValue',
      render: (value: number) => <div style={{ textAlign: 'center' }}>{value.toFixed(3)}</div>,
    },
    {
      title: <div style={{ textAlign: 'center' }}>Yük (Watt)</div>,
      dataIndex: 'load',
      key: 'load',
      render: (value: number) => (
        <div style={{ textAlign: 'center' }}>
          <span className="font-medium text-blue-600">{value.toFixed(2)}</span>
        </div>
      ),
    },
  ];

  // Kapı tablosu kolonları
  const doorColumns = [
    {
      title: <div style={{ textAlign: 'center' }}><span className="text-red-500">Wall *</span></div>,
      dataIndex: 'wall',
      key: 'wall',
      render: (text: string, record: DoorData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Select
            value={text}
            placeholder="[Please Select]"
            style={{ width: '100%' }}
            onChange={(value) => {
              const newData = doorsData.map(item => 
                item.id === record.id ? { ...item, wall: value } : item
              );
              setDoorsData(newData);
            }}
          >
            <Option value="Wall1">Wall1</Option>
            <Option value="Wall2">Wall2</Option>
            <Option value="Wall3">Wall3</Option>
            <Option value="Wall4">Wall4</Option>
          </Select>
        </div>
      ),
    },
    {
      title: <div style={{ textAlign: 'center' }}><span className="text-red-500">Door Type *</span></div>,
      dataIndex: 'doorType',
      key: 'doorType',
      render: (text: string, record: DoorData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Select
            value={text}
            placeholder="[Please Select]"
            style={{ width: '100%' }}
            onChange={(value) => {
              const newData = doorsData.map(item => 
                item.id === record.id ? { ...item, doorType: value } : item
              );
              setDoorsData(newData);
            }}
          >
            <Option value="Single Glass">Single Glass</Option>
            <Option value="Double Glass">Double Glass</Option>
            <Option value="Insulated">Insulated</Option>
            <Option value="Non-Glass">Non-Glass</Option>
          </Select>
        </div>
      ),
    },
    {
      title: <div style={{ textAlign: 'center' }}><span className="text-red-500">Quantity *</span></div>,
      dataIndex: 'quantity',
      key: 'quantity',
      render: (value: number, record: DoorData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <InputNumber
            value={value}
            min={1}
            style={{ width: '100%' }}
            onChange={(newValue) => {
              const newData = doorsData.map(item => 
                item.id === record.id ? { ...item, quantity: newValue || 1 } : item
              );
              setDoorsData(newData);
            }}
          />
        </div>
      ),
    },
    {
      title: <div style={{ textAlign: 'center' }}>Height (m)</div>,
      dataIndex: 'height',
      key: 'height',
      render: (value: number, record: DoorData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <InputNumber
            value={value}
            min={0}
            step={0.1}
            style={{ width: '100%' }}
            onChange={(newValue) => {
              const newData = doorsData.map(item => 
                item.id === record.id ? { ...item, height: newValue || 0 } : item
              );
              setDoorsData(newData);
            }}
          />
        </div>
      ),
    },
    {
      title: <div style={{ textAlign: 'center' }}>Width (m)</div>,
      dataIndex: 'width',
      key: 'width',
      render: (value: number, record: DoorData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <InputNumber
            value={value}
            min={0}
            step={0.1}
            style={{ width: '100%' }}
            onChange={(newValue) => {
              const newData = doorsData.map(item => 
                item.id === record.id ? { ...item, width: newValue || 0 } : item
              );
              setDoorsData(newData);
            }}
          />
        </div>
      ),
    },
    {
      title: <div style={{ textAlign: 'center' }}>U (Watt/m²-K)</div>,
      dataIndex: 'uValue',
      key: 'uValue',
      render: (value: number) => <div style={{ textAlign: 'center' }}>{value.toFixed(3)}</div>,
    },
    {
      title: <div style={{ textAlign: 'center' }}>Yük (Watt)</div>,
      dataIndex: 'load',
      key: 'load',
      render: (value: number) => (
        <div style={{ textAlign: 'center' }}>
          <span className="font-medium text-blue-600">{value.toFixed(2)}</span>
        </div>
      ),
    },
    {
      title: '',
      key: 'action',
      render: (_, record: DoorData) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeDoor(record.id)}
            disabled={doorsData.length === 1}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Duvarlar/Zemin/Tavan Kartı */}
      <Card
        title={
          <div className="flex items-center">
            <HomeOutlined className="text-blue-500 text-xl mr-2" />
            <span className="text-lg font-medium">Duvarlar/Zemin/Tavan</span>
          </div>
        }
        className="shadow-md hover:shadow-lg transition-shadow duration-300"
      >
        <div className="space-y-6">
          {/* Oda Boyutları */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center">
                <span className="text-base font-medium">Oda Tasarımı</span>
              </div>
              <Select
                placeholder="Lütfen Seçiniz"
                style={{ width: 200 }}
                value={selectedRoomType || undefined}
                onChange={(value) => {
                  setSelectedRoomType(value);
                }}
              >
                <Option value="rectangular">Dikdörtgen Oda</Option>
                <Option value="L">L Oda</Option>
                <Option value="T">T Oda</Option>
              </Select>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <span className="text-base font-medium">Oda Nerede</span>
              </div>
              <Select
                placeholder="Lütfen Seçiniz"
                style={{ width: 200 }}
                value={roomDimensions.location}
                onChange={(value) => {
                  setRoomDimensions({...roomDimensions, location: value});
                  
                  // Lokasyon değiştiğinde duvar yönlerini güncelle
                  if (value === 'inside') {
                    // Bina içerisine geçiliyorsa, tüm duvarları 'internal' yap
                    const newWallsData = wallsData.map(wall => 
                      wall.type === 'wall' ? { ...wall, orientation: 'internal' } : wall
                    );
                    setWallsData(newWallsData);
                  } else {
                    // Bina dışına geçiliyorsa, varsayılan yönleri ata
                    const newWallsData = wallsData.map((wall, index) => {
                      if (wall.type === 'wall') {
                        const defaultOrientations = ['north', 'west', 'south', 'east'];
                        return { ...wall, orientation: defaultOrientations[index] || 'north' };
                      }
                      return wall;
                    });
                    setWallsData(newWallsData);
                  }
                }}
              >
                <Option value="inside">Bina İçerisinde</Option>
                <Option value="outside">Bina Dışında</Option>
              </Select>
              
              {/* Sıcaklık alanları */}
              {roomDimensions.location === 'outside' && (
                <>
                  <div className="flex items-center">
                    <span className="text-base font-medium">Hedeflenen İç Sıcaklık</span>
                  </div>
                  <InputNumber
                    style={{ width: 120 }}
                    min={-50}
                    max={50}
                    step={1}
                    value={targetIndoorTemp}
                    onChange={(value) => setTargetIndoorTemp(value ?? undefined)}
                    placeholder="°C"
                    addonAfter="°C"
                  />
                  {outdoorTemp !== undefined ? (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">Dış Sıcaklık: {outdoorTemp.toFixed(1)}°C</span>
                    </div>
                  ) : climateData ? (
                    <div className="flex items-center">
                      <span className="text-sm text-yellow-600">⏳ İklim verileri işleniyor...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-sm text-red-600">⚠️ İklim verileri yüklenmedi</span>
                    </div>
                  )}
                </>
              )}
              
              {roomDimensions.location === 'inside' && (
                <>
                  <div className="flex items-center">
                    <span className="text-base font-medium">Hedeflenen İç Sıcaklık</span>
                  </div>
                  <InputNumber
                    style={{ width: 120 }}
                    min={-50}
                    max={50}
                    step={1}
                    value={targetIndoorTemp}
                    onChange={(value) => setTargetIndoorTemp(value ?? undefined)}
                    placeholder="°C"
                    addonAfter="°C"
                  />
                  <div className="flex items-center">
                    <span className="text-base font-medium">Çevre Sıcaklığı</span>
                  </div>
                  <InputNumber
                    style={{ width: 120 }}
                    min={-50}
                    max={50}
                    step={5}
                    value={ambientTemp}
                    onChange={(value) => setAmbientTemp(value ?? undefined)}
                    placeholder="°C"
                    addonAfter="°C"
                  />
                </>
              )}
            </div>
          </div>

          {/* 2D Oda Görseli */}
          {selectedRoomType && (
            <div className="flex flex-col items-center mb-6">
              {/* Konva ile 2D Oda Görseli */}
              <div className="flex items-center justify-center">
                <Stage width={600} height={350}>
                <Layer>
                  {/* Ana oda dikdörtgeni */}
                  <Rect
                    x={150}
                    y={75}
                    width={300}
                    height={200}
                    stroke="#0D9488"
                    strokeWidth={8}
                    fill="#F3F4F6"
                  />
                  
                  {/* Duvar etiketleri */}
                  {/* Wall 1 - Üst */}
                  <Group x={300} y={50}>
                    <Rect
                      x={-30}
                      y={-15}
                      width={60}
                      height={30}
                      fill="#0D9488"
                      cornerRadius={4}
                    />
                    <Text
                      x={-30}
                      y={-5}
                      width={60}
                      text="Duvar 1"
                      fill="white"
                      fontSize={14}
                      align="center"
                    />
                  </Group>
                  {/* Wall 1 boyut bilgisi */}
                  <Text
                    x={300}
                    y={19}
                    text={`${wallsData[0]?.width || 0}m x ${wallsData[0]?.height || 0}m`}
                    fontSize={12}
                    fill="#4B5563"
                    align="center"
                    offsetX={30}
                  />
                  
                  {/* Wall 2 - Sol */}
                  <Group x={110} y={175}>
                    <Rect
                      x={-30}
                      y={-15}
                      width={60}
                      height={30}
                      fill="#0D9488"
                      cornerRadius={4}
                    />
                    <Text
                      x={-30}
                      y={-5}
                      width={60}
                      text="Duvar 2"
                      fill="white"
                      fontSize={14}
                      align="center"
                    />
                  </Group>
                  {/* Wall 2 boyut bilgisi */}
                  <Text
                    x={110}
                    y={200}
                    text={`${wallsData[1]?.width || 0}m x ${wallsData[1]?.height || 0}m`}
                    fontSize={12}
                    fill="#4B5563"
                    align="center"
                    offsetX={30}
                  />
                  
                  {/* Wall 3 - Alt */}
                  <Group x={300} y={300}>
                    <Rect
                      x={-30}
                      y={-15}
                      width={60}
                      height={30}
                      fill="#0D9488"
                      cornerRadius={4}
                    />
                    <Text
                      x={-30}
                      y={-5}
                      width={60}
                      text="Duvar 3"
                      fill="white"
                      fontSize={14}
                      align="center"
                    />
                  </Group>
                  {/* Wall 3 boyut bilgisi */}
                  <Text
                    x={300}
                    y={325}
                    text={`${wallsData[2]?.width || 0}m x ${wallsData[2]?.height || 0}m`}
                    fontSize={12}
                    fill="#4B5563"
                    align="center"
                    offsetX={30}
                  />
                  
                  {/* Wall 4 - Sağ */}
                  <Group x={490} y={175}>
                    <Rect
                      x={-30}
                      y={-15}
                      width={60}
                      height={30}
                      fill="#0D9488"
                      cornerRadius={4}
                    />
                    <Text
                      x={-30}
                      y={-5}
                      width={60}
                      text="Duvar 4"
                      fill="white"
                      fontSize={14}
                      align="center"
                    />
                  </Group>
                  {/* Wall 4 boyut bilgisi */}
                  <Text
                    x={490}
                    y={200}
                    text={`${wallsData[3]?.width || 0}m x ${wallsData[3]?.height || 0}m`}
                    fontSize={12}
                    fill="#4B5563"
                    align="center"
                    offsetX={30}
                  />
                </Layer>
              </Stage>
            </div>
          </div>
          )}

          {/* Uniform Insulation Checkbox */}
          <div className="mb-4">
            <Checkbox
              checked={uniformInsulation}
              onChange={(e) => setUniformInsulation(e.target.checked)}
            >
              Tüm duvarlar ve çatı için aynı yalıtım kullan (zemin hariç)
            </Checkbox>
          </div>

          {/* Duvarlar/Zemin/Tavan Tablosu */}
          <Table
            dataSource={wallsData}
            columns={wallColumns}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1200 }}
            className="border border-gray-200"
            rowClassName={(record) => {
              if (record.type === 'wall') return 'bg-white';
              if (record.type === 'roof') return 'bg-blue-50';
              return 'bg-green-50';
            }}
          />

          {/* Toplam Yük */}
          <div className="flex justify-end">
            <div className="bg-gray-100 px-4 py-2 rounded">
              <span className="font-medium">Load (Watt): </span>
              <span className="text-blue-600 font-bold text-lg">{totalWallLoad.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Kapılar Kartı */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Doors</span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addDoor}
              className="bg-teal-600 hover:bg-teal-700 border-teal-600"
            >
              Add Door
            </Button>
          </div>
        }
        className="shadow-md hover:shadow-lg transition-shadow duration-300"
      >
        <div className="space-y-6">
          <Table
            dataSource={doorsData}
            columns={doorColumns}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1000 }}
            className="border border-gray-200"
          />

          {/* Kapılar için bilgi */}
          <Alert
            message={
              <div>
                <strong>Note :</strong> Non-Glass Door assumes that it uses the same insulation and thickness type as the chosen wall. 
                Hence, load is already included in the wall load calculation.
              </div>
            }
            type="info"
            showIcon
            className="border-l-4 border-l-teal-500"
          />

          {/* Kapı Toplam Yük */}
          <div className="flex justify-end">
            <div className="bg-gray-100 px-4 py-2 rounded">
              <span className="font-medium">Load (Watt): </span>
              <span className="text-red-600 font-bold text-lg">{totalDoorLoad.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

    </div>
  );
};

export default WallInsulation;