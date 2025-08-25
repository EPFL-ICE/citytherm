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


CITYTHERM_DATA_DIR = $(shell pwd)/processing
CITYTHERM_PROCESSED_DATA_DIR = $(shell pwd)/public/geodata
CITYTHERM_DATA_VERSION = 1.0
CITYTHERM_DATA_DATE = 2025-05-02
# Change the version and date accordingly
# version=1.0
version=2025-08-25
bucket=10208-fcd9acb029f419e6493edf97f4592b96
path=citytherm/${version}
S3CMD_CONFIG_NAME=.s3cfg_cdn_enac
data_dir=$(CITYTHERM_PROCESSED_DATA_DIR)


# TODO: centralize processing of processed files
# install:
# 	$(MAKE) -C $(CITYTHERM_DATA_DIR) install
# 	$(MAKE) -C $(CITYTHERM_SG_MANON) install

help:
	@echo "make cdn              # upload files to s3://${bucket}/${path}/"
	@echo "make ls-cdn           # list files in s3://${bucket}/${path}/"
	@echo "make sync version=xxx # get files from s3://${bucket}/${path}/xxx/ to ${data_dir}"


cdn:
	s3cmd -c ${HOME}/${S3CMD_CONFIG_NAME} put --recursive --acl-public --guess-mime-type ${data_dir} s3://${bucket}/${path}/
	
ls:
	s3cmd -c ${HOME}/${S3CMD_CONFIG_NAME} ls --acl-public s3://${bucket}/${path}/


sync:
	s3cmd -c ${HOME}/${S3CMD_CONFIG_NAME} sync s3://${bucket}/${path} ${data_dir}


dev:
	npm run dev

build:
	npm run build

install:
	npm install
