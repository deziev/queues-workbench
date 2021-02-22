export function uid(): string {
  return `${Math.random() * Math.floor(9999)}-${Date.now()}`;
}