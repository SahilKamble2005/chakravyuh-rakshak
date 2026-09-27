import { create } from 'zustand';
import { Alert } from '../types';

interface AlertState {
  activeAlerts: Alert[];
  alertHistory: Alert[];
  audioMuted: boolean;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (id: number | string) => void;
  toggleMute: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  activeAlerts: [],
  alertHistory: [],
  audioMuted: true,
  addAlert: (alert) =>
    set((state) => ({ activeAlerts: [...state.activeAlerts, alert] })),
  acknowledgeAlert: (id) =>
    set((state) => {
      const alert = state.activeAlerts.find((a) => String(a.id) === String(id));
      if (!alert) return state;
      return {
        activeAlerts: state.activeAlerts.filter((a) => String(a.id) !== String(id)),
        alertHistory: [alert, ...state.alertHistory],
      };
    }),
  toggleMute: () => set((state) => ({ audioMuted: !state.audioMuted })),
}));
