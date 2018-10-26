const fs = require('fs');

// given kvm map, return encryped string or empty if error
function encryptContent( kvm) {

  let buffer = '';

  // read source as is
  if( kvm.has('srcFile') && fs.existsSync(kvm.get('srcFile'))) {
    buffer += fs.readFileSync( kvm.get('srcFile') , 'utf-8');
  }

  // read
  if( kvm.has('kvFiles')) {
    if( buffer.length > 0) {
      buffer += '\n';
    }
    kvm.get('kvFiles').forEach(elem => {
      buffer += elem.key + '=' + readFile( elem.value) + '\n';
    });
  }

  const dotenv = require('dotenv');

  let isDevMode = false;
  if( (!process.env.NODE_ENV) || process.env.NODE_ENV === 'development') {
    isDevMode = true;
    dotenv.config()
    console.log('is in dev mode');
  }

  // my key should exist. if not default key will be used - not recommended
  if( ! process.env.MY_ENCRYPTION_KEY) {
    console.log('*** process.env.MY_ENCRYPTION_KEY is missing ***');
  }

  const enc = require('./enc.js');
  let encText = enc.encrypt(buffer);
  
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
  let finalText = encText.text + hash.replace('==','') + encText.iv.replace('==' , '');
  console.log('final: ' ,finalText);
  
  let chunks;
  if( kvm.get('chunk')) {
    // chunk it to 64 byte sizes
    const re = new RegExp('.{1,' + 64 + '}', 'g');
    const alist = finalText.match(re);
    chunks = alist.join('\n');
  } else {
    chunks = finalText;
  }
  
  if( isDevMode) {
    console.log('\nchunks:\n' + chunks);
    console.log('writing to file:' , kvm.get('tgtFile'));
  }

  fs.writeFileSync(kvm.get('tgtFile') , chunks);
  return true;
}

// returns a map
function parseArgs(argv) {

  let kvMap = new Map();
  let kvFiles = [];
  
  // -s src -t target -f key=value -n => no chunking
  let vlen = argv.length;
  if( vlen > 0) {
    for(let i = 0 ; i < vlen ; i++) {
      if( argv[i].startsWith('-')) {
        let lv = argv[i].toLowerCase();
        switch(lv) {
          case '-n' :
            kvMap.set('chunk' , false);
            break;

          case '-s' :
            if( i < (vlen - 1)) {
              kvMap.set('srcFile' , argv[i+1]);
              i++
            }
            break;

          case '-t':
            if( i < (vlen - 1)) {
              kvMap.set('tgtFile' , argv[i+1]);
              i++
            }
            break;

          case '-f':
            if( i < (vlen - 1)) {
              let kvtext = argv[i+1];
              let parts = kvtext.split('=');
              if( parts.length === 2) {
                kvFiles.push( { key: parts[0].trim() , value: parts[1].trim()});
                i++;
              }
            }
            break;
        }
      }
    }
  }

  if( !kvMap.has('chunk')) {
    kvMap.set('chunk',true);
  }

  if( !kvMap.has('tgtFile')) {
    kvMap.set('tgtFile' , '.randomcfg');
  }

  if( kvFiles.length > 0 ) {
    kvMap.set('kvFiles' , kvFiles);
  }

  return kvMap;
}

// returns read content
function readFile(fileName) {

  if( fs.existsSync(fileName)) {
    let content;
    try {
      content = fs.readFileSync(fileName, 'utf-8');
      // replace /r and /n into literal '/r' and '/n'

      content = content.replace( /\r/g , '\\r');
      content = content.replace( /\n/g , '\\n');

      return content;

    } catch (e) {
      // don't fail
      console.log(e);
    }
  }
  return '';
}

module.exports = { encryptContent, parseArgs, readFile };