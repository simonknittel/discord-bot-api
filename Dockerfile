FROM node:7.8-alpine

# Install system dependencies
RUN apk update
RUN apk add ffmpeg


ENV NODE_ENV development


# Import source code
WORKDIR /home/node
COPY . .


# Install local dependencies
WORKDIR /home/node
# VOLUME yarn-error.log npm-debug.log music avatar.png config.cson
RUN yarn


# Build
WORKDIR /home/node
RUN npm run build


# Install plugin dependencies
WORKDIR /home/node/dist/plugins/music
RUN cp /home/node/src/plugins/music/package.json .
RUN yarn --production
RUN rm package.json


# Remove local build dependencies
WORKDIR /home/node
# # RUN yarn remove babel-cli babel-preset-es2015
#
# RUN rm -rf /home/node/node_modules
# RUN yarn --prodution

RUN rm -rf src .babelrc


# Start the application
WORKDIR /home/node
ENV NODE_ENV production
CMD [ "node", "dist/index.js" ]
