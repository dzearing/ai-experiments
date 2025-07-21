export function main(): void {
  console.log('Hello from {{name}}!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
