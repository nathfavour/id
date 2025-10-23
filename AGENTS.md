1. don't write documentation unless explicitly told do. no incessant generation of markdown files, summary files, txt, etc. just do one thing and do it well: write the code

2. don't run any build commmands, as those interrupt with my dev commands and make me have to restart my application. don't run until you're told to run and verify if things work. simply write/modify code.

3. don't bother with git. i'll handle it myself. just write the code.

4. the codebase consists of several foundations: oauth, passkey, wallet and others combined into this auth system. under no circumstance, should you, ever break any of the core fundamentals of the codebase, most especially the passkey which was extremely difficult to implement. 