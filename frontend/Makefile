.PHONY: help cdn ls sync dev build install

# Date: 2025-05-02
# Version: 1.0
# Description: Makefile for lgb-trsc-data
# Usage: make install
# ========================================
# Check for required tools
REQUIRED_TOOLS := s3cmd
$(foreach tool,$(REQUIRED_TOOLS),\
    $(if $(shell which $(tool)),,$(error "$(tool) not found in PATH")))


# Directories
CITYTHERM_PROCESSED_DATA_DIRS := \
	$(shell pwd)/public/geodata \
	$(shell pwd)/public/simulation

# Change the version and date accordingly
# version=1.0
version=2025-09-16
bucket=10208-fcd9acb029f419e6493edf97f4592b96
path=citytherm/${version}

# you can retrieve .s3cfg from https://enac-it-secrets.epfl.ch/fr/project/08a95a29-3788-46f9-aec8-f47985b60358/secrets/overview?secretPath=%2Fs3%2Fcdn
# in enac-it4r/enacit-4r/s3/cdn/.s3cfg 
S3CMD_CONFIG_NAME=.s3cfg_cdn_enac
data_dir=$(CITYTHERM_PROCESSED_DATA_DIR)

help:
	@echo "make cdn          # upload files to s3://${bucket}/${path}/"
	@echo "make ls           # list files in s3://${bucket}/${path}/"
	@echo "make processing   # process raw data into processed_data"
	@echo "make dev         # start development server"
	@echo "make build      # build the project"
	@echo "make install    # install dependencies"

processing:
	# should create geosjon and csv files in ../frontend/public/geodata
	$(MAKE) -C ../processing

# AI Generated to upload multiple directories
cdn:
	@for dir in $(CITYTHERM_PROCESSED_DATA_DIRS); do \
		echo "📤 Uploading $$dir to s3://${bucket}/${path}/..."; \
		s3cmd -c ${HOME}/${S3CMD_CONFIG_NAME} \
			put --recursive --acl-public --guess-mime-type \
			$$dir s3://${bucket}/${path}/; \
	done

# original from Pierre
#cdn:
#	s3cmd -c ${HOME}/${S3CMD_CONFIG_NAME} put --recursive --acl-public --guess-mime-type ${data_dir} s3://${bucket}/${path}/
	
ls:
	s3cmd -c ${HOME}/${S3CMD_CONFIG_NAME} ls --acl-public s3://${bucket}/${path}/


dev:
	npm run dev

build:
	npm run build

install:
	npm install
