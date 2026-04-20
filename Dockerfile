# syntax=docker/dockerfile:1
#
# Тонкий nginx-образ. Сборка артефакта (dist/) происходит в CI на стадии npm_build,
# здесь только копируем готовую статику и конфиг nginx.
#
ARG NGINX_IMAGE=harbor.online.tkbbank.ru/library/nginx:1.27-alpine

FROM ${NGINX_IMAGE}

LABEL org.opencontainers.image.title="pay-admin-front" \
      org.opencontainers.image.source="payadmin-front"

# nginx конфиг (SPA fallback + кеш статики + healthcheck)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Готовая статика, собранная в стадии npm_build
COPY dist/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1
