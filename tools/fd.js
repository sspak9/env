
const dotenv = require('dotenv');
const fs = require('fs');
const crypto = require('crypto');
var enc = require('./enc.js');

function updateEnv(dtext , autoDecrypt, flagOverride) {

  if( ! process.env.NODE_ENV ||  process.env.NODE_ENV === 'development') {
    console.log('*** updating env ***\nautoDecrypt:', autoDecrypt , '\nflagOverride', flagOverride);
  }

  const decConfig = dotenv.parse(dtext);
  
  Object.keys(decConfig).forEach( function (key) {
    if( key.length > 0) {
      if( !process.env.hasOwnProperty(key) || flagOverride) {
        let value = decConfig[key];
        // change \n to new line and remove \r
        value = value.replace(/\\r/g,'');
        value = value.replace(/\\n/g , '\n');
        if( value.startsWith('ENC(') && autoDecrypt) {
          value = enc.decryptString(value);
        }
        process.env[key] = value;
        if( ! process.env.NODE_ENV ||  process.env.NODE_ENV === 'development') {
          console.log("setting " + key + '=' + value);
        }
        
      } else {
        console.log(`"${key}" is already defined in \`process.env\` and will not be overwritten`);
      }
    }
  });
}

/*************************************************************************/
// return decrypted version of the text
function decryptRawText(etext) {

  const clength = etext.length;
  if( clength <= 44 ) {
    console.log("*** not valid encrypted text. nothing processed ***");
    return ;
  }

  // add back in the == that we removed before

  const ivPortion = etext.substring(clength - 22) + '==';
  const hashPortion = etext.substring( clength - 44 , clength - 22) + "==";
  const textPortion = etext.substring(0,clength - 44);

  const newHash = crypto.createHash('md5').update(textPortion + ivPortion).digest('base64');
  if( ! ( newHash === hashPortion)) {
    if( isDevMode) {
      console.log("*** invalid hash: " + newHash + ', does not match: ' + hashPortion);
    }
    return ;
  }
  
  const decryptedText = enc.decrypt(ivPortion , textPortion);
  if( ! process.env.NODE_ENV ||  process.env.NODE_ENV === 'development') { 
    console.log('\ndecryped text:\n' + decryptedText , '\n');
  }
  return decryptedText;
}

/*************************************************************************/
// ready to read encrypted config file
function readEncConfig(autoDecrypt, override , srcFile ) {
 
  let isDevMode = false;
  // if development, read the env stuff from .env
  if( !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    console.log('.env file: ' , dotenv.config());
    isDevMode = true;
  }

  // my key should exist. if not default key will be used - not recommended
  if( ! process.env.MY_ENCRYPTION_KEY) {
    console.log('*** process.env.MY_ENCRYPTION_KEY is missing ***');
  }

  // checking is
  // if local file exists, read it
  // if ENCRYPTED_CONFIG_CONTENT_xxx exists sort by key and parse over-writing the env

  let localFile = srcFile || '.randomcfg';

  if( process.env.ENCRYPTED_CONFIG_FILE) {
    localFile = process.env.ENCRYPTED_CONFIG_FILE;
  }
  
  
  const flagOverride = override || false;

  // read the encrypted text config file
  if( fs.existsSync(localFile )) {
    let chunks = fs.readFileSync(localFile, 'utf-8');
    if( isDevMode) {
      console.log('\nread local file:' , localFile);
    }
    let nobreak = chunks.replace(/(\r\n|\n|\r)/gm,'');
    let dtext = decryptRawText(nobreak);
    if( dtext) {
      updateEnv( dtext , autoDecrypt , flagOverride)
    }
  }

  let envNameList = [];
  // process ENCRYPTED_CONFIG_CONTENT_???
  for(let key in process.env) {
    if( key.startsWith('ENCRYPTED_CONFIG_CONTENT_')) {
      envNameList.push(key);
    }
  }
  if( envNameList.length > 0 ) {
    envNameList.sort();
    for(let i = 0 ; i < envNameList.length ; i++) {
      let encryptedContent = process.env[envNameList[i]];
      let dt = decryptRawText(encryptedContent);
      if( dt ) {
        if( isDevMode) {
          console.log('processing env variable:' , envNameList[i] , '\n');
        }
        updateEnv( dt , autoDecrypt , process.env.FORCE_ENV_OVERRIDE);
      }
    }

  }

  return true;
}

module.exports = { readEncConfig };
