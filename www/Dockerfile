FROM node:25.5.0-alpine3.23

WORKDIR /code

CMD ["bin/run"]

# Install nginx and packages required to build it
RUN apk add --no-cache curl pcre && \
  apk add --no-cache --virtual tmp g++ pcre-dev brotli-dev make zlib-dev && \
  cd /tmp && \
  mkdir nginx && \
  curl -L https://nginx.org/download/nginx-1.21.3.tar.gz | \
    tar xz --strip-components 1 -C nginx && \
  cd nginx && \
  ./configure --with-http_gzip_static_module && \
  make && \
  make install && \
  ln -s /usr/local/nginx/sbin/nginx /usr/local/bin/nginx && \
  rm -fr nginx && \
  apk del --purge tmp

COPY package*.json ./

RUN npm install
RUN npm cache clean --force

COPY src src
COPY cogs.js ./
COPY bin bin

ARG API_URL
ARG VERSION
RUN bin/build
