FROM docker.io/library/node:16.10.0-buster
ADD ./ /data/lp_main/
EXPOSE 18081
WORKDIR /data/lp_main/
RUN apt-get update
RUN yes|apt-get install libusb-1.0-0-dev
RUN yes|apt-get install libudev-dev
RUN npm i
# build
RUN npx gulp
CMD [ "node", "dist/profit.js" ]

