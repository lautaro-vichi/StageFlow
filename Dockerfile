# Usamos Nginx oficial como base
FROM nginx:latest

# Copiamos un mensaje personalizado directo al archivo web del servidor
RUN echo "<h1>Imagen Custom de Franco: Dockerfile funcionando</h1>" > /usr/share/nginx/html/index.html
