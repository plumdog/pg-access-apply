#!/bin/bash -e

docker-compose build
docker-compose down -v
docker-compose -f docker-compose.yaml run --rm pg-access-apply
