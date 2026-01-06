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
	}

	let { name, icon, onPulse, pollStatus, pulseDuration = 2000 }: Props = $props();

	let deviceState = $state('disconnected');
	let customStatusText = $state('');
	let deviceOnline = $state(false);
	
	// Poll status on mount and periodically
	$effect(() => {
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
				if (deviceOnline && deviceState !== 'sending' && deviceState !== 'triggered' && deviceState !== 'error') {
					deviceState = 'ready';
				} else if (!deviceOnline && deviceState !== 'sending' && deviceState !== 'triggered' && deviceState !== 'error') {
					deviceState = 'disconnected';
				}
			} catch {
				if (deviceState !== 'sending' && deviceState !== 'triggered') {
					deviceState = 'error';
				}
			}
		};

		checkConnection();
		const interval = setInterval(checkConnection, 5000);

		return () => clearInterval(interval);
	});
	
	// Compute default status text based on state
	let defaultStatusText = $derived(
		deviceState === 'disconnected' ? 'Device offline' :
		deviceState === 'ready' ? `Tap to trigger ${name.toLowerCase()}` : 
		deviceState === 'sending' ? 'Sending command...' :
		deviceState === 'triggered' ? 'Triggered successfully!' :
		'Failed to send command'
	);
	
	// Display custom text if set, otherwise use default
	let statusText = $derived(customStatusText || defaultStatusText);

	async function handleClick() {
		if (deviceState === 'sending' || deviceState === 'disconnected') return;

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
			customStatusText = 'Failed to send command';
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

<Card class="w-full max-w-sm mx-auto">
	<CardHeader class="text-center">
		<CardTitle class="text-2xl font-bold">{name}</CardTitle>
		<div
			class="flex items-center justify-center gap-3 mt-4 px-4 py-2 bg-secondary/50 rounded-full w-fit mx-auto"
		>
			<span class={cn('w-3 h-3 rounded-full', config.statusDot)}></span>
			<span class={cn('text-sm font-medium', config.statusColor)}>
				{config.statusText}
			</span>
		</div>
		<p class="text-xs text-muted-foreground mt-2">
			Sends {pulseDuration}ms pulse when triggered
		</p>
	</CardHeader>
	<CardContent class="flex flex-col items-center gap-6 pb-8">
		<button
			onclick={handleClick}
			disabled={deviceState === 'sending' || deviceState === 'disconnected'}
			class={cn(
				'w-48 h-48 rounded-full flex items-center justify-center',
				'transition-all duration-200 ease-out',
				'shadow-lg hover:shadow-xl',
				'focus:outline-none focus:ring-4 focus:ring-ring/50',
				'disabled:opacity-50 disabled:cursor-not-allowed',
				config.buttonBg
			)}
			aria-label={`Trigger ${name}`}
		>
			{#if deviceState === 'sending'}
				<Loader2 class="w-20 h-20 text-amber-500 animate-spin" />
			{:else if IconComponent}
				<IconComponent class={cn('w-20 h-20', config.iconColor)} />
			{:else}
				<div class={cn('w-20 h-20 rounded-full border-4', config.iconColor)}></div>
			{/if}
		</button>
		<p class="text-muted-foreground text-center">{customStatusText || statusText}</p>
	</CardContent>
</Card>
