// get argv
let isDevMode = false;

if( !process.env.NODE_ENV || process.env.NODE_ENV == 'development') {
  isDevMode = true;
  console.log(process.argv);
}

// this contains the argv portion
var argv = process.argv.slice(2);
if( isDevMode) {
  console.log(argv);
}

// argv 0 = source file (default = plain.cfg)
// 1 = target file ( default = random.cfg)

var srcFile = 'plain.cfg';
var tgtFile = '.randomcfg';

if( argv.length > 0) {
  srcFile = argv[0];
}

if( argv.length > 1) {
  tgtFile = argv[1];
}

if( isDevMode) {
  console.log('src,tgt files: ' , srcFile , tgtFile);
}
// ready to read plain config file

const dotenv = require('dotenv');

// if development, read the env stuff from .env
if( isDevMode) {
  console.log('config file read: ' , dotenv.config());
}

// my key should exist. if not default key will be used - not recommended
if( ! process.env.MY_ENCRYPTION_KEY) {
  console.log('*** process.env.MY_ENCRYPTION_KEY is missing ***');
}

const fs = require('fs');
const enc = require('./enc.js');

// read the src plain text config file
if( fs.existsSync(srcFile)) {
  var plainText = fs.readFileSync(srcFile, 'utf-8');
  var encText = enc.encrypt(plainText);
  
  if( !encText.iv && !encText.text) {
    console.log("error... nothing encrypted...");
    return;
  }
  if( isDevMode) {
    console.log('iv=' + encText.iv);
    console.log('encrypted text=' + encText.text);
  }
  
  // generate hash on text+iv
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(encText.text + encText.iv).digest('base64');

  // due to known size, we can safely remove == and add that later before decrypting

  const finalText = encText.text + hash.replace('==','') + encText.iv.replace('==' , '');

  // chunk it to 64 byte sizes
  const re = new RegExp('.{1,' + 64 + '}', 'g');
  const alist = finalText.match(re);
  const chunks = alist.join('\n');

  if( isDevMode) {
    console.log('\nchunks:\n' + chunks);
    console.log('writing to file:' , tgtFile);
  }

  fs.writeFileSync(tgtFile , chunks);
  
}