# This file is for exploring the NetCDF data and is not used to process the data as expected by the frontend.
# It is kept here for reference and potential future use.
# For actual data processing, please refer to process_netdcf.py in the same directory.


import xarray as xr
import pandas as pd
import numpy as np
import json
from pathlib import Path
import math

scenario = "S3_3_Decidious_Trees"

file_path = f"./raw_data/{scenario}.nc"
ds = xr.open_dataset(file_path)
print(ds.data_vars)

var_keys = ["T", "RelHum", "WindSpd"]

def explore_variable(variable_name):
    variable = ds.data_vars[variable_name]
    print(variable)
    print(variable.attrs)
    print(variable.dims)
    print(variable.shape)
    print(variable.isel(Time=0))

    values = variable.values.flatten()
    unique_values = np.unique(values)
    print(f"Unique values for {variable_name}: {unique_values}")
    print(f"Number of unique values for {variable_name}: {len(unique_values)}")

    print("querying non-null values...")
    query = variable.where(variable.notnull(), drop=True)
    print("time_0 GridsK=1.45 non-null coordinates:")
    time_0 = query.isel(Time=0).sel(GridsJ=121, GridsI=93, method="nearest")
    print(f"Number of non-null coordinates for {variable_name} at Time=0 and GridsK=1.45: {len(time_0)}")
    coords_df = time_0.to_dataframe().reset_index().drop(columns=["Time"])
    print(f"Coordinates with non-null values for {variable_name} (total {len(coords_df)}):")
    
    with pd.option_context("display.max_rows", 350):
        print(coords_df.head(350))

    return

    slice = variable.isel(Time=0).sel(GridsJ=89, GridsK=0.2, method="nearest")
    print(f"Slice at GridsJ=89 for {variable_name} at Time=0:")
    print(slice)
    slice_df = slice.to_dataframe().reset_index()
    print(slice_df.head(100))

    return
    target_value = 12.0
    mask = variable.notnull() & (variable == target_value)

    # Extract the indices (or coordinates) where this is true
    coords = variable.where(mask, drop=True)

    if coords.count() == 0:
        print(f"No coordinates found with value {target_value} in {variable_name}.")
        return None

    # Convert to a dataframe for easier inspection
    df = coords.to_dataframe().reset_index().dropna(subset=[variable_name])
    
    print(f"Found {len(df)} points with value {target_value} in {variable_name}.")
    print("head")
    print(df.head())  # show first few rows
    print("tail")
    print(df.tail())  # show last few rows

    print("All GridsK values at these points:")
    print(df["GridsK"].unique())


explore_variable("XFac_WallTempNode1Outside")

def prettify_unit(unit: str) -> str:
    unit_mappings = {
        "degree Celsius": "°C",
        "m s-1": "m/s",
    }
    return unit_mappings.get(unit, unit)

def get_variable_attributes_in_dict(ds, variable_name):
    variable = ds.data_vars[variable_name]
    attrs = variable.attrs
    return {k: prettify_unit(attrs[k]) for k in attrs}

def export_variable_attributes(variable_names=var_keys):
    vars = {}
    for variable_name in variable_names:
        attrs_dict = get_variable_attributes_in_dict(ds, variable_name)
        vars[variable_name] = attrs_dict

    save_json_for_scenario(to_json_compatible(vars), scenario, "", "variable_attributes")




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
    return [
        {
            "slug": "horizontal_ground",
            "slicer": lambda df: slice_xy_plane_at_z(df, 0.2),
        },
        {
            "slug": "horizontal_human_height",
            "slicer": lambda df: slice_xy_plane_at_z(df, 1.4000000953674316),
        },
        {
            "slug": "horizontal_building_canopy",
            "slicer": lambda df: slice_xy_plane_at_z(df, 31.0 if scenario == "S1_Tall_Canyon_Scenario" else 17.0),
        },
        {
            "slug": "vertical_mid_canyon",
            "slicer": lambda df: slice_yz_plane_at_x(df, 99.0),
            "index_column": "y",
            "columns": "z",
        },
        {
            "slug": "vertical_mid_building",
            "slicer": lambda df: slice_yz_plane_at_x(df, 73.0 if scenario == "S2_Wide_Canyon" else 79.0),
            "index_column": "y",
            "columns": "z",
        },
    ]


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

def clean_nans(obj):
    """Recursively replace NaN or inf with None for JSON safety."""
    if isinstance(obj, list):
        return [clean_nans(x) for x in obj]
    if isinstance(obj, float):
        if math.isnan(obj):
            return None
    return obj

def slice_to_array_of_arrays(df, index_column="y", columns="x", value_column="value"):
    to_2d = df.pivot(index=index_column, columns=columns, values=value_column)
    return to_2d.where(pd.notna(to_2d), None).values.tolist()

def save_plane_slices_for_var_at_time(variable_name="T", time_index=0):
    variable_at_time = get_variable_at_time(ds, variable_name, time_index)
    slicers = get_plane_slicers_for_scenario(scenario)

    for slicer in slicers:
        # print(f"--- {slicer['slug']} ---")
        sliced = slicer["slicer"](variable_at_time)
        # print(sliced)
        array_2d = slice_to_array_of_arrays(df=sliced, index_column=slicer.get("index_column", "y"), columns=slicer.get("columns", "x"), value_column="value")
        dict = {
            "data": clean_nans(array_2d),
        }
        save_slice_to_json(scenario, "potential_air_temperature", 0, slicer["slug"], dict)

def save_json_for_scenario(dict, scenario, dir_path, filename):
    output_dir = Path(f"./processed_data/{scenario}/{dir_path}")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{filename}.json"
    with open(output_path, "w") as f:
        json.dump(dict, f, allow_nan=False, separators=(',', ':'))

def save_slice_to_json(scenario, variable_name, time_index, slicer_slug, dict):
    save_json_for_scenario(dict, scenario, f"{variable_name}/time_{time_index}", slicer_slug)

def save_plane_slices_for_multiple_vars_at_multiple_times(variable_names=["T", "RH", "WS", "WD"], time_indices=[0, 6, 12, 18]):
    for variable_name in variable_names:
        for time_index in time_indices:
            save_plane_slices_for_var_at_time(variable_name, time_index)

# save_plane_slices_for_var_at_time()

def hardcoded_side_color():
    if scenario == "S2_Wide_Canyon":
        return "#d4d4d4"
    return "#aaaaaa"

# The building Height seems to be stored in the BuildingHeight variable
building_heights = ds.data_vars["BuildingHeight"]
soil_profile_type = ds.data_vars["SoilProfileType"]

def cleanedup_building_height():
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
        "defaultSideColor": hardcoded_side_color(),
        "buildingsParts": records
    }

def cleanedup_soiltype():
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

def save_json(dict, path, pretty=False):
    with open(path, "w") as f:
        if pretty:
            json.dump(dict, f, indent=4)
        else:
            json.dump(dict, f, separators=(',', ':'))

def export_dataframe_to_formats(df, base_path, base_filename):
    csv_path = Path(base_path) / f"{base_filename}.csv"
    json_pretty_path = Path(base_path) / f"{base_filename}_pretty.json"
    json_path = Path(base_path) / f"{base_filename}.json"
    
    df.to_csv(csv_path, index=False)
    df.to_json(json_path, orient="records")
    df.to_json(json_pretty_path, orient="records", indent=4)



# export_variable_attributes()

# Check if building heights are constant over time
def check_constant_over_time():
    # get the mean building height per time slice
    mean_building_heights_per_time = building_heights_filled.mean(dim=["GridsJ", "GridsI"])
    print("Mean building heights per time slice: ", mean_building_heights_per_time)

    # get the sum of building heights per time slice
    sum_building_heights_per_time = building_heights_filled.sum(dim=["GridsJ", "GridsI"])
    print("Sum of building heights per time slice: ", sum_building_heights_per_time)

    # diff of build heights across time slices
    diff_building_heights_per_time = abs(building_heights_filled - building_heights_filled.isel(Time=0))
    print("Diff of building heights per time slice: ", diff_building_heights_per_time)
    max_diff_building_heights_per_time = diff_building_heights_per_time.max()
    print("Max diff of building heights per time slice: ", max_diff_building_heights_per_time)

