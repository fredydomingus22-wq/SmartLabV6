"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Icosahedron, Sphere, Cylinder } from "@react-three/drei";

function NetworkGlobe({ position, color, scale, speed }: any) {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame((state, delta) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.y -= delta * speed * 0.5;
        meshRef.current.rotation.x += delta * speed * 0.2;
    });

    return (
        <group position={position} scale={scale}>
            {/* Wireframe Globe */}
            <Icosahedron args={[1, 2]} ref={meshRef}>
                <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
            </Icosahedron>
            {/* Core */}
            <Sphere args={[0.5, 16, 16]}>
                <meshBasicMaterial color={color} transparent opacity={0.1} />
            </Sphere>
        </group>
    );
}

function SimpleMolecule({ position, color, scale, speed }: any) {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (!groupRef.current) return;
        groupRef.current.rotation.z += delta * speed * 0.2;
        groupRef.current.rotation.y += delta * speed * 0.3;
        // Float
        groupRef.current.position.y += Math.sin(state.clock.elapsedTime * speed) * 0.002;
    });

    // Simple H2O-like structure or generic triangle
    return (
        <group position={position} scale={scale} ref={groupRef}>
            {/* Center Atom */}
            <Sphere args={[0.4, 16, 16]} position={[0, 0, 0]}>
                <meshPhysicalMaterial color={color} roughness={0.2} metalness={0.5} />
            </Sphere>

            {/* Atom 2 */}
            <Sphere args={[0.25, 16, 16]} position={[0.8, 0.6, 0]}>
                <meshPhysicalMaterial color={color} opacity={0.8} transparent />
            </Sphere>

            {/* Atom 3 */}
            <Sphere args={[0.25, 16, 16]} position={[-0.8, 0.6, 0]}>
                <meshPhysicalMaterial color={color} opacity={0.8} transparent />
            </Sphere>

            {/* Bond 1 */}
            <Cylinder args={[0.05, 0.05, 1]} position={[0.4, 0.3, 0]} rotation={[0, 0, -0.9]}>
                <meshBasicMaterial color={color} opacity={0.3} transparent />
            </Cylinder>

            {/* Bond 2 */}
            <Cylinder args={[0.05, 0.05, 1]} position={[-0.4, 0.3, 0]} rotation={[0, 0, 0.9]}>
                <meshBasicMaterial color={color} opacity={0.3} transparent />
            </Cylinder>
        </group>
    );
}

export function FloatingSymbols() {
    const symbols = useMemo(() => {
        return [
            // Network Globes (Tech/Web) - Subtle
            { type: 'globe', position: [-6, 3, -5], scale: 1.2, color: "#475569", speed: 0.5 },
            { type: 'globe', position: [7, -4, -8], scale: 1.8, color: "#334155", speed: 0.3 },

            // Molecules (Science/Chem) - Subtle
            { type: 'molecule', position: [5, 2, -4], scale: 1.0, color: "#64748b", speed: 0.4 },
            { type: 'molecule', position: [-5, -3, -6], scale: 1.4, color: "#475569", speed: 0.3 },
        ];
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 12], fov: 50 }} gl={{ alpha: true }}>
                <ambientLight intensity={0.6} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />

                {symbols.map((s: any, i) => (
                    s.type === 'globe'
                        ? <NetworkGlobe key={i} {...s} />
                        : <SimpleMolecule key={i} {...s} />
                ))}
            </Canvas>
        </div>
    );
}
