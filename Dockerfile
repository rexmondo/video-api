FROM node:18-alpine

# ffmpeg build script taken from https://github.com/denismakogon/ffmpeg-alpine/blob/master/custom/alpine/Dockerfile
# TODO: break this into staged builds so we don't pollute the service container with build tools

ENV FFMPEG_VERSION=6.0

ENV FFMPEG_CORE="bash \
    tzdata \
    libass \
    libstdc++ \
    libpng \
    libjpeg \
    xvidcore \
    x264-libs \
    x265 \
    libvpx \
    libvorbis \
    opus \
    lame \
    fdk-aac \
    freetype \
    libcrypto1.0 \
    libssl1.0 \
    jasper-libs \
    libavc1394 \
    yasm"

ENV RUNTIME_DEPS="coreutils \
    make \
    cmake \
    gcc \
    g++ \
    clang \
    linux-headers \
    git \
    curl"

ENV BUILD_DEPS="fdk-aac-dev \
    freetype-dev \
    x264-dev \
    x265-dev \
    yasm-dev \
    libogg-dev \
    libvorbis-dev \
    opus-dev \
    libvpx-dev \
    lame-dev \
    xvidcore-dev \
    libass-dev \
    openssl-dev \
    musl-dev \
    build-base \
    libjpeg-turbo-dev \
    libpng-dev \
    jasper-dev \
    libavc1394-dev \
    libavc1394-dev \
    clang-dev"

# FFMPEG
RUN apk update && \
    apk add --no-cache apk-tools && \
    echo http://nl.alpinelinux.org/alpine/edge/testing >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache --virtual .runtime-deps ${RUNTIME_DEPS} && \
    apk add --no-cache ${FFMPEG_CORE} && \
    apk add --no-cache --virtual .build-deps ${BUILD_DEPS} && \
    export SRC=/usr \
    DIR=$(mktemp -d) && cd ${DIR} && \
    curl -Os http://ffmpeg.org/releases/ffmpeg-${FFMPEG_VERSION}.tar.gz && \
    tar xzvf ffmpeg-${FFMPEG_VERSION}.tar.gz && \
    cd ffmpeg-${FFMPEG_VERSION} && \
    ./configure \
    --prefix="${SRC}" \
    --extra-cflags="-I${SRC}/include" \
    --extra-ldflags="-L${SRC}/lib" \
    --bindir="${SRC}/bin" \
    --extra-libs=-ldl \
    --enable-version3 \
    --enable-libmp3lame \
    --enable-pthreads \
    --enable-libx264 \
    --enable-libxvid \
    --enable-gpl \
    --enable-postproc \
    --enable-nonfree \
    --enable-avresample \
    --enable-libfdk-aac \
    --disable-debug \
    --enable-small \
    --enable-openssl \
    --enable-libx265 \
    --enable-libopus \
    --enable-libvorbis \
    --enable-libvpx \
    --enable-libfreetype \
    --enable-libass \
    --enable-shared \
    --enable-pic && \
    make && \
    make install && \
    make distclean && \
    hash -r && \
    cd /tmp && \
    rm -rf ${DIR} && \
    apk del .build-deps && \
    apk del .runtime-deps && \
    rm -rf /var/cache/apk/*

WORKDIR /app
COPY . .

RUN npm i -g pnpm
RUN pnpm install --production
RUN pnpm build

EXPOSE 4000

CMD [ "pnpm", "start" ]