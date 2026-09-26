'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getWsUrl } from '@/lib/api/api-client';
import type { DiceSessionViewDto } from '@/types/dice';
import type { ScoreKeyDto } from '@/types/dice';

interface UseDiceWsOptions {
  sessionId: string;
  accessToken: string | null;
  guestId: string | null;
  enabled: boolean;
}

interface WsMessageState {
  type: 'STATE';
  payload: DiceSessionViewDto;
}

interface WsMessageError {
  type: 'ERROR';
  error: string;
}

type WsMessage = WsMessageState | WsMessageError;

export function useDiceWs({ sessionId, accessToken, guestId, enabled }: UseDiceWsOptions) {
  const [view, setView] = useState<DiceSessionViewDto | null>(null);
  const [connected, setConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sendQueueRef = useRef<string[]>([]);

  const send = useCallback((payload: object) => {
    const msg = JSON.stringify(payload);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(msg);
    } else {
      sendQueueRef.current.push(msg);
    }
  }, []);

  const sendRoll = useCallback(() => {
    send({ type: 'ROLL' });
  }, [send]);

  const sendLock = useCallback(
    (diceIndex: number) => {
      send({ type: 'LOCK', payload: { diceIndex } });
    },
    [send],
  );

  const sendChooseScore = useCallback(
    (scoreKey: ScoreKeyDto) => {
      send({ type: 'CHOOSE_SCORE', payload: { scoreKey } });
    },
    [send],
  );

  useEffect(() => {
    if (!enabled || !sessionId) return;
    if (!accessToken && !guestId) return;

    const params = new URLSearchParams();
    if (guestId) params.set('guestId', guestId);
    const baseUrl = getWsUrl(`/dice/sessions/${sessionId}/ws`);
    const url = params.toString() ? `${baseUrl}?${params}` : baseUrl;
    const ws =
      accessToken !== null ? new WebSocket(url, `access-token.${accessToken}`) : new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setWsError(null);
      for (const msg of sendQueueRef.current) {
        ws.send(msg);
      }
      sendQueueRef.current = [];
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as WsMessage;
        if (data.type === 'STATE') {
          setView(data.payload);
        }
        if (data.type === 'ERROR') {
          setWsError(data.error);
        }
      } catch {
        setWsError('Message invalide');
      }
    };

    ws.onerror = () => {
      setWsError('Erreur de connexion');
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setConnected(false);
      setView(null);
      setWsError(null);
      sendQueueRef.current = [];
    };
  }, [enabled, sessionId, accessToken, guestId]);

  return {
    view,
    connected,
    error: wsError,
    sendRoll,
    sendLock,
    sendChooseScore,
  };
}
