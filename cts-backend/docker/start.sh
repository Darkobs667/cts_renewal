#!/usr/bin/env sh
set -eu

: "${PORT:=10000}"

# ── Injecter le port Render dans la config Nginx ──────────────────────────────
# Le template contient __RENDER_PORT__ qui est remplacé par la variable PORT.
# Le fichier généré est placé dans /etc/nginx/nginx.conf (config principale).
sed "s/__RENDER_PORT__/${PORT}/g" \
    /var/www/html/docker/nginx.conf.template \
    > /etc/nginx/nginx.conf

# ── Artisan bootstrap ─────────────────────────────────────────────────────────
php artisan storage:link     --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate          --force --no-interaction
php artisan cts:provision-admin --no-interaction

# ── Démarrer PHP-FPM en arrière-plan puis Nginx en premier plan ──────────────
php-fpm -D
exec nginx -g 'daemon off;'
