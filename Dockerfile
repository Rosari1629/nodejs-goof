FROM node:18.13.0

RUN mkdir /usr/src/goof /tmp/extracted_files

COPY . /usr/src/goof

WORKDIR /usr/src/goof

RUN chmod +x /usr/src/goof/wait-for-it.sh && \
    chmod +x /usr/src/goof/entrypoint.sh && \
    npm update && \
    npm install

EXPOSE 3001
EXPOSE 9229

ENTRYPOINT ["./entrypoint.sh"]
