FROM node:22-alpine AS build-stage
WORKDIR /app
COPY package.json npm-shrinkwrap.json ./
RUN npm ci
COPY ./ .
RUN npm run build


FROM nginx:1-alpine AS production-stage
RUN mkdir /app
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build-stage /app/dist /app
