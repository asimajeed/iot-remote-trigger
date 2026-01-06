<script lang="ts">
	import { Button, type Props as ButtonProps } from "$lib/components/ui/button";
	import { cn } from "$lib/utils";
	import type { HTMLButtonAttributes } from "svelte/elements";

	type $$Props = ButtonProps & HTMLButtonAttributes;

	let className: $$Props["class"] = undefined;
	export { className as class };
</script>

<Button
	variant="outline"
	class={cn("mt-2 sm:mt-0", className)}
	{...$$restProps}
>
	<slot />
</Button>
