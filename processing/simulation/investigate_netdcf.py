import xarray as xr
import json
from pathlib import Path

scenario = "S2_Wide_Canyon"

file_path = f"./raw_data/{scenario}.nc"
ds = xr.open_dataset(file_path)
print(ds.data_vars)
print(ds.data_vars["SurfaceColors"])

def hardcoded_side_color():
    if scenario == "S2_Wide_Canyon":
        return "#d4d4d4"
    return "#aaaaaa"

# The building Height seems to be stored in the BuildingHeight variable
building_heights = ds.data_vars["BuildingHeight"]
soil_profile_type = ds.data_vars["SoilProfileType"]
print(soil_profile_type.values)

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

# export_dataframe_to_formats(cleanedup_building_height(), "./processed_data/S0_Baseline_Scenario", "building_heights")
save_json(cleanedup_building_height(), f"./processed_data/{scenario}/buildingMap.json", pretty=False)
save_json(cleanedup_soiltype(), f"./processed_data/{scenario}/soilMap.json", pretty=False)















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

