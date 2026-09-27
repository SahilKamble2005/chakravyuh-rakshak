import { create } from 'zustand';
import { Location } from '../types';

export interface MapLayerItem {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
}

interface MapState {
  selectedCoordinates: Location | null;
  layers: MapLayerItem[];
  mapConnectionStatus: 'connected' | 'connecting' | 'disconnected';
  setSelectedCoordinates: (loc: Location | null) => void;
  toggleLayer: (id: string) => void;
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected') => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedCoordinates: null,
  layers: [
    { id: 'risk_zones', name: 'Risk Zones', visible: true, opacity: 0.8 },
    { id: 'sst', name: 'Sea Surface Temp', visible: false, opacity: 0.6 },
  ],
  mapConnectionStatus: 'disconnected',
  setSelectedCoordinates: (loc) => set({ selectedCoordinates: loc }),
  toggleLayer: (id) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      ),
    })),
  setConnectionStatus: (status) => set({ mapConnectionStatus: status }),
}));
