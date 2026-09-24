"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  PerspectiveCamera, 
  MeshDistortMaterial, 
  Trail, 
  Float as FloatDrei,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";

// Drone with Swarm logic and 3D Banking Physics
function Drone({ position, speed, color, swarmPos }: { 
  position: [number, number, number], 
  speed: number, 
  color: string, 
  swarmPos: THREE.Vector3 
}) {
  const meshRef = useRef<THREE.Group>(null);
  const rotorsRef = useRef<THREE.Group[]>([]);
  const localOffset = useMemo(() => new THREE.Vector3(...position), [position]);
  const lastPosition = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * speed;
      
      // Calculate target position based on swarm (mouse) + local orbit
      const targetX = swarmPos.x + localOffset.x + Math.sin(t) * 0.8;
      const targetY = swarmPos.y + localOffset.y + Math.cos(t * 0.5) * 0.8;
      const targetZ = swarmPos.z + localOffset.z + Math.sin(t * 0.3) * 1.2;

      // Calculate velocity for 3D physics (banking/tilting)
      velocity.current.subVectors(meshRef.current.position, lastPosition.current);
      lastPosition.current.copy(meshRef.current.position);

      // Smoothly move drone to target
      meshRef.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.05);
      
      // 3D BANKING & TILTING PHYSICS
      // Tilt Z based on horizontal movement (Banking)
      const targetBank = -velocity.current.x * 12;
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetBank, 0.1);
      
      // Tilt X based on vertical/forward movement (Pitching)
      const targetPitch = velocity.current.y * 10;
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetPitch, 0.1);
      
      // Face forward + slight oscillation
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, (Math.sin(t * 0.2) * 0.4), 0.05);

      // Rotate rotors fast
      rotorsRef.current.forEach((rotor) => {
        if (rotor) rotor.rotation.y += 0.8;
      });
    }
  });

  return (
    <group ref={meshRef}>
      <Trail width={1} length={10} color={new THREE.Color(color)} attenuation={(t) => t * t}>
        <group scale={1.2}>
          {/* Main Body - Highly Metallic for 3D highlight */}
          <mesh>
            <boxGeometry args={[0.3, 0.1, 0.4]} />
            <meshStandardMaterial color="#000080" metalness={0.9} roughness={0.1} />
          </mesh>
          
          {/* Arms & Rotors */}
          {[[0.4, 0.4], [0.4, -0.4], [-0.4, 0.4], [-0.4, -0.4]].map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <mesh position={[-x/2, 0, -z/2]} rotation={[0, Math.atan2(x, z), 0]}>
                <boxGeometry args={[0.08, 0.04, 0.6]} />
                <meshStandardMaterial color="#334155" metalness={0.8} />
              </mesh>
              <group ref={el => rotorsRef.current[i] = el!}>
                <mesh position={[0, 0.1, 0]}>
                  <boxGeometry args={[0.6, 0.01, 0.04]} />
                  <meshStandardMaterial color="#94a3b8" transparent opacity={0.6} />
                </mesh>
              </group>
            </group>
          ))}

          {/* Tactical Indicator Eye (The "Face") */}
          <mesh position={[0, 0, 0.3]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={30} />
          </mesh>
        </group>
      </Trail>
    </group>
  );
}

// Central Decorative Orb
function CyberOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const orbGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.3, 1), []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <primitive object={orbGeometry} />
        <MeshDistortMaterial
          color="#ffffff"
          speed={2}
          distort={0.15}
          radius={1}
          emissive="#000080"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.4}
        />
      </mesh>
      <mesh>
        <primitive object={orbGeometry} />
        <meshStandardMaterial color="#000080" wireframe transparent opacity={0.1} emissive="#000080" emissiveIntensity={1} />
      </mesh>
      <FloatDrei speed={3} rotationIntensity={1} floatIntensity={0.5}>
        <mesh rotation={[Math.PI / 2, 0.5, 0]}>
          <torusGeometry args={[2.1, 0.015, 16, 120]} />
          <meshStandardMaterial color="#FF9933" emissive="#FF9933" emissiveIntensity={2} />
        </mesh>
      </FloatDrei>
    </group>
  );
}

// Manages the movement of the drone swarm with depth
function DroneSwarm() {
  const { mouse } = useThree();
  const swarmPos = useRef(new THREE.Vector3());

  useFrame(() => {
    swarmPos.current.x = THREE.MathUtils.lerp(swarmPos.current.x, mouse.x * 4, 0.05);
    swarmPos.current.y = THREE.MathUtils.lerp(swarmPos.current.y, mouse.y * 4, 0.05);
    swarmPos.current.z = 0;
  });

  return (
    <>
      <Drone position={[1.5, 1.2, 0.5]} speed={0.9} color="#FF9933" swarmPos={swarmPos.current} />
      <Drone position={[-1.5, -1.2, -0.5]} speed={0.7} color="#138808" swarmPos={swarmPos.current} />
      <Drone position={[0.8, -1.5, 1]} speed={1.1} color="#000080" swarmPos={swarmPos.current} />
    </>
  );
}

export function TacticalCanvas() {
  return (
    <div className="h-[400px] w-full md:h-[600px] cursor-crosshair">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={35} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#fff" />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#138808" />
        <CyberOrb />
        <DroneSwarm />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
