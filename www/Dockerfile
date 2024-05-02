FROM node:22.0.0-alpine3.18

CMD ["vite"]

WORKDIR /code

COPY package*.json ./
COPY src src
RUN npm i
