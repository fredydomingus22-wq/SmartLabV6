"use client";

import { create } from 'zustand';

export type EnterpriseView = 'analytical' | 'wizard' | 'equipment';

interface UI5Toast {
    id: string;
    message: string;
    duration?: number;
}

interface EnterpriseStore {
    activeView: EnterpriseView;
    isSidebarCollapsed: boolean;
    toasts: UI5Toast[];

    // Actions
    setActiveView: (view: EnterpriseView) => void;
    toggleSidebar: () => void;
    showToast: (message: string, duration?: number) => void;
    removeToast: (id: string) => void;

    // Equipment Mock State
    equipmentHealth: Record<string, number>;
    updateEquipmentHealth: (id: string, health: number) => void;
}

export const useUI5Store = create<EnterpriseStore>((set) => ({
    activeView: 'analytical',
    isSidebarCollapsed: false,
    toasts: [],
    equipmentHealth: {
        'EQUIP-FOSS-01': 98.2,
        'EQUIP-THERMO-02': 84.5,
        'EQUIP-AGILENT-03': 100.0,
    },

    setActiveView: (view) => set({ activeView: view }),
    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

    showToast: (message, duration = 3000) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({ toasts: [...state.toasts, { id, message, duration }] }));
    },

    removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
    })),

    updateEquipmentHealth: (id, health) => set((state) => ({
        equipmentHealth: { ...state.equipmentHealth, [id]: health }
    })),
}));
