FROM node:alpine

RUN sed -i 's|https://dl-cdn.alpinelinux.org|http://mirrors.tuna.tsinghua.edu.cn|g' /etc/apk/repositories

RUN apk add --no-cache chromium-chromedriver

RUN apk add --no-cache --virtual .build-app curl

RUN npm config set registry https://registry.npmmirror.com

RUN npm install -g pnpm

RUN pnpm config set registry https://registry.npmmirror.com

WORKDIR /srv

COPY ./src ./src

COPY ./package.json ./pnpm-lock.yaml ./tsconfig.json ./run.sh ./

RUN pnpm install

RUN apk del .build-app

RUN { crontab -l; printf '%s\t%s\t%s\t%s\t%s\t%s\n' '5' '0' '*' '*' '*' '/usr/bin/env /srv/run.sh'; } | crontab -

CMD ["/usr/sbin/crond", "-f"]
