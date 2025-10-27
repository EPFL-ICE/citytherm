# Makefile to process all NetCDF files in ./raw_data using process_netcdf.py

PYTHON := python
SCRIPT := process_netcdf.py
INPUT_DIR := ./raw_data
OUTPUT_DIR := ./processed_data
ASSET_SRC := ./static_assets/scenarios.json
ASSET_DEST := $(OUTPUT_DIR)/scenarios/scenarios.json

# Find all .nc files and strip directory + extension to get scenario names
SCENARIOS := $(basename $(notdir $(wildcard $(INPUT_DIR)/*.nc)))

# Default target: process all scenarios
all: $(SCENARIOS) $(ASSET_DEST)
	@echo ""
	@echo "✅ All scenarios processed successfully."
	@echo "📁 scenarios.json copied to $(ASSET_DEST)"
	@echo "🎉 Processing complete!"
	@echo "Copy the content of $(OUTPUT_DIR) to the frontend static assets directory in a subdirectory named 'simulation' to use the processed data (for instance: frontend/public/simulation)."

# Rule: process individual scenario
$(SCENARIOS):
	@echo "Processing scenario: $@"
	$(PYTHON) $(SCRIPT) $@ $(INPUT_DIR) $(OUTPUT_DIR)

# Rule: copy scenarios.json after all scenarios are processed
$(ASSET_DEST): $(ASSET_SRC)
	@echo "Copying scenarios.json to $(ASSET_DEST)"
	cp $(ASSET_SRC) $(ASSET_DEST)

# Clean target: remove processed data
clean:
	rm -rf $(OUTPUT_DIR)

.PHONY: all clean $(SCENARIOS)