@echo off
rem Ouvre le portfolio dans le navigateur via un petit serveur local.
rem (Double-cliquer directement sur index.html bloque la musique et les vidéos YouTube.)
rem Laisse cette fenêtre ouverte pendant que tu regardes le site ; ferme-la pour arrêter.
cd /d "%~dp0"
echo Ouverture du portfolio sur http://localhost:5501 ...
npx -y http-server . -p 5501 -c-1 -o
