export async function load(event) {
  // This makes the load function depend on the auth state
  // When invalidateAll() is called, this will rerun
  event.depends('auth:session');

  const session = await event.locals.auth?.();

  console.log('Layout server load - session:', session ? 'exists' : 'null');

  return {
    session
  };
}
