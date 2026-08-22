import { digitsOnlyPhone } from '../utils/contactLinks';

let passed = 0;
let failed = 0;

function assert(cond: unknown, name: string): void {
  if (cond) {
    passed += 1;
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}`);
}

function assertEqual<T>(actual: T, expected: T, name: string): void {
  assert(actual === expected, `${name} (got ${JSON.stringify(actual)})`);
}

// 1. Phone number normalization tests
assertEqual(digitsOnlyPhone('+90 555 123 45 67'), '905551234567', 'normalized +90 format');
assertEqual(digitsOnlyPhone('0555 123 45 67'), '905551234567', 'normalized 0555 format');
assertEqual(digitsOnlyPhone('5551234567'), '905551234567', 'normalized 10-digit format');
assertEqual(digitsOnlyPhone('0(555) 123-45-67'), '905551234567', 'normalized with punctuation');
assertEqual(digitsOnlyPhone(''), '', 'empty phone returns empty');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
