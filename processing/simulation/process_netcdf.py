import xarray as xr
import json
from pathlib import Path
import argparse
import pandas as pd
import numpy as np
import math

def process_netcdf(scenario_name: str, input_directory: str, output_directory: str):
    print(f"========= Processing scenario: {scenario_name} =========")

    input_path = Path(input_directory) / f"{scenario_name}.nc"
    print(f"Processing NetCDF at : {input_path}")

    ds = xr.open_dataset(input_path)
    print(ds)

    print("Processing building heights and soil types...")
    export_buildings_and_soil_maps(scenario_name, ds, output_directory)
    print("Done processing building heights and soil types.", end="\n\n")

    var_keys = ["T", "RelHum", "WindSpd"]

    print("Exporting variable attributes...")
    export_variable_attributes(var_keys, ds, output_directory)
    print("Done exporting variable attributes.", end="\n\n")

    print("Processing simulation results slices...")
    save_plane_slices_for_multiple_vars_at_multiple_times(scenario_name, ds, output_directory, variable_names=var_keys, time_indices=[0, 6, 12, 18])
    print("Done processing simulation results slices.", end="\n\n")

    print("Done !", end="\n\n\n\n")


# Building heights and soil types helpers

def export_buildings_and_soil_maps(scenario_name: str, ds, output_directory: str = "processed_data"):
    building_heights = ds.data_vars["BuildingHeight"]
    bh_dict = building_height_dict(building_heights)
    bh_dict["defaultSideColor"] = hardcoded_side_color(scenario_name)
    bh_dict["defaultTopColor"] = hardcoded_top_color(scenario_name)

    soil_profile_type = ds.data_vars["SoilProfileType"]
    st_dict = soiltype_dict(soil_profile_type)

    # Save the processed data
    save_json_for_scenario(bh_dict, output_directory, scenario_name, "", "buildingMap", pretty=False)
    save_json_for_scenario(st_dict, output_directory, scenario_name, "", "soilMap", pretty=False)

def hardcoded_side_color(scenario_name: str):
    if scenario_name == "S2_Wide_Canyon":
        return "#00e000"
    return "#aaaaaa"

def hardcoded_top_color(scenario_name: str):
    if scenario_name == "S2_Wide_Canyon":
        return "#02dc02"
    return "#cccccc"

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


# Export variable schemas in a json file for consumption by frontend

def export_variable_attributes(variable_names, ds, output_directory):
    vars = {}
    for variable_name in variable_names:
        attrs_dict = get_variable_attributes_in_dict(ds, variable_name)
        vars[variable_name] = attrs_dict

    save_json(to_json_compatible(vars), f"{output_directory}/variable_attributes.json")


def get_variable_attributes_in_dict(ds, variable_name):
    variable = ds.data_vars[variable_name]
    attrs = variable.attrs
    return {k: prettify_unit(attrs[k]) for k in attrs}



# Save plane slices for multiple variables at multiple times

def save_plane_slices_for_multiple_vars_at_multiple_times(scenario: str, ds, output_directory: str, variable_names=["T", "RH", "WS", "WD"], time_indices=[0, 6, 12, 18]):
    for variable_name in variable_names:
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
        "S1_Tall_Canyon_Scenario": 31.0,
    }

    mid_building_x_per_scenario = {
        "S2_Wide_Canyon": 73.0,
    }

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


# Utility functions

def prettify_unit(unit: str) -> str:
    unit_mappings = {
        "degree Celsius": "°C",
        "m s-1": "m/s",
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
    scenario_slug = scenario.split("_")[0]
    output_dir = Path(f"./{output_dir}/{scenario_slug}/{dir_path}")
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