# Data processing for the /simulation/... routes

This folder is for processing the NetCDF files into small files that can be consumed by the frontend.

## Steps

- Create a folder named `raw_data` and put the NetCDF (.nc) files in it
- Run inside the simulation directory `make all`. This will call `process_netcdf.py` for each file in `raw_data`
- Everything will be outputed in the `processed_data` directory

### Notes

To run the scripts in this folder you'll need to have the following python packages on your machine :

- netcdf4 (`pip install netcdf4`)
- xarray (`pip install xarray`)

There is also a `investigate_netcdf.py` file that is not used for the real processing and is used only for exploration purposes.