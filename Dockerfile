FROM node:18.13.0

WORKDIR /usr/src/goof

COPY package*.json ./
RUN npm install

COPY . .
COPY wait-for-it.sh ./wait-for-it.sh

RUN chmod +x wait-for-it.sh

EXPOSE 3001
EXPOSE 9229

CMD ["npm", "start"]
