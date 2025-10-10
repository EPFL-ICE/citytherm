.PHONY: allshp geojson shp upload


NODE := node
SCRIPT := geojson-to-csv.js

INPUTS := geneva_grid_data.geojson zurich_grid_data.geojson
OUTPUTS := $(INPUTS:.geojson=.csv)

all: $(OUTPUTS)

%.csv: %.geojson $(SCRIPT)
	$(NODE) $(SCRIPT) $< $@

clean:
	rm -f $(OUTPUTS)


geojson:
	mkdir -p ../frontend/public/geodata
	# Convert all shapefiles in the current directory to GeoJSON and reproject to W
	find . -maxdepth 1 -name "*.geojson" | while read f; do \
		filename=$$(basename "$$f" .geojson); \
		output_dir="../frontend/public/geodata"; \
		echo "Converting $$f to GeoJSON (reprojecting to WGS84)..."; \
		rm -f "$$output_dir/$${filename}_reprojected.geojson"; \
		ogr2ogr -f GeoJSON -t_srs EPSG:4326 "$$output_dir/$${filename}_reprojected.geojson" "$$f"; \
		if [ -f "$$output_dir/$${filename}_reprojected.geojson" ] && [ -s "$$output_dir/$${filename}_reprojected.geojson" ]; then \
			echo "Converting $$output_dir/$${filename}_reprojected.geojson to PMTiles..."; \
			tippecanoe --force -z12 --read-parallel -o "$$output_dir/$${filename}.pmtiles" "$$output_dir/$${filename}_reprojected.geojson"; \
		else \
			echo "Warning: Failed to create valid GeoJSON for $$f"; \
		fi; \
	done
