---
tags: ["vscode"]
---

# ["vscode"] How to setup tslint

I knew tslint is deprecating, but there are still projects using it. And recently I am doing a ionic project with angular which actually using tslint for lint. My goals are:

- use command line to lint and format ts files
- in vscode, when save it will automatically lint and format
- The above two ways should share the exact same configurations

It took me a while to set them up, but basically we use `tslint` and `prettier`, and the `tslint` for lint for syntax, and leave format for `prettier`.

## Steps

1. `npm i tslint -D`

2. Config tslint by `touch tslint.json`, and the file content is like below:

   ```json
   {
     "extends": ["tslint:recommended", "tslint-config-prettier"],
     "rules": {}
   }
   ```

   `tslint-config-prettier` will turn off the tslint format rule. Also we need to turn off the format rules in `rules`.

3. `npm i prettier tslint-config-prettier -D`, prettier is the format package, and `tslint-config-prettier` package is to turn off all format options in tslint

4. Config prettier `touch .prettierrc` as below maybe:

   ```json
   {
     "singleQuote": true,
     "semi": false,
     "trailingComma": "es5"
   }
   ```

5. In vscode install the following two plugins: `esbenp.prettier-vscode` and `ms-vscode.vscode-typescript-tslint-plugin`, and setup as below:

   ```json
   {
     "editor.formatOnSave": false, // save will trigger format
     "editor.codeActionsOnSave": {
       "source.fixAll.tslint": true // save will implement tslint rules (currently just syntax rules)
     }
   }
   ```
