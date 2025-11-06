import re
import xarray as xr
import json
from pathlib import Path
import argparse
import pandas as pd
import numpy as np
import math

human_height = 1.4000000953674316
surface_level_variables = [
    "TSurf",
    "QSurf",
    "UVSurf",
    "SensHeatFlux",
    "LatentHeatFlux",
    "SoilHeatFlux",
    "QSWDirHor",
    "QSWDiffHor",
    "QSWReflRecHor",
    "QLWEmit",
    "QLWBudget",
    "QLWSumAllFluxes",
    "SkyViewFactor",
]
building_data_variables = [
    "$Fac_WallTempNode1Outside", # $ gets replaced by either X or Y depending on wall orientation
    "$Fac_WallSystemLWEmitted",
    "$Fac_WallSystemSWReceived",
    "$Fac_WallSystemSWDirAbsorbed",
    "$Fac_WallSystemLWIncoming",
    "$Fac_WallSystemSWReflected",
    "$Fac_WallSystemSHTransCoeffOutside",
    "$Fac_WallSystemLWEnergyBalance",
]

def process_netcdf(scenario_name: str, input_directory: str, output_directory: str):
    print(f"========= Processing scenario: {scenario_name} =========")

    input_path = Path(input_directory) / f"{scenario_name}.nc"
    print(f"Processing NetCDF at : {input_path}")

    ds = xr.open_dataset(input_path)
    print(ds)

    print("Processing building heights, soil types, and objects...")
    export_buildings_and_soil_maps_and_objects(scenario_name, ds, output_directory)
    print("Done processing building heights, soil types, and objects.", end="\n\n")

    var_keys = ["T", "RelHum", "SpecHum", "WindSpd", "TMRT", "PET", "QSWDir", "QSWDiff", "QSWRefl"] + surface_level_variables + building_data_variables

    print("Exporting variable attributes...")
    export_variable_attributes(var_keys, ds, output_directory)
    print("Done exporting variable attributes.", end="\n\n")

    print("Processing simulation results slices...")
    save_plane_slices_for_multiple_vars_at_multiple_times(scenario_name, ds, output_directory, variable_names=var_keys, time_indices=[0, 4, 8, 12, 16, 20])
    print("Done processing simulation results slices.", end="\n\n")

    print("Exporting time series points list...") # defined in make_horizontal_time_series_points
    export_time_series_points_list(scenario_name, var_keys, output_directory)
    print("Done exporting time series points list.", end="\n\n")

    print("Exporting time series points...")
    points = get_time_series_points_list(scenario_name, var_keys)
    export_time_series_points(scenario_name, ds, points, output_directory)
    print("Done exporting time series points.", end="\n\n")

    print("Done !", end="\n\n\n\n")


# Building heights and soil types helpers

def export_buildings_and_soil_maps_and_objects(scenario_name: str, ds, output_directory: str = "processed_data"):
    building_heights = ds.data_vars["BuildingHeight"]
    bh_dict = building_height_dict(building_heights)
    bh_dict["defaultSideColor"] = hardcoded_side_color(scenario_name)
    bh_dict["defaultTopColor"] = hardcoded_top_color(scenario_name)

    soil_profile_type = ds.data_vars["SoilProfileType"]
    st_dict = soiltype_dict(soil_profile_type)
    if scenario_name.startswith("S3_3"): # shitty hack for grass
        st_dict["defaultSoilType"] = 3000
    
    objects = ds.data_vars["Objects"]
    obj_dict = objects_dict_scenarios(scenario_name, objects)

    # Save the processed data
    save_json_for_scenario(bh_dict, output_directory, scenario_name, "", "buildingMap", pretty=False)
    save_json_for_scenario(st_dict, output_directory, scenario_name, "", "soilMap", pretty=False)
    save_json_for_scenario(obj_dict, output_directory, scenario_name, "", "objectsMap", pretty=False)

def hardcoded_side_color(scenario_name: str):
    if scenario_name.startswith("S2_1"):
        return "#eeeeee"
    elif scenario_name.startswith("S2_2"):
        return "#8ad7dc"
    elif scenario_name.startswith("S2_3"):
        return "#00e000"
    return "#aaaaaa"

def hardcoded_top_color(scenario_name: str):
    return "#aaaaaa"

def building_height_dict(building_heights):
    first_time_slice = building_heights.isel(Time=0)
    dataframe = first_time_slice.to_dataframe().reset_index().drop(columns=["Time"]).rename(columns={"GridsI": "x", "GridsJ": "y", "BuildingHeight": "h"})
    dataframe_cleaned = dataframe[dataframe["h"].notna()]

    for col in ["x", "y", "h"]:
        dataframe_cleaned[col] = dataframe_cleaned[col].apply(lambda v: int(v) if float(v).is_integer() else v)

    most_common_building_height = dataframe_cleaned["h"].mode()[0]
    
    # Convert to list of dicts and remove 'h' if equal to most_common_building_height, reduces size of JSON by about 29%
    records = []
    for record in dataframe_cleaned.to_dict(orient="records"):
        if record["h"] == most_common_building_height:
            record = {k: v for k, v in record.items() if k != "h"}
        records.append(record)
    
    return {
        "defaultHeight": float(most_common_building_height),
        "buildingsParts": records
    }

def soiltype_dict(soil_profile_type):
    first_time_slice = soil_profile_type.isel(Time=0)
    dataframe = first_time_slice.to_dataframe().reset_index().drop(columns=["Time"]).rename(columns={"GridsI": "x", "GridsJ": "y", "SoilProfileType": "t"})
    for col in ["x", "y", "t"]:
        dataframe[col] = dataframe[col].apply(lambda v: int(v) if float(v).is_integer() else v)

    most_common_soil_type = dataframe["t"].mode()[0]
    dataframe_anomalies = dataframe[dataframe["t"] != most_common_soil_type]

    anomalies_dict = {}
    for _, row in dataframe_anomalies.iterrows():
        key = f"{row['x']};{row['y']}"
        anomalies_dict[key] = int(row["t"])

    return {
        "defaultSoilType": int(most_common_soil_type),
        "anomalies": anomalies_dict
    }

def objects_dict_scenarios(scenario_name: str, objects):
    if scenario_name.startswith("S4_2"): # betula trees
        return objects_dict_trees(-2)
    elif scenario_name.startswith("S4_3"): # acer trees
        return objects_dict_trees(-3)
    elif scenario_name.startswith("S5_1"): # mist nozzles
        return objects_dict_water_bodies(-10)
    elif scenario_name.startswith("S5_2"): # fountains
        return objects_dict_water_bodies(-11)

    return objects_dict(objects)

def objects_dict(objects):
    first_time_slice = objects.isel(Time=0).sel(GridsK=0.2) # Only objects on the ground (on the 2m*2m square centered at height 1m so, so touching the ground)
    dataframe = first_time_slice.to_dataframe().reset_index().drop(columns=["Time","GridsK"]).rename(columns={"GridsI": "x", "GridsJ": "y", "Objects": "o"})
    print(dataframe)
    dataframe_cleaned = dataframe[dataframe["o"].notna() & (dataframe["o"] > 1)] # 0 is no object and 1 is building, already taken into account in building heights
    print(dataframe_cleaned)

    if dataframe_cleaned.empty:
        return {
            "defaultObject": 0,
            "objects": []
        }

    for col in ["x", "y", "o"]:
        dataframe_cleaned[col] = dataframe_cleaned[col].apply(lambda v: int(v) if float(v).is_integer() else v)

    print(dataframe_cleaned)
    most_common_object = dataframe_cleaned["o"].mode()[0]


    # Convert to list of dicts and remove 'o' if equal to most_common_object, reduces size of JSON by about 29%
    records = []
    for record in dataframe_cleaned.to_dict(orient="records"):
        if record["o"] == most_common_object:
            record = {k: v for k, v in record.items() if k != "o"}
        records.append(record)

    return {
        "defaultObject": int(most_common_object),
        "objects": records
    }

def objects_dict_trees(type: int = -2):
    return {
        "defaultObject": type,
        "objects": [ # hardcoded list provided by Jaafar, values seem to be the index of the 2x2 square, so multiplied by 2 here
            { "x": 31 * 2, "y": 28 * 2 },
            { "x": 31 * 2, "y": 24 * 2 },
            { "x": 31 * 2, "y": 20 * 2 },
            { "x": 34 * 2, "y": 26 * 2 },
            { "x": 34 * 2, "y": 22 * 2 },
            { "x": 31 * 2, "y": 37 * 2 },
            { "x": 31 * 2, "y": 41 * 2 },
            { "x": 31 * 2, "y": 45 * 2 },
            { "x": 34 * 2, "y": 43 * 2 },
            { "x": 34 * 2, "y": 39 * 2 },
            { "x": 31 * 2, "y": 55 * 2 },
            { "x": 31 * 2, "y": 59 * 2 },
            { "x": 31 * 2, "y": 63 * 2 },
            { "x": 34 * 2, "y": 61 * 2 },
            { "x": 34 * 2, "y": 57 * 2 },
            { "x": 31 * 2, "y": 73 * 2 },
            { "x": 31 * 2, "y": 77 * 2 },
            { "x": 31 * 2, "y": 81 * 2 },
            { "x": 34 * 2, "y": 79 * 2 },
            { "x": 34 * 2, "y": 75 * 2 },
            { "x": 49 * 2, "y": 73 * 2 },
            { "x": 49 * 2, "y": 77 * 2 },
            { "x": 49 * 2, "y": 81 * 2 },
            { "x": 52 * 2, "y": 79 * 2 },
            { "x": 52 * 2, "y": 75 * 2 },
            { "x": 49 * 2, "y": 63 * 2 },
            { "x": 49 * 2, "y": 59 * 2 },
            { "x": 52 * 2, "y": 61 * 2 },
            { "x": 49 * 2, "y": 55 * 2 },
            { "x": 52 * 2, "y": 57 * 2 },
            { "x": 49 * 2, "y": 45 * 2 },
            { "x": 49 * 2, "y": 41 * 2 },
            { "x": 49 * 2, "y": 37 * 2 },
            { "x": 52 * 2, "y": 39 * 2 },
            { "x": 52 * 2, "y": 44 * 2 },
            { "x": 49 * 2, "y": 19 * 2 },
            { "x": 49 * 2, "y": 23 * 2 },
            { "x": 49 * 2, "y": 27 * 2 },
            { "x": 52 * 2, "y": 25 * 2 },
            { "x": 52 * 2, "y": 21 * 2 },
            { "x": 67 * 2, "y": 27 * 2 },
            { "x": 67 * 2, "y": 23 * 2 },
            { "x": 67 * 2, "y": 19 * 2 },
            { "x": 70 * 2, "y": 21 * 2 },
            { "x": 70 * 2, "y": 25 * 2 },
            { "x": 67 * 2, "y": 37 * 2 },
            { "x": 67 * 2, "y": 41 * 2 },
            { "x": 67 * 2, "y": 45 * 2 },
            { "x": 70 * 2, "y": 43 * 2 },
            { "x": 70 * 2, "y": 39 * 2 },
            { "x": 67 * 2, "y": 55 * 2 },
            { "x": 67 * 2, "y": 59 * 2 },
            { "x": 67 * 2, "y": 63 * 2 },
            { "x": 70 * 2, "y": 61 * 2 },
            { "x": 70 * 2, "y": 57 * 2 },
            { "x": 67 * 2, "y": 73 * 2 },
            { "x": 67 * 2, "y": 77 * 2 },
            { "x": 67 * 2, "y": 81 * 2 },
            { "x": 70 * 2, "y": 79 * 2 },
            { "x": 70 * 2, "y": 75 * 2 }
        ]
    }

def objects_dict_water_bodies(type: int = -10):
    return {
        "defaultObject": type,
        "objects": [
            { "x": 30 * 2, "y": 18 * 2 },
            { "x": 33 * 2, "y": 18 * 2 },
            { "x": 48 * 2, "y": 18 * 2 },
            { "x": 51 * 2, "y": 18 * 2 },
            { "x": 66 * 2, "y": 18 * 2 },
            { "x": 69 * 2, "y": 18 * 2 },
            { "x": 30 * 2, "y": 19 * 2 },
            { "x": 33 * 2, "y": 19 * 2 },
            { "x": 48 * 2, "y": 19 * 2 },
            { "x": 51 * 2, "y": 19 * 2 },
            { "x": 66 * 2, "y": 19 * 2 },
            { "x": 69 * 2, "y": 19 * 2 },
            { "x": 30 * 2, "y": 20 * 2 },
            { "x": 33 * 2, "y": 20 * 2 },
            { "x": 48 * 2, "y": 20 * 2 },
            { "x": 51 * 2, "y": 20 * 2 },
            { "x": 66 * 2, "y": 20 * 2 },
            { "x": 69 * 2, "y": 20 * 2 },
            { "x": 30 * 2, "y": 21 * 2 },
            { "x": 33 * 2, "y": 21 * 2 },
            { "x": 48 * 2, "y": 21 * 2 },
            { "x": 51 * 2, "y": 21 * 2 },
            { "x": 66 * 2, "y": 21 * 2 },
            { "x": 69 * 2, "y": 21 * 2 },
            { "x": 30 * 2, "y": 22 * 2 },
            { "x": 33 * 2, "y": 22 * 2 },
            { "x": 48 * 2, "y": 22 * 2 },
            { "x": 51 * 2, "y": 22 * 2 },
            { "x": 66 * 2, "y": 22 * 2 },
            { "x": 69 * 2, "y": 22 * 2 },
            { "x": 30 * 2, "y": 23 * 2 },
            { "x": 33 * 2, "y": 23 * 2 },
            { "x": 48 * 2, "y": 23 * 2 },
            { "x": 51 * 2, "y": 23 * 2 },
            { "x": 66 * 2, "y": 23 * 2 },
            { "x": 69 * 2, "y": 23 * 2 },
            { "x": 30 * 2, "y": 24 * 2 },
            { "x": 33 * 2, "y": 24 * 2 },
            { "x": 48 * 2, "y": 24 * 2 },
            { "x": 51 * 2, "y": 24 * 2 },
            { "x": 66 * 2, "y": 24 * 2 },
            { "x": 69 * 2, "y": 24 * 2 },
            { "x": 30 * 2, "y": 25 * 2 },
            { "x": 33 * 2, "y": 25 * 2 },
            { "x": 48 * 2, "y": 25 * 2 },
            { "x": 51 * 2, "y": 25 * 2 },
            { "x": 66 * 2, "y": 25 * 2 },
            { "x": 69 * 2, "y": 25 * 2 },
            { "x": 30 * 2, "y": 26 * 2 },
            { "x": 33 * 2, "y": 26 * 2 },
            { "x": 48 * 2, "y": 26 * 2 },
            { "x": 51 * 2, "y": 26 * 2 },
            { "x": 66 * 2, "y": 26 * 2 },
            { "x": 69 * 2, "y": 26 * 2 },
            { "x": 30 * 2, "y": 27 * 2 },
            { "x": 33 * 2, "y": 27 * 2 },
            { "x": 48 * 2, "y": 27 * 2 },
            { "x": 51 * 2, "y": 27 * 2 },
            { "x": 66 * 2, "y": 27 * 2 },
            { "x": 69 * 2, "y": 27 * 2 },
            { "x": 30 * 2, "y": 36 * 2 },
            { "x": 33 * 2, "y": 36 * 2 },
            { "x": 48 * 2, "y": 36 * 2 },
            { "x": 51 * 2, "y": 36 * 2 },
            { "x": 66 * 2, "y": 36 * 2 },
            { "x": 69 * 2, "y": 36 * 2 },
            { "x": 30 * 2, "y": 37 * 2 },
            { "x": 33 * 2, "y": 37 * 2 },
            { "x": 48 * 2, "y": 37 * 2 },
            { "x": 51 * 2, "y": 37 * 2 },
            { "x": 66 * 2, "y": 37 * 2 },
            { "x": 69 * 2, "y": 37 * 2 },
            { "x": 30 * 2, "y": 38 * 2 },
            { "x": 33 * 2, "y": 38 * 2 },
            { "x": 48 * 2, "y": 38 * 2 },
            { "x": 51 * 2, "y": 38 * 2 },
            { "x": 66 * 2, "y": 38 * 2 },
            { "x": 69 * 2, "y": 38 * 2 },
            { "x": 30 * 2, "y": 39 * 2 },
            { "x": 33 * 2, "y": 39 * 2 },
            { "x": 48 * 2, "y": 39 * 2 },
            { "x": 51 * 2, "y": 39 * 2 },
            { "x": 66 * 2, "y": 39 * 2 },
            { "x": 69 * 2, "y": 39 * 2 },
            { "x": 30 * 2, "y": 40 * 2 },
            { "x": 33 * 2, "y": 40 * 2 },
            { "x": 48 * 2, "y": 40 * 2 },
            { "x": 51 * 2, "y": 40 * 2 },
            { "x": 66 * 2, "y": 40 * 2 },
            { "x": 69 * 2, "y": 40 * 2 },
            { "x": 30 * 2, "y": 41 * 2 },
            { "x": 33 * 2, "y": 41 * 2 },
            { "x": 48 * 2, "y": 41 * 2 },
            { "x": 51 * 2, "y": 41 * 2 },
            { "x": 66 * 2, "y": 41 * 2 },
            { "x": 69 * 2, "y": 41 * 2 },
            { "x": 30 * 2, "y": 42 * 2 },
            { "x": 33 * 2, "y": 42 * 2 },
            { "x": 48 * 2, "y": 42 * 2 },
            { "x": 51 * 2, "y": 42 * 2 },
            { "x": 66 * 2, "y": 42 * 2 },
            { "x": 69 * 2, "y": 42 * 2 },
            { "x": 30 * 2, "y": 43 * 2 },
            { "x": 33 * 2, "y": 43 * 2 },
            { "x": 48 * 2, "y": 43 * 2 },
            { "x": 51 * 2, "y": 43 * 2 },
            { "x": 66 * 2, "y": 43 * 2 },
            { "x": 69 * 2, "y": 43 * 2 },
            { "x": 30 * 2, "y": 44 * 2 },
            { "x": 33 * 2, "y": 44 * 2 },
            { "x": 48 * 2, "y": 44 * 2 },
            { "x": 51 * 2, "y": 44 * 2 },
            { "x": 66 * 2, "y": 44 * 2 },
            { "x": 69 * 2, "y": 44 * 2 },
            { "x": 30 * 2, "y": 45 * 2 },
            { "x": 33 * 2, "y": 45 * 2 },
            { "x": 48 * 2, "y": 45 * 2 },
            { "x": 51 * 2, "y": 45 * 2 },
            { "x": 66 * 2, "y": 45 * 2 },
            { "x": 69 * 2, "y": 45 * 2 },
            { "x": 30 * 2, "y": 54 * 2 },
            { "x": 33 * 2, "y": 54 * 2 },
            { "x": 48 * 2, "y": 54 * 2 },
            { "x": 51 * 2, "y": 54 * 2 },
            { "x": 66 * 2, "y": 54 * 2 },
            { "x": 69 * 2, "y": 54 * 2 },
            { "x": 30 * 2, "y": 55 * 2 },
            { "x": 33 * 2, "y": 55 * 2 },
            { "x": 48 * 2, "y": 55 * 2 },
            { "x": 51 * 2, "y": 55 * 2 },
            { "x": 66 * 2, "y": 55 * 2 },
            { "x": 69 * 2, "y": 55 * 2 },
            { "x": 30 * 2, "y": 56 * 2 },
            { "x": 33 * 2, "y": 56 * 2 },
            { "x": 48 * 2, "y": 56 * 2 },
            { "x": 51 * 2, "y": 56 * 2 },
            { "x": 66 * 2, "y": 56 * 2 },
            { "x": 69 * 2, "y": 56 * 2 },
            { "x": 30 * 2, "y": 57 * 2 },
            { "x": 33 * 2, "y": 57 * 2 },
            { "x": 48 * 2, "y": 57 * 2 },
            { "x": 51 * 2, "y": 57 * 2 },
            { "x": 66 * 2, "y": 57 * 2 },
            { "x": 69 * 2, "y": 57 * 2 },
            { "x": 30 * 2, "y": 58 * 2 },
            { "x": 33 * 2, "y": 58 * 2 },
            { "x": 48 * 2, "y": 58 * 2 },
            { "x": 51 * 2, "y": 58 * 2 },
            { "x": 66 * 2, "y": 58 * 2 },
            { "x": 69 * 2, "y": 58 * 2 },
            { "x": 30 * 2, "y": 59 * 2 },
            { "x": 33 * 2, "y": 59 * 2 },
            { "x": 48 * 2, "y": 59 * 2 },
            { "x": 51 * 2, "y": 59 * 2 },
            { "x": 66 * 2, "y": 59 * 2 },
            { "x": 69 * 2, "y": 59 * 2 },
            { "x": 30 * 2, "y": 60 * 2 },
            { "x": 33 * 2, "y": 60 * 2 },
            { "x": 48 * 2, "y": 60 * 2 },
            { "x": 51 * 2, "y": 60 * 2 },
            { "x": 66 * 2, "y": 60 * 2 },
            { "x": 69 * 2, "y": 60 * 2 },
            { "x": 30 * 2, "y": 61 * 2 },
            { "x": 33 * 2, "y": 61 * 2 },
            { "x": 48 * 2, "y": 61 * 2 },
            { "x": 51 * 2, "y": 61 * 2 },
            { "x": 66 * 2, "y": 61 * 2 },
            { "x": 69 * 2, "y": 61 * 2 },
            { "x": 30 * 2, "y": 62 * 2 },
            { "x": 33 * 2, "y": 62 * 2 },
            { "x": 48 * 2, "y": 62 * 2 },
            { "x": 51 * 2, "y": 62 * 2 },
            { "x": 66 * 2, "y": 62 * 2 },
            { "x": 69 * 2, "y": 62 * 2 },
            { "x": 30 * 2, "y": 63 * 2 },
            { "x": 33 * 2, "y": 63 * 2 },
            { "x": 48 * 2, "y": 63 * 2 },
            { "x": 51 * 2, "y": 63 * 2 },
            { "x": 66 * 2, "y": 63 * 2 },
            { "x": 69 * 2, "y": 63 * 2 },
            { "x": 30 * 2, "y": 72 * 2 },
            { "x": 33 * 2, "y": 72 * 2 },
            { "x": 48 * 2, "y": 72 * 2 },
            { "x": 51 * 2, "y": 72 * 2 },
            { "x": 66 * 2, "y": 72 * 2 },
            { "x": 69 * 2, "y": 72 * 2 },
            { "x": 30 * 2, "y": 73 * 2 },
            { "x": 33 * 2, "y": 73 * 2 },
            { "x": 48 * 2, "y": 73 * 2 },
            { "x": 51 * 2, "y": 73 * 2 },
            { "x": 66 * 2, "y": 73 * 2 },
            { "x": 69 * 2, "y": 73 * 2 },
            { "x": 30 * 2, "y": 74 * 2 },
            { "x": 33 * 2, "y": 74 * 2 },
            { "x": 48 * 2, "y": 74 * 2 },
            { "x": 51 * 2, "y": 74 * 2 },
            { "x": 66 * 2, "y": 74 * 2 },
            { "x": 69 * 2, "y": 74 * 2 },
            { "x": 30 * 2, "y": 75 * 2 },
            { "x": 33 * 2, "y": 75 * 2 },
            { "x": 48 * 2, "y": 75 * 2 },
            { "x": 51 * 2, "y": 75 * 2 },
            { "x": 66 * 2, "y": 75 * 2 },
            { "x": 69 * 2, "y": 75 * 2 },
            { "x": 30 * 2, "y": 76 * 2 },
            { "x": 33 * 2, "y": 76 * 2 },
            { "x": 48 * 2, "y": 76 * 2 },
            { "x": 51 * 2, "y": 76 * 2 },
            { "x": 66 * 2, "y": 76 * 2 },
            { "x": 69 * 2, "y": 76 * 2 },
            { "x": 30 * 2, "y": 77 * 2 },
            { "x": 33 * 2, "y": 77 * 2 },
            { "x": 48 * 2, "y": 77 * 2 },
            { "x": 51 * 2, "y": 77 * 2 },
            { "x": 66 * 2, "y": 77 * 2 },
            { "x": 69 * 2, "y": 77 * 2 },
            { "x": 30 * 2, "y": 78 * 2 },
            { "x": 33 * 2, "y": 78 * 2 },
            { "x": 48 * 2, "y": 78 * 2 },
            { "x": 51 * 2, "y": 78 * 2 },
            { "x": 66 * 2, "y": 78 * 2 },
            { "x": 69 * 2, "y": 78 * 2 },
            { "x": 30 * 2, "y": 79 * 2 },
            { "x": 33 * 2, "y": 79 * 2 },
            { "x": 48 * 2, "y": 79 * 2 },
            { "x": 51 * 2, "y": 79 * 2 },
            { "x": 66 * 2, "y": 79 * 2 },
            { "x": 69 * 2, "y": 79 * 2 },
            { "x": 30 * 2, "y": 80 * 2 },
            { "x": 33 * 2, "y": 80 * 2 },
            { "x": 48 * 2, "y": 80 * 2 },
            { "x": 51 * 2, "y": 80 * 2 },
            { "x": 66 * 2, "y": 80 * 2 },
            { "x": 69 * 2, "y": 80 * 2 },
            { "x": 30 * 2, "y": 81 * 2 },
            { "x": 33 * 2, "y": 81 * 2 },
            { "x": 48 * 2, "y": 81 * 2 },
            { "x": 51 * 2, "y": 81 * 2 },
            { "x": 66 * 2, "y": 81 * 2 },
            { "x": 69 * 2, "y": 81 * 2 }
        ]
    }
# Export variable schemas in a json file for consumption by frontend

def export_variable_attributes(variable_names, ds, output_directory):
    vars = {}
    for variable_name in variable_names:
        attrs_dict = get_variable_attributes_in_dict(ds, variable_name)
        vars[variable_name] = attrs_dict

    save_json(to_json_compatible(vars), f"{output_directory}/variablesAttributes.json")


def get_variable_attributes_in_dict(ds, variable_name):
    source_variable_name = variable_name.replace("$", "X")
    variable = ds.data_vars[source_variable_name]
    attrs = variable.attrs
    overriden_attrs = hardcoded_overrides(variable_name, attrs.copy())
    return {k: prettify_unit(overriden_attrs[k]) for k in overriden_attrs}

def hardcoded_overrides(variable_name: str, attrs: dict):
    if variable_name in surface_level_variables:
        attrs["available_at"] = 0.2
    elif variable_name in building_data_variables:
        attrs["available_at"] = human_height

    if variable_name == "T":
        attrs["long_name"] = "Air Temperature"
        attrs["valid_min"] = 10
        attrs["valid_max"] = 50
    elif variable_name == "RelHum":
        attrs["valid_min"] = 20
        attrs["valid_max"] = 80
    elif variable_name == "WindSpd":
        attrs["valid_min"] = 0
        attrs["valid_max"] = 20
    elif variable_name == "PET":
        attrs["long_name"] = "PET Default Person"
    elif variable_name == "$Fac_WallTempNode1Outside":
        attrs["long_name"] = "Wall Temperature"
    elif variable_name == "$Fac_WallSystemLWEmitted":
        attrs["long_name"] = "Emitted Longwave Radiation (Facade)"
    elif variable_name == "$Fac_WallSystemSWReceived":
        attrs["long_name"] = "Received Shortwave Radiation (Facade)"
    elif variable_name == "$Fac_WallSystemSWAbsorbed":
        attrs["long_name"] = "Absorbed Direct Shortwave Radiation (Facade)"
    elif variable_name == "$Fac_WallSystemLWIncoming":
        attrs["long_name"] = "Incoming Longwave Radiation (Facade)"
    elif variable_name == "$Fac_WallSystemSWReflected":
        attrs["long_name"] = "Reflected Shortwave Radiation (Facade)"
    elif variable_name == "$Fac_WallSystemSHTransCoeffOutside":
        attrs["long_name"] = "Sensible Heat Transmission Coefficient (Outside)"
    elif variable_name == "$Fac_WallSystemLWEnergyBalance":
        attrs["long_name"] = "Longwave Energy Balance (Facade)"

    return attrs

# Save plane slices for multiple variables at multiple times

def save_plane_slices_for_multiple_vars_at_multiple_times(scenario: str, ds, output_directory: str, variable_names=["T", "RH", "WS", "WD"], time_indices=[0, 4, 8, 12, 16, 20]):
    for variable_name in variable_names:
        if variable_name in surface_level_variables or variable_name in building_data_variables:
            continue
        
        for time_index in time_indices:
            print(f"Processing slices for variable '{variable_name}' at time index {time_index}...")
            save_plane_slices_for_var_at_time(scenario, ds, output_directory, variable_slug=variable_name, time_index=time_index)

def save_plane_slices_for_var_at_time(scenario: str, ds, output_directory: str, variable_slug="T", time_index=0):
    variable_at_time = get_variable_at_time(ds, variable_slug, time_index)
    slicers = get_plane_slicers_for_scenario(scenario)

    for slicer in slicers:
        sliced = slicer["slicer"](variable_at_time)
        array_2d = slice_to_array_of_arrays(df=sliced, index_column=slicer.get("index_column", "y"), columns=slicer.get("columns", "x"), value_column="value")
        dict = {
            "data": to_json_compatible(array_2d),
        }
        save_slice_to_json(scenario, output_directory, variable_slug, time_index=time_index, slicer_slug=slicer["slug"], dict=dict)


def get_variable_at_time(ds, variable_name, time_index=0):
    variable = ds.data_vars[variable_name]
    time_slice = variable.isel(Time=time_index)
    df = time_slice.to_dataframe().reset_index().drop(columns=["Time"]).rename(columns={"GridsI": "x", "GridsJ": "y", "GridsK": "z", variable_name: "value"})
    return df

def slice_xy_plane_at_z(df, z_value):
    return df[df["z"] == z_value]

def slice_yz_plane_at_x(df, x_value):
    return df[df["x"] == x_value]

def get_plane_slicers_for_scenario(scenario: str):
    building_canopy_anomalies_per_scenario = {
        "S1_1_Tall_Canyon_Scenario": 31.0,
    }

    mid_building_x_per_scenario = {
        "S1_2_Wide_Canyon": 73.0,
    }

    return [
        {
            "slug": "horizontal_ground",
            "slicer": lambda df: slice_xy_plane_at_z(df, 0.2),
        },
        {
            "slug": "horizontal_human_height",
            "slicer": lambda df: slice_xy_plane_at_z(df, human_height),
        },
        {
            "slug": "horizontal_building_canopy",
            "slicer": lambda df: slice_xy_plane_at_z(df, building_canopy_anomalies_per_scenario.get(scenario, 17.0)),
        },
        {
            "slug": "vertical_mid_canyon",
            "slicer": lambda df: slice_yz_plane_at_x(df, 99.0),
            "index_column": "y",
            "columns": "z",
        },
        {
            "slug": "vertical_mid_building",
            "slicer": lambda df: slice_yz_plane_at_x(df, mid_building_x_per_scenario.get(scenario, 79.0)),
            "index_column": "y",
            "columns": "z",
        },
    ]


# Export time series points list

def make_time_series_point(coords: list[float], available_variables: list[str], corresponding_plane: str):
    return {
        "c": coords,
        "v": available_variables,
        "p": corresponding_plane
    }

def make_horizontal_time_series_points(variable_names: list[str], scenario_name: str):
    height_per_plane = [
        {
            "plane": "horizontal_ground",
            "height": 0.2,
            "available_variables": list(filter(lambda var: var not in building_data_variables, variable_names))
        },
        {
            "plane": "horizontal_human_height",
            "height": human_height,
            "available_variables": list(filter(lambda var: var not in surface_level_variables, variable_names))
        },
        {
            "plane": "horizontal_building_canopy",
            "height": 31.0 if scenario_name == "S1_1_Tall_Canyon_Scenario" else 17.0,
            "available_variables": list(filter(lambda var: var not in surface_level_variables, variable_names))
        }
    ]

    xy_list = [
        (118.0, 100.0),
        (100.0, 118.0),
        (118.0, 118.0),
    ]

    return [
        make_time_series_point([x, y, plane["height"]], plane["available_variables"], plane["plane"])
        for plane in height_per_plane
        for (x, y) in xy_list
    ]

def get_time_series_points_list(scenario: str, variables: list[str]):
    points = make_horizontal_time_series_points(variables, scenario)
    return points

def export_time_series_points_list(scenario: str, variables: list[str], output_directory: str = "processed_data"):
    points = get_time_series_points_list(scenario, variables)
    save_json_for_scenario(points, output_directory, scenario, "", "timeSeriesPoints")


# Export time series points

def export_time_series_points(scenario: str, ds, points, output_directory: str):
    for point in points:
        coords = point["c"]
        variable_names = point["v"]
        for variable_name in variable_names:
            print(f"Exporting time series for {variable_name} at {coords}")
            is_building_data = "$" in variable_name
            true_variable_name = variable_name

            if is_building_data:
                if coords[0] == 118.0 and coords[1] == 118.0:
                    true_variable_name = variable_name.replace("$", "Z")
                elif coords[1] == 118.0:
                    true_variable_name = variable_name.replace("$", "X")
                elif coords[0] == 118.0:
                    true_variable_name = variable_name.replace("$", "Y")

            time_series, true_coords = get_single_time_series_point_for_var_and_coords_dataframe(ds, true_variable_name, coords, filter_nan=is_building_data)
            record = {
                "requested_coords": {"x": coords[0], "y": coords[1], "z": coords[2]},
                "true_coords": true_coords,
                "data": to_json_compatible(time_series.to_dict(orient="records")),
            }
            save_json_for_scenario(record, output_directory, scenario, f"{variable_name}/timeSeries", f"{number_for_filename(coords[0])}-{number_for_filename(coords[1])}-{number_for_filename(coords[2])}")

def get_single_time_series_point_for_var_and_coords_dataframe(ds, variable_name: str, coords: list[float], filter_nan: bool = False):
    x = coords[0] + 1.0 if coords[0] % 2 != 0 else coords[0]
    y = coords[1] + 1.0 if coords[1] % 2 != 0 else coords[1]

    variable = ds.data_vars[variable_name]

    selection = {"GridsI": x, "GridsJ": y}
    columns_to_drop = ["GridsI", "GridsJ"]
    if "GridsK" in variable.dims and len(coords) > 2:
        selection["GridsK"] = coords[2]
        columns_to_drop.append("GridsK")

    filtered = variable.where(variable.notnull(), drop=True) if filter_nan else variable
    point_data = filtered.sel(method="nearest", **selection)
    true_coords = {
        "x": float(point_data["GridsI"].values),
        "y": float(point_data["GridsJ"].values),
        "z": float(point_data["GridsK"].values) if "GridsK" in point_data else None,
    }

    df = point_data.to_dataframe().reset_index().rename(columns={variable_name: "v"}).drop(columns=columns_to_drop)
    df["t"] = df["Time"].dt.strftime('%H:%M:%S')
    df.drop(columns=["Time"], inplace=True)

    return df, true_coords

# Utility functions

def number_for_filename(n):
    return f"{n}".replace(".", "_")

def prettify_unit(unit: str) -> str:
    unit_mappings = {
        "degree Celsius": "°C",
        "m s-1": "m/s",
        "g kg-1": "g/kg",
        "W m-2": "W/m²",
    }
    return unit_mappings.get(unit, unit)

def slice_to_array_of_arrays(df, index_column="y", columns="x", value_column="value"):
    to_2d = df.pivot(index=index_column, columns=columns, values=value_column)
    return to_2d.where(pd.notna(to_2d), None).values.tolist()

def to_json_compatible(value):
    """Recursively convert numpy types and arrays to JSON-compatible types."""
    if isinstance(value, (np.floating,)):
        return float(value)
    elif isinstance(value, (np.integer,)):
        return int(value)
    elif isinstance(value, (np.ndarray, list, tuple)):
        return [to_json_compatible(v) for v in value]
    elif isinstance(value, dict):
        return {k: to_json_compatible(v) for k, v in value.items()}
    elif isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        else:
            return value
    else:
        return value

def save_json(dict, path, pretty=False):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)  # ensure output dirs exist
    with open(path, "w") as f:
        if pretty:
            json.dump(dict, f, indent=4)
        else:
            json.dump(dict, f, separators=(',', ':'))

def save_json_for_scenario(dict, output_dir, scenario, dir_path, filename, pretty=False):
    match = re.match(r"^(S\d+(?:_\d+)?)(?:_.*)?", scenario)
    scenario_slug = match.group(1) if match else scenario
    output_dir = Path(f"./{output_dir}/scenarios/{scenario_slug}/{dir_path}")
    save_json(dict, output_dir / f"{filename}.json", pretty=pretty)

def save_slice_to_json(scenario, output_dir, variable_slug, time_index, slicer_slug, dict):
    save_json_for_scenario(dict, output_dir, scenario, f"{variable_slug}/time_{time_index}", slicer_slug)





if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Process a NetCDF file into JSON output maps."
    )
    parser.add_argument(
        "scenario_name", type=str, help="The name of the scenario (without .nc)"
    )
    parser.add_argument(
        "input_directory", type=str, help="Path to the directory containing the .nc file"
    )
    parser.add_argument(
        "output_directory",
        type=str,
        help="Path to the directory where the processed JSON files will be saved",
    )

    args = parser.parse_args()
    process_netcdf(args.scenario_name, args.input_directory, args.output_directory)