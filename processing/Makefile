.PHONY: allshp geojson shp upload


NODE := node
SCRIPT := geojson-to-csv.js

INPUTS := geneva_grid_data.geojson zurich_grid_data.geojson
OUTPUTS := $(INPUTS:.geojson=.csv)

all: $(OUTPUTS) $(OUTPUTS:.csv=.pmtiles) clean

%.csv: %.geojson $(SCRIPT)
	$(NODE) $(SCRIPT) $< $@
	mkdir -p ../frontend/public/geodata
	mv $@ ../frontend/public/geodata/

# Rule to reproject all geojson files to WGS84 (EPSG:4326) in reprojected subdirectory
reprojected/%.geojson: %.geojson
	mkdir -p reprojected
	echo "Reprojecting $< to WGS84..."
	ogr2ogr -f GeoJSON -t_srs EPSG:4326 "reprojected/$*.geojson" $<

# Rule to generate PMTiles from reprojected geojson files
%.pmtiles: reprojected/%.geojson
	mkdir -p ../frontend/public/geodata
	echo "Converting reprojected $< to PMTiles..."
	tippecanoe --force -z12 --read-parallel -o "../frontend/public/geodata/$*.pmtiles" $<

# Generate all reprojected files
reprojected: $(INPUTS:%.geojson=reprojected/%.geojson)

# Generate all PMTiles files
pmtiles: $(OUTPUTS:.csv=.pmtiles)

clean:
	rm -f $(OUTPUTS) $(OUTPUTS:.csv=.pmtiles)
	rm -rf reprojected

geojson:
	@echo "Use pattern rules instead:"
	@echo "  make reprojected  - Reproject all geojson files"
	@echo "  make pmtiles      - Generate PMTiles from reprojected files"
	@echo "  make all          - Generate both CSV and PMTiles"
