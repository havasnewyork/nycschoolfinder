#!/bin/bash
export VCAP_SERVICES=`cat VCAP_SERVICES.json`
node app.js