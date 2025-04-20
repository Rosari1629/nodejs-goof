FROM node:16

# Create necessary directories
RUN mkdir /usr/src/goof
RUN mkdir /tmp/extracted_files

# Copy project files
COPY . /usr/src/goof

# Set the working directory
WORKDIR /usr/src/goof

# Copy the wait-for-it.sh script to the container
COPY wait-for-it.sh /usr/src/goof/

# Make the wait-for-it.sh script executable
RUN chmod +x /usr/src/goof/wait-for-it.sh

# Install dependencies
RUN npm install

# Expose ports
EXPOSE 3001
EXPOSE 9229

# Run the application, waiting for MySQL and MongoDB
ENTRYPOINT ["./wait-for-it.sh", "goof-mysql:3306", "--", "./wait-for-it.sh", "goof-mongo:27017", "--", "npm", "start"]
