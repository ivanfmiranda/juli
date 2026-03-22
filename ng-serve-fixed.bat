@echo off
cd /d "%~dp0"
set NODE_OPTIONS=--openssl-legacy-provider
npx ng serve --host 0.0.0.0 --port 4200
