# Makefile to process all NetCDF files in ./raw_data using process_netcdf.py

PYTHON := python
SCRIPT := process_netcdf.py
INPUT_DIR := ./raw_data
OUTPUT_DIR := ./processed_data

# Find all .nc files and strip directory + extension to get scenario names
SCENARIOS := $(basename $(notdir $(wildcard $(INPUT_DIR)/*.nc)))

# Default target: process all scenarios
all: $(SCENARIOS)

# Rule: process individual scenario
$(SCENARIOS):
	@echo "Processing scenario: $@"
	$(PYTHON) $(SCRIPT) $@ $(INPUT_DIR) $(OUTPUT_DIR)

# Clean target: remove processed data
clean:
	rm -rf $(OUTPUT_DIR)

.PHONY: all clean $(SCENARIOS)