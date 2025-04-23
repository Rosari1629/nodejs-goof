FROM node:18.13.0

RUN mkdir /usr/src/goof /tmp/extracted_files

COPY . /usr/src/goof

WORKDIR /usr/src/goof

RUN chmod +x /usr/src/goof/wait-for-it.sh && \
    npm update && \
    npm install

EXPOSE 3001
EXPOSE 9229

ENTRYPOINT ["./wait-for-it.sh", "mysql:3306", "--timeout=30", "--strict", "--", "npm", "start"]

