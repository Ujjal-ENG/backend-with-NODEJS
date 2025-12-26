From ubuntu:25.04 AS builder

RUN apt update

RUN apt install -y golang

WORKDIR /app

COPY ./server.go  ./server.go

CMD ["go", "run", "server.go"]
