
// ready to read encrypted config file

function readEncConfig(autoDecrypt, srcFile  , override ) {

  /*
  console.log('autodecrypt: ' + autoDecrypt);
  console.log('srcFile    : ' + srcFile);
  console.log('override   : ' + override);
  */
 
  const dotenv = require('dotenv');

  let isDevMode = false;
  // if development, read the env stuff from .env
  if( !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    console.log('.env file: ' , dotenv.config());
    isDevMode = true;
  }

  const localFile = srcFile || '.randomcfg';
  const flag_override = override || false;

  const fs = require('fs');
  const enc = require('./enc.js');

  // read the encrypted text config file
  if( !fs.existsSync(localFile )) {
    if( isDevMode) {
      console.log('srcFile does not exist:' , localFile);
    }
    return;
  }

  // my key should exist. if not default key will be used - not recommended
  if( ! process.env.MY_ENCRYPTION_KEY) {
    console.log('*** process.env.MY_ENCRYPTION_KEY is missing ***');
  }

  var chunks = fs.readFileSync(localFile, 'utf-8');
  var nobreak = chunks.replace(/(\r\n|\n|\r)/gm,'');


  // file size must be greater than 44
  const clength = nobreak.length;
  if( clength <= 44 ) {
    console.log("*** not valid encrypted text. nothing processed ***");
    return ;
  }

  // add back in the == that we removed before

  const ivPortion = nobreak.substring(clength - 22) + '==';
  const hashPortion = nobreak.substring( clength - 44 , clength - 22) + "==";
  const textPortion = nobreak.substring(0,clength - 44);

  /*
  console.log('text=' + textPortion);
  console.log('iv=' + ivPortion);
  console.log('hash=' + hashPortion);
*/

  // verify the hash matches
  const crypto = require('crypto');

  const newHash = crypto.createHash('md5').update(textPortion + ivPortion).digest('base64');
  if( ! ( newHash === hashPortion)) {
    if( isDevMode) {
      console.log("*** invalid hash: " + newHash + ', does not match: ' + hashPortion);
    }
    return ;
  }

  // decrypt
  const myenc = require('./enc');
  const decryptedText = myenc.decrypt(ivPortion , textPortion);

  // if the content is not empty add them into env
  
  const decConfig = dotenv.parse(decryptedText);
  
  Object.keys(decConfig).forEach( function (key) {
    if( key.length > 0) {
      if( !process.env.hasOwnProperty(key) || flag_override) {
        let value = decConfig[key];
        // change \n to new line and remove \r
        value = value.replace(/\\r/g,'');
        value = value.replace(/\\n/g , '\n');
        if( value.startsWith('ENC(') && autoDecrypt) {
          value = enc.decryptString(value);
        }
        process.env[key] = value;
        if( isDevMode) {
          console.log('setting ', key , '=' , value);
        }
      } else {
        console.log(`"${key}" is already defined in \`process.env\` and will not be overwritten`);
      }
    }
  });

  return true;
}

module.exports = { readEncConfig };
