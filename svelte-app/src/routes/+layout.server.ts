export async function load(event) {
  const session = await event.locals.auth?.();

  console.log('Layout server load - session:', session ? 'exists' : 'null');

  return {
    session
  };
}
