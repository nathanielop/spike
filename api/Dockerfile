FROM oven/bun

WORKDIR /code

CMD ["bin/run"]

RUN apt-get update

COPY *.json ./
COPY src src
COPY bin bin

RUN bun install
