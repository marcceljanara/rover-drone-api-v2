FROM node:24-slim

WORKDIR /app

# Install utilitas: netcat (nc) dan bash
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    bash \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 5000

ENTRYPOINT ["sh", "./docker/entrypoint.sh"]

# CMD ["npm", "start"]
