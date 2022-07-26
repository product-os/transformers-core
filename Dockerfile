FROM docker:dind
RUN apk add --no-cache \
	bash \
    nodejs \
    npm \
    docker-cli
RUN wget -qO- https://github.com/oras-project/oras/releases/download/v0.13.0/oras_0.13.0_linux_amd64.tar.gz | tar xvz -C /usr/local/bin
WORKDIR /usr/src/app
COPY package.json .npmrc ./
RUN npm install
COPY . ./
CMD /bin/bash -c "npm run test:integration"
