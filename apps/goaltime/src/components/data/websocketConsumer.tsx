"use client"

import { EventEmitter } from 'events';
import { Goal, CalendarEvent } from '@prisma/client';
import { Jsonify } from 'inngest/helpers/jsonify';
import { toast } from '@/libs/ui-components/src/hooks/use-toast';
import { userStore } from './proxies/user';
import { useSnapshot } from 'valtio';
import { useRef, useEffect, useCallback } from 'react';

export class WebsocketHandler extends EventEmitter {
  emitOpen() {
    this.emit('open');
  }

  emitGoalsUpdate(goals: Jsonify<Goal[]>) {
    this.emit('goalsUpdate', goals);
  }

  emitCalendarUpdate(calendarEvents: Jsonify<CalendarEvent[]>) {
    this.emit('calendarUpdate', calendarEvents);
  }

  emitError(error: Error) {
    this.emit('error', error);
  }
}

interface WebsocketEventConsumerProps {
  onOpen: () => void;
  onGoalsUpdate: (goals: Jsonify<Goal[]>) => void;
  onCalendarUpdate: (calendarEvents: Jsonify<CalendarEvent[]>) => void;
  onError: (error: Error) => void;
}

export class WebsocketEventConsumer {
  constructor(
    private readonly handler: WebsocketHandler,
    private readonly props: WebsocketEventConsumerProps,
  ) {
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    this.handler.on('open', this.onOpen);
    this.handler.on('goalsUpdate', this.onGoalsUpdate);
    this.handler.on('calendarUpdate', this.onCalendarUpdate);
    this.handler.on('error', this.onError);
  }

  private onOpen = () => {
    console.log('WebSocket connection opened');
    this.props.onOpen();
  };

  private onGoalsUpdate = (goals: Jsonify<Goal[]>) => {
    console.log(`Received goals update: ${goals.length} goals`);
    this.props.onGoalsUpdate(goals);
  };

  private onCalendarUpdate = (calendarEvents: Jsonify<CalendarEvent[]>) => {
    console.log(`Received calendar update: ${calendarEvents.length} events`);
    this.props.onCalendarUpdate(calendarEvents);
  };

  private onError = (error: Error) => {
    console.error('WebSocket error:', error);
    this.props.onError(error);
  };

  public cleanup() {
    this.handler.off('open', this.onOpen);
    this.handler.off('goalsUpdate', this.onGoalsUpdate);
    this.handler.off('calendarUpdate', this.onCalendarUpdate);
    this.handler.off('error', this.onError);
  }
}

export function WebsocketConsumer() {
  const consumerRef = useRef<WebsocketEventConsumer | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = useSnapshot(userStore).websocketHandler;
  const handler = userStore.websocketHandler; // Needs to be mutable, so we don't use useSnapshot but rely on the snapshot for re-renders

  const handleOpen = useCallback(() => {
    toast({
      title: 'Sync is active',
      description: 'You are now connected to the server',
    });
  }, []);

  const handleGoalsUpdate = useCallback((goals: Jsonify<Goal[]>) => {
    toast({
      title: 'Goals updated',
      description: `Synced ${goals.length} goals`,
    });
  }, []);

  const handleCalendarUpdate = useCallback((calendarEvents: Jsonify<CalendarEvent[]>) => {
    toast({
      title: 'Calendar updated',
      description: `Synced ${calendarEvents.length} events`,
    });
  }, []);

  const handleError = useCallback((error: Error) => {
    toast({
      title: 'Sync error',
      description: `Don't worry, your data is still safe.`,
    });
  }, []);

  useEffect(() => {
    if (!handler) return;

    consumerRef.current = new WebsocketEventConsumer(handler, {
      onOpen: handleOpen,
      onGoalsUpdate: handleGoalsUpdate,
      onCalendarUpdate: handleCalendarUpdate,
      onError: handleError,
    });

    return () => {
      consumerRef.current?.cleanup();
      consumerRef.current = null;
    };
  }, [handler, handleOpen, handleGoalsUpdate, handleCalendarUpdate, handleError]);

  return null;
}
