tsc
sed -i '' '1i\
#!/usr/bin/env node
' dist/src/index.js
chmod +x dist/src/index.js