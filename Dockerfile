
# Use the official Node.js image as the base image
FROM node:latest

# Set the working directory in the container
WORKDIR /app

# Copy the application files into the working directory
COPY package*.json ./

COPY . .
# Install the application dependencies
EXPOSE 3000
RUN npm install

# Define the entry point for the container
CMD ["npm","run", "start"]