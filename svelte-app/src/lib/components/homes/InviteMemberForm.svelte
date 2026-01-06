<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { UserPlus } from '@lucide/svelte';

  interface Props {
    homeId: string;
    onSuccess: () => void;
  }

  let { homeId, onSuccess }: Props = $props();

  let email = $state('');
  let role = $state('member');
  let isSubmitting = $state(false);
  let error = $state('');

  const roles = [
    { value: 'member', label: 'Member - Can view and control devices' },
    { value: 'admin', label: 'Admin - Can manage members and devices' }
  ];

  const roleTriggerContent = $derived(
    roles.find((r) => r.value === role)?.label.split(' -')[0] ?? 'Select role'
  );

  async function handleSubmit() {
    if (!email) {
      error = 'Email is required';
      return;
    }

    isSubmitting = true;
    error = '';

    try {
      const res = await fetch(`/api/homes/${homeId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });

      if (!res.ok) {
        const data = await res.json();
        error = data.error || 'Failed to invite member';
        return;
      }

      // Reset form
      email = '';
      role = 'member';
      onSuccess();
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="rounded-lg border bg-card p-6">
  <div class="mb-4 flex items-center gap-2">
    <UserPlus class="h-5 w-5 text-primary" />
    <h3 class="text-lg font-semibold">Invite Member</h3>
  </div>

  <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
    <div class="space-y-2">
      <Label for="email">Email Address</Label>
      <Input
        id="email"
        type="email"
        bind:value={email}
        placeholder="friend@example.com"
        disabled={isSubmitting}
      />
      <p class="text-xs text-muted-foreground">
        User must have an account to be invited
      </p>
    </div>

    <div class="space-y-2">
      <Label for="role">Role</Label>
      <Select.Root type="single" bind:value={role}>
        <Select.Trigger disabled={isSubmitting}>
          {roleTriggerContent}
        </Select.Trigger>
        <Select.Content>
          {#each roles as roleOption (roleOption.value)}
            <Select.Item value={roleOption.value} label={roleOption.label}>
              {roleOption.label}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>

    {#if error}
      <p class="text-sm text-destructive">{error}</p>
    {/if}

    <Button type="submit" disabled={isSubmitting} class="w-full">
      {isSubmitting ? 'Inviting...' : 'Invite Member'}
    </Button>
  </form>
</div>
