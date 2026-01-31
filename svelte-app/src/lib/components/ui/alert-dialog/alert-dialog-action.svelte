<script lang="ts">
  import { Button, type Props as ButtonProps } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  type $$Props = ButtonProps & HTMLButtonAttributes;

  let className: $$Props['class'] = undefined;
  export { className as class };
</script>

<Button
  class={cn('text-destructive-foreground bg-destructive hover:bg-destructive/90', className)}
  {...$$restProps}
>
  <slot />
</Button>
