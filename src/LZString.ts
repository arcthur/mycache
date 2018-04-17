// private property
const f = String.fromCharCode;
const Base64CharArray = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split('');

let i = 0;
let reverseDict: any = {};
let UriSafeCharArray = Base64CharArray.concat();
UriSafeCharArray[63] = '-';
UriSafeCharArray[64] = '$';

while (i < 65) {
  if (i > 62) {
    reverseDict[UriSafeCharArray[i].charCodeAt(0)] = i;
  }
  reverseDict[Base64CharArray[i].charCodeAt(0)] = i++;
}

const _node = (val: any) => ({ v: val, d: {} });
const _compress = function(uncompressed: string | null, bitsPerChar: number, getCharFromInt: (data: any) => any): string[] {
  if (uncompressed === null || uncompressed === undefined) { return []; }

  let i = 0;
  let j = 0;
  let value = 0;
  let dictionary: any = new Map();
  let freshNode = true;
  let c = 0;

  // first node will always be initialised like this.
  let node: any = _node(3); 
  let nextNode;
  let enlargeIn = 1;
  let dictSize = 4;
  let numBits = 2;
  let data = [];
  let data_val = 0;
  let data_position = 0;

  if (uncompressed.length) {
    // If there is a string, the first charCode is guaranteed to
    // be new, so we write it to output stream, and add it to the
    // dictionary. For the same reason we can initialize freshNode
    // as true, and new_node, node and dictSize as if
    // it was already added to the dictionary (see above).
    c = uncompressed.charCodeAt(0);

    // == Write first charCode token to output ==

    // 8 or 16 bit?
    value = c < 256 ? 0 : 1

    // insert 'new 8/16 bit charCode' token
    // into bitstream (value 1)
    for (i = 0; i < numBits; i++) {
      // Value is 0 (8 bit) or 1 (16 bit).
      // We shift it into the bitstream in reverse
      // (shifting has precedence over bitmasking)
      data_val = value >> i | data_val << 1;
      if (++data_position === bitsPerChar) {
        data_position = 0;
        data.push(getCharFromInt(data_val));
        data_val = 0;
      }
    }
    // insert charCode bits into bitstream
    // Nasty but effective hack:
    // loop 8 or 16 times based on token value
    value = 8 + 8 * value;
    for (i = 0; i < value; i++) {
      // shifting has precedence over bitmasking
      data_val = c >> i & 1 | data_val << 1;
      if (++data_position === bitsPerChar) {
        data_position = 0;
        data.push(getCharFromInt(data_val));
        data_val = 0;
      }
    }

    // Add charCode to the dictionary.
    dictionary.set(c, node);

    for (j = 1; j < uncompressed.length; j++) {
      c = uncompressed.charCodeAt(j);
      // does the new charCode match an existing prefix?
      nextNode = node.d[c];
      if (nextNode) {
        // continue with next prefix
        node = nextNode;
      } else {

        // Prefix+charCode does not exist in trie yet.
        // We write the prefix to the bitstream, and add
        // the new charCode to the dictionary if it's new
        // Then we set `node` to the root node matching
        // the charCode.

        if (freshNode) {
          // Prefix is a freshly added character token,
          // which was already written to the bitstream
          freshNode = false;
        } else {
          // write out the current prefix token
          value = node.v;
          for (i = 0; i < numBits; i++) {
            // shifting has precedence over bitmasking
            data_val = value >> i & 1 | data_val << 1;
            if (++data_position === bitsPerChar) {
              data_position = 0;
              data.push(getCharFromInt(data_val));
              data_val = 0;
            }
          }
        }

        // Is the new charCode a new character
        // that needs to be stored at the root?
        if (!dictionary.has(c)) {
          // increase token bitlength if necessary
          if (--enlargeIn === 0) {
            enlargeIn = 1 << numBits++;
          }

          // insert 'new 8/16 bit charCode' token,
          // see comments above for explanation
          value = c < 256 ? 0 : 1
          for (i = 0; i < numBits; i++) {
            data_val = value >> i | data_val << 1;
            if (++data_position === bitsPerChar) {
              data_position = 0;
              data.push(getCharFromInt(data_val));
              data_val = 0;
            }
          }
          value = 8 + 8 * value;
          for (i = 0; i < value; i++) {
            data_val = c >> i & 1 | data_val << 1;
            if (++data_position == bitsPerChar) {
              data_position = 0;
              data.push(getCharFromInt(data_val));
              data_val = 0;
            }
          }
          dictionary.set(c, _node(dictSize++));
          // Note of that we already wrote
          // the charCode token to the bitstream
          freshNode = true;
        }
        // add node representing prefix + new charCode to trie
        node.d[c] = _node(dictSize++)
        // increase token bitlength if necessary
        if (--enlargeIn === 0) {
          enlargeIn = 1 << numBits++;
        }
        // set node to first charCode of new prefix
        node = dictionary.get(c);
      }
    }

    // === Write last prefix to output ===
    if (freshNode) {
      // character token already written to output
      freshNode = false;
    } else {
      // write out the prefix token
      value = node.v;
      for (i = 0; i < numBits; i++) {
        // shifting has precedence over bitmasking
        data_val = value >> i & 1 | data_val << 1;
        if (++data_position === bitsPerChar) {
          data_position = 0;
          data.push(getCharFromInt(data_val));
          data_val = 0;
        }
      }
    }

    // Is c a new character?
    if (!dictionary.has(c)) {
      // increase token bitlength if necessary
      if (--enlargeIn === 0) {
        enlargeIn = 1 << numBits++;
      }
      // insert 'new 8/16 bit charCode' token,
      // see comments above for explanation
      value = c < 256 ? 0 : 1
      for (i = 0; i < numBits; i++) {
        data_val = value >> i | data_val << 1;
        if (++data_position === bitsPerChar) {
          data_position = 0;
          data.push(getCharFromInt(data_val));
          data_val = 0;
        }
      }
      value = 8 + 8 * value;
      for (i = 0; i < value; i++) {
        data_val = c >> i & 1 | data_val << 1;
        if (++data_position === bitsPerChar) {
          data_position = 0;
          data.push(getCharFromInt(data_val));
          data_val = 0;
        }
      }
    }
    // increase token bitlength if necessary
    if (--enlargeIn === 0) {
      enlargeIn = 1 << numBits++;
    }
  }

  // Mark the end of the stream
  for (i = 0; i < numBits; i++) {
    // shifting has precedence over bitmasking
    data_val = 2 >> i & 1 | data_val << 1;
    if (++data_position === bitsPerChar) {
      data_position = 0;
      data.push(getCharFromInt(data_val));
      data_val = 0;
    }
  }

  // Flush the last char
  data_val <<= bitsPerChar - data_position;
  data.push(getCharFromInt(data_val));
  return data;
};

const _decompress = function(length: number, resetBits: number, getNextValue: (num: number) => any): string {
  let dictionary = ['', '', ''];
  let enlargeIn = 4;
  let dictSize = 4;
  let numBits = 3;
  let entry = '';
  let result = [];
  let bits = 0;
  let maxpower = 2;
  let power = 0;
  let c = '';
  let data_val = getNextValue(0);
  let data_position = resetBits;
  let data_index = 1;

  // Get first token, guaranteed to be either
  // a new character token (8 or 16 bits)
  // or end of stream token.
  while (power !== maxpower) {
    // shifting has precedence over bitmasking
    bits += (data_val >> --data_position & 1) << power++;
    if (data_position == 0) {
      data_position = resetBits;
      data_val = getNextValue(data_index++);
    }
  }

  // if end of stream token, return empty string
  if (bits === 2) {
    return '';
  }

  // else, get character
  maxpower = bits * 8 + 8;
  bits = power = 0;
  while (power !== maxpower) {
    // shifting has precedence over bitmasking
    bits += (data_val >> --data_position & 1) << power++;
    if (data_position === 0) {
      data_position = resetBits;
      data_val = getNextValue(data_index++);
    }
  }
  c = f(bits);
  dictionary[3] = c;
  result.push(c);

  // read rest of string
  while (data_index <= length) {
    // read out next token
    maxpower = numBits;
    bits = power = 0;
    while (power !== maxpower) {
      // shifting has precedence over bitmasking
      bits += (data_val >> --data_position & 1) << power++;
      if (data_position === 0) {
        data_position = resetBits;
        data_val = getNextValue(data_index++);
      }
    }

    // 0 or 1 implies new character token
    if (bits < 2) {
      maxpower = (8 + 8 * bits);
      bits = power = 0;
      while (power !== maxpower) {
        // shifting has precedence over bitmasking
        bits += (data_val >> --data_position & 1) << power++;
        if (data_position === 0) {
          data_position = resetBits;
          data_val = getNextValue(data_index++);
        }
      }
      dictionary[dictSize] = f(bits);
      bits = dictSize++;
      if (--enlargeIn === 0) {
        enlargeIn = 1 << numBits++;
      }
    } else if (bits == 2) {
      // end of stream token
      return result.join('');
    }

    if (bits > dictionary.length) {
      return null;
    }

    entry = bits < dictionary.length ? dictionary[bits] : c + c.charAt(0);
    result.push(entry);
    // Add c+entry[0] to the dictionary.
    dictionary[dictSize++] = c + entry.charAt(0);

    c = entry;

    if (--enlargeIn === 0) {
      enlargeIn = 1 << numBits++;
    }

  }
  return '';
};

const _compressToArray = function(uncompressed: string): string[] {
  return _compress(uncompressed, 16, (a: any) => f(a));
};

const _decompressFromArray = function(compressed: string[]) {
  if (compressed === null) { return ''; }
  if (compressed.length === 0) { return null; }

  return _decompress(compressed.length, 16, (index: number) => {
    return compressed[index].charCodeAt(0);
  });
};

const LZString = {
  compress(uncompressed: string): string {
    return _compressToArray(uncompressed).join('');
  },

  compressToArray: _compressToArray,

  decompress(compressed: string): string {
    if (compressed === null) { return ''; }
    if (compressed === '') { return null; }

    return _decompress(compressed.length, 16, (index: number) => {
      return compressed.charCodeAt(index);
    });
  },

  decompressFromArray: _decompressFromArray,
};

export default LZString;