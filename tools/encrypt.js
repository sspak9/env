const fe = require('./fe');

let result = fe.parseArgs(process.argv.slice(2));
console.log(result);

if(! fe.encryptContent( result)) {
  console.log('something went wrong');
} 

