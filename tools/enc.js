const crypto = require('crypto');

var encKey = process.env.MY_ENCRYPTION_KEY ;
if( !encKey ) { // is null
  encKey = 'bcvr8yK8tBr0DIC06xCvOc9c04gY4Nzx';
  console.log('*** MY_ENCRYPTION_KEY is not set. Using default key...not recommended');
}
if( encKey.length != 32) {
  encKey = (encKey + 'the_length_of_the_key_is_not_32b').substring(0,32);
}

function encrypt(text) {

  let iv;
  let encrypted;

  try {
    iv  = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', new Buffer.from(encKey), iv);
    encrypted = cipher.update(text);
  
    encrypted = Buffer.concat([encrypted, cipher.final()]);
  } catch (error) {
    console.log('error: ' , error);
  }
  
  return ({iv : iv.toString('base64') , text: encrypted.toString('base64')});
}

function decrypt(ivText, text) {

  let decrypted;

  try {
    
    let iv = new Buffer.from(ivText, 'base64');
    let encryptedText = new Buffer.from(text, 'base64');
    let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer.from(encKey), iv);
    decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();

  } catch (error) {
    console.log('error: ' + error);
  }
  
  return '';
}

function encryptString(text) {
  var encText = encrypt(text);
  if( encText.text) {
    return 'ENC(' + encText.text + encText.iv + ')';
  }
  return text;
}

function decryptString(text) {

  console.log('trying to decrypt: ' + text);

  // the iv is at last 24
  if( text && text.startsWith('ENC')) {

    var nop = text.replace('ENC(', '').replace(')', '');
    
    if( nop.length > 24) {
      var ivText = nop.substring(24);
      var encText = nop.substring(0 , nop.length - 24);
      
      return decrypt(ivText, encText);
    }
  }
  
  return text;
}

module.exports = { decrypt , encrypt , encryptString, decryptString};
