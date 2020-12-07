# pull official base image
FROM node:15.3.0-alpine3.12

# set working directory
WORKDIR /app

# install app dependencies
COPY package.json ./
RUN yarn install
# RUN npm install react-scripts@3.4.1 -g --silent

# add app
COPY . ./

# start app
CMD ["yarn", "start"]