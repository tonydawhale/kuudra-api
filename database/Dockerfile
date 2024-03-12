# syntax=docker/dockerfile:1

FROM golang:1.21-alpine

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOD=linux go build -o /database

ENTRYPOINT [ "/database" ]