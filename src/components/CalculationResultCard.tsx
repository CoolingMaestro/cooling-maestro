import React from "react";
import { Card, Descriptions, Progress, Statistic, Row, Col, Divider } from "antd";
import { CalculationResult } from "../services/calculationService";

interface CalculationResultCardProps {
  calculationResult: CalculationResult;
}

const CalculationResultCard: React.FC<CalculationResultCardProps> = ({
  calculationResult,
}) => {
  // Yük bileşenlerini yüzde olarak hesapla
  const getPercentage = (value: number) => {
    return Math.round((value / calculationResult.totalCoolingLoad) * 100);
  };

  // Türkçe etiketler
  const labels = {
    transmissionLoad: "İletim Yükü",
    productLoad: "Ürün Yükü", 
    internalLoads: "İç Yükler",
    infiltrationLoad: "İnfiltrasyon Yükü",
    walls: "Duvarlar",
    ceiling: "Tavan",
    floor: "Zemin",
    doors: "Kapılar",
    sensibleHeat: "Duyulur Isı",
    latentHeat: "Gizli Isı",
    respirationHeat: "Solunum Isısı",
    lighting: "Aydınlatma",
    people: "İnsan",
    motors: "Motorlar",
    equipment: "Ekipman"
  };

  return (
    <div className="space-y-6">
      {/* Ana Sonuç Kartı */}
      <Card
        title={
          <div className="flex items-center">
            <i className="fas fa-chart-pie mr-2 text-blue-600"></i>
            <span className="text-xl font-semibold">Hesaplama Sonuçları</span>
          </div>
        }
        className="shadow-md hover:shadow-lg transition-shadow duration-300"
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12} className="text-center">
            <Statistic
              title="Toplam Soğutma Yükü (Güvenlik Faktörü Dahil)"
              value={calculationResult.finalCoolingLoad}
              suffix="W"
              precision={0}
              valueStyle={{ color: '#1890ff', fontSize: '32px' }}
            />
            <p className="text-gray-500 mt-2">
              Güvenlik Faktörü: %{((calculationResult.safetyFactor - 1) * 100).toFixed(0)}
            </p>
          </Col>
          <Col xs={24} md={12} className="text-center">
            <Statistic
              title="Toplam Soğutma Yükü (Ham)"
              value={calculationResult.totalCoolingLoad}
              suffix="W"
              precision={0}
              valueStyle={{ fontSize: '28px' }}
            />
            <p className="text-gray-500 mt-2">Güvenlik faktörü uygulanmamış</p>
          </Col>
        </Row>
      </Card>

      {/* Yük Dağılımı */}
      <Card
        title="Soğutma Yükü Dağılımı"
        className="shadow-md hover:shadow-lg transition-shadow duration-300"
      >
        <div className="space-y-4">
          {Object.entries(calculationResult.breakdown).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="font-medium">{labels[key as keyof typeof labels]}</span>
                <span>{value.toLocaleString()} W ({getPercentage(value)}%)</span>
              </div>
              <Progress
                percent={getPercentage(value)}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                showInfo={false}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Detaylı Analiz */}
      <Row gutter={[16, 16]}>
        {/* İletim Yükü Detayları */}
        <Col xs={24} md={12}>
          <Card
            title="İletim Yükü Detayları"
            size="small"
            className="shadow-md"
          >
            <Descriptions column={1} size="small" bordered>
              {Object.entries(calculationResult.details.transmission).map(([key, value]) => (
                <Descriptions.Item key={key} label={labels[key as keyof typeof labels] || key}>
                  {value.toLocaleString()} W
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        </Col>

        {/* Ürün Yükü Detayları */}
        <Col xs={24} md={12}>
          <Card
            title="Ürün Yükü Detayları"
            size="small"
            className="shadow-md"
          >
            <Descriptions column={1} size="small" bordered>
              {Object.entries(calculationResult.details.product).map(([key, value]) => (
                <Descriptions.Item key={key} label={labels[key as keyof typeof labels] || key}>
                  {value.toLocaleString()} W
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        </Col>

        {/* İç Yükler Detayları */}
        <Col xs={24} md={12}>
          <Card
            title="İç Yükler Detayları"
            size="small"
            className="shadow-md"
          >
            <Descriptions column={1} size="small" bordered>
              {Object.entries(calculationResult.details.internal).map(([key, value]) => (
                <Descriptions.Item key={key} label={labels[key as keyof typeof labels] || key}>
                  {value.toLocaleString()} W
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        </Col>

        {/* İnfiltrasyon Detayları */}
        <Col xs={24} md={12}>
          <Card
            title="İnfiltrasyon Detayları"
            size="small"
            className="shadow-md"
          >
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Hava Değişim Oranı">
                {calculationResult.details.infiltration.airChangeRate.toFixed(2)} /saat
              </Descriptions.Item>
              <Descriptions.Item label="İnfiltrasyon Yükü">
                {calculationResult.details.infiltration.load.toLocaleString()} W
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Öneriler */}
      <Card
        title="Sistem Önerileri"
        className="shadow-md hover:shadow-lg transition-shadow duration-300"
      >
        <div className="space-y-3">
          <div className="flex items-start">
            <i className="fas fa-snowflake text-blue-500 mt-1 mr-3"></i>
            <div>
              <p className="font-semibold">Önerilen Soğutma Kapasitesi</p>
              <p className="text-gray-600">
                Minimum {Math.ceil(calculationResult.finalCoolingLoad / 1000)} kW kapasiteli soğutma sistemi önerilir.
              </p>
            </div>
          </div>
          
          {calculationResult.breakdown.infiltrationLoad > calculationResult.totalCoolingLoad * 0.3 && (
            <div className="flex items-start">
              <i className="fas fa-door-open text-yellow-500 mt-1 mr-3"></i>
              <div>
                <p className="font-semibold">Yüksek İnfiltrasyon Yükü</p>
                <p className="text-gray-600">
                  İnfiltrasyon yükü toplam yükün %{getPercentage(calculationResult.breakdown.infiltrationLoad)}
                  'ını oluşturuyor. Hava perdesi veya ön oda kullanımı önerilir.
                </p>
              </div>
            </div>
          )}
          
          {calculationResult.breakdown.transmissionLoad > calculationResult.totalCoolingLoad * 0.4 && (
            <div className="flex items-start">
              <i className="fas fa-home text-orange-500 mt-1 mr-3"></i>
              <div>
                <p className="font-semibold">Yüksek İletim Yükü</p>
                <p className="text-gray-600">
                  İletim yükü toplam yükün %{getPercentage(calculationResult.breakdown.transmissionLoad)}
                  'ını oluşturuyor. Daha iyi yalıtım malzemeleri kullanılması önerilir.
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-start">
            <i className="fas fa-chart-line text-green-500 mt-1 mr-3"></i>
            <div>
              <p className="font-semibold">Enerji Verimliliği</p>
              <p className="text-gray-600">
                Inverter teknolojili ve yüksek COP değerine sahip sistemler tercih edilmelidir.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CalculationResultCard;