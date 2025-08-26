import json
import os

def get_unique_melody_files(json_file, audio_folder='audio'):
    # Load the JSON data
    with open(json_file, 'r', encoding='utf-8') as f:
        stations = json.load(f)
    
    # Extract all unique melody files
    unique_files = set()
    for station in stations:
        if 'file' in station:
            # Extract just the filename without path and extension
            filename = station['file'].replace('audio/', '').replace('.mp3', '')
            unique_files.add(filename)
    
    # Check which files exist in the audio folder
    existing_files = []
    missing_files = []
    for file in unique_files:
        file_path = os.path.join(audio_folder, f"{file}.mp3")
        if os.path.exists(file_path):
            existing_files.append(file)
        else:
            missing_files.append(file)
    
    return sorted(existing_files), sorted(missing_files)

# Example usage
if __name__ == "__main__":
    existing, missing = get_unique_melody_files('stations.json')
    
    print(f"Files already in /audio/: {len(existing)}")
    for file in existing:
        print(f"- {file}.mp3")
    
    print(f"\nFiles missing in /audio/: {len(missing)}")
    for file in missing:
        print(f"- {file}.mp3")
    
    # Optionally save lists to text files
    with open('existing_melodies.txt', 'w', encoding='utf-8') as f:
        f.write("\n".join([f"{file}.mp3" for file in existing]))
    
    with open('missing_melodies.txt', 'w', encoding='utf-8') as f:
        f.write("\n".join([f"{file}.mp3" for file in missing]))
    
    print("\nLists saved to 'existing_melodies.txt' and 'missing_melodies.txt'")
