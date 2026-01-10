"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { Octahedron } from "@react-three/drei";

function RotatingPrism({ position, scale, speed }: any) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.x += delta * speed * 0.5;
        meshRef.current.rotation.y += delta * speed;
    });

    return (
        <Octahedron args={[1, 0]} position={position} scale={scale} ref={meshRef}>
            <meshPhysicalMaterial
                roughness={0}
                metalness={0.1}
                transmission={0.9} // Glass effect
                thickness={2} // Refraction
                color="#ffffff"
                transparent
                opacity={0.3}
            />
        </Octahedron>
    );
}

export function PrismField() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 15], fov: 50 }} gl={{ alpha: true }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={0.5} color="#cbd5e1" />
                <pointLight position={[-10, -10, -10]} intensity={0.2} color="#94a3b8" />

                <RotatingPrism position={[-4, 2, -5]} scale={1.5} speed={0.2} />
                <RotatingPrism position={[5, -3, -8]} scale={2} speed={0.15} />
                <RotatingPrism position={[0, 4, -10]} scale={1} speed={0.1} />
            </Canvas>
        </div>
    );
}
