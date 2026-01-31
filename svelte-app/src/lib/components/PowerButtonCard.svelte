<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Power, LoaderCircle } from '@lucide/svelte';
  import { cn } from '$lib/utils';

  type ConnectionState = 'disconnected' | 'connecting' | 'ready' | 'error' | 'pressing';

  interface Props {
    onQuick: (duration: number) => Promise<{ ack: string }>;
    onPress: () => Promise<{ ack: string }>;
    onRelease: () => Promise<{ ack: string }>;
    pollStatus: () => Promise<{ connected: boolean; deviceStatus: 'online' | 'offline' | 'unknown' }>;
    initialStatus?: { connected: boolean; deviceStatus: 'online' | 'offline' | 'unknown' };
  }

  let { onQuick, onPress, onRelease, pollStatus, initialStatus }: Props = $props();

  const LONG_PRESS_THRESHOLD = 500;

  let statusText = $state('Tap to power on/off PC');
  
  // Compute initial state from props
  function getInitialConnectionState(): ConnectionState {
    if (!initialStatus) return 'disconnected';
    return initialStatus.deviceStatus === 'online' ? 'ready' : 'disconnected';
  }
  
  let connectionState: ConnectionState = $state(getInitialConnectionState());
  let pressStart = $state(0);
  let isLongPress = $state(false);
  let longPressTimer: ReturnType<typeof setTimeout> | null = $state(null);
  let isMouseDown = $state(false);

  const stateConfig = {
    disconnected: {
      buttonBg: 'bg-neutral-800 hover:bg-neutral-700',
      iconColor: 'text-neutral-500',
      statusDot: 'bg-neutral-500',
      statusText: 'Disconnected',
      statusColor: 'text-neutral-500'
    },
    connecting: {
      buttonBg: 'bg-amber-900/30 hover:bg-amber-900/40',
      iconColor: 'text-amber-500',
      statusDot: 'bg-amber-500 animate-pulse',
      statusText: 'Sending...',
      statusColor: 'text-amber-500'
    },
    pressing: {
      buttonBg: 'bg-emerald-600 scale-95',
      iconColor: 'text-white',
      statusDot: 'bg-emerald-500 animate-pulse',
      statusText: 'Pressing...',
      statusColor: 'text-emerald-500'
    },
    ready: {
      buttonBg: 'bg-emerald-900/30 hover:bg-emerald-900/40',
      iconColor: 'text-emerald-500',
      statusDot: 'bg-emerald-500',
      statusText: 'Ready',
      statusColor: 'text-emerald-500'
    },
    error: {
      buttonBg: 'bg-red-900/30 hover:bg-red-900/40',
      iconColor: 'text-red-500',
      statusDot: 'bg-red-500',
      statusText: 'Error',
      statusColor: 'text-red-500'
    }
  };

  let config = $derived(stateConfig[connectionState]);

  // Check status once on mount if no initial status provided
  $effect(() => {
    if (initialStatus) return;

    const checkConnection = async () => {
      try {
        const status = await pollStatus();
        if (status.deviceStatus === 'online') {
          connectionState = 'ready';
        } else {
          connectionState = 'disconnected';
        }
      } catch {
        connectionState = 'error';
      }
    };

    checkConnection();
  });

  function handlePressStart() {
    isMouseDown = true;
    pressStart = Date.now();
    isLongPress = false;

    // Clear any existing timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }

    // Start long press timer
    longPressTimer = setTimeout(async () => {
      if (!isMouseDown) return;

      // Long press detected - send live press
      isLongPress = true;
      connectionState = 'pressing';
      statusText = 'Holding button...';
      try {
        await onPress();
      } catch (error) {
        connectionState = 'error';
        const isNetworkError = error instanceof TypeError || (error as any)?.message?.includes('fetch');
        statusText = isNetworkError ? 'No internet connection' : 'Failed to press';
      }
    }, LONG_PRESS_THRESHOLD);
  }

  async function handlePressEnd() {
    if (!isMouseDown) return;

    isMouseDown = false;

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    const duration = Date.now() - pressStart;

    if (isLongPress) {
      // Long press - send release
      connectionState = 'connecting';
      statusText = 'Releasing button...';
      try {
        const response = await onRelease();
        if (response.ack === 'released') {
          connectionState = 'ready';
          statusText = `Button held for ${duration}ms`;
          setTimeout(() => (statusText = 'Tap to power on/off PC'), 3000);
        } else {
          connectionState = 'error';
          statusText = 'Failed to release';
          setTimeout(() => {
            connectionState = 'ready';
            statusText = 'Tap to power on/off PC';
          }, 3000);
        }
      } catch (error) {
        connectionState = 'error';
        const isNetworkError = error instanceof TypeError || (error as any)?.message?.includes('fetch');
        statusText = isNetworkError ? 'No internet connection' : 'Failed to release';
        setTimeout(() => {
          connectionState = 'ready';
          statusText = 'Tap to power on/off PC';
        }, 3000);
      }
    } else {
      // Quick press - send immediate command
      connectionState = 'connecting';
      statusText = 'Sending quick press...';
      try {
        const quickDuration = Math.max(duration, 200);
        const response = await onQuick(quickDuration);
        if (response.ack === 'executed') {
          connectionState = 'ready';
          statusText = 'Quick press executed!';
          setTimeout(() => (statusText = 'Tap to power on/off PC'), 3000);
        } else if (response.ack === 'timeout') {
          connectionState = 'error';
          statusText = 'Command sent but no acknowledgment';
          setTimeout(() => {
            connectionState = 'ready';
            statusText = 'Tap to power on/off PC';
          }, 3000);
        } else {
          connectionState = 'error';
          statusText = `ESP32 error: ${response.ack}`;
          setTimeout(() => {
            connectionState = 'ready';
            statusText = 'Tap to power on/off PC';
          }, 3000);
        }
      } catch (error) {
        connectionState = 'error';
        const isNetworkError = error instanceof TypeError || (error as any)?.message?.includes('fetch');
        statusText = isNetworkError ? 'No internet connection' : 'Failed to send command';
        setTimeout(() => {
          connectionState = 'ready';
          statusText = 'Tap to power on/off PC';
        }, 3000);
      }
    }
  }
</script>

<Card.Root class="mx-auto w-full max-w-sm">
  <Card.Header class="text-center">
    <Card.Title class="text-2xl font-bold">PC Power Control</Card.Title>
    <div
      class="mx-auto mt-4 flex w-fit items-center justify-center gap-3 rounded-full bg-secondary/50 px-4 py-2"
    >
      <span class={cn('h-3 w-3 rounded-full', config.statusDot)}></span>
      <span class={cn('text-sm font-medium', config.statusColor)}>
        {config.statusText}
      </span>
    </div>
    <p class="mt-2 text-xs text-muted-foreground">Quick tap or hold for live control</p>
  </Card.Header>
  <Card.Content class="flex flex-col items-center gap-6 pb-8">
    <button
      onmousedown={handlePressStart}
      onmouseup={handlePressEnd}
      onmouseleave={handlePressEnd}
      ontouchstart={handlePressStart}
      ontouchend={handlePressEnd}
      disabled={connectionState === 'connecting'}
      class={cn(
        'flex h-48 w-48 items-center justify-center rounded-full',
        'transition-all duration-200 ease-out',
        'shadow-lg hover:shadow-xl',
        'focus:ring-4 focus:ring-ring/50 focus:outline-none',
        config.buttonBg
      )}
      aria-label="Power button"
    >
      {#if connectionState === 'connecting'}
        <LoaderCircle class="h-20 w-20 animate-spin text-amber-500" />
      {:else}
        <Power class={cn('h-20 w-20', config.iconColor)} />
      {/if}
    </button>
    <p class="text-center text-muted-foreground">{statusText}</p>
  </Card.Content>
</Card.Root>
