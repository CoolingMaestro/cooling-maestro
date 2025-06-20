import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Box, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

interface Room3DProps {
  roomType?: 'rectangle' | 'L' | 'T';
  width?: number;
  depth?: number;
  height?: number;
  lWidth?: number;
  lDepth?: number;
  tWidth?: number;
  tDepth?: number;
  wallInsulation?: {[key: string]: { type: string; uValue: number } | null};
  wallDoors?: {[key: string]: boolean | { enabled: boolean; width?: number; height?: number; type?: string }};
}

export interface Room3DHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetRotation: () => void;
  focusOnWall: (wallNumber: number) => void;
}

const Room: React.FC<{ 
  roomType: string; 
  width: number; 
  depth: number; 
  height: number;
  lWidth?: number;
  lDepth?: number;
  tWidth?: number;
  tDepth?: number;
  wallInsulation?: {[key: string]: { type: string; uValue: number } | null};
  wallDoors?: {[key: string]: boolean | { enabled: boolean; width?: number; height?: number; type?: string }};
}> = ({ 
  roomType, 
  width, 
  depth, 
  height,
  lWidth = 4,
  lDepth = 3,
  tWidth = 4,
  tDepth = 3,
  wallInsulation = {},
  wallDoors = {}
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredWall, setHoveredWall] = useState<string | null>(null);
  
  // Helper function to check if door is enabled
  const isDoorEnabled = (wall: string): boolean => {
    const door = wallDoors[wall];
    return typeof door === 'boolean' ? door : door?.enabled || false;
  };
  
  // Helper function to get door dimensions
  const getDoorDimensions = (wall: string) => {
    const door = wallDoors[wall];
    if (typeof door === 'boolean') {
      return { width: 1.0, height: 2.1 };
    }
    const dimensions = { width: door?.width || 1.0, height: door?.height || 2.1 };
    // console.log(`Door dimensions for ${wall}:`, dimensions);
    return dimensions;
  };

  // Otomatik dönme kapatıldı
  // useFrame((state, delta) => {
  //   if (groupRef.current) {
  //     groupRef.current.rotation.y += delta * 0.1;
  //   }
  // });

  const wallThickness = 0.2;

  // L tipi oda render fonksiyonu
  const renderLRoom = () => {
    // L kolunun pozisyon hesaplamaları
    const lStartX = width/2; // L kolunun başlangıç X pozisyonu
    const lStartZ = depth/2 - lDepth; // L kolunun başlangıç Z pozisyonu
    
    return (
      <>
        {/* Ana zemin */}
        <Box args={[width + wallThickness, 0.1, depth + wallThickness]} position={[0, -height/2, 0]}>
          <meshStandardMaterial color="#8B7355" side={THREE.DoubleSide} />
        </Box>
        {/* L kol zemin */}
        <Box args={[lWidth + wallThickness, 0.1, lDepth + wallThickness]} position={[lStartX + lWidth/2, -height/2, lStartZ + lDepth/2]}>
          <meshStandardMaterial color="#8B7355" side={THREE.DoubleSide} />
        </Box>

        {/* Ana tavan */}
        <Box args={[width + wallThickness, 0.1, depth + wallThickness]} position={[0, height/2, 0]}>
          <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
        </Box>
        {/* L kol tavan */}
        <Box args={[lWidth + wallThickness, 0.1, lDepth + wallThickness]} position={[lStartX + lWidth/2, height/2, lStartZ + lDepth/2]}>
          <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
        </Box>

        {/* DUVAR 1 - Ana Bölüm Ön */}
        {/* Duvar 1 etiketi */}
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
          position={[0, height/2 + 0.5, depth/2 + wallThickness + 0.3]}
        >
          <Text
            fontSize={0.8}
            color="#1a73e8"
            anchorX="center"
            anchorY="middle"
          >
            1
          </Text>
        </Billboard>
        
        <Box 
          args={[width + wallThickness, height, wallThickness]} 
          position={[0, 0, depth/2 + wallThickness/2]}
          onPointerOver={() => setHoveredWall('wall1')}
          onPointerOut={() => setHoveredWall(null)}
        >
          <meshStandardMaterial 
            color={hoveredWall === 'wall1' ? "#6BA3F5" : "#4A90E2"} 
            transparent 
            opacity={0.6} 
            side={THREE.DoubleSide} 
            depthWrite={false} 
          />
        </Box>
        
        {/* DUVAR 2 - Ana Bölüm Sağ (üst parça) */}
        {/* Duvar 2 etiketi */}
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
          position={[width/2 + wallThickness + 0.3, height/2 + 0.5, depth/4 - lDepth/2]}
        >
          <Text
            fontSize={0.8}
            color="#1a73e8"
            anchorX="center"
            anchorY="middle"
          >
            2
          </Text>
        </Billboard>
        
        <Box 
          args={[wallThickness, height, depth/2 - lDepth + wallThickness]} 
          position={[width/2 + wallThickness/2, 0, (depth/4 - lDepth/2 + wallThickness/2)]}
          onPointerOver={() => setHoveredWall('wall2')}
          onPointerOut={() => setHoveredWall(null)}
        >
          <meshStandardMaterial 
            color={hoveredWall === 'wall2' ? "#6BA3F5" : "#5BA3F5"} 
            transparent 
            opacity={0.6} 
            side={THREE.DoubleSide} 
            depthWrite={false} 
          />
        </Box>

        {/* DUVAR 3 - L Kolu Arka */}
        {/* Duvar 3 etiketi */}
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
          position={[lStartX + lWidth/2, height/2 + 0.5, lStartZ - wallThickness - 0.3]}
        >
          <Text
            fontSize={0.8}
            color="#1a73e8"
            anchorX="center"
            anchorY="middle"
          >
            3
          </Text>
        </Billboard>
        
        <Box 
          args={[lWidth + wallThickness, height, wallThickness]} 
          position={[lStartX + lWidth/2, 0, lStartZ - wallThickness/2]}
          onPointerOver={() => setHoveredWall('wall3')}
          onPointerOut={() => setHoveredWall(null)}
        >
          <meshStandardMaterial 
            color={hoveredWall === 'wall3' ? "#6BA3F5" : "#4A90E2"} 
            transparent 
            opacity={0.6} 
            side={THREE.DoubleSide} 
            depthWrite={false} 
          />
        </Box>
        
        {/* DUVAR 4 - L Kolu Sağ */}
        {/* Duvar 4 etiketi */}
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
          position={[lStartX + lWidth + wallThickness + 0.3, height/2 + 0.5, lStartZ + lDepth/2]}
        >
          <Text
            fontSize={0.8}
            color="#1a73e8"
            anchorX="center"
            anchorY="middle"
          >
            4
          </Text>
        </Billboard>
        
        <Box 
          args={[wallThickness, height, lDepth + wallThickness]} 
          position={[lStartX + lWidth + wallThickness/2, 0, lStartZ + lDepth/2]}
          onPointerOver={() => setHoveredWall('wall4')}
          onPointerOut={() => setHoveredWall(null)}
        >
          <meshStandardMaterial 
            color={hoveredWall === 'wall4' ? "#6BA3F5" : "#5BA3F5"} 
            transparent 
            opacity={0.6} 
            side={THREE.DoubleSide} 
            depthWrite={false} 
          />
        </Box>
        
        {/* DUVAR 5 - L Kolu Ön */}
        {/* Duvar 5 etiketi */}
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
          position={[lStartX + lWidth/2, height/2 + 0.5, lStartZ + lDepth + wallThickness + 0.3]}
        >
          <Text
            fontSize={0.8}
            color="#1a73e8"
            anchorX="center"
            anchorY="middle"
          >
            5
          </Text>
        </Billboard>
        
        <Box 
          args={[lWidth + wallThickness, height, wallThickness]} 
          position={[lStartX + lWidth/2, 0, lStartZ + lDepth + wallThickness/2]}
          onPointerOver={() => setHoveredWall('wall5')}
          onPointerOut={() => setHoveredWall(null)}
        >
          <meshStandardMaterial 
            color={hoveredWall === 'wall5' ? "#6BA3F5" : "#4A90E2"} 
            transparent 
            opacity={0.6} 
            side={THREE.DoubleSide} 
            depthWrite={false} 
          />
        </Box>
        
        {/* DUVAR 6 - Bağlantı Duvarı */}
        {/* Duvar 6 etiketi */}
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
          position={[width/2 + wallThickness + 0.3, height/2 + 0.5, lStartZ + lDepth/2]}
        >
          <Text
            fontSize={0.8}
            color="#1a73e8"
            anchorX="center"
            anchorY="middle"
          >
            6
          </Text>
        </Billboard>
        
        <Box 
          args={[wallThickness, height, lDepth]} 
          position={[width/2 + wallThickness/2, 0, lStartZ + lDepth/2]}
          onPointerOver={() => setHoveredWall('wall6')}
          onPointerOut={() => setHoveredWall(null)}
        >
          <meshStandardMaterial 
            color={hoveredWall === 'wall6' ? "#6BA3F5" : "#5BA3F5"} 
            transparent 
            opacity={0.6} 
            side={THREE.DoubleSide} 
            depthWrite={false} 
          />
        </Box>
        
        {/* Duvar 7 - Ana dikdörtgen arka duvar (kısmi) */}
        <Box 
          args={[width/2 - wallThickness/2, height, wallThickness]} 
          position={[-width/4 + wallThickness/4, 0, -depth/2 - wallThickness/2]}
          onPointerOver={() => setHoveredWall('wall7')}
          onPointerOut={() => setHoveredWall(null)}
        >
          <meshStandardMaterial 
            color={hoveredWall === 'wall7' ? "#6BA3F5" : "#4A90E2"} 
            transparent 
            opacity={0.6} 
            side={THREE.DoubleSide} 
            depthWrite={false} 
          />
        </Box>
        
        {/* Duvar 7 Etiketi */}
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
          position={[-width/4 + wallThickness/4, height/2 + 0.5, -depth/2 - wallThickness - 0.3]}
        >
          <Text
            fontSize={0.8}
            color="#1a73e8"
            anchorX="center"
            anchorY="middle"
          >
            7
          </Text>
        </Billboard>
        
        {/* Duvar 8 - Ana dikdörtgen sol duvar */}
        <Box 
          args={[wallThickness, height, depth + wallThickness]} 
          position={[-width/2 - wallThickness/2, 0, 0]}
          onPointerOver={() => setHoveredWall('wall8')}
          onPointerOut={() => setHoveredWall(null)}
        >
          <meshStandardMaterial 
            color={hoveredWall === 'wall8' ? "#6BA3F5" : "#5BA3F5"} 
            transparent 
            opacity={0.6} 
            side={THREE.DoubleSide} 
            depthWrite={false} 
          />
        </Box>
        
        {/* Duvar 8 Etiketi */}
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
          position={[-width/2 - wallThickness - 0.3, height/2 + 0.5, 0]}
        >
          <Text
            fontSize={0.8}
            color="#1a73e8"
            anchorX="center"
            anchorY="middle"
          >
            8
          </Text>
        </Billboard>
      </>
    );
  };

  // T tipi oda render fonksiyonu
  const renderTRoom = () => (
    <>
      {/* Ana zemin */}
      <Box args={[width, 0.1, depth]} position={[0, -height/2, 0]}>
        <meshStandardMaterial color="#8B7355" side={THREE.DoubleSide} />
      </Box>
      {/* T kol zemin */}
      <Box args={[tWidth, 0.1, tDepth]} position={[0, -height/2, -depth/2 - tDepth/2 + wallThickness/2]}>
        <meshStandardMaterial color="#8B7355" side={THREE.DoubleSide} />
      </Box>

      {/* Ana tavan */}
      <Box args={[width, 0.1, depth]} position={[0, height/2, 0]}>
        <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
      </Box>
      {/* T kol tavan */}
      <Box args={[tWidth, 0.1, tDepth]} position={[0, height/2, -depth/2 - tDepth/2 + wallThickness/2]}>
        <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
      </Box>

      {/* T odası duvarları */}
      {/* Ana dikdörtgen arka duvar (T kol bağlantısı için kısmi) */}
      <Box args={[(width - tWidth)/2, height, wallThickness]} position={[-(width/4 + tWidth/4), 0, -depth/2]}>
        <meshStandardMaterial color="#4A90E2" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </Box>
      <Box args={[(width - tWidth)/2, height, wallThickness]} position={[(width/4 + tWidth/4), 0, -depth/2]}>
        <meshStandardMaterial color="#4A90E2" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </Box>
      {/* Ana dikdörtgen ön duvar */}
      <Box args={[width, height, wallThickness]} position={[0, 0, depth/2]}>
        <meshStandardMaterial color="#4A90E2" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </Box>
      {/* Ana dikdörtgen sol duvar */}
      <Box args={[wallThickness, height, depth]} position={[-width/2, 0, 0]}>
        <meshStandardMaterial color="#5BA3F5" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </Box>
      {/* Ana dikdörtgen sağ duvar */}
      <Box args={[wallThickness, height, depth]} position={[width/2, 0, 0]}>
        <meshStandardMaterial color="#5BA3F5" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </Box>

      {/* T kol duvarları */}
      {/* T kol arka duvar */}
      <Box args={[tWidth, height, wallThickness]} position={[0, 0, -depth/2 - tDepth + wallThickness]}>
        <meshStandardMaterial color="#4A90E2" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </Box>
      {/* T kol sol duvar */}
      <Box args={[wallThickness, height, tDepth]} position={[-tWidth/2, 0, -depth/2 - tDepth/2 + wallThickness/2]}>
        <meshStandardMaterial color="#5BA3F5" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </Box>
      {/* T kol sağ duvar */}
      <Box args={[wallThickness, height, tDepth]} position={[tWidth/2, 0, -depth/2 - tDepth/2 + wallThickness/2]}>
        <meshStandardMaterial color="#5BA3F5" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </Box>
    </>
  );

  // Dikdörtgen oda render fonksiyonu
  const renderRectangleRoom = () => (
    <>
      {/* Zemin */}
      <Box args={[width + wallThickness, 0.1, depth + wallThickness]} position={[0, -height/2, 0]}>
        <meshStandardMaterial color="#8B7355" side={THREE.DoubleSide} />
      </Box>

      {/* Tavan */}
      <Box args={[width + wallThickness, 0.1, depth + wallThickness]} position={[0, height/2, 0]}>
        <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
      </Box>

      {/* Duvar 3 etiketi */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[0, height/2 + 0.5, -depth/2 - wallThickness - 0.3]}
      >
        <Text
          fontSize={0.8}
          color="#1a73e8"
          anchorX="center"
          anchorY="middle"
        >
          3
        </Text>
      </Billboard>

      {/* Arka duvar (Duvar 3) */}
      {isDoorEnabled('wall3') ? (
        <>
          {/* Kapılı duvar - Sol parça */}
          <Box 
            args={[(width - getDoorDimensions('wall3').width) / 2, height, wallThickness]} 
            position={[-(width/4 + getDoorDimensions('wall3').width/4), 0, -depth/2 - wallThickness/2]}
            onPointerOver={() => setHoveredWall('wall3')}
            onPointerOut={() => setHoveredWall(null)}
          >
            <meshStandardMaterial 
              color={hoveredWall === 'wall3' ? "#6BA3F5" : "#4A90E2"} 
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </Box>

          {/* Kapılı duvar - Sağ parça */}
          <Box 
            args={[(width - getDoorDimensions('wall3').width) / 2, height, wallThickness]} 
            position={[(width/4 + getDoorDimensions('wall3').width/4), 0, -depth/2 - wallThickness/2]}
            onPointerOver={() => setHoveredWall('wall3')}
            onPointerOut={() => setHoveredWall(null)}
          >
            <meshStandardMaterial 
              color={hoveredWall === 'wall3' ? "#6BA3F5" : "#4A90E2"} 
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </Box>

          {/* Kapılı duvar - Kapı üstü */}
          <Box 
            args={[getDoorDimensions('wall3').width, height - getDoorDimensions('wall3').height, wallThickness]} 
            position={[0, height/2 - (height - getDoorDimensions('wall3').height)/2, -depth/2 - wallThickness/2]}
            onPointerOver={() => setHoveredWall('wall3')}
            onPointerOut={() => setHoveredWall(null)}
          >
            <meshStandardMaterial 
              color={hoveredWall === 'wall3' ? "#6BA3F5" : "#4A90E2"} 
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </Box>

          {/* Kapı paneli */}
          <Box 
            args={[getDoorDimensions('wall3').width - 0.1, getDoorDimensions('wall3').height - 0.1, wallThickness * 0.8]} 
            position={[0, -height/2 + getDoorDimensions('wall3').height/2, -depth/2 - wallThickness/4]}
          >
            <meshStandardMaterial color="#FFFFFF" opacity={0.95} transparent side={THREE.DoubleSide} />
          </Box>

          {/* Kapı çerçevesi */}
          <Box 
            args={[0.1, getDoorDimensions('wall3').height, 0.3]} 
            position={[-getDoorDimensions('wall3').width/2, -height/2 + getDoorDimensions('wall3').height/2, -depth/2 - wallThickness/2]}
          >
            <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
          </Box>
          <Box 
            args={[0.1, getDoorDimensions('wall3').height, 0.3]} 
            position={[getDoorDimensions('wall3').width/2, -height/2 + getDoorDimensions('wall3').height/2, -depth/2 - wallThickness/2]}
          >
            <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
          </Box>
          <Box 
            args={[getDoorDimensions('wall3').width, 0.1, 0.3]} 
            position={[0, -height/2 + getDoorDimensions('wall3').height, -depth/2 - wallThickness/2]}
          >
            <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
          </Box>
        </>
      ) : (
        /* Kapısız tam duvar */
        <Box 
          args={[width + wallThickness, height, wallThickness]} 
          position={[0, 0, -depth/2 - wallThickness/2]}
          onPointerOver={() => setHoveredWall('wall3')}
          onPointerOut={() => setHoveredWall(null)}
        >
          <meshStandardMaterial 
            color={hoveredWall === 'wall3' ? "#6BA3F5" : "#4A90E2"} 
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </Box>
      )}

      {/* Duvar 1 etiketi */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[0, height/2 + 0.5, depth/2 + wallThickness + 0.3]}
      >
        <Text
          fontSize={0.8}
          color="#1a73e8"
          anchorX="center"
          anchorY="middle"
        >
          1
        </Text>
      </Billboard>

      {/* Ön duvar */}
      {isDoorEnabled('wall1') ? (
        <>
          {/* Kapılı duvar - Sol parça */}
          <Box 
            args={[(width - getDoorDimensions('wall1').width) / 2, height, wallThickness]} 
            position={[-(width/4 + getDoorDimensions('wall1').width/4), 0, depth/2 + wallThickness/2]}
            onPointerOver={() => setHoveredWall('wall1')}
            onPointerOut={() => setHoveredWall(null)}
          >
            <meshStandardMaterial 
              color={hoveredWall === 'wall1' ? "#6BA3F5" : "#4A90E2"} 
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </Box>

          {/* Kapılı duvar - Sağ parça */}
          <Box 
            args={[(width - getDoorDimensions('wall1').width) / 2, height, wallThickness]} 
            position={[(width/4 + getDoorDimensions('wall1').width/4), 0, depth/2 + wallThickness/2]}
            onPointerOver={() => setHoveredWall('wall1')}
            onPointerOut={() => setHoveredWall(null)}
          >
            <meshStandardMaterial 
              color={hoveredWall === 'wall1' ? "#6BA3F5" : "#4A90E2"} 
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </Box>

          {/* Kapılı duvar - Kapı üstü */}
          <Box 
            args={[getDoorDimensions('wall1').width, height - getDoorDimensions('wall1').height, wallThickness]} 
            position={[0, height/2 - (height - getDoorDimensions('wall1').height)/2, depth/2 + wallThickness/2]}
            onPointerOver={() => setHoveredWall('wall1')}
            onPointerOut={() => setHoveredWall(null)}
          >
            <meshStandardMaterial 
              color={hoveredWall === 'wall1' ? "#6BA3F5" : "#4A90E2"} 
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </Box>

          {/* Kapı paneli */}
          <Box 
            args={[getDoorDimensions('wall1').width - 0.1, getDoorDimensions('wall1').height - 0.1, wallThickness * 0.8]} 
            position={[0, -height/2 + getDoorDimensions('wall1').height/2, depth/2 + wallThickness/4]}
          >
            <meshStandardMaterial color="#FFFFFF" opacity={0.9} transparent side={THREE.DoubleSide} />
          </Box>

          {/* Kapı çerçevesi */}
          <Box 
            args={[0.1, getDoorDimensions('wall1').height, 0.3]} 
            position={[-getDoorDimensions('wall1').width/2, -height/2 + getDoorDimensions('wall1').height/2, depth/2 + wallThickness/2]}
          >
            <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
          </Box>
          <Box 
            args={[0.1, getDoorDimensions('wall1').height, 0.3]} 
            position={[getDoorDimensions('wall1').width/2, -height/2 + getDoorDimensions('wall1').height/2, depth/2 + wallThickness/2]}
          >
            <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
          </Box>
          <Box 
            args={[getDoorDimensions('wall1').width, 0.1, 0.3]} 
            position={[0, -height/2 + getDoorDimensions('wall1').height, depth/2 + wallThickness/2]}
          >
            <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
          </Box>
        </>
      ) : (
        /* Kapısız tam duvar */
        <Box 
          args={[width + wallThickness, height, wallThickness]} 
          position={[0, 0, depth/2 + wallThickness/2]}
          onPointerOver={() => setHoveredWall('wall1')}
          onPointerOut={() => setHoveredWall(null)}
        >
          <meshStandardMaterial 
            color={hoveredWall === 'wall1' ? "#6BA3F5" : "#4A90E2"} 
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </Box>
      )}

      {/* Duvar 4 etiketi */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[-width/2 - wallThickness - 0.3, height/2 + 0.5, 0]}
      >
        <Text
          fontSize={0.8}
          color="#1a73e8"
          anchorX="center"
          anchorY="middle"
        >
          4
        </Text>
      </Billboard>

      {/* Sol duvar (Duvar 4) */}
      {isDoorEnabled('wall4') ? (
        <>
          {/* Kapılı duvar - Ön parça */}
          <Box 
            args={[wallThickness, height, (depth - getDoorDimensions('wall4').width) / 2]} 
            position={[-width/2 - wallThickness/2, 0, -(depth/4 + getDoorDimensions('wall4').width/4)]}
            onPointerOver={() => setHoveredWall('wall4')}
            onPointerOut={() => setHoveredWall(null)}
          >
            <meshStandardMaterial 
              color={hoveredWall === 'wall4' ? "#7BB4F5" : "#5BA3F5"} 
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </Box>

          {/* Kapılı duvar - Arka parça */}
          <Box 
            args={[wallThickness, height, (depth - getDoorDimensions('wall4').width) / 2]} 
            position={[-width/2 - wallThickness/2, 0, (depth/4 + getDoorDimensions('wall4').width/4)]}
            onPointerOver={() => setHoveredWall('wall4')}
            onPointerOut={() => setHoveredWall(null)}
          >
            <meshStandardMaterial 
              color={hoveredWall === 'wall4' ? "#7BB4F5" : "#5BA3F5"} 
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </Box>

          {/* Kapılı duvar - Kapı üstü */}
          <Box 
            args={[wallThickness, height - getDoorDimensions('wall4').height, getDoorDimensions('wall4').width]} 
            position={[-width/2 - wallThickness/2, height/2 - (height - getDoorDimensions('wall4').height)/2, 0]}
            onPointerOver={() => setHoveredWall('wall4')}
            onPointerOut={() => setHoveredWall(null)}
          >
            <meshStandardMaterial 
              color={hoveredWall === 'wall4' ? "#7BB4F5" : "#5BA3F5"} 
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </Box>

          {/* Kapı paneli */}
          <Box 
            args={[wallThickness * 0.8, getDoorDimensions('wall4').height - 0.1, getDoorDimensions('wall4').width - 0.1]} 
            position={[-width/2 - wallThickness/4, -height/2 + getDoorDimensions('wall4').height/2, 0]}
          >
            <meshStandardMaterial color="#FFFFFF" opacity={0.9} transparent side={THREE.DoubleSide} />
          </Box>

          {/* Kapı çerçevesi */}
          <Box 
            args={[0.3, getDoorDimensions('wall4').height, 0.1]} 
            position={[-width/2 - wallThickness/2, -height/2 + getDoorDimensions('wall4').height/2, -getDoorDimensions('wall4').width/2]}
          >
            <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
          </Box>
          <Box 
            args={[0.3, getDoorDimensions('wall4').height, 0.1]} 
            position={[-width/2 - wallThickness/2, -height/2 + getDoorDimensions('wall4').height/2, getDoorDimensions('wall4').width/2]}
          >
            <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
          </Box>
          <Box 
            args={[0.3, 0.1, getDoorDimensions('wall4').width]} 
            position={[-width/2 - wallThickness/2, -height/2 + getDoorDimensions('wall4').height, 0]}
          >
            <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
          </Box>
        </>
      ) : (
        /* Kapısız tam duvar */
        <Box 
          args={[wallThickness, height, depth + wallThickness]} 
          position={[-width/2 - wallThickness/2, 0, 0]}
          onPointerOver={() => setHoveredWall('wall4')}
          onPointerOut={() => setHoveredWall(null)}
        >
          <meshStandardMaterial 
            color={hoveredWall === 'wall4' ? "#7BB4F5" : "#5BA3F5"} 
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </Box>
      )}

      {/* Duvar 2 etiketi */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[width/2 + wallThickness + 0.3, height/2 + 0.5, 0]}
      >
        <Text
          fontSize={0.8}
          color="#1a73e8"
          anchorX="center"
          anchorY="middle"
        >
          2
        </Text>
      </Billboard>

      {/* Sağ duvar (Duvar 2) */}
      {isDoorEnabled('wall2') ? (
        <>
          {/* Kapılı duvar - Ön parça */}
          <Box 
            args={[wallThickness, height, (depth - getDoorDimensions('wall2').width) / 2]} 
            position={[width/2 + wallThickness/2, 0, -(depth/4 + getDoorDimensions('wall2').width/4)]}
            onPointerOver={() => setHoveredWall('wall2')}
            onPointerOut={() => setHoveredWall(null)}
          >
            <meshStandardMaterial 
              color={hoveredWall === 'wall2' ? "#7BB4F5" : "#5BA3F5"} 
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </Box>

          {/* Kapılı duvar - Arka parça */}
          <Box 
            args={[wallThickness, height, (depth - getDoorDimensions('wall2').width) / 2]} 
            position={[width/2 + wallThickness/2, 0, (depth/4 + getDoorDimensions('wall2').width/4)]}
            onPointerOver={() => setHoveredWall('wall2')}
            onPointerOut={() => setHoveredWall(null)}
          >
            <meshStandardMaterial 
              color={hoveredWall === 'wall2' ? "#7BB4F5" : "#5BA3F5"} 
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </Box>

          {/* Kapılı duvar - Kapı üstü */}
          <Box 
            args={[wallThickness, height - getDoorDimensions('wall2').height, getDoorDimensions('wall2').width]} 
            position={[width/2 + wallThickness/2, height/2 - (height - getDoorDimensions('wall2').height)/2, 0]}
            onPointerOver={() => setHoveredWall('wall2')}
            onPointerOut={() => setHoveredWall(null)}
          >
            <meshStandardMaterial 
              color={hoveredWall === 'wall2' ? "#7BB4F5" : "#5BA3F5"} 
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </Box>

          {/* Kapı paneli */}
          <Box 
            args={[wallThickness * 0.8, getDoorDimensions('wall2').height - 0.1, getDoorDimensions('wall2').width - 0.1]} 
            position={[width/2 + wallThickness/4, -height/2 + getDoorDimensions('wall2').height/2, 0]}
          >
            <meshStandardMaterial color="#FFFFFF" opacity={0.9} transparent side={THREE.DoubleSide} />
          </Box>

          {/* Kapı çerçevesi */}
          <Box 
            args={[0.3, getDoorDimensions('wall2').height, 0.1]} 
            position={[width/2 + wallThickness/2, -height/2 + getDoorDimensions('wall2').height/2, -getDoorDimensions('wall2').width/2]}
          >
            <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
          </Box>
          <Box 
            args={[0.3, getDoorDimensions('wall2').height, 0.1]} 
            position={[width/2 + wallThickness/2, -height/2 + getDoorDimensions('wall2').height/2, getDoorDimensions('wall2').width/2]}
          >
            <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
          </Box>
          <Box 
            args={[0.3, 0.1, getDoorDimensions('wall2').width]} 
            position={[width/2 + wallThickness/2, -height/2 + getDoorDimensions('wall2').height, 0]}
          >
            <meshStandardMaterial color="#E0E0E0" side={THREE.DoubleSide} />
          </Box>
        </>
      ) : (
        /* Kapısız tam duvar */
        <Box 
          args={[wallThickness, height, depth + wallThickness]} 
          position={[width/2 + wallThickness/2, 0, 0]}
          onPointerOver={() => setHoveredWall('wall2')}
          onPointerOut={() => setHoveredWall(null)}
        >
          <meshStandardMaterial 
            color={hoveredWall === 'wall2' ? "#7BB4F5" : "#5BA3F5"} 
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </Box>
      )}


      {/* İzolasyon işaretleri kaldırıldı - gerekirse daha sonra düzgün bir şekilde eklenebilir */}
    </>
  );

  // Ana return - oda tipine göre render
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {roomType === 'L' && renderLRoom()}
      {roomType === 'T' && renderTRoom()}
      {roomType === 'rectangle' && renderRectangleRoom()}
    </group>
  );
};

const CameraController = forwardRef<any, any>((props, ref) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  // İlk mount'ta kamerayı ayarla
  React.useEffect(() => {
    if (camera && props.minDistance && controlsRef.current && !controlsRef.current._hasInitialized) {
      // Kamerayı odaya göre optimal mesafeye ayarla
      const optimalDistance = props.minDistance * 1.3;
      
      // Mevcut kamera pozisyonunu normalize et ve yeni mesafeye ayarla
      const direction = camera.position.clone().normalize();
      camera.position.copy(direction.multiplyScalar(optimalDistance));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      
      controlsRef.current.update();
      controlsRef.current._hasInitialized = true;
    }
  }, [props.minDistance, camera]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (controlsRef.current) {
        const currentDistance = camera.position.length();
        const newDistance = Math.max(currentDistance * 0.8, props.minDistance || 5);
        camera.position.normalize().multiplyScalar(newDistance);
        camera.updateProjectionMatrix();
        controlsRef.current.update();
      }
    },
    zoomOut: () => {
      if (controlsRef.current) {
        const currentDistance = camera.position.length();
        const newDistance = Math.min(currentDistance * 1.2, props.maxDistance || 50);
        camera.position.normalize().multiplyScalar(newDistance);
        camera.updateProjectionMatrix();
        controlsRef.current.update();
      }
    },
    resetRotation: () => {
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    },
    focusOnWall: (wallNumber: number, roomType: string, dimensions: any) => {
      if (controlsRef.current && camera) {
        const { width, depth, height, lWidth, lDepth } = dimensions;
        const distance = Math.max(width, depth) * 2;
        
        let targetPosition = { x: 0, y: 0, z: 0 };
        let cameraPosition = { x: 0, y: height, z: distance };
        
        if (roomType === 'rectangle') {
          switch(wallNumber) {
            case 1: // Ön duvar
              cameraPosition = { x: 0, y: height/2, z: depth + distance };
              targetPosition = { x: 0, y: 0, z: depth/2 };
              break;
            case 2: // Sağ duvar
              cameraPosition = { x: width + distance, y: height/2, z: 0 };
              targetPosition = { x: width/2, y: 0, z: 0 };
              break;
            case 3: // Arka duvar
              cameraPosition = { x: 0, y: height/2, z: -depth - distance };
              targetPosition = { x: 0, y: 0, z: -depth/2 };
              break;
            case 4: // Sol duvar
              cameraPosition = { x: -width - distance, y: height/2, z: 0 };
              targetPosition = { x: -width/2, y: 0, z: 0 };
              break;
          }
        } else if (roomType === 'L') {
          const lStartX = width/2;
          const lStartZ = depth/2 - lDepth;
          
          switch(wallNumber) {
            case 1: // Ana Bölüm Ön
              cameraPosition = { x: 0, y: height/2, z: depth + distance };
              targetPosition = { x: 0, y: 0, z: depth/2 };
              break;
            case 2: // Ana Bölüm Sağ
              cameraPosition = { x: width + distance, y: height/2, z: depth/4 - lDepth/2 };
              targetPosition = { x: width/2, y: 0, z: depth/4 - lDepth/2 };
              break;
            case 3: // L Kolu Arka
              cameraPosition = { x: lStartX + lWidth/2, y: height/2, z: lStartZ - distance };
              targetPosition = { x: lStartX + lWidth/2, y: 0, z: lStartZ };
              break;
            case 4: // L Kolu Sağ
              cameraPosition = { x: lStartX + lWidth + distance, y: height/2, z: lStartZ + lDepth/2 };
              targetPosition = { x: lStartX + lWidth, y: 0, z: lStartZ + lDepth/2 };
              break;
            case 5: // L Kolu Ön
              cameraPosition = { x: lStartX + lWidth/2, y: height/2, z: lStartZ + lDepth + distance };
              targetPosition = { x: lStartX + lWidth/2, y: 0, z: lStartZ + lDepth };
              break;
            case 6: // Bağlantı Duvarı
              cameraPosition = { x: width/2 + distance, y: height/2, z: lStartZ + lDepth/2 };
              targetPosition = { x: width/2, y: 0, z: lStartZ + lDepth/2 };
              break;
            case 7: // Ana Bölüm Arka
              cameraPosition = { x: -width/4, y: height/2, z: -depth - distance };
              targetPosition = { x: -width/4, y: 0, z: -depth/2 };
              break;
            case 8: // Ana Bölüm Sol
              cameraPosition = { x: -width - distance, y: height/2, z: 0 };
              targetPosition = { x: -width/2, y: 0, z: 0 };
              break;
          }
        }
        
        // Animasyonlu geçiş
        const startPosition = camera.position.clone();
        const startTarget = controlsRef.current.target.clone();
        const endPosition = new THREE.Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        const endTarget = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
        
        const duration = 1000; // 1 saniye
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing function (smooth in-out)
          const eased = progress < 0.5 
            ? 2 * progress * progress 
            : -1 + (4 - 2 * progress) * progress;
          
          camera.position.lerpVectors(startPosition, endPosition, eased);
          controlsRef.current.target.lerpVectors(startTarget, endTarget, eased);
          camera.updateProjectionMatrix();
          controlsRef.current.update();
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      }
    }
  }));

  return (
    <OrbitControls
      ref={controlsRef}
      {...props}
    />
  );
});

const Room3D = forwardRef<Room3DHandle, Room3DProps>(({ 
  roomType = 'rectangle', 
  width = 8, 
  depth = 6, 
  height = 3,
  lWidth = 4,
  lDepth = 3,
  tWidth = 4,
  tDepth = 3,
  wallInsulation,
  wallDoors
}, ref) => {
  const [isMobile, setIsMobile] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const cameraControllerRef = useRef<any>(null);
  
  // Oda tipine göre maksimum boyutu hesapla
  const getMaxDimension = () => {
    if (roomType === 'L') {
      return Math.max(width + lWidth, depth + lDepth, height);
    } else if (roomType === 'T') {
      return Math.max(width + tWidth, depth + tDepth, height);
    }
    return Math.max(width, depth, height);
  };
  
  const maxDim = getMaxDimension();

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (cameraControllerRef.current) {
        cameraControllerRef.current.zoomIn();
      }
    },
    zoomOut: () => {
      if (cameraControllerRef.current) {
        cameraControllerRef.current.zoomOut();
      }
    },
    resetRotation: () => {
      if (cameraControllerRef.current) {
        cameraControllerRef.current.resetRotation();
      }
    },
    focusOnWall: (wallNumber: number) => {
      if (cameraControllerRef.current) {
        cameraControllerRef.current.focusOnWall(wallNumber, roomType, {
          width,
          depth,
          height,
          lWidth,
          lDepth
        });
      }
    }
  }));

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Canvas'ın hazır olmasını bekle ve resize event'i tetikle
    const timer = setTimeout(() => {
      setCanvasReady(true);
      // Canvas render edildikten sonra resize event'i tetikle
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }, 100);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div style={{ 
      width: '100%', 
      height: '400px',
      touchAction: 'none',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {!canvasReady ? (
        <div style={{ color: '#666' }}>Yükleniyor...</div>
      ) : (
        <Canvas
        camera={{ 
          position: isMobile 
            ? [maxDim * 1.5, Math.max(height * 2, maxDim), maxDim * 1.5] 
            : [maxDim * 2, Math.max(height * 2.5, maxDim * 1.2), maxDim * 2], 
          fov: isMobile ? 60 : 50,
          near: 0.1,
          far: 1000
        }}
        style={{ 
          background: '#f5f5f5',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
        gl={{ antialias: true, alpha: true }}
        resize={{ scroll: true, debounce: { scroll: 0, resize: 0 } }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[width, height * 2, depth]} intensity={0.8} />
        <pointLight position={[-width, height * 2, -depth]} intensity={0.5} />
        <spotLight
          position={[0, height * 3, 0]}
          angle={0.5}
          penumbra={1}
          intensity={0.8}
          castShadow
        />
        
        <Room 
          roomType={roomType} 
          width={width} 
          depth={depth} 
          height={height}
          lWidth={lWidth}
          lDepth={lDepth}
          tWidth={tWidth}
          tDepth={tDepth}
          wallInsulation={wallInsulation}
          wallDoors={wallDoors}
        />
        
        {/* Boyut etiketleri kaldırıldı */}
        
        <CameraController 
          ref={cameraControllerRef}
          enablePan={!isMobile}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
          autoRotateSpeed={0.5}
          enableDamping={true}
          dampingFactor={0.05}
          target={[0, 0, 0]}
          minDistance={maxDim * 1.2}
          maxDistance={maxDim * 5}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
      )}
    </div>
  );
});

export default Room3D;