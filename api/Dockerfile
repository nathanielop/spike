FROM node:25.5.0-alpine3.23

WORKDIR /code

CMD ["bin/run"]

ENV \
  ID_ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' \
  ID_SIZE='12'

COPY *.json ./
COPY src src
COPY bin bin

RUN npm i
