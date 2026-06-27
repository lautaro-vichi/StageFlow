# Usamos Nginx oficial como base
FROM nginx:latest

# Copiamos todo el contenido de nuestra carpeta actual al servidor web
COPY . /usr/share/nginx/html
