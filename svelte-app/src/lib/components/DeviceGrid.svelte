<script lang="ts">
	import PowerButtonCard from './PowerButtonCard.svelte';
	import PulseDeviceCard from './PulseDeviceCard.svelte';
	import { DoorOpen, Lock, Zap } from '@lucide/svelte';

	interface Device {
		id: string;
		name: string;
		type: string;
		pulseDurationMs?: number;
	}

	interface Props {
		devices: Device[];
	}

	let { devices }: Props = $props();

	// Get icon for device type
	function getDeviceIcon(type: string) {
		switch (type) {
			case 'gate':
				return DoorOpen;
			case 'lock':
				return Lock;
			default:
				return Zap;
		}
	}

	async function handleQuick(deviceId: string, duration: number) {
		const response = await fetch('/api/mqtt', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ deviceId, action: 'quick', duration })
		});

		if (!response.ok) {
			throw new Error('Failed to send command');
		}

		const data = await response.json();
		return { ack: data.ack || 'unknown' };
	}

	async function handlePress(deviceId: string) {
		const response = await fetch('/api/mqtt', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ deviceId, action: 'press' })
		});

		if (!response.ok) {
			throw new Error('Failed to press');
		}

		const data = await response.json();
		return { ack: data.ack || 'unknown' };
	}

	async function handleRelease(deviceId: string) {
		const response = await fetch('/api/mqtt', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ deviceId, action: 'release' })
		});

		if (!response.ok) {
			throw new Error('Failed to release');
		}

		const data = await response.json();
		return { ack: data.ack || 'unknown' };
	}

	async function pollStatus(deviceId: string) {
		const response = await fetch(`/api/mqtt?deviceId=${deviceId}`);

		if (!response.ok) {
			throw new Error('Failed to poll status');
		}

		const data = await response.json();
		return data;
	}

	async function handlePulse(deviceId: string, duration: number) {
		const response = await fetch('/api/mqtt', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ deviceId, action: 'pulse', duration })
		});

		if (!response.ok) {
			throw new Error('Failed to send pulse');
		}

		const data = await response.json();
		return { ack: data.ack || 'unknown' };
	}
</script>

<div class="space-y-4">
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each devices as device}
			{#if device.type === 'power_button'}
				<PowerButtonCard
					onQuick={(duration) => handleQuick(device.id, duration)}
					onPress={() => handlePress(device.id)}
					onRelease={() => handleRelease(device.id)}
					pollStatus={() => pollStatus(device.id)}
				/>
			{:else}
				<PulseDeviceCard
					name={device.name}
					icon={getDeviceIcon(device.type)}
					onPulse={() => handlePulse(device.id, device.pulseDurationMs || 2000)}
					pollStatus={() => pollStatus(device.id)}
					pulseDuration={device.pulseDurationMs || 2000}
				/>
			{/if}
		{/each}
	</div>

	{#if devices.length === 0}
		<div class="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
			<p class="text-muted-foreground">No devices found</p>
		</div>
	{/if}
</div>
