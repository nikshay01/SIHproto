import json, glob, os
for state_file in glob.glob('data/e-waste-facilities/states/*.json'):
    with open(state_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for facility in data.get('facilities', []):
        name = facility.get('name', '')
        ftype = facility.get('type', '')
        address = facility.get('address', '')
        district = facility.get('district', '')
        state = facility.get('state', '')
        print(f"{name} ({ftype}): {address}, {district}, {state}")
