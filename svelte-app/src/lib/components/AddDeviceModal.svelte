<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';

  interface Props {
    open: boolean;
    homes: Array<{ id: string; name: string }>;
    onClose: () => void;
    onSubmit: (device: {
      name: string;
      type: string;
      homeId: string | null;
      mqttConfig: any;
    }) => Promise<void>;
  }

  let { open, homes, onClose, onSubmit }: Props = $props();

  let name = $state('');
  let type = $state('power_button');
  let homeId = $state<string | null>(null);
  let endpoint = $state('');
  let region = $state('ap-southeast-1');
  let cmdTopic = $state('');
  let ackTopic = $state('');
  let statusTopic = $state('');
  let isSubmitting = $state(false);

  const deviceTypes = [
    { value: 'power_button', label: 'Power Button' },
    { value: 'door_lock', label: 'Door Lock' },
    { value: 'light', label: 'Light' },
    { value: 'thermostat', label: 'Thermostat' },
    { value: 'camera', label: 'Camera' }
  ];

  const homeOptions = $derived([
    { value: 'private', label: '🔒 Private Device' },
    ...homes.map((h) => ({ value: h.id, label: `🏠 ${h.name}` }))
  ]);

  let locationValue = $state('private');

  const locationTriggerContent = $derived(
    homeOptions.find((h) => h.value === locationValue)?.label ?? 'Select location'
  );

  // Sync locationValue with homeId
  $effect(() => {
    homeId = locationValue === 'private' ? null : locationValue;
  });

  async function handleSubmit() {
    if (!name || !endpoint || !cmdTopic || !ackTopic || !statusTopic) {
      alert('Please fill in all required fields');
      return;
    }

    isSubmitting = true;
    try {
      await onSubmit({
        name,
        type,
        homeId: homeId === 'private' ? null : homeId,
        mqttConfig: {
          endpoint,
          region,
          cmdTopic,
          ackTopic,
          statusTopic
        }
      });

      // Reset form
      name = '';
      endpoint = '';
      cmdTopic = '';
      ackTopic = '';
      statusTopic = '';
      homeId = null;

      onClose();
    } catch (error) {
      console.error('Add device error:', error);
      alert('Failed to add device');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Dialog.Root {open} onOpenChange={(o) => !o && onClose()}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Add New Device</Dialog.Title>
      <Dialog.Description>Configure a new IoT device for your home.</Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="name">Device Name</Label>
        <Input id="name" bind:value={name} placeholder="e.g., Living Room PC" />
      </div>

      <div class="space-y-2">
        <Label for="type">Device Type</Label>
        <Select.Root type="single" bind:value={type}>
          <Select.Trigger>
            {deviceTypes.find((t) => t.value === type)?.label ?? 'Select type'}
          </Select.Trigger>
          <Select.Content>
            {#each deviceTypes as deviceType (deviceType.value)}
              <Select.Item value={deviceType.value} label={deviceType.label}>
                {deviceType.label}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="space-y-2">
        <Label for="home">Location</Label>
        <Select.Root type="single" bind:value={locationValue}>
          <Select.Trigger>
            {locationTriggerContent}
          </Select.Trigger>
          <Select.Content>
            {#each homeOptions as homeOption (homeOption.value)}
              <Select.Item value={homeOption.value} label={homeOption.label}>
                {homeOption.label}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="space-y-2">
        <Label for="endpoint">AWS IoT Endpoint</Label>
        <Input id="endpoint" bind:value={endpoint} placeholder="xxxxx.iot.region.amazonaws.com" />
      </div>

      <div class="space-y-2">
        <Label for="region">AWS Region</Label>
        <Input id="region" bind:value={region} placeholder="ap-southeast-1" />
      </div>

      <div class="space-y-2">
        <Label for="cmdTopic">Command Topic</Label>
        <Input id="cmdTopic" bind:value={cmdTopic} placeholder="home/device/cmd" />
      </div>

      <div class="space-y-2">
        <Label for="ackTopic">Acknowledgment Topic</Label>
        <Input id="ackTopic" bind:value={ackTopic} placeholder="home/device/ack" />
      </div>

      <div class="space-y-2">
        <Label for="statusTopic">Status Topic</Label>
        <Input id="statusTopic" bind:value={statusTopic} placeholder="home/device/status" />
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={onClose} disabled={isSubmitting}>Cancel</Button>
      <Button onclick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Adding...' : 'Add Device'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
