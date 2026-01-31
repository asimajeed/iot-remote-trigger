<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { signIn } from '@auth/sveltekit/client';

  interface Props {
    showRegister?: boolean;
  }

  let { showRegister = false }: Props = $props();

  let email = $state('');
  let password = $state('');
  let name = $state('');
  let isLoading = $state(false);
  let error = $state('');
  // svelte-ignore state_referenced_locally
  let mode = $state<'login' | 'register'>(showRegister ? 'register' : 'login');

  async function handleLogin(e: Event) {
    e.preventDefault();
    isLoading = true;
    error = '';

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      console.log('SignIn result:', result);

      if (result?.error) {
        error = 'Invalid email or password';
        isLoading = false;
        return;
      }

      // Success - do a full page reload to get fresh session
      window.location.href = '/';
    } catch (err) {
      console.error('Login error:', err);
      error = 'Login failed. Please try again.';
      isLoading = false;
    }
  }

  async function handleRegister(e: Event) {
    e.preventDefault();
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

      // After successful registration, switch to login mode
      mode = 'login';
      error = '';
      password = ''; // Clear password for security
    } catch (err) {
      error = 'Registration failed. Please try again.';
    } finally {
      isLoading = false;
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
      {#if mode === 'register'}
        <!-- Registration form -->
        <form onsubmit={handleRegister} class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input id="name" name="name" bind:value={name} placeholder="John Doe" required />
          </div>

          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              bind:value={email}
              placeholder="you@example.com"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              bind:value={password}
              placeholder="••••••••"
              required
            />
            <p class="text-xs text-muted-foreground">Must be at least 8 characters</p>
          </div>

          {#if error}
            <p class="text-sm text-destructive">{error}</p>
          {/if}

          <Button type="submit" class="w-full" disabled={isLoading}>
            {isLoading ? 'Please wait...' : 'Create Account'}
          </Button>
        </form>
      {:else}
        <!-- Login form -->
        <form onsubmit={handleLogin} class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              bind:value={email}
              placeholder="you@example.com"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              bind:value={password}
              placeholder="••••••••"
              required
            />
          </div>

          {#if error}
            <p class="text-sm text-destructive">{error}</p>
          {/if}

          <Button type="submit" class="w-full" disabled={isLoading}>
            {isLoading ? 'Please wait...' : 'Sign In'}
          </Button>
        </form>
      {/if}
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
