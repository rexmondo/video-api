FROM node:18-alpine

WORKDIR /app
COPY . .

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    libx264-dev \
    libfdk_aac \
    ffmpeg

RUN npm i -g pnpm
RUN pnpm install --production

EXPOSE 4000

CMD [ "pnpm", "start" ]