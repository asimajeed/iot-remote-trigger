<script lang="ts">
  import { page } from '$app/state';
  import { signOut } from '@auth/sveltekit/client';
  import PowerButtonCard from '$lib/components/PowerButtonCard.svelte';
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

  // Sync with system preference changes (if no manual override)
  $effect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        // Only auto-update if user hasn't manually set preference
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
  
  async function handleQuick(duration: number) {
    const response = await fetch('/api/mqtt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'quick', duration })
    });

    if (!response.ok) {
      throw new Error('Failed to send command');
    }

    const data = await response.json();
    return { ack: data.ack || 'unknown' };
  }

  async function handlePress() {
    const response = await fetch('/api/mqtt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'press' })
    });

    if (!response.ok) {
      throw new Error('Failed to press');
    }

    const data = await response.json();
    return { ack: data.ack || 'unknown' };
  }

  async function handleRelease() {
    const response = await fetch('/api/mqtt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'release' })
    });

    if (!response.ok) {
      throw new Error('Failed to release');
    }

    const data = await response.json();
    return { ack: data.ack || 'unknown' };
  }

  async function pollStatus() {
    const response = await fetch('/api/mqtt');

    if (!response.ok) {
      throw new Error('Failed to poll status');
    }

    const data = await response.json();
    return data;
  }

  async function handleLogout() {
    await signOut({ callbackUrl: '/' });
  }

  function handleLoginSuccess() {
    window.location.reload();
  }
</script>

{#if !session}
  <LoginForm onSuccess={handleLoginSuccess} />
{:else}
  <main class="min-h-screen p-4">
    <!-- Header -->
    <header class="mb-8 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <House class="h-6 w-6 text-primary" />
        <h1 class="text-xl font-semibold">House Control</h1>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" onclick={toggleTheme}>
          {#if theme === 'dark'}
            <Sun class="h-4 w-4" />
          {:else}
            <Moon class="h-4 w-4" />
          {/if}
        </Button>
        <Button variant="ghost" size="sm" onclick={handleLogout}>
          <LogOut class="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>

    <!-- Dashboard -->
    <div class="mx-auto max-w-4xl">
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PowerButtonCard
          onQuick={handleQuick}
          onPress={handlePress}
          onRelease={handleRelease}
          {pollStatus}
        />
      </div>
    </div>
  </main>
{/if}
