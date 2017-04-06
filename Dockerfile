FROM node:7.8-alpine

RUN apk update
RUN apk add ffmpeg

# Currently needed since it only works with babel-node right now, but should get a production mode (without on the fly transpiling) soon
ENV NODE_ENV development

WORKDIR /home/node
COPY . .

VOLUME yarn-error.log npm-debug.log music avatar.png config.cson
RUN yarn

# Plugins
WORKDIR /home/node/plugins/music
RUN yarn

# Start
WORKDIR /home/node
CMD [ "npm", "start" ]
