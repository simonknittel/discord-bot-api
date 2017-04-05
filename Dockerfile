# FROM node:7.8-slim
#
# RUN apt-get update && apt-get upgrade
# RUN apt-get install -y libav-tools


FROM node:7.8-alpine

RUN apk update
RUN apk add ffmpeg

RUN adduser -D app
USER app

ENV NODE_ENV development

WORKDIR /home/app
COPY . .

# VOLUME yarn-error.log npm-debug.log music avatar.png config.cson
RUN yarn

# Plugins
WORKDIR /home/app/plugins/music
RUN yarn

# Start
WORKDIR /home/app
CMD [ 'npm', 'start' ]
