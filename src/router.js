export function selectedFromHash() {
  const match = window.location.hash.match(/demo-(\d+)/);
  return match ? Number(match[1]) : null;
}
