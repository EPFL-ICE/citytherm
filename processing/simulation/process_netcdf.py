import xarray as xr
import json
from pathlib import Path
import argparse

def process_netcdf(scenario_name: str, input_directory: str, output_directory: str):
    input_path = Path(input_directory) / f"{scenario_name}.nc"
    print(f"Processing NetCDF at : {input_path}")

    ds = xr.open_dataset(input_path)
    print(ds)

    building_heights = ds.data_vars["BuildingHeight"]
    bh_dict = building_height_dict(building_heights)
    bh_dict["defaultSideColor"] = hardcoded_side_color(scenario_name)
    bh_dict["defaultTopColor"] = hardcoded_top_color(scenario_name)

    soil_profile_type = ds.data_vars["SoilProfileType"]
    st_dict = soiltype_dict(soil_profile_type)

    # Save the processed data
    save_json(bh_dict, f"./processed_data/{scenario_name}/buildingMap.json", pretty=False)
    save_json(st_dict, f"./processed_data/{scenario_name}/soilMap.json", pretty=False)



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

def save_json(dict, path, pretty=False):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)  # ensure output dirs exist
    with open(path, "w") as f:
        if pretty:
            json.dump(dict, f, indent=4)
        else:
            json.dump(dict, f, separators=(',', ':'))


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