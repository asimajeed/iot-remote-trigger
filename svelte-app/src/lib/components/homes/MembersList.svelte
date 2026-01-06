<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Crown, Shield, User, UserMinus } from '@lucide/svelte';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';

  interface Member {
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }

  interface Props {
    homeId: string;
    members: Member[];
    currentUserId: string;
    currentUserRole: 'owner' | 'admin' | 'member';
    onRemove: (userId: string) => Promise<void>;
  }

  let { homeId, members, currentUserId, currentUserRole, onRemove }: Props = $props();

  let removingUserId = $state<string | null>(null);
  let showConfirm = $state(false);
  let userToRemove = $state<Member | null>(null);

  function confirmRemove(member: Member) {
    userToRemove = member;
    showConfirm = true;
  }

  async function handleRemove() {
    if (!userToRemove) return;

    removingUserId = userToRemove.userId;
    try {
      await onRemove(userToRemove.userId);
      showConfirm = false;
      userToRemove = null;
    } finally {
      removingUserId = null;
    }
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case 'owner': return Crown;
      case 'admin': return Shield;
      default: return User;
    }
  }

  function getRoleBadgeClass(role: string) {
    switch (role) {
      case 'owner':
        return 'bg-primary/10 text-primary';
      case 'admin':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  const canRemoveMember = $derived(
    currentUserRole === 'owner' || currentUserRole === 'admin'
  );
</script>

<div class="rounded-lg border bg-card p-6">
  <h3 class="mb-4 text-lg font-semibold">Members ({members.length})</h3>

  <div class="space-y-3">
    {#each members as member (member.userId)}
      <div class="flex items-center justify-between rounded-lg border p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User class="h-5 w-5 text-primary" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <p class="font-medium">
                {member.user.name || member.user.email}
              </p>
              {#if member.userId === currentUserId}
                <span class="text-xs text-muted-foreground">(You)</span>
              {/if}
            </div>
            <p class="text-sm text-muted-foreground">{member.user.email}</p>
            <div class="mt-1 flex items-center gap-2">
              {#if member.role === 'owner'}
                <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                  <Crown class="h-3 w-3" />
                  Owner
                </span>
              {:else if member.role === 'admin'}
                <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Shield class="h-3 w-3" />
                  Admin
                </span>
              {:else}
                <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                  <User class="h-3 w-3" />
                  Member
                </span>
              {/if}
              <span class="text-xs text-muted-foreground">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {#if canRemoveMember && member.userId !== currentUserId && member.role !== 'owner'}
          <Button
            variant="ghost"
            size="sm"
            onclick={() => confirmRemove(member)}
            disabled={removingUserId === member.userId}
          >
            <UserMinus class="mr-2 h-4 w-4" />
            {removingUserId === member.userId ? 'Removing...' : 'Remove'}
          </Button>
        {/if}
      </div>
    {/each}
  </div>
</div>

<AlertDialog.Root bind:open={showConfirm}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Remove Member</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to remove {userToRemove?.user.name || userToRemove?.user.email} from this home?
        They will immediately lose access to all devices.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action onclick={handleRemove} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Remove Member
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
