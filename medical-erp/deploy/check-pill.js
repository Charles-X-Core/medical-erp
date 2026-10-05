try {
  const lucide = require('lucide-react');
  console.log('Pill type:', typeof lucide.Pill);
  console.log('Pill:', lucide.Pill);
} catch(e) {
  console.log('ERROR:', e.message);
}
