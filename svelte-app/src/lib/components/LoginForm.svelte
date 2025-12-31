<script lang="ts">
  import { signIn } from '@auth/sveltekit/client';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { Home, Mail, Lock } from '@lucide/svelte';

  interface Props {
    onSuccess: () => void;
  }

  let { onSuccess }: Props = $props();

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let isLoading = $state(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    isLoading = true;
    error = '';

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        error = 'Invalid credentials';
      } else if (result?.ok) {
        onSuccess();
      }
    } catch {
      error = 'Connection error';
    }

    isLoading = false;
  }
</script>

<div class="flex min-h-screen items-center justify-center p-4">
  <Card.Root class="w-full max-w-sm">
    <Card.Header class="text-center">
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
      >
        <Home class="h-8 w-8 text-primary" />
      </div>
      <Card.Title class="text-2xl">House Control</Card.Title>
      <Card.Description>Sign in to access your devices</Card.Description>
    </Card.Header>
    <Card.Content>
      <form onsubmit={handleSubmit} class="space-y-4">
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <div class="relative">
            <Mail class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              bind:value={email}
              class="pl-10"
              autocomplete="email"
              required
            />
          </div>
        </div>
        <div class="space-y-2">
          <Label for="password">Password</Label>
          <div class="relative">
            <Lock class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              bind:value={password}
              class="pl-10"
              autocomplete="current-password"
              required
            />
          </div>
        </div>
        {#if error}
          <p class="text-center text-sm text-destructive">{error}</p>
        {/if}
        <Button type="submit" class="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </Card.Content>
  </Card.Root>
</div>
