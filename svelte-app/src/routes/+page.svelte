<script lang="ts">
  import { page } from '$app/state';
  import { signOut } from '@auth/sveltekit/client';
  import DeviceGrid from '$lib/components/DeviceGrid.svelte';
  import LoginForm from '$lib/components/LoginForm.svelte';
  import { Button } from '$lib/components/ui/button';
  import { LogOut, House, Moon, Sun } from '@lucide/svelte';

  // Access session from $page.data (set by +layout.server.ts)
  let session = $derived(page.data?.session);
  let devices = $derived(page.data?.devices);

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
  let isLoading = $state(true);

  async function handleLogout() {
    // Use signOut with redirect: false, then do full page reload
    await signOut({ redirect: false });
    window.location.href = '/';
  }
</script>

{#if !session}
  <LoginForm />
{:else}
  <main class="min-h-screen p-4">
    <header class="mb-8">
      <div class="flex flex-row items-center justify-between">
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
            <LogOut class="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-7xl">
      <!-- {#if isLoading}
        <div class="flex h-100 items-center justify-center">
          <p class="text-muted-foreground">Loading...</p>
        </div>
      {:else} -->
      <DeviceGrid {devices} />
      <!-- {/if} -->
    </div>
  </main>
{/if}
