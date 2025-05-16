FROM node:18.13.0

RUN mkdir /usr/src/goof
RUN mkdir /tmp/extracted_files
COPY . /usr/src/goof
WORKDIR /usr/src/goof

RUN npm install
RUN chmod +x wait-for-it.sh

EXPOSE 3001
EXPOSE 9229

CMD ["npm", "start"]
