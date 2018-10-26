// string encrypt decrypt
const dotenv = require('dotenv');

// if development, read the env stuff from .env
if( !process.env.NODE_ENV || process.env.NODE_ENV == 'development') {
  dotenv.config();
}
// my key should exist. if not default key will be used - not recommended
if( ! process.env.MY_ENCRYPTION_KEY) {
  console.log('*** process.env.MY_ENCRYPTION_KEY is missing ***');
}

const enc = require('./enc.js');

// usage tools/senc.js text  or -d text
var argv = process.argv.slice(2);

if( argv.length > 0) {
  if( !argv[0].startsWith('-')) {
    // this is encrypt
    console.log('encrypted: ' + enc.encryptString(argv[0]));
  } else { // decript
    if( argv.length > 1 && argv[1].startsWith('ENC(')) {
      console.log('decrypted: ' + enc.decryptString(argv[1]));
    }
  }
}