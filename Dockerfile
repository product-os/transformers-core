FROM docker:20.10-dind
RUN apk add --no-cache \
	bash \
    nodejs=16.16.0-r0 \
    npm=8.10.0-r0 \
    docker-cli
WORKDIR /usr/src/app
COPY package.json .npmrc ./
RUN npm install
COPY . ./
CMD /bin/bash -c "npm run test:integration"
