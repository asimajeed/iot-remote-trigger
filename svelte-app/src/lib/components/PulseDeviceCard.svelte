<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Loader2 } from '@lucide/svelte';
  import { cn } from '$lib/utils';

  interface Props {
    name: string;
    icon?: any; // Lucide icon component
    onPulse: () => Promise<{ ack: string }>;
    pollStatus?: () => Promise<{ deviceStatus: 'online' | 'offline' }>;
    pulseDuration?: number;
    initialStatus?: { connected: boolean; deviceStatus: 'online' | 'offline' | 'unknown' };
  }

  let { name, icon, onPulse, pollStatus, pulseDuration = 2000, initialStatus }: Props = $props();

  // Compute initial state from props
  function getInitialDeviceOnline(): boolean {
    if (!initialStatus) return false;
    return initialStatus.deviceStatus === 'online';
  }

  function getInitialDeviceState(): string {
    if (!initialStatus) return 'disconnected';
    return initialStatus.deviceStatus === 'online' ? 'ready' : 'disconnected';
  }

  let deviceOnline = $state(getInitialDeviceOnline());
  let deviceState = $state(getInitialDeviceState());
  let customStatusText = $state('');

  // Check status once on mount if no initial status provided
  $effect(() => {
    if (initialStatus) return;

    if (!pollStatus) {
      // If no pollStatus provided, assume device is ready
      deviceState = 'ready';
      deviceOnline = true;
      return;
    }

    const checkConnection = async () => {
      try {
        const status = await pollStatus();
        deviceOnline = status.deviceStatus === 'online';
        if (
          deviceOnline &&
          deviceState !== 'sending' &&
          deviceState !== 'triggered' &&
          deviceState !== 'error'
        ) {
          deviceState = 'ready';
        } else if (
          !deviceOnline &&
          deviceState !== 'sending' &&
          deviceState !== 'triggered' &&
          deviceState !== 'error'
        ) {
          deviceState = 'disconnected';
        }
      } catch {
        if (deviceState !== 'sending' && deviceState !== 'triggered') {
          deviceState = 'error';
        }
      }
    };

    checkConnection();
  });

  // Compute default status text based on state
  let defaultStatusText = $derived(
    deviceState === 'disconnected'
      ? 'Device offline'
      : deviceState === 'ready'
        ? `Tap to trigger ${name.toLowerCase()}`
        : deviceState === 'sending'
          ? 'Sending command...'
          : deviceState === 'triggered'
            ? 'Triggered successfully!'
            : 'Failed to send command'
  );

  // Display custom text if set, otherwise use default
  let statusText = $derived(customStatusText || defaultStatusText);

  async function handleClick() {
    if (deviceState === 'sending') return;

    deviceState = 'sending';
    customStatusText = '';

    try {
      const response = await onPulse();
      if (response.ack === 'executed' || response.ack === 'triggered') {
        deviceState = 'triggered';
        customStatusText = 'Triggered successfully!';
        setTimeout(() => {
          deviceState = deviceOnline ? 'ready' : 'disconnected';
          customStatusText = '';
        }, 3000);
      } else if (response.ack === 'timeout') {
        deviceState = 'error';
        customStatusText = 'Command sent but no acknowledgment';
        setTimeout(() => {
          deviceState = deviceOnline ? 'ready' : 'disconnected';
          customStatusText = '';
        }, 3000);
      } else {
        deviceState = 'error';
        customStatusText = `Error: ${response.ack}`;
        setTimeout(() => {
          deviceState = deviceOnline ? 'ready' : 'disconnected';
          customStatusText = '';
        }, 3000);
      }
    } catch (error) {
      deviceState = 'error';
      // Check if it's a network error (user's internet)
      const isNetworkError = error instanceof TypeError || (error as any)?.message?.includes('fetch');
      customStatusText = isNetworkError 
        ? 'No internet connection' 
        : 'Failed to send command';
      setTimeout(() => {
        deviceState = deviceOnline ? 'ready' : 'disconnected';
        customStatusText = '';
      }, 3000);
    }
  }

  const stateConfig = {
    disconnected: {
      buttonBg: 'bg-neutral-800',
      iconColor: 'text-neutral-500',
      statusDot: 'bg-neutral-500',
      statusText: 'Offline',
      statusColor: 'text-neutral-500'
    },
    ready: {
      buttonBg: 'bg-emerald-900/30 hover:bg-emerald-900/40',
      iconColor: 'text-emerald-500',
      statusDot: 'bg-emerald-500',
      statusText: 'Ready',
      statusColor: 'text-emerald-500'
    },
    sending: {
      buttonBg: 'bg-amber-900/30',
      iconColor: 'text-amber-500',
      statusDot: 'bg-amber-500 animate-pulse',
      statusText: 'Sending...',
      statusColor: 'text-amber-500'
    },
    triggered: {
      buttonBg: 'bg-blue-900/30',
      iconColor: 'text-blue-500',
      statusDot: 'bg-blue-500',
      statusText: 'Triggered',
      statusColor: 'text-blue-500'
    },
    error: {
      buttonBg: 'bg-red-900/30',
      iconColor: 'text-red-500',
      statusDot: 'bg-red-500',
      statusText: 'Error',
      statusColor: 'text-red-500'
    }
  } as const;

  type StateKey = 'ready' | 'sending' | 'triggered' | 'error' | 'disconnected';
  const config = $derived(stateConfig[deviceState as StateKey]);
  let IconComponent = $derived(icon);
</script>

<Card class="mx-auto w-full max-w-sm">
  <CardHeader class="text-center">
    <CardTitle class="text-2xl font-bold">{name}</CardTitle>
    <div
      class="mx-auto mt-4 flex w-fit items-center justify-center gap-3 rounded-full bg-secondary/50 px-4 py-2"
    >
      <span class={cn('h-3 w-3 rounded-full', config.statusDot)}></span>
      <span class={cn('text-sm font-medium', config.statusColor)}>
        {config.statusText}
      </span>
    </div>
    <!-- <p class="mt-2 text-xs text-muted-foreground">
      Sends {pulseDuration}ms pulse when triggered
    </p> -->
  </CardHeader>
  <CardContent class="flex flex-col items-center gap-6 pb-8">
    <button
      onclick={handleClick}
      disabled={deviceState === 'sending'}
      class={cn(
        'flex h-48 w-48 items-center justify-center rounded-full',
        'transition-all duration-200 ease-out',
        'shadow-lg hover:shadow-xl',
        'focus:ring-4 focus:ring-ring/50 focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        config.buttonBg
      )}
      aria-label={`Trigger ${name}`}
    >
      {#if deviceState === 'sending'}
        <Loader2 class="h-20 w-20 animate-spin text-amber-500" />
      {:else if IconComponent}
        <IconComponent class={cn('h-20 w-20', config.iconColor)} />
      {:else}
        <div class={cn('h-20 w-20 rounded-full border-4', config.iconColor)}></div>
      {/if}
    </button>
    <p class="text-center text-muted-foreground">{customStatusText || statusText}</p>
  </CardContent>
</Card>
