FROM node:20-alpine
WORKDIR /app

# Copy only what's needed for dependency install
COPY package.json . 
# If you have a lockfile, uncomment the next line so Docker caches installs properly:
# COPY package-lock.json . 

RUN npm install

# Now copy the rest of the app
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
