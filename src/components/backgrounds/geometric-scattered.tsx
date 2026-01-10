"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function FloatingShape({ position, type, color, speed, size }: any) {
    const meshRef = useRef<THREE.Mesh>(null);
    const rotationSpeed = useRef({
        x: Math.random() * 0.5 * speed,
        y: Math.random() * 0.5 * speed
    });

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.x += rotationSpeed.current.x * delta;
        meshRef.current.rotation.y += rotationSpeed.current.y * delta;

        // Gentle float
        meshRef.current.position.y += Math.sin(state.clock.elapsedTime * speed) * 0.002;
    });

    const Geometry = type === "box" ? "boxGeometry" : "icosahedronGeometry";
    const args = type === "box" ? [size, size, size] : [size, 0];

    return (
        <mesh ref={meshRef} position={position}>
            {type === "box" ? <boxGeometry args={[size, size, size]} /> : <icosahedronGeometry args={[size, 0]} />}
            <meshBasicMaterial color={color} wireframe transparent opacity={0.15} />
        </mesh>
    );
}

export function GeometricScatteredBackground() {
    const shapes = useMemo(() => {
        const items = [];
        const colors = ["#06b6d4", "#f59e0b", "#10b981", "#8b5cf6"]; // Cyan-500, Amber-500, Emerald-500, Violet-500

        for (let i = 0; i < 40; i++) {
            items.push({
                position: [
                    (Math.random() - 0.5) * 30, // Spread X
                    (Math.random() - 0.5) * 20, // Spread Y
                    (Math.random() - 0.5) * 10 - 5 // Spread Z (Depth)
                ],
                type: Math.random() > 0.5 ? "box" : "sphere",
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 0.5 + 0.2,
                size: Math.random() * 0.8 + 0.2
            });
        }
        return items;
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 10], fov: 60 }} gl={{ alpha: true }}>
                {shapes.map((shape, i) => (
                    <FloatingShape key={i} {...shape} />
                ))}
            </Canvas>
        </div>
    );
}
