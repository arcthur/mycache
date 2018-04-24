import test from 'ava';
import LZString from '../lib/LZString';

function test_set(compress, decompress) {
  test('compresses and decompresses  "Hello world!"', (t) => {
    const compressed = compress('Hello world!');
    t.not(compressed, 'Hello world!');
    const decompressed = decompress(compressed);
    t.is(decompressed, 'Hello world!');
  });

  test('compresses and decompresses null', (t) => {
    const compressed = compress(null);
    t.is(compressed.length, 0);
    const decompressed = decompress(compressed);
    t.is(decompressed, null);
  });

  test('compresses and decompresses undefined', (t) => {
    const compressed = compress();
    t.is(compressed.length, 0);
    const decompressed = decompress(compressed);
    t.is(decompressed, null);
  });

  test('decompresses null', (t) => {
    const decompressed = decompress(null);
    t.is(decompressed, '');
  });

  test('compresses and decompresses an empty string', (t) => {
    const compressed = compress('');
    t.not(compressed.length, 0);
    const decompressed = decompress(compressed);
    t.is(decompressed, '');
  });

  test('compresses and decompresses all printable UTF-16 characters', (t) => {
    let testString = '';
    let i;
    for (i = 32; i < 127; ++i) {
      testString += String.fromCharCode(i);
    }
    for (i = 128 + 32; i < 55296; ++i) {
      testString += String.fromCharCode(i);
    }
    for (i = 63744; i < 65536; ++i) {
      testString += String.fromCharCode(i);
    }

    const compressed = compress(testString);
    t.not(compressed, testString);
    const decompressed = decompress(compressed);
    t.is(decompressed, testString);
  });

  test('compresses and decompresses a string that repeats', (t) => {
    const testString = 'aaaaabaaaaacaaaaadaaaaaeaaaaa';
    const compressed = compress(testString);
    t.not(compressed, testString);
    t.true(compressed.length < testString.length);
    const decompressed = decompress(compressed);
    t.is(decompressed, testString);
  });

  test('compresses and decompresses a long string', (t) => {
    let testString = '';
    for (let i = 0; i < 1000; i++) {
      testString += Math.random() + ' ';
    }

    const compressed = compress(testString);
    t.not(compressed, testString);
    t.true(compressed.length < testString.length);
    const decompressed = decompress(compressed);
    t.is(decompressed, testString);
  });
}

test_set(LZString.compress, LZString.decompress);
test_set(LZString.compressToUTF16, LZString.decompressFromUTF16);