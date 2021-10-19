FROM node:14

RUN mkdir /app
WORKDIR /app

ADD package.json package-lock.json ./
RUN npm ci

ADD . .
