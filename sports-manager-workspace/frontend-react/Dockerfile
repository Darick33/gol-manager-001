FROM node:22-alpine AS builder
WORKDIR /app
ARG VITE_BASE_DOMAIN=golmanager.qzz.io
ENV VITE_BASE_DOMAIN=$VITE_BASE_DOMAIN
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx vite build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
