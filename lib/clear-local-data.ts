export function clearFlexidineBrowserData() {
  const removed: string[] = [];

  function wipe(store: Storage) {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key && key.startsWith("flexidine-")) keys.push(key);
    }
    keys.forEach((key) => {
      store.removeItem(key);
      removed.push(key);
    });
  }

  wipe(window.localStorage);
  wipe(window.sessionStorage);
  return removed;
}
