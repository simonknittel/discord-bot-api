FROM node:7.8-slim

ENV NODE_ENV development
RUN apt-get install -y ffmpeg

COPY . app

WORKDIR ~/app
VOLUME yarn-error.log npm-debug.log
# VOLUME music avatar.png config.cson
RUN yarn

# Plugins
WORKDIR ~/app/plugins/music
RUN yarn --production

# Start
WORKDIR ~/app
CMD [ 'npm', 'start' ]
