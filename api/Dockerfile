FROM node:22.2.0-alpine3.20

WORKDIR /code

CMD ["bin/run"]

ENV \
  ID_ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' \
  ID_SIZE='12'

COPY *.json ./
COPY src src
COPY bin bin

RUN npm i
