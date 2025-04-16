FROM node:18-alpine

WORKDIR /lms/backend

COPY package*.json ./

COPY . .

RUN npm install -g nodemon
RUN npm install -f --silent

EXPOSE 3002

CMD ["npm","run","start"]
