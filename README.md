# Tools to leverage encrypted config file or encrypted environment variables

How this works;

You encrypt a plain config file as well as certificate files;

command -s plain.text -t file_to_save -f key=filename;

## Environment Variables

| Variable                      | Required | Description                                        |
|-------------------------------|----------|----------------------------------------------------|
| MY_ENCRYPTION_KEY             | YES      | This is the key used to decrypt the content        |
| ENCRYPTED_CONFIG_FILE         | Optional | If defined, will try to read from this file. default is .randomcfg |
| ENCRYPTED_CONFIG_CONTENT_xxx  | Optional | If defined, will try to decrypte the env variable  |
| FORCE_ENV_OVERRIDE            | Optional | if defined, will over write existing env variables when reading from encrypted env vars |