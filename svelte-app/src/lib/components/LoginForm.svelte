<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { signIn } from '@auth/sveltekit/client';
  import { invalidate } from '$app/navigation';

  interface Props {
    onSuccess: () => void;
    showRegister?: boolean;
  }

  let { onSuccess, showRegister = false }: Props = $props();

  let email = $state('');
  let password = $state('');
  let name = $state('');
  let isLoading = $state(false);
  let error = $state('');
  // svelte-ignore state_referenced_locally
    let mode = $state<'login' | 'register'>(showRegister ? 'register' : 'login');

  async function handleLogin() {
    isLoading = true;
    error = '';

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        error = 'Invalid email or password';
      } else {
        await invalidate('auth:session');
        onSuccess();
      }
    } catch (err) {
      error = 'Login failed. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  async function handleRegister() {
    isLoading = true;
    error = '';

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();

      if (!response.ok) {
        error = data.error || 'Registration failed';
        return;
      }

      // Auto-login after registration
      await handleLogin();
    } catch (err) {
      error = 'Registration failed. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (mode === 'login') {
      handleLogin();
    } else {
      handleRegister();
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center p-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header class="text-center">
      <Card.Title class="text-2xl font-bold">
        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
      </Card.Title>
      <Card.Description>
        {mode === 'login'
          ? 'Sign in to control your devices'
          : 'Register to start managing your smart home'}
      </Card.Description>
    </Card.Header>

    <Card.Content>
      <form onsubmit={handleSubmit} class="space-y-4">
        {#if mode === 'register'}
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input id="name" bind:value={name} placeholder="John Doe" required />
          </div>
        {/if}

        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" type="email" bind:value={email} placeholder="you@example.com" required />
        </div>

        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input
            id="password"
            type="password"
            bind:value={password}
            placeholder="••••••••"
            required
          />
          {#if mode === 'register'}
            <p class="text-xs text-muted-foreground">Must be at least 8 characters</p>
          {/if}
        </div>

        {#if error}
          <p class="text-sm text-destructive">{error}</p>
        {/if}

        <Button type="submit" class="w-full" disabled={isLoading}>
          {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>
    </Card.Content>

    <Card.Footer class="flex justify-center">
      <button
        type="button"
        onclick={() => {
          mode = mode === 'login' ? 'register' : 'login';
          error = '';
        }}
        class="text-sm text-muted-foreground hover:text-primary"
      >
        {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
      </button>
    </Card.Footer>
  </Card.Root>
</div>
