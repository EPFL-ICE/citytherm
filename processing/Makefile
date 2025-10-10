.PHONY: all clean reprojected pmtiles csv

NODE := node
SCRIPT := geojson-to-csv.js

INPUTS := geneva_grid_data.geojson zurich_grid_data.geojson
REPROJECTED := $(INPUTS:%.geojson=reprojected/%.geojson)
PMTILES := $(INPUTS:%.geojson=../frontend/public/geodata/%.pmtiles)
CSVS := $(INPUTS:%.geojson=../frontend/public/geodata/%.csv)

# Full pipeline
all: $(CSVS) $(REPROJECTED) $(PMTILES)

# 1. GeoJSON -> CSV
../frontend/public/geodata/%.csv: %.geojson $(SCRIPT)
	mkdir -p ../frontend/public/geodata
	$(NODE) $(SCRIPT) $< $@

# 2. Reproject GeoJSON -> reprojected GeoJSON
reprojected/%.geojson: %.geojson
	mkdir -p reprojected
	echo "Reprojecting $< to WGS84..."
	ogr2ogr -f GeoJSON -t_srs EPSG:4326 $@ $<

# 3. Reprojected GeoJSON -> PMTiles
../frontend/public/geodata/%.pmtiles: reprojected/%.geojson
	mkdir -p ../frontend/public/geodata
	echo "Converting $< to PMTiles..."
	tippecanoe --force -z12 --read-parallel -o $@ $<

# Convenience targets
csv: $(CSVS)
reprojected: $(REPROJECTED)
pmtiles: $(PMTILES)

clean:
	rm -rf reprojected
	rm -f ../frontend/public/geodata/*.csv ../frontend/public/geodata/*.pmtiles
