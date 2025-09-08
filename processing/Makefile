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

allshp:
	find . -name "*.shp" | nl | while read n f; do \
		filename=$$(basename "$$f" .shp); \
		output_dir="../processed_data/"; \
		mkdir -p "$$output_dir"; \
		tippecanoe --force -zg --read-parallel -o "$$output_dir/$${filename}_$$n.pmtiles" "$$f"; \
	done

geojson:
	mkdir -p ../processed_data/
	find . -maxdepth 1 -name "*.geojson" | while read f; do \
		filename=$$(basename "$$f" .geojson); \
		output_dir="../processed_data/"; \
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

shp:
	mkdir -p ../processed_data/
	find . -name "*.shp" | while read f; do \
		filename=$$(basename "$$f" .shp); \
		output_dir="../processed_data/"; \
		mkdir -p "$$output_dir"; \
		echo "Converting $$f to GeoJSON (reprojecting to WGS84)..."; \
		rm -f "$$output_dir/$${filename}.geojson"; \
		ogr2ogr -f GeoJSON -t_srs EPSG:4326 "$$output_dir/$${filename}.geojson" "$$f"; \
		if [ -f "$$output_dir/$${filename}.geojson" ] && [ -s "$$output_dir/$${filename}.geojson" ]; then \
			echo "Converting $$output_dir/$${filename}.geojson to PMTiles..."; \
			tippecanoe --force -z12 --read-parallel -o "$$output_dir/$${filename}.pmtiles" "$$output_dir/$${filename}.geojson"; \
		else \
			echo "Warning: Failed to create valid GeoJSON for $$f"; \
		fi; \
	done


upload:
	@echo "Uploading processed data to S3 bucket..."
	@aws s3 sync ../processed_data/ s3://your-bucket-name/processed_data/ --acl public-read --exclude "*.tmp" --exclude "*.bak"
	@echo "Upload complete!"