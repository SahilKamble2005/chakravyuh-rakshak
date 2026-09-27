import { useState, useEffect, useRef, useCallback } from 'react';
import { cycloneApi } from '../services/api';
import { AlertItem } from '../types';
import { useAudioAlert } from './useAudioAlert';

export const useLiveAlerts = () => {
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>([]);
  const [popupAlert, setPopupAlert] = useState<AlertItem | null>(null);
  const seenAlertIds = useRef<Set<number>>(new Set());
  const socketRef = useRef<WebSocket | null>(null);

  const {
    triggerAlert,
    stopSound,
    isPlaying,
    isMuted,
    toggleMute,
    requestAudioPermission
  } = useAudioAlert();

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await cycloneApi.getAlerts();
      setActiveAlerts(data);

      // Check for unacknowledged severe or warning alerts that haven't been shown in popup yet
      const unackSevere = data.find(
        (a) => !a.acknowledged && (a.level === 'SEVERE' || a.level === 'WARNING')
      );

      if (unackSevere && !seenAlertIds.current.has(unackSevere.id)) {
        seenAlertIds.current.add(unackSevere.id);
        setPopupAlert(unackSevere);
        triggerAlert(unackSevere.level);
      }
    } catch (e) {
      console.warn('Alerts poll failed:', e);
    }
  }, [triggerAlert]);

  useEffect(() => {
    // Initial fetch & interval polling fallback
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 8000);

    // WebSocket connection
    const connectWS = () => {
      try {
        const wsBase = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8001/ws';
        const wsUrl = `${wsBase}/alerts`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log('📡 Connected to /ws/alerts');
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'NEW_ALERT' && msg.payload) {
              const alert: AlertItem = msg.payload;
              setActiveAlerts((prev) => [alert, ...prev]);
              if (!alert.acknowledged && (alert.level === 'SEVERE' || alert.level === 'WARNING')) {
                setPopupAlert(alert);
                triggerAlert(alert.level);
              }
            }
          } catch (e) {
            // non-json
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (e) {
        console.warn('WS alert connect error:', e);
      }
    };

    connectWS();

    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.close();
      }
      stopSound();
    };
  }, [fetchAlerts, triggerAlert, stopSound]);

  const handleAcknowledge = async (id: number) => {
    try {
      await cycloneApi.acknowledgeAlert(id);
      stopSound();
      setPopupAlert(null);
      fetchAlerts();
    } catch (e) {
      console.error('Acknowledge failed:', e);
    }
  };

  const handleCloseModal = () => {
    stopSound();
    setPopupAlert(null);
  };

  return {
    activeAlerts,
    popupAlert,
    handleAcknowledge,
    handleCloseModal,
    isMuted,
    toggleMute,
    isPlaying,
    requestAudioPermission
  };
};
