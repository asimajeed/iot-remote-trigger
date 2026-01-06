<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { signOut } from '@auth/sveltekit/client';
	import DeviceGrid from '$lib/components/DeviceGrid.svelte';
	import LoginForm from '$lib/components/LoginForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import { LogOut, House, Moon, Sun } from '@lucide/svelte';

	let session = $derived(page.data?.session);

	let theme = $state<'light' | 'dark'>(
		typeof window !== 'undefined'
			? localStorage.getItem('darkMode') === 'true' ||
				(!localStorage.getItem('darkMode') &&
					window.matchMedia('(prefers-color-scheme: dark)').matches)
				? 'dark'
				: 'light'
			: 'dark'
	);

	$effect(() => {
		if (typeof document !== 'undefined') {
			if (theme === 'dark') {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
			localStorage.setItem('darkMode', theme === 'dark' ? 'true' : 'false');
		}
	});

	$effect(() => {
		if (typeof window !== 'undefined') {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handler = (e: MediaQueryListEvent) => {
				if (!localStorage.getItem('darkMode')) {
					theme = e.matches ? 'dark' : 'light';
				}
			};
			mediaQuery.addEventListener('change', handler);
			return () => mediaQuery.removeEventListener('change', handler);
		}
	});

	const toggleTheme = () => {
		theme = theme === 'dark' ? 'light' : 'dark';
	};

	// State
	let devices = $state<any[]>([]);
	let isLoading = $state(true);

	// Load devices
	async function loadDevices() {
		if (!session) return;

		isLoading = true;
		console.log('Loading devices for user:', session.user);
		try {
			const devicesRes = await fetch('/api/devices');
			console.log('Devices response status:', devicesRes.status);
			if (devicesRes.ok) {
				devices = await devicesRes.json();
				console.log('Loaded devices:', devices);
			} else {
				const error = await devicesRes.text();
				console.error('Failed to load devices:', error);
			}
		} catch (error) {
			console.error('Failed to load devices:', error);
		} finally {
			isLoading = false;
		}
	}

	// Load data when session changes
	$effect(() => {
		if (session) {
			loadDevices();
		}
	});

	async function handleLogout() {
		await signOut({ redirect: false });
		await invalidate('auth:session');
		// Force reload to clear session state immediately
		window.location.href = '/';
	}

	async function handleLoginSuccess() {
		await invalidate('auth:session');
	}
</script>

{#if !session}
	<LoginForm onSuccess={handleLoginSuccess} />
{:else}
	<main class="min-h-screen p-4">
		<header class="mb-8">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<!-- Left side: Title -->
				<div class="flex items-center gap-2">
					<House class="h-6 w-6 text-primary" />
					<h1 class="text-xl font-semibold">House Control</h1>
				</div>

				<!-- Right side: Theme toggle and Sign Out -->
				<div class="flex items-center gap-2">
					<Button variant="ghost" size="icon" onclick={toggleTheme}>
						{#if theme === 'dark'}
							<Sun class="h-4 w-4" />
						{:else}
							<Moon class="h-4 w-4" />
						{/if}
					</Button>
					<Button variant="ghost" size="sm" onclick={handleLogout}>
						<LogOut class="mr-2 h-4 w-4" />
						<span class="hidden sm:inline">Sign Out</span>
						<span class="sm:hidden">Out</span>
					</Button>
				</div>
			</div>
		</header>

		<div class="mx-auto max-w-7xl">
			{#if isLoading}
				<div class="flex h-[400px] items-center justify-center">
					<p class="text-muted-foreground">Loading...</p>
				</div>
			{:else}
				<DeviceGrid {devices} />
			{/if}
		</div>
	</main>
{/if}
